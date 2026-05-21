const { MATCH_EVAL_GRADE_BY_LABEL } = require('./constants')

function isBinaryRelevant(label) {
  return label === 'highly_relevant' || label === 'relevant'
}

function precisionAtK(rankedApplicantIds, labelByApplicantId, k) {
  const top = rankedApplicantIds.slice(0, k)
  if (!top.length) {
    return 0
  }

  const relevantCount = top.filter((applicantId) =>
    isBinaryRelevant(labelByApplicantId.get(applicantId)),
  ).length

  return relevantCount / top.length
}

function meanReciprocalRank(rankedApplicantIds, labelByApplicantId) {
  for (let index = 0; index < rankedApplicantIds.length; index += 1) {
    const applicantId = rankedApplicantIds[index]
    if (isBinaryRelevant(labelByApplicantId.get(applicantId))) {
      return 1 / (index + 1)
    }
  }

  return 0
}

function dcgAtK(grades, k) {
  let score = 0
  const limit = Math.min(k, grades.length)

  for (let index = 0; index < limit; index += 1) {
    const grade = grades[index] || 0
    if (index === 0) {
      score += grade
    } else {
      score += grade / Math.log2(index + 1)
    }
  }

  return score
}

function ndcgAtK(rankedApplicantIds, labelByApplicantId, k) {
  const actualGrades = rankedApplicantIds.slice(0, k).map((applicantId) => {
    const label = labelByApplicantId.get(applicantId)
    return MATCH_EVAL_GRADE_BY_LABEL[label] ?? 0
  })

  const idealGrades = [...labelByApplicantId.entries()]
    .map(([, label]) => MATCH_EVAL_GRADE_BY_LABEL[label] ?? 0)
    .sort((a, b) => b - a)
    .slice(0, k)

  const actual = dcgAtK(actualGrades, k)
  const ideal = dcgAtK(idealGrades, k)

  if (!ideal) {
    return 0
  }

  return actual / ideal
}

function averageScoreByRelevanceLabel(rankedItems, labelByApplicantId) {
  const buckets = {
    highly_relevant: { total: 0, count: 0 },
    relevant: { total: 0, count: 0 },
    partially_relevant: { total: 0, count: 0 },
    not_relevant: { total: 0, count: 0 },
    unlabeled: { total: 0, count: 0 },
  }

  rankedItems.forEach((item) => {
    const label = labelByApplicantId.get(item.applicantId)
    const bucketKey = buckets[label] ? label : 'unlabeled'
    buckets[bucketKey].total += item.score
    buckets[bucketKey].count += 1
  })

  return Object.fromEntries(
    Object.entries(buckets).map(([label, bucket]) => [
      label,
      {
        count: bucket.count,
        averageScore: bucket.count ? bucket.total / bucket.count : null,
      },
    ]),
  )
}

function analyzeFalsePositivesAndNegatives(rankedApplicantIds, labelByApplicantId, k = 10) {
  const topSet = new Set(rankedApplicantIds.slice(0, k))
  const falsePositives = []
  const falseNegatives = []

  topSet.forEach((applicantId) => {
    const label = labelByApplicantId.get(applicantId)
    if (!isBinaryRelevant(label)) {
      falsePositives.push({
        applicantId,
        label: label || 'unlabeled',
        rank: rankedApplicantIds.indexOf(applicantId) + 1,
      })
    }
  })

  labelByApplicantId.forEach((label, applicantId) => {
    if (isBinaryRelevant(label) && !topSet.has(applicantId)) {
      falseNegatives.push({
        applicantId,
        label,
        rank: rankedApplicantIds.indexOf(applicantId) >= 0 ? rankedApplicantIds.indexOf(applicantId) + 1 : null,
      })
    }
  })

  return {
    falsePositiveCount: falsePositives.length,
    falseNegativeCount: falseNegatives.length,
    falsePositives: falsePositives.slice(0, 25),
    falseNegatives: falseNegatives.slice(0, 25),
  }
}

function computeJobRankingMetrics({ rankedApplicantIds, labelByApplicantId, rankedItems }) {
  return {
    precisionAt5: precisionAtK(rankedApplicantIds, labelByApplicantId, 5),
    precisionAt10: precisionAtK(rankedApplicantIds, labelByApplicantId, 10),
    ndcgAt10: ndcgAtK(rankedApplicantIds, labelByApplicantId, 10),
    meanReciprocalRank: meanReciprocalRank(rankedApplicantIds, labelByApplicantId),
    averageScoreByRelevanceLabel: averageScoreByRelevanceLabel(rankedItems, labelByApplicantId),
    errorAnalysis: analyzeFalsePositivesAndNegatives(rankedApplicantIds, labelByApplicantId, 10),
  }
}

function aggregateMetricValues(jobMetricsList, metricName) {
  if (!jobMetricsList.length) {
    return 0
  }

  const total = jobMetricsList.reduce((sum, metrics) => sum + (metrics[metricName] || 0), 0)
  return total / jobMetricsList.length
}

function aggregateErrorAnalysis(jobMetricsList) {
  return jobMetricsList.reduce(
    (acc, metrics) => {
      acc.falsePositiveCount += metrics.errorAnalysis.falsePositiveCount
      acc.falseNegativeCount += metrics.errorAnalysis.falseNegativeCount
      return acc
    },
    { falsePositiveCount: 0, falseNegativeCount: 0 },
  )
}

function buildMethodSummary(jobMetricsList) {
  return {
    jobsEvaluated: jobMetricsList.length,
    precisionAt5: aggregateMetricValues(jobMetricsList, 'precisionAt5'),
    precisionAt10: aggregateMetricValues(jobMetricsList, 'precisionAt10'),
    ndcgAt10: aggregateMetricValues(jobMetricsList, 'ndcgAt10'),
    meanReciprocalRank: aggregateMetricValues(jobMetricsList, 'meanReciprocalRank'),
    errorAnalysis: aggregateErrorAnalysis(jobMetricsList),
  }
}

function groupMetricsBySegment(jobContexts, methodMetricsByJobId) {
  const segmentTypes = ['job_category', 'skill_group', 'experience_level', 'data_completeness']
  const grouped = {}

  segmentTypes.forEach((segmentType) => {
    grouped[segmentType] = {}
  })

  jobContexts.forEach((context) => {
    const metrics = methodMetricsByJobId.get(context.jobId)
    if (!metrics) {
      return
    }

    segmentTypes.forEach((segmentType) => {
      const segmentValue = context.segments[segmentType] || 'unknown'
      if (!grouped[segmentType][segmentValue]) {
        grouped[segmentType][segmentValue] = []
      }
      grouped[segmentType][segmentValue].push(metrics)
    })
  })

  const output = {}
  segmentTypes.forEach((segmentType) => {
    output[segmentType] = Object.fromEntries(
      Object.entries(grouped[segmentType]).map(([segmentValue, metricsList]) => [
        segmentValue,
        buildMethodSummary(metricsList),
      ]),
    )
  })

  return output
}

module.exports = {
  isBinaryRelevant,
  precisionAtK,
  meanReciprocalRank,
  ndcgAtK,
  averageScoreByRelevanceLabel,
  analyzeFalsePositivesAndNegatives,
  computeJobRankingMetrics,
  buildMethodSummary,
  groupMetricsBySegment,
}
