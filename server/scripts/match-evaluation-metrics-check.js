const assert = require('assert')
const {
  precisionAtK,
  meanReciprocalRank,
  ndcgAtK,
  computeJobRankingMetrics,
  buildMethodSummary,
} = require('../src/utils/matchEvalMetrics')

function runMetricChecks() {
  const labelByApplicantId = new Map([
    [1, 'highly_relevant'],
    [2, 'relevant'],
    [3, 'partially_relevant'],
    [4, 'not_relevant'],
    [5, 'not_relevant'],
  ])

  const rankedApplicantIds = [1, 4, 2, 3, 5]
  const rankedItems = rankedApplicantIds.map((applicantId, index) => ({
    applicantId,
    score: 1 - index * 0.1,
  }))

  assert.strictEqual(precisionAtK(rankedApplicantIds, labelByApplicantId, 5), 0.4)
  assert.strictEqual(precisionAtK(rankedApplicantIds, labelByApplicantId, 10), 0.4)
  assert.strictEqual(meanReciprocalRank(rankedApplicantIds, labelByApplicantId), 1)
  assert.ok(ndcgAtK(rankedApplicantIds, labelByApplicantId, 10) > 0.8)

  const metrics = computeJobRankingMetrics({
    rankedApplicantIds,
    labelByApplicantId,
    rankedItems,
  })

  assert.strictEqual(metrics.errorAnalysis.falsePositiveCount, 3)
  assert.strictEqual(metrics.errorAnalysis.falseNegativeCount, 0)
  assert.ok(metrics.averageScoreByRelevanceLabel.highly_relevant.averageScore > 0.8)

  const summary = buildMethodSummary([metrics, metrics])
  assert.ok(Math.abs(summary.precisionAt5 - metrics.precisionAt5) < 0.0001)
  assert.strictEqual(summary.jobsEvaluated, 2)

  const emptyLabels = new Map()
  const emptyMetrics = computeJobRankingMetrics({
    rankedApplicantIds,
    labelByApplicantId: emptyLabels,
    rankedItems,
  })
  assert.strictEqual(emptyMetrics.precisionAt5, 0)
  assert.ok(emptyMetrics.averageScoreByRelevanceLabel.unlabeled.count === rankedItems.length)

  return {
    status: 'pass',
    checks: 8,
  }
}

try {
  const result = runMetricChecks()
  console.log(JSON.stringify({ message: 'Matching evaluation metric checks passed', ...result }, null, 2))
  process.exit(0)
} catch (error) {
  console.error(JSON.stringify({ message: 'Matching evaluation metric checks failed', error: error.message }, null, 2))
  process.exit(1)
}
