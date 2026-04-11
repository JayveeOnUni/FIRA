const { query, withTransaction } = require('../config/db')
const { ApiError } = require('../utils/ApiError')
const { MATCH_SCORE_TYPE_SBERT, MATCH_SOURCE_VERSION } = require('../utils/constants')
const { buildExplainabilityPayload } = require('../utils/matchingExplainability')
const { logAuditEvent } = require('./audit.service')
const { getLatestReviewContextMap } = require('./reviewGovernance.service')
const { getAiHealth, rankSemanticMatches } = require('./aiMatchingClient.service')
const { incrementCounter, recordDiagnosticEvent, getDiagnosticsSnapshot, listRecentEvents } = require('./diagnostics.service')
const { buildApplicantMatchingText, buildJobMatchingText } = require('./matchingText.service')

const CACHE_MAX_AGE_HOURS = 12

function normalizeOptional(value) {
  if (value === undefined || value === null) {
    return null
  }

  const trimmed = String(value).trim()
  return trimmed.length ? trimmed : null
}

function toNumber(value) {
  return Number(value)
}

function normalizeKeywords(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 25)
}

function normalizeExplanation(explanation) {
  const keywords = normalizeKeywords(explanation?.shared_keywords)
  const summary = normalizeOptional(explanation?.summary) || 'Semantic similarity score generated from profile and job text.'

  return {
    summary,
    keywords,
  }
}

async function getApplicantCoreByUserId(userId) {
  const result = await query(
    `
    SELECT
      ap.id AS applicant_id,
      ap.user_id,
      ap.profile_status,
      ap.preferred_job_category,
      ap.skills_summary,
      ap.work_experience_summary,
      ap.education_summary,
      u.first_name,
      u.last_name,
      u.email
    FROM applicants ap
    JOIN users u ON u.id = ap.user_id
    WHERE ap.user_id = $1
    LIMIT 1
    `,
    [userId],
  )

  if (!result.rows[0]) {
    throw new ApiError(404, 'Applicant profile not found')
  }

  return result.rows[0]
}

async function listPublishedJobsForMatching() {
  const result = await query(
    `
    SELECT
      j.id,
      j.title,
      j.description,
      j.qualifications,
      j.required_skills,
      j.location,
      j.employment_type,
      j.salary,
      j.status,
      j.is_public,
      j.created_at,
      j.updated_at,
      c.name AS company_name
    FROM jobs j
    LEFT JOIN companies c ON c.id = j.company_id
    WHERE j.status = 'published'
      AND j.is_public = TRUE
    ORDER BY j.created_at DESC
    `,
  )

  return result.rows
}

async function getDocumentFilenameMap(applicantIds = []) {
  if (!applicantIds.length) {
    return new Map()
  }

  const result = await query(
    `
    SELECT
      applicant_id,
      STRING_AGG(original_filename, ' ' ORDER BY uploaded_at DESC) AS filenames
    FROM applicant_documents
    WHERE applicant_id = ANY($1::bigint[])
    GROUP BY applicant_id
    `,
    [applicantIds],
  )

  const map = new Map()
  result.rows.forEach((row) => {
    map.set(toNumber(row.applicant_id), row.filenames || '')
  })

  return map
}

async function assertEmployerOwnsJob(userId, jobId) {
  const result = await query(
    `
    SELECT
      j.id
    FROM jobs j
    JOIN employers e ON e.company_id = j.company_id
    WHERE j.id = $1
      AND e.user_id = $2
    LIMIT 1
    `,
    [jobId, userId],
  )

  if (!result.rows[0]) {
    throw new ApiError(404, 'Job not found for your employer account')
  }
}

async function getJobForMatching(jobId) {
  const result = await query(
    `
    SELECT
      j.id,
      j.company_id,
      j.title,
      j.description,
      j.qualifications,
      j.required_skills,
      j.location,
      j.employment_type,
      j.salary,
      j.status,
      j.is_public,
      j.created_at,
      j.updated_at,
      c.name AS company_name
    FROM jobs j
    LEFT JOIN companies c ON c.id = j.company_id
    WHERE j.id = $1
    LIMIT 1
    `,
    [jobId],
  )

  if (!result.rows[0]) {
    throw new ApiError(404, 'Job not found')
  }

  return result.rows[0]
}

async function listApplicantsAppliedToJob(jobId) {
  const result = await query(
    `
    SELECT
      a.id AS application_id,
      a.status AS application_status,
      a.applied_at,
      a.updated_at AS application_updated_at,
      ap.id AS applicant_id,
      ap.profile_status,
      ap.preferred_job_category,
      ap.skills_summary,
      ap.work_experience_summary,
      ap.education_summary,
      u.first_name,
      u.last_name,
      u.email,
      en.id AS endorsement_id,
      en.created_at AS endorsed_at
    FROM applications a
    JOIN applicants ap ON ap.id = a.applicant_id
    JOIN users u ON u.id = ap.user_id
    LEFT JOIN endorsements en
      ON en.application_id = a.id
     AND en.status = 'active'
    WHERE a.job_id = $1
    ORDER BY a.applied_at DESC
    `,
    [jobId],
  )

  return result.rows
}

async function getMetadataRows(entityType, entityIds = []) {
  if (!entityIds.length) {
    return []
  }

  const result = await query(
    `
    SELECT entity_id, text_hash, embedding_model
    FROM embeddings_metadata
    WHERE entity_type = $1
      AND entity_id = ANY($2::bigint[])
    `,
    [entityType, entityIds],
  )

  return result.rows
}

function metadataMatchesHashSet(rows, items, expectedModel) {
  if (!items.length) {
    return true
  }

  if (rows.length !== items.length) {
    return false
  }

  const map = new Map(rows.map((row) => [toNumber(row.entity_id), row]))

  for (const item of items) {
    const row = map.get(item.entityId)
    if (!row) {
      return false
    }

    if (row.text_hash !== item.textHash) {
      return false
    }

    if (row.embedding_model !== expectedModel) {
      return false
    }
  }

  return true
}

async function getCachedApplicantJobScores(applicantId, jobIds = []) {
  if (!jobIds.length) {
    return []
  }

  const result = await query(
    `
    SELECT
      ms.id,
      ms.applicant_id,
      ms.job_id,
      ms.score,
      ms.score_type,
      ms.explanation_summary,
      ms.explanation_keywords,
      ms.generated_at,
      j.title,
      j.description,
      j.qualifications,
      j.required_skills,
      j.location,
      j.employment_type,
      j.salary,
      j.status,
      j.is_public,
      j.created_at,
      j.updated_at,
      c.name AS company_name
    FROM match_scores ms
    JOIN jobs j ON j.id = ms.job_id
    LEFT JOIN companies c ON c.id = j.company_id
    WHERE ms.applicant_id = $1
      AND ms.job_id = ANY($2::bigint[])
      AND ms.score_type = $3
      AND ms.generated_at >= NOW() - ($4::int * INTERVAL '1 hour')
    ORDER BY ms.score DESC
    `,
    [applicantId, jobIds, MATCH_SCORE_TYPE_SBERT, CACHE_MAX_AGE_HOURS],
  )

  return result.rows
}

async function getCachedJobApplicantScores(jobId, applicantIds = []) {
  if (!applicantIds.length) {
    return []
  }

  const result = await query(
    `
    SELECT
      ms.id,
      ms.applicant_id,
      ms.job_id,
      ms.score,
      ms.score_type,
      ms.explanation_summary,
      ms.explanation_keywords,
      ms.generated_at
    FROM match_scores ms
    WHERE ms.job_id = $1
      AND ms.applicant_id = ANY($2::bigint[])
      AND ms.score_type = $3
      AND ms.generated_at >= NOW() - ($4::int * INTERVAL '1 hour')
    ORDER BY ms.score DESC
    `,
    [jobId, applicantIds, MATCH_SCORE_TYPE_SBERT, CACHE_MAX_AGE_HOURS],
  )

  return result.rows
}

async function persistEmbeddingMetadata(client, metadataRows = []) {
  for (const row of metadataRows) {
    await client.query(
      `
      INSERT INTO embeddings_metadata (
        entity_type,
        entity_id,
        source_version,
        embedding_model,
        text_hash,
        generated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (entity_type, entity_id)
      DO UPDATE SET
        source_version = EXCLUDED.source_version,
        embedding_model = EXCLUDED.embedding_model,
        text_hash = EXCLUDED.text_hash,
        generated_at = NOW(),
        updated_at = NOW()
      `,
      [row.entityType, row.entityId, MATCH_SOURCE_VERSION, row.embeddingModel, row.textHash],
    )
  }
}

async function persistMatchScores(client, scoreRows = []) {
  for (const row of scoreRows) {
    const keywords = normalizeKeywords(row.explanationKeywords)
    await client.query(
      `
      INSERT INTO match_scores (
        applicant_id,
        job_id,
        score,
        score_type,
        explanation_summary,
        explanation_keywords,
        generated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (applicant_id, job_id, score_type)
      DO UPDATE SET
        score = EXCLUDED.score,
        explanation_summary = EXCLUDED.explanation_summary,
        explanation_keywords = EXCLUDED.explanation_keywords,
        generated_at = NOW(),
        updated_at = NOW()
      `,
      [
        row.applicantId,
        row.jobId,
        row.score,
        MATCH_SCORE_TYPE_SBERT,
        normalizeOptional(row.explanationSummary),
        JSON.stringify(keywords),
      ],
    )
  }
}

function parseKeywords(value) {
  if (Array.isArray(value)) {
    return normalizeKeywords(value)
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return normalizeKeywords(parsed)
    } catch {
      return []
    }
  }

  return []
}

function applyScoreFilters(items, options = {}) {
  const minScore = options.minScore
  const topN = options.topN

  let filtered = items
  if (typeof minScore === 'number') {
    filtered = filtered.filter((item) => Number(item.match_score) >= minScore)
  }

  if (typeof topN === 'number') {
    filtered = filtered.slice(0, topN)
  }

  return filtered
}

function mapCachedApplicantRecommendationRows(rows) {
  return rows.map((row) => ({
    job_id: toNumber(row.job_id),
    title: row.title,
    description: row.description,
    qualifications: row.qualifications,
    required_skills: row.required_skills,
    location: row.location,
    employment_type: row.employment_type,
    salary: row.salary,
    status: row.status,
    is_public: row.is_public,
    company_name: row.company_name,
    created_at: row.created_at,
    updated_at: row.updated_at,
    match_score: Number(row.score),
    explanation_summary: row.explanation_summary,
    explanation_keywords: parseKeywords(row.explanation_keywords),
    generated_at: row.generated_at,
  }))
}

function rankItemsByCandidateMap(resultItems, candidateMap) {
  const ranked = []
  resultItems.forEach((item) => {
    const candidate = candidateMap.get(toNumber(item.id))
    if (!candidate) {
      return
    }

    const explanation = normalizeExplanation(item.explanation)
    ranked.push({
      ...candidate,
      match_score: Number(item.score),
      explanation_summary: explanation.summary,
      explanation_keywords: explanation.keywords,
    })
  })

  return ranked
}

function buildDecisionSupportNotice() {
  return 'Match scores are decision-support signals. Final hiring and ATS decisions remain human-controlled.'
}

function buildFairnessNotice() {
  return 'Matching quality depends on text completeness and wording. Always pair scores with manual review to reduce unfair outcomes.'
}

function buildHumanReviewPrompt() {
  return 'Record explicit human review actions (reviewed, shortlisted, deferred, needs more information) before final hiring decisions.'
}

function buildMetaSummary({ cached, model, totalCandidates, cacheCoverage = 0 }) {
  return {
    cached,
    model,
    scoreType: MATCH_SCORE_TYPE_SBERT,
    totalCandidates,
    cacheCoverage,
    decisionSupportNotice: buildDecisionSupportNotice(),
    fairnessNotice: buildFairnessNotice(),
    humanReviewPrompt: buildHumanReviewPrompt(),
    limitations: [
      'Scores are based on text similarity, not full candidate suitability.',
      'Sparse applicant or job text can reduce recommendation reliability.',
      'Protected trait inference is not performed and should not be attempted.',
    ],
  }
}

function enrichRecommendationExplainability(item, applicant) {
  const explainability = buildExplainabilityPayload({
    score: item.match_score,
    summary: item.explanation_summary,
    keywords: item.explanation_keywords,
    applicant,
    job: item,
  })

  return {
    ...item,
    ...explainability,
  }
}

function enrichRankedApplicantExplainability(item, job) {
  const explainability = buildExplainabilityPayload({
    score: item.match_score,
    summary: item.explanation_summary,
    keywords: item.explanation_keywords,
    applicant: item,
    job,
  })

  return {
    ...item,
    ...explainability,
  }
}

function attachReviewContext(items, reviewContextMap) {
  return items.map((item) => {
    const context = reviewContextMap.get(toNumber(item.applicant_id))
    if (!context) {
      return {
        ...item,
        latest_review_action: null,
        latest_review_note: null,
        latest_reviewed_at: null,
        latest_reviewed_by: null,
        review_note_count: 0,
        last_review_note_at: null,
      }
    }

    return {
      ...item,
      ...context,
    }
  })
}

async function getApplicantRecommendedJobs(userId, options = {}) {
  incrementCounter('matching.applicant_requests.total')

  const applicant = await getApplicantCoreByUserId(userId)
  const jobs = await listPublishedJobsForMatching()

  if (!jobs.length) {
    return {
      recommendations: [],
      meta: buildMetaSummary({
        cached: false,
        model: null,
        totalCandidates: 0,
      }),
    }
  }

  const documentsMap = await getDocumentFilenameMap([toNumber(applicant.applicant_id)])
  const applicantTextData = buildApplicantMatchingText(applicant, {
    documentFilenames: documentsMap.get(toNumber(applicant.applicant_id)) || '',
  })

  if (!applicantTextData.text) {
    throw new ApiError(400, 'Applicant profile does not have enough matching data yet')
  }

  const jobCandidates = jobs.map((job) => {
    const jobTextData = buildJobMatchingText(job)
    return {
      ...job,
      matching_text: jobTextData.text,
      text_hash: jobTextData.textHash,
    }
  })

  const health = await getAiHealth()
  const modelName = health.model || 'unknown'
  const jobIds = jobCandidates.map((item) => toNumber(item.id))

  const applicantMetaRows = await getMetadataRows('applicant', [toNumber(applicant.applicant_id)])
  const jobMetaRows = await getMetadataRows('job', jobIds)

  const metadataReady =
    metadataMatchesHashSet(
      applicantMetaRows,
      [{ entityId: toNumber(applicant.applicant_id), textHash: applicantTextData.textHash }],
      modelName,
    ) &&
    metadataMatchesHashSet(
      jobMetaRows,
      jobCandidates.map((job) => ({ entityId: toNumber(job.id), textHash: job.text_hash })),
      modelName,
    )

  let cachedRows = []
  let cacheCoverage = 0

  if (!options.refresh && metadataReady) {
    cachedRows = await getCachedApplicantJobScores(toNumber(applicant.applicant_id), jobIds)
    cacheCoverage = Number((cachedRows.length / Math.max(1, jobIds.length)).toFixed(2))

    if (cachedRows.length === jobIds.length) {
      incrementCounter('matching.cache.full_hits')

      const cachedRecommendations = mapCachedApplicantRecommendationRows(cachedRows)
        .map((item) => enrichRecommendationExplainability(item, applicant))
      const filtered = applyScoreFilters(cachedRecommendations, options)

      return {
        recommendations: filtered,
        meta: buildMetaSummary({
          cached: true,
          model: modelName,
          totalCandidates: jobIds.length,
          cacheCoverage,
        }),
      }
    }
  }

  const cachedRowsByJobId = new Map(cachedRows.map((row) => [toNumber(row.job_id), row]))
  const candidatesForAi =
    !options.refresh && metadataReady
      ? jobCandidates.filter((job) => !cachedRowsByJobId.has(toNumber(job.id)))
      : jobCandidates

  if (cacheCoverage > 0 && cacheCoverage < 1) {
    incrementCounter('matching.cache.partial_hits')
  } else if (cacheCoverage === 0) {
    incrementCounter('matching.cache.misses')
  }

  let rankedFromAi = []
  if (candidatesForAi.length > 0) {
    incrementCounter('matching.ai_rank_requests.total')

    let aiResult
    try {
      aiResult = await rankSemanticMatches({
        queryText: applicantTextData.text,
        candidates: candidatesForAi.map((job) => ({
          id: job.id,
          text: job.matching_text,
        })),
        topK: candidatesForAi.length,
        minScore: null,
      })
    } catch (error) {
      recordDiagnosticEvent({
        service: 'matching-service',
        severity: 'error',
        message: 'Applicant recommendation ranking call failed',
        metadata: {
          applicant_id: toNumber(applicant.applicant_id),
          candidate_count: candidatesForAi.length,
        },
      })
      throw error
    }

    const candidateMap = new Map(
      candidatesForAi.map((job) => [
        toNumber(job.id),
        {
          job_id: toNumber(job.id),
          title: job.title,
          description: job.description,
          qualifications: job.qualifications,
          required_skills: job.required_skills,
          location: job.location,
          employment_type: job.employment_type,
          salary: job.salary,
          status: job.status,
          is_public: job.is_public,
          company_name: job.company_name,
          created_at: job.created_at,
          updated_at: job.updated_at,
        },
      ]),
    )

    rankedFromAi = rankItemsByCandidateMap(aiResult.items || [], candidateMap)
  }

  const scoreRows = rankedFromAi.map((item) => ({
    applicantId: toNumber(applicant.applicant_id),
    jobId: toNumber(item.job_id),
    score: item.match_score,
    explanationSummary: item.explanation_summary,
    explanationKeywords: item.explanation_keywords,
  }))

  const metadataRows =
    metadataReady && !options.refresh
      ? candidatesForAi.map((job) => ({
          entityType: 'job',
          entityId: toNumber(job.id),
          textHash: job.text_hash,
          embeddingModel: modelName,
        }))
      : [
          {
            entityType: 'applicant',
            entityId: toNumber(applicant.applicant_id),
            textHash: applicantTextData.textHash,
            embeddingModel: modelName,
          },
          ...jobCandidates.map((job) => ({
            entityType: 'job',
            entityId: toNumber(job.id),
            textHash: job.text_hash,
            embeddingModel: modelName,
          })),
        ]

  if (metadataRows.length > 0 || scoreRows.length > 0) {
    await withTransaction(async (client) => {
      if (metadataRows.length > 0) {
        await persistEmbeddingMetadata(client, metadataRows)
      }

      if (scoreRows.length > 0) {
        await persistMatchScores(client, scoreRows)
      }
    })
  }

  await logAuditEvent({
    userId,
    action: 'matching.applicant.recommendations.refresh',
    entityType: 'applicants',
    entityId: toNumber(applicant.applicant_id),
    metadata: {
      candidate_count: jobCandidates.length,
    },
  })

  const mergedRecommendationMap = new Map()
  mapCachedApplicantRecommendationRows(cachedRows).forEach((item) => {
    mergedRecommendationMap.set(toNumber(item.job_id), item)
  })
  rankedFromAi.forEach((item) => {
    mergedRecommendationMap.set(toNumber(item.job_id), item)
  })

  const recommendations = Array.from(mergedRecommendationMap.values())
    .sort((left, right) => Number(right.match_score) - Number(left.match_score))
    .map((item) => enrichRecommendationExplainability(item, applicant))

  const filteredRecommendations = applyScoreFilters(recommendations, options)

  return {
    recommendations: filteredRecommendations,
    meta: buildMetaSummary({
      cached: false,
      model: modelName,
      totalCandidates: jobCandidates.length,
      cacheCoverage,
    }),
  }
}

function mapCachedApplicantRankingForJob(cachedRows, applicantMap, job) {
  return cachedRows
    .map((row) => {
      const applicant = applicantMap.get(toNumber(row.applicant_id))
      if (!applicant) {
        return null
      }

      const enriched = {
        ...applicant,
        match_score: Number(row.score),
        explanation_summary: row.explanation_summary,
        explanation_keywords: parseKeywords(row.explanation_keywords),
        generated_at: row.generated_at,
      }

      return enrichRankedApplicantExplainability(enriched, job)
    })
    .filter(Boolean)
}

async function getRankedApplicantsForJob({ requesterUserId, requesterRole, jobId, options = {} }) {
  incrementCounter('matching.ranking_requests.total')

  if (requesterRole === 'employer') {
    await assertEmployerOwnsJob(requesterUserId, jobId)
  } else if (requesterRole !== 'agency_staff') {
    throw new ApiError(403, 'You do not have access to ranked applicants for this job')
  }

  const job = await getJobForMatching(jobId)
  const applicants = await listApplicantsAppliedToJob(jobId)

  if (!applicants.length) {
    return {
      job,
      rankedApplicants: [],
      meta: buildMetaSummary({
        cached: false,
        model: null,
        totalCandidates: 0,
      }),
    }
  }

  const applicantIds = applicants.map((item) => toNumber(item.applicant_id))
  const documentsMap = await getDocumentFilenameMap(applicantIds)

  const applicantCandidates = applicants.map((applicant) => {
    const textData = buildApplicantMatchingText(applicant, {
      documentFilenames: documentsMap.get(toNumber(applicant.applicant_id)) || '',
    })

    return {
      ...applicant,
      matching_text: textData.text,
      text_hash: textData.textHash,
    }
  })

  const jobTextData = buildJobMatchingText(job)
  if (!jobTextData.text) {
    throw new ApiError(400, 'This job does not contain enough text for matching yet')
  }

  const health = await getAiHealth()
  const modelName = health.model || 'unknown'

  const applicantMetaRows = await getMetadataRows('applicant', applicantIds)
  const jobMetaRows = await getMetadataRows('job', [toNumber(job.id)])

  const metadataReady =
    metadataMatchesHashSet(
      applicantMetaRows,
      applicantCandidates.map((applicant) => ({
        entityId: toNumber(applicant.applicant_id),
        textHash: applicant.text_hash,
      })),
      modelName,
    ) &&
    metadataMatchesHashSet(
      jobMetaRows,
      [{ entityId: toNumber(job.id), textHash: jobTextData.textHash }],
      modelName,
    )

  const applicantMap = new Map(
    applicantCandidates.map((item) => [
      toNumber(item.applicant_id),
      {
        applicant_id: toNumber(item.applicant_id),
        first_name: item.first_name,
        last_name: item.last_name,
        email: item.email,
        profile_status: item.profile_status,
        preferred_job_category: item.preferred_job_category,
        skills_summary: item.skills_summary,
        application_id: toNumber(item.application_id),
        application_status: item.application_status,
        applied_at: item.applied_at,
        application_updated_at: item.application_updated_at,
        endorsement_id: item.endorsement_id ? toNumber(item.endorsement_id) : null,
        endorsed_at: item.endorsed_at,
      },
    ]),
  )

  let cachedRows = []
  let cacheCoverage = 0

  if (!options.refresh && metadataReady) {
    cachedRows = await getCachedJobApplicantScores(toNumber(job.id), applicantIds)
    cacheCoverage = Number((cachedRows.length / Math.max(1, applicantIds.length)).toFixed(2))

    if (cachedRows.length === applicantIds.length) {
      incrementCounter('matching.cache.full_hits')

      const rankedFromCache = mapCachedApplicantRankingForJob(cachedRows, applicantMap, job)
      const reviewContextMap = await getLatestReviewContextMap(toNumber(job.id), applicantIds)
      const withReviewContext = attachReviewContext(rankedFromCache, reviewContextMap)
      const filtered = applyScoreFilters(withReviewContext, options)

      return {
        job,
        rankedApplicants: filtered,
        meta: buildMetaSummary({
          cached: true,
          model: modelName,
          totalCandidates: applicantIds.length,
          cacheCoverage,
        }),
      }
    }
  }

  const cachedRowsByApplicantId = new Map(cachedRows.map((row) => [toNumber(row.applicant_id), row]))
  const candidatesForAi =
    !options.refresh && metadataReady
      ? applicantCandidates.filter((item) => !cachedRowsByApplicantId.has(toNumber(item.applicant_id)))
      : applicantCandidates

  if (cacheCoverage > 0 && cacheCoverage < 1) {
    incrementCounter('matching.cache.partial_hits')
  } else if (cacheCoverage === 0) {
    incrementCounter('matching.cache.misses')
  }

  let rankedFromAi = []
  if (candidatesForAi.length > 0) {
    incrementCounter('matching.ai_rank_requests.total')

    let aiResult
    try {
      aiResult = await rankSemanticMatches({
        queryText: jobTextData.text,
        candidates: candidatesForAi.map((item) => ({
          id: item.applicant_id,
          text: item.matching_text,
        })),
        topK: candidatesForAi.length,
        minScore: null,
      })
    } catch (error) {
      recordDiagnosticEvent({
        service: 'matching-service',
        severity: 'error',
        message: 'Job ranking call failed',
        metadata: {
          requester_role: requesterRole,
          job_id: toNumber(job.id),
          candidate_count: candidatesForAi.length,
        },
      })
      throw error
    }

    rankedFromAi = rankItemsByCandidateMap(aiResult.items || [], applicantMap)
      .map((item) => enrichRankedApplicantExplainability(item, job))
  }

  const scoreRows = rankedFromAi.map((item) => ({
    applicantId: toNumber(item.applicant_id),
    jobId: toNumber(job.id),
    score: item.match_score,
    explanationSummary: item.explanation_summary,
    explanationKeywords: item.explanation_keywords,
  }))

  const metadataRows =
    metadataReady && !options.refresh
      ? candidatesForAi.map((item) => ({
          entityType: 'applicant',
          entityId: toNumber(item.applicant_id),
          textHash: item.text_hash,
          embeddingModel: modelName,
        }))
      : [
          ...applicantCandidates.map((item) => ({
            entityType: 'applicant',
            entityId: toNumber(item.applicant_id),
            textHash: item.text_hash,
            embeddingModel: modelName,
          })),
          {
            entityType: 'job',
            entityId: toNumber(job.id),
            textHash: jobTextData.textHash,
            embeddingModel: modelName,
          },
        ]

  if (metadataRows.length > 0 || scoreRows.length > 0) {
    await withTransaction(async (client) => {
      if (metadataRows.length > 0) {
        await persistEmbeddingMetadata(client, metadataRows)
      }

      if (scoreRows.length > 0) {
        await persistMatchScores(client, scoreRows)
      }
    })
  }

  await logAuditEvent({
    userId: requesterUserId,
    action: `matching.${requesterRole}.job_ranking.refresh`,
    entityType: 'jobs',
    entityId: toNumber(job.id),
    metadata: {
      candidate_count: applicantCandidates.length,
    },
  })

  const mergedRankingsMap = new Map()
  mapCachedApplicantRankingForJob(cachedRows, applicantMap, job).forEach((item) => {
    mergedRankingsMap.set(toNumber(item.applicant_id), item)
  })
  rankedFromAi.forEach((item) => {
    mergedRankingsMap.set(toNumber(item.applicant_id), item)
  })

  const rankedApplicants = Array.from(mergedRankingsMap.values())
    .sort((left, right) => Number(right.match_score) - Number(left.match_score))

  const reviewContextMap = await getLatestReviewContextMap(
    toNumber(job.id),
    rankedApplicants.map((item) => toNumber(item.applicant_id)),
  )
  const withReviewContext = attachReviewContext(rankedApplicants, reviewContextMap)
  const filteredRankedApplicants = applyScoreFilters(withReviewContext, options)

  return {
    job,
    rankedApplicants: filteredRankedApplicants,
    meta: buildMetaSummary({
      cached: false,
      model: modelName,
      totalCandidates: applicantCandidates.length,
      cacheCoverage,
    }),
  }
}

async function getMatchingOperationsSummary() {
  const [scoreStatsResult, metadataStatsResult, reviewStatsResult, aiHealth] = await Promise.all([
    query(
      `
      SELECT
        COUNT(*)::INT AS total_scores,
        COUNT(*) FILTER (WHERE generated_at >= NOW() - INTERVAL '24 hours')::INT AS scores_last_24h,
        MAX(generated_at) AS last_generated_at
      FROM match_scores
      `,
    ),
    query(
      `
      SELECT
        COUNT(*)::INT AS total_embedding_metadata,
        COUNT(*) FILTER (WHERE generated_at >= NOW() - INTERVAL '24 hours')::INT AS metadata_last_24h,
        MAX(generated_at) AS last_generated_at
      FROM embeddings_metadata
      `,
    ),
    query(
      `
      SELECT
        (SELECT COUNT(*)::INT FROM match_review_actions) AS total_review_actions,
        (SELECT COUNT(*)::INT FROM review_notes) AS total_review_notes
      `,
    ),
    getAiHealth().catch(() => ({ status: 'error', matching_ready: false })),
  ])

  return {
    cachePolicy: {
      matchScoreCacheMaxAgeHours: CACHE_MAX_AGE_HOURS,
      optimizationMode: 'partial-cache-with-selective-recompute',
    },
    database: {
      matchScores: scoreStatsResult.rows[0],
      embeddingsMetadata: metadataStatsResult.rows[0],
      humanReview: reviewStatsResult.rows[0],
    },
    runtime: getDiagnosticsSnapshot(),
    recentDiagnostics: listRecentEvents({
      limit: 25,
    }),
    aiService: aiHealth,
    guidance: {
      decisionSupport: buildDecisionSupportNotice(),
      fairness: buildFairnessNotice(),
      humanReview: buildHumanReviewPrompt(),
    },
  }
}

module.exports = {
  getApplicantRecommendedJobs,
  getRankedApplicantsForJob,
  getMatchingOperationsSummary,
}
