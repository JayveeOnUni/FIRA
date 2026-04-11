const { ApiError } = require('../utils/ApiError')
const { parsePositiveInt } = require('../utils/parse')
const { getAiHealth } = require('../services/aiMatchingClient.service')
const {
  getApplicantRecommendedJobs,
  getRankedApplicantsForJob,
  getMatchingOperationsSummary,
} = require('../services/matching.service')
const {
  createMatchReviewAction,
  createReviewNote,
  getReviewTimeline,
  getJobReviewSummary,
} = require('../services/reviewGovernance.service')

function parseOptionalTopN(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return 10
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 100) {
    throw new ApiError(400, 'topN must be an integer between 1 and 100')
  }

  return parsed
}

function parseOptionalMinScore(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < -1 || parsed > 1) {
    throw new ApiError(400, 'minScore must be a number between -1 and 1')
  }

  return parsed
}

function parseOptionalBoolean(value, fieldName) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return false
  }

  const normalized = String(value).trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false

  throw new ApiError(400, `${fieldName} must be either "true" or "false"`)
}

function parseOptionalExportFormat(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return 'json'
  }

  const normalized = String(value).trim().toLowerCase()
  if (normalized === 'json' || normalized === 'csv') {
    return normalized
  }

  throw new ApiError(400, 'format must be either "json" or "csv"')
}

function extractRankingOptions(req) {
  return {
    topN: parseOptionalTopN(req.query.topN),
    minScore: parseOptionalMinScore(req.query.minScore),
    refresh: parseOptionalBoolean(req.query.refresh, 'refresh'),
  }
}

async function matchingHealthController(req, res) {
  const health = await getAiHealth()
  return res.status(200).json({
    message: 'AI matching service is reachable',
    ai: health,
  })
}

async function applicantRecommendationsController(req, res) {
  const payload = await getApplicantRecommendedJobs(req.auth.userId, extractRankingOptions(req))

  return res.status(200).json({
    recommendations: payload.recommendations,
    count: payload.recommendations.length,
    meta: payload.meta,
  })
}

async function employerRankedApplicantsController(req, res) {
  const payload = await getRankedApplicantsForJob({
    requesterUserId: req.auth.userId,
    requesterRole: req.auth.role,
    jobId: parsePositiveInt(req.params.jobId, 'jobId'),
    options: extractRankingOptions(req),
  })

  return res.status(200).json({
    job: payload.job,
    rankedApplicants: payload.rankedApplicants,
    count: payload.rankedApplicants.length,
    meta: payload.meta,
  })
}

async function staffRankedApplicantsController(req, res) {
  const payload = await getRankedApplicantsForJob({
    requesterUserId: req.auth.userId,
    requesterRole: req.auth.role,
    jobId: parsePositiveInt(req.params.jobId, 'jobId'),
    options: extractRankingOptions(req),
  })

  return res.status(200).json({
    job: payload.job,
    rankedApplicants: payload.rankedApplicants,
    count: payload.rankedApplicants.length,
    meta: payload.meta,
  })
}

async function matchingOperationsSummaryController(req, res) {
  const summary = await getMatchingOperationsSummary()
  return res.status(200).json(summary)
}

async function createMatchReviewActionController(req, res) {
  const reviewAction = await createMatchReviewAction({
    actorUserId: req.auth.userId,
    actorRole: req.auth.role,
    jobId: parsePositiveInt(req.params.jobId, 'jobId'),
    applicantId: parsePositiveInt(req.params.applicantId, 'applicantId'),
    payload: req.validatedBody,
  })

  return res.status(201).json({
    message: 'Human review action recorded successfully',
    reviewAction,
  })
}

async function createReviewNoteController(req, res) {
  const reviewNote = await createReviewNote({
    actorUserId: req.auth.userId,
    actorRole: req.auth.role,
    jobId: parsePositiveInt(req.params.jobId, 'jobId'),
    applicantId: parsePositiveInt(req.params.applicantId, 'applicantId'),
    payload: req.validatedBody,
  })

  return res.status(201).json({
    message: 'Review note saved successfully',
    reviewNote,
  })
}

async function getReviewTimelineController(req, res) {
  const timeline = await getReviewTimeline({
    actorUserId: req.auth.userId,
    actorRole: req.auth.role,
    jobId: parsePositiveInt(req.params.jobId, 'jobId'),
    applicantId: parsePositiveInt(req.params.applicantId, 'applicantId'),
  })

  return res.status(200).json(timeline)
}

async function exportJobReviewSummaryController(req, res) {
  const jobId = parsePositiveInt(req.params.jobId, 'jobId')
  const format = parseOptionalExportFormat(req.query.format)
  const payload = await getJobReviewSummary({
    actorUserId: req.auth.userId,
    actorRole: req.auth.role,
    jobId,
  })

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="job-${jobId}-review-summary.csv"`)
    return res.status(200).send(payload.csv)
  }

  return res.status(200).json({
    rows: payload.rows,
    count: payload.rows.length,
  })
}

module.exports = {
  matchingHealthController,
  applicantRecommendationsController,
  employerRankedApplicantsController,
  staffRankedApplicantsController,
  matchingOperationsSummaryController,
  createMatchReviewActionController,
  createReviewNoteController,
  getReviewTimelineController,
  exportJobReviewSummaryController,
}
