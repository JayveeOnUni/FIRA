const { query, withTransaction } = require('../config/db')
const { ApiError } = require('../utils/ApiError')
const {
  MATCH_EVAL_METHODS,
  MATCH_EVAL_RELEVANCE_LABELS,
  MATCH_EVAL_DATASET_STATUSES,
  MATCH_SOURCE_VERSION,
} = require('../utils/constants')
const { buildApplicantMatchingText, buildJobMatchingText } = require('./matchingText.service')
const { rankSemanticMatches } = require('./aiMatchingClient.service')
const { logAuditEvent } = require('./audit.service')
const { rankByKeywordOverlap, rankByTfidf } = require('../utils/matchEvalBaselines')
const {
  computeJobRankingMetrics,
  buildMethodSummary,
  groupMetricsBySegment,
} = require('../utils/matchEvalMetrics')

function normalizeOptional(value) {
  if (value === undefined || value === null) {
    return null
  }

  const trimmed = String(value).trim()
  return trimmed.length ? trimmed : null
}

function toCsvField(value) {
  if (value === undefined || value === null) {
    return '""'
  }

  return `"${String(value).replace(/"/g, '""')}"`
}

function deriveSegments(job, applicant) {
  const jobCategory =
    normalizeOptional(job?.title)?.split(' ')[0]?.toLowerCase() ||
    normalizeOptional(applicant?.preferred_job_category)?.toLowerCase() ||
    'unknown'

  const skillTokens = String(applicant?.skills_summary || '')
    .toLowerCase()
    .split(/[,;|/]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  const skillGroup = skillTokens[0] || 'unspecified'

  const experienceText = String(applicant?.work_experience_summary || '').trim()
  let experienceLevel = 'unspecified'
  if (experienceText.length >= 400) {
    experienceLevel = 'senior'
  } else if (experienceText.length >= 120) {
    experienceLevel = 'mid'
  } else if (experienceText.length > 0) {
    experienceLevel = 'junior'
  }

  const completenessFields = [
    applicant?.skills_summary,
    applicant?.work_experience_summary,
    applicant?.education_summary,
    job?.description,
    job?.required_skills,
    job?.qualifications,
  ]

  const filled = completenessFields.filter((field) => normalizeOptional(field)).length
  let dataCompleteness = 'low'
  if (filled >= 5) {
    dataCompleteness = 'high'
  } else if (filled >= 3) {
    dataCompleteness = 'medium'
  }

  return {
    job_category: jobCategory,
    skill_group: skillGroup,
    experience_level: experienceLevel,
    data_completeness: dataCompleteness,
  }
}

function buildQualityWarnings({ labeledPairs, evaluatedJobs, aiUnavailableMethods }) {
  const warnings = []

  if (!labeledPairs) {
    warnings.push({
      code: 'no_labels',
      message: 'No relevance labels found. Metrics require human/expert labels before interpretation.',
      severity: 'high',
    })
  }

  if (evaluatedJobs === 0) {
    warnings.push({
      code: 'no_jobs',
      message: 'No jobs were evaluated. Add jobs and applicants to the dataset first.',
      severity: 'high',
    })
  }

  if (aiUnavailableMethods.length) {
    warnings.push({
      code: 'ai_service_unavailable',
      message: `SBERT evaluation skipped or failed for methods: ${aiUnavailableMethods.join(', ')}`,
      severity: 'medium',
    })
  }

  warnings.push({
    code: 'decision_support_only',
    message:
      'Matching scores and evaluation metrics are decision-support signals only. They do not automate hiring decisions or ATS status changes.',
    severity: 'info',
  })

  warnings.push({
    code: 'no_fairness_certification',
    message:
      'This evaluation does not certify bias elimination, fairness compliance, or legal hiring suitability.',
    severity: 'info',
  })

  return warnings
}

async function assertDatasetExists(datasetId) {
  const result = await query(
    `
    SELECT *
    FROM match_eval_datasets
    WHERE id = $1
    LIMIT 1
    `,
    [datasetId],
  )

  if (!result.rows[0]) {
    throw new ApiError(404, 'Evaluation dataset not found')
  }

  return result.rows[0]
}

async function createEvaluationDataset({ userId, name, version, description, sourceNotes, status }) {
  const normalizedStatus = status || 'draft'
  if (!MATCH_EVAL_DATASET_STATUSES.includes(normalizedStatus)) {
    throw new ApiError(400, 'Invalid dataset status')
  }

  const result = await query(
    `
    INSERT INTO match_eval_datasets (
      name,
      version,
      description,
      status,
      source_notes,
      created_by,
      updated_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $6)
    RETURNING *
    `,
    [
      name,
      version || 'v1',
      normalizeOptional(description),
      normalizedStatus,
      normalizeOptional(sourceNotes),
      userId,
    ],
  )

  const dataset = result.rows[0]
  await logAuditEvent({
    userId,
    action: 'matching_evaluation.dataset.create',
    entityType: 'match_eval_dataset',
    entityId: dataset.id,
    metadata: {
      name: dataset.name,
      version: dataset.version,
    },
  })

  return dataset
}

async function updateEvaluationDataset(datasetId, { userId, name, description, status, sourceNotes }) {
  await assertDatasetExists(datasetId)

  if (status && !MATCH_EVAL_DATASET_STATUSES.includes(status)) {
    throw new ApiError(400, 'Invalid dataset status')
  }

  const result = await query(
    `
    UPDATE match_eval_datasets
    SET
      name = COALESCE($2, name),
      description = COALESCE($3, description),
      status = COALESCE($4, status),
      source_notes = COALESCE($5, source_notes),
      updated_by = $6,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [
      datasetId,
      normalizeOptional(name),
      description === undefined ? null : normalizeOptional(description),
      status || null,
      sourceNotes === undefined ? null : normalizeOptional(sourceNotes),
      userId,
    ],
  )

  const dataset = result.rows[0]
  await logAuditEvent({
    userId,
    action: 'matching_evaluation.dataset.update',
    entityType: 'match_eval_dataset',
    entityId: dataset.id,
    metadata: {
      status: dataset.status,
    },
  })

  return dataset
}

async function listEvaluationDatasets() {
  const result = await query(
    `
    SELECT
      d.*,
      COUNT(DISTINCT dj.job_id)::INT AS job_count,
      COUNT(DISTINCT da.applicant_id)::INT AS applicant_count,
      COUNT(DISTINCT rl.id)::INT AS label_count,
      COUNT(DISTINCT r.id)::INT AS run_count
    FROM match_eval_datasets d
    LEFT JOIN match_eval_dataset_jobs dj ON dj.dataset_id = d.id
    LEFT JOIN match_eval_dataset_applicants da ON da.dataset_id = d.id
    LEFT JOIN match_eval_relevance_labels rl ON rl.dataset_id = d.id
    LEFT JOIN match_eval_runs r ON r.dataset_id = d.id
    GROUP BY d.id
    ORDER BY d.created_at DESC
    `,
  )

  return result.rows
}

async function getEvaluationDataset(datasetId) {
  const dataset = await assertDatasetExists(datasetId)
  const [jobsResult, applicantsResult, labelsResult, runsResult] = await Promise.all([
    query(
      `
      SELECT dj.*, j.title, j.status AS job_status
      FROM match_eval_dataset_jobs dj
      JOIN jobs j ON j.id = dj.job_id
      WHERE dj.dataset_id = $1
      ORDER BY dj.created_at ASC
      `,
      [datasetId],
    ),
    query(
      `
      SELECT da.*, u.first_name, u.last_name, ap.preferred_job_category
      FROM match_eval_dataset_applicants da
      JOIN applicants ap ON ap.id = da.applicant_id
      JOIN users u ON u.id = ap.user_id
      WHERE da.dataset_id = $1
      ORDER BY da.created_at ASC
      `,
      [datasetId],
    ),
    query(
      `
      SELECT
        rl.*,
        labeler.email AS labeled_by_email,
        reviewer.email AS reviewed_by_email
      FROM match_eval_relevance_labels rl
      LEFT JOIN users labeler ON labeler.id = rl.labeled_by
      LEFT JOIN users reviewer ON reviewer.id = rl.reviewed_by
      WHERE rl.dataset_id = $1
      ORDER BY rl.updated_at DESC
      `,
      [datasetId],
    ),
    query(
      `
      SELECT *
      FROM match_eval_runs
      WHERE dataset_id = $1
      ORDER BY started_at DESC
      `,
      [datasetId],
    ),
  ])

  return {
    dataset,
    jobs: jobsResult.rows,
    applicants: applicantsResult.rows,
    labels: labelsResult.rows,
    runs: runsResult.rows,
  }
}

async function addDatasetJobs(datasetId, { userId, jobIds = [], notes }) {
  await assertDatasetExists(datasetId)

  if (!Array.isArray(jobIds) || !jobIds.length) {
    throw new ApiError(400, 'At least one jobId is required')
  }

  await withTransaction(async (client) => {
    for (const jobId of jobIds) {
      await client.query(
        `
        INSERT INTO match_eval_dataset_jobs (dataset_id, job_id, notes)
        VALUES ($1, $2, $3)
        ON CONFLICT (dataset_id, job_id)
        DO UPDATE SET notes = COALESCE(EXCLUDED.notes, match_eval_dataset_jobs.notes)
        `,
        [datasetId, jobId, normalizeOptional(notes)],
      )
    }
  })

  await logAuditEvent({
    userId,
    action: 'matching_evaluation.dataset.jobs.add',
    entityType: 'match_eval_dataset',
    entityId: datasetId,
    metadata: { jobIds },
  })

  return getEvaluationDataset(datasetId)
}

async function addDatasetApplicants(datasetId, { userId, applicantIds = [], notes }) {
  await assertDatasetExists(datasetId)

  if (!Array.isArray(applicantIds) || !applicantIds.length) {
    throw new ApiError(400, 'At least one applicantId is required')
  }

  await withTransaction(async (client) => {
    for (const applicantId of applicantIds) {
      await client.query(
        `
        INSERT INTO match_eval_dataset_applicants (dataset_id, applicant_id, notes)
        VALUES ($1, $2, $3)
        ON CONFLICT (dataset_id, applicant_id)
        DO UPDATE SET notes = COALESCE(EXCLUDED.notes, match_eval_dataset_applicants.notes)
        `,
        [datasetId, applicantId, normalizeOptional(notes)],
      )
    }
  })

  await logAuditEvent({
    userId,
    action: 'matching_evaluation.dataset.applicants.add',
    entityType: 'match_eval_dataset',
    entityId: datasetId,
    metadata: { applicantIds },
  })

  return getEvaluationDataset(datasetId)
}

async function upsertRelevanceLabel(datasetId, { userId, jobId, applicantId, relevanceLabel, labelNotes, reviewedBy }) {
  await assertDatasetExists(datasetId)

  if (!MATCH_EVAL_RELEVANCE_LABELS.includes(relevanceLabel)) {
    throw new ApiError(400, 'Invalid relevance label')
  }

  const result = await query(
    `
    INSERT INTO match_eval_relevance_labels (
      dataset_id,
      job_id,
      applicant_id,
      relevance_label,
      label_notes,
      labeled_by,
      reviewed_by,
      reviewed_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7::bigint, CASE WHEN $7::bigint IS NULL THEN NULL ELSE NOW() END)
    ON CONFLICT (dataset_id, job_id, applicant_id)
    DO UPDATE SET
      relevance_label = EXCLUDED.relevance_label,
      label_notes = EXCLUDED.label_notes,
      labeled_by = EXCLUDED.labeled_by,
      reviewed_by = EXCLUDED.reviewed_by,
      reviewed_at = CASE WHEN EXCLUDED.reviewed_by IS NULL THEN match_eval_relevance_labels.reviewed_at ELSE NOW() END,
      updated_at = NOW()
    RETURNING *
    `,
    [
      datasetId,
      jobId,
      applicantId,
      relevanceLabel,
      normalizeOptional(labelNotes),
      userId,
      reviewedBy || null,
    ],
  )

  const label = result.rows[0]
  await logAuditEvent({
    userId,
    action: 'matching_evaluation.label.upsert',
    entityType: 'match_eval_relevance_label',
    entityId: label.id,
    metadata: {
      datasetId,
      jobId,
      applicantId,
      relevanceLabel,
    },
  })

  return label
}

async function listRelevanceLabels(datasetId) {
  await assertDatasetExists(datasetId)
  const result = await query(
    `
    SELECT
      rl.*,
      labeler.email AS labeled_by_email,
      reviewer.email AS reviewed_by_email
    FROM match_eval_relevance_labels rl
    LEFT JOIN users labeler ON labeler.id = rl.labeled_by
    LEFT JOIN users reviewer ON reviewer.id = rl.reviewed_by
    WHERE rl.dataset_id = $1
    ORDER BY rl.job_id ASC, rl.applicant_id ASC
    `,
    [datasetId],
  )

  return result.rows
}

async function loadEvaluationContext(datasetId) {
  const datasetBundle = await getEvaluationDataset(datasetId)
  const jobIds = datasetBundle.jobs.map((row) => row.job_id)
  const applicantIds = datasetBundle.applicants.map((row) => row.applicant_id)

  if (!jobIds.length || !applicantIds.length) {
    return {
      dataset: datasetBundle.dataset,
      jobs: [],
      applicants: [],
      labels: datasetBundle.labels,
      labelsByJob: new Map(),
    }
  }

  const [jobsResult, applicantsResult] = await Promise.all([
    query(
      `
      SELECT
        j.id,
        j.title,
        j.description,
        j.qualifications,
        j.required_skills,
        j.location,
        j.employment_type,
        c.name AS company_name
      FROM jobs j
      LEFT JOIN companies c ON c.id = j.company_id
      WHERE j.id = ANY($1::bigint[])
      `,
      [jobIds],
    ),
    query(
      `
      SELECT
        ap.id AS applicant_id,
        ap.preferred_job_category,
        ap.skills_summary,
        ap.work_experience_summary,
        ap.education_summary,
        u.first_name,
        u.last_name
      FROM applicants ap
      JOIN users u ON u.id = ap.user_id
      WHERE ap.id = ANY($1::bigint[])
      `,
      [applicantIds],
    ),
  ])

  const labelsByJob = new Map()
  datasetBundle.labels.forEach((label) => {
    if (!labelsByJob.has(label.job_id)) {
      labelsByJob.set(label.job_id, new Map())
    }
    labelsByJob.get(label.job_id).set(label.applicant_id, label.relevance_label)
  })

  return {
    dataset: datasetBundle.dataset,
    jobs: jobsResult.rows,
    applicants: applicantsResult.rows,
    labels: datasetBundle.labels,
    labelsByJob,
  }
}

async function rankWithMethod(methodKey, { jobText, candidates, scoringConfig }) {
  if (methodKey === 'keyword_overlap') {
    return rankByKeywordOverlap({ queryText: jobText, candidates })
  }

  if (methodKey === 'tfidf') {
    return rankByTfidf({ queryText: jobText, candidates })
  }

  if (methodKey === 'sbert') {
    const response = await rankSemanticMatches({
      queryText: jobText,
      candidates: candidates.map((candidate) => ({
        id: candidate.applicantId,
        text: candidate.text,
      })),
      topK: scoringConfig?.topK || candidates.length,
      minScore: scoringConfig?.minScore ?? null,
    })

    const items = Array.isArray(response?.items) ? response.items : []
    return items
      .map((item) => ({
        applicantId: Number(item.id),
        score: Number(item.score) || 0,
        metadata: {
          method: 'sbert',
          model: response?.model || null,
        },
      }))
      .sort((a, b) => b.score - a.score)
  }

  throw new ApiError(400, `Unsupported evaluation method: ${methodKey}`)
}

async function persistRunRankings(client, runId, methodKey, jobId, rankedItems) {
  for (let index = 0; index < rankedItems.length; index += 1) {
    const item = rankedItems[index]
    await client.query(
      `
      INSERT INTO match_eval_run_rankings (
        run_id,
        method_key,
        job_id,
        applicant_id,
        rank_position,
        score,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (run_id, method_key, job_id, applicant_id)
      DO UPDATE SET
        rank_position = EXCLUDED.rank_position,
        score = EXCLUDED.score,
        metadata = EXCLUDED.metadata
      `,
      [runId, methodKey, jobId, item.applicantId, index + 1, item.score, item.metadata || null],
    )
  }
}

async function persistMetricResults(client, runId, methodKey, metricsPayload) {
  const rows = [
    { metric_name: 'precision_at_5', metric_value: metricsPayload.overall.precisionAt5, segment_type: 'overall', segment_value: 'all' },
    { metric_name: 'precision_at_10', metric_value: metricsPayload.overall.precisionAt10, segment_type: 'overall', segment_value: 'all' },
    { metric_name: 'ndcg_at_10', metric_value: metricsPayload.overall.ndcgAt10, segment_type: 'overall', segment_value: 'all' },
    { metric_name: 'mean_reciprocal_rank', metric_value: metricsPayload.overall.meanReciprocalRank, segment_type: 'overall', segment_value: 'all' },
  ]

  Object.entries(metricsPayload.segments || {}).forEach(([segmentType, segmentMap]) => {
    Object.entries(segmentMap).forEach(([segmentValue, summary]) => {
      rows.push(
        { metric_name: 'precision_at_5', metric_value: summary.precisionAt5, segment_type: segmentType, segment_value: segmentValue },
        { metric_name: 'precision_at_10', metric_value: summary.precisionAt10, segment_type: segmentType, segment_value: segmentValue },
        { metric_name: 'ndcg_at_10', metric_value: summary.ndcgAt10, segment_type: segmentType, segment_value: segmentValue },
        { metric_name: 'mean_reciprocal_rank', metric_value: summary.meanReciprocalRank, segment_type: segmentType, segment_value: segmentValue },
      )
    })
  })

  for (const row of rows) {
    await client.query(
      `
      INSERT INTO match_eval_metric_results (
        run_id,
        method_key,
        metric_name,
        metric_value,
        segment_type,
        segment_value,
        details
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        runId,
        methodKey,
        row.metric_name,
        row.metric_value,
        row.segment_type,
        row.segment_value,
        metricsPayload.overall.errorAnalysis || null,
      ],
    )
  }
}

async function executeEvaluationRun(datasetId, { userId, runName, methods, scoringConfig }) {
  const dataset = await assertDatasetExists(datasetId)
  const selectedMethods = (methods || MATCH_EVAL_METHODS).filter((method) => MATCH_EVAL_METHODS.includes(method))

  if (!selectedMethods.length) {
    throw new ApiError(400, 'At least one valid evaluation method is required')
  }

  const context = await loadEvaluationContext(datasetId)
  const runInsert = await query(
    `
    INSERT INTO match_eval_runs (
      dataset_id,
      run_name,
      status,
      methods,
      model_version,
      scoring_config,
      started_by
    )
    VALUES ($1, $2, 'running', $3::jsonb, $4, $5::jsonb, $6)
    RETURNING *
    `,
    [
      datasetId,
      runName || `Evaluation ${new Date().toISOString()}`,
      JSON.stringify(selectedMethods),
      MATCH_SOURCE_VERSION,
      JSON.stringify(scoringConfig || {}),
      userId,
    ],
  )

  const run = runInsert.rows[0]
  const aiUnavailableMethods = new Set()
  const methodSummaries = {}

  try {
    const applicantCandidates = context.applicants.map((applicant) => {
      const built = buildApplicantMatchingText(applicant)
      return {
        applicantId: applicant.applicant_id,
        text: built.text,
        applicant,
      }
    })

    for (const methodKey of selectedMethods) {
      const jobMetricsList = []
      const jobContexts = []
      const methodMetricsByJobId = new Map()

      for (const job of context.jobs) {
        const jobText = buildJobMatchingText(job).text
        const labelMap = context.labelsByJob.get(job.id) || new Map()

        let rankedItems = []
        try {
          rankedItems = await rankWithMethod(methodKey, {
            jobText,
            candidates: applicantCandidates,
            scoringConfig,
          })
        } catch (error) {
          if (methodKey === 'sbert') {
            aiUnavailableMethods.add(methodKey)
            continue
          }
          throw error
        }

        await withTransaction(async (client) => {
          await persistRunRankings(client, run.id, methodKey, job.id, rankedItems)
        })

        const rankedApplicantIds = rankedItems.map((item) => item.applicantId)
        const metrics = computeJobRankingMetrics({
          rankedApplicantIds,
          labelByApplicantId: labelMap,
          rankedItems,
        })

        const representativeApplicant = applicantCandidates[0]?.applicant || {}
        const segments = deriveSegments(job, representativeApplicant)
        const jobContext = { jobId: job.id, segments }
        jobContexts.push(jobContext)
        jobMetricsList.push(metrics)
        methodMetricsByJobId.set(job.id, metrics)
      }

      if (!jobMetricsList.length && methodKey === 'sbert') {
        continue
      }

      const overall = buildMethodSummary(jobMetricsList)
      const segments = groupMetricsBySegment(jobContexts, methodMetricsByJobId)
      methodSummaries[methodKey] = { overall, segments }

      await withTransaction(async (client) => {
        await persistMetricResults(client, run.id, methodKey, { overall, segments })
      })
    }

    const warnings = buildQualityWarnings({
      labeledPairs: context.labels.length > 0,
      evaluatedJobs: context.jobs.length,
      aiUnavailableMethods: [...aiUnavailableMethods],
    })

    const summary = {
      dataset: {
        id: dataset.id,
        name: dataset.name,
        version: dataset.version,
      },
      run: {
        id: run.id,
        runName: run.run_name,
        methods: selectedMethods,
        modelVersion: run.model_version,
        scoringConfig: scoringConfig || {},
      },
      labelCoverage: {
        totalLabels: context.labels.length,
        labeledPairs: context.labels.length,
        jobsWithLabels: [...context.labelsByJob.keys()].length,
      },
      methods: methodSummaries,
      baselineComparison: {
        primary: 'sbert',
        baselines: ['keyword_overlap', 'tfidf'],
        availableMethods: Object.keys(methodSummaries),
      },
      warnings,
      responsibleUse: {
        decisionSupportOnly: true,
        noAutomatedHiringDecisions: true,
        noAtsStatusAutomation: true,
        requiresHumanOversight: true,
      },
    }

    const finalStatus =
      aiUnavailableMethods.size && Object.keys(methodSummaries).length ? 'partial' : 'completed'

    const completed = await query(
      `
      UPDATE match_eval_runs
      SET
        status = $2,
        summary = $3::jsonb,
        warnings = $4::jsonb,
        completed_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [run.id, finalStatus, JSON.stringify(summary), JSON.stringify(warnings)],
    )

    await logAuditEvent({
      userId,
      action: 'matching_evaluation.run.execute',
      entityType: 'match_eval_run',
      entityId: run.id,
      metadata: {
        datasetId,
        methods: selectedMethods,
        status: finalStatus,
      },
    })

    return {
      run: completed.rows[0],
      summary,
    }
  } catch (error) {
    await query(
      `
      UPDATE match_eval_runs
      SET
        status = 'failed',
        error_message = $2,
        completed_at = NOW()
      WHERE id = $1
      `,
      [run.id, error.message],
    )

    await logAuditEvent({
      userId,
      action: 'matching_evaluation.run.failed',
      entityType: 'match_eval_run',
      entityId: run.id,
      metadata: {
        datasetId,
        message: error.message,
      },
    })

    throw error
  }
}

async function listEvaluationRuns(datasetId) {
  await assertDatasetExists(datasetId)
  const result = await query(
    `
    SELECT *
    FROM match_eval_runs
    WHERE dataset_id = $1
    ORDER BY started_at DESC
    `,
    [datasetId],
  )

  return result.rows
}

async function getEvaluationRun(runId) {
  const runResult = await query(
    `
    SELECT r.*, d.name AS dataset_name, d.version AS dataset_version
    FROM match_eval_runs r
    JOIN match_eval_datasets d ON d.id = r.dataset_id
    WHERE r.id = $1
    LIMIT 1
    `,
    [runId],
  )

  if (!runResult.rows[0]) {
    throw new ApiError(404, 'Evaluation run not found')
  }

  const [metricsResult, rankingsResult] = await Promise.all([
    query(
      `
      SELECT *
      FROM match_eval_metric_results
      WHERE run_id = $1
      ORDER BY method_key ASC, segment_type ASC, segment_value ASC, metric_name ASC
      `,
      [runId],
    ),
    query(
      `
      SELECT *
      FROM match_eval_run_rankings
      WHERE run_id = $1
      ORDER BY method_key ASC, job_id ASC, rank_position ASC
      LIMIT 5000
      `,
      [runId],
    ),
  ])

  return {
    run: runResult.rows[0],
    metrics: metricsResult.rows,
    rankings: rankingsResult.rows,
  }
}

function evaluationSummaryToCsv(summary) {
  const lines = [
    [
      'method',
      'segment_type',
      'segment_value',
      'precision_at_5',
      'precision_at_10',
      'ndcg_at_10',
      'mean_reciprocal_rank',
      'false_positive_count',
      'false_negative_count',
    ].join(','),
  ]

  Object.entries(summary.methods || {}).forEach(([methodKey, payload]) => {
    const writeRow = (segmentType, segmentValue, metrics, errorAnalysis) => {
      lines.push(
        [
          methodKey,
          segmentType,
          segmentValue,
          metrics.precisionAt5,
          metrics.precisionAt10,
          metrics.ndcgAt10,
          metrics.meanReciprocalRank,
          errorAnalysis?.falsePositiveCount ?? '',
          errorAnalysis?.falseNegativeCount ?? '',
        ]
          .map(toCsvField)
          .join(','),
      )
    }

    writeRow('overall', 'all', payload.overall, payload.overall.errorAnalysis)

    Object.entries(payload.segments || {}).forEach(([segmentType, segmentMap]) => {
      Object.entries(segmentMap).forEach(([segmentValue, metrics]) => {
        writeRow(segmentType, segmentValue, metrics, metrics.errorAnalysis)
      })
    })
  })

  return lines.join('\n')
}

module.exports = {
  createEvaluationDataset,
  updateEvaluationDataset,
  listEvaluationDatasets,
  getEvaluationDataset,
  addDatasetJobs,
  addDatasetApplicants,
  upsertRelevanceLabel,
  listRelevanceLabels,
  executeEvaluationRun,
  listEvaluationRuns,
  getEvaluationRun,
  evaluationSummaryToCsv,
}
