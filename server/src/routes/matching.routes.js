const express = require('express')
const { requireAuth } = require('../middleware/authRequired')
const { requireRole } = require('../middleware/roleGuard')
const { asyncHandler } = require('../utils/asyncHandler')
const { validateBody } = require('../middleware/validateRequest')
const { matchReviewActionSchema, reviewNoteSchema } = require('../validation/matching.validation')
const {
  matchingHealthController,
  applicantRecommendationsController,
  employerRankedApplicantsController,
  staffRankedApplicantsController,
  matchingOperationsSummaryController,
  createMatchReviewActionController,
  createReviewNoteController,
  getReviewTimelineController,
  exportJobReviewSummaryController,
} = require('../controllers/matching.controller')

const router = express.Router()

router.get('/health', requireAuth, asyncHandler(matchingHealthController))

router.get(
  '/applicant/recommended-jobs',
  requireAuth,
  requireRole('applicant'),
  asyncHandler(applicantRecommendationsController),
)

router.get(
  '/employer/jobs/:jobId/ranked-applicants',
  requireAuth,
  requireRole('employer'),
  asyncHandler(employerRankedApplicantsController),
)

router.get(
  '/staff/jobs/:jobId/ranked-applicants',
  requireAuth,
  requireRole('agency_staff'),
  asyncHandler(staffRankedApplicantsController),
)

router.get(
  '/operations/summary',
  requireAuth,
  requireRole('agency_staff'),
  asyncHandler(matchingOperationsSummaryController),
)

router.get(
  '/jobs/:jobId/review-summary',
  requireAuth,
  requireRole('employer', 'agency_staff'),
  asyncHandler(exportJobReviewSummaryController),
)

router.get(
  '/jobs/:jobId/applicants/:applicantId/review-timeline',
  requireAuth,
  requireRole('employer', 'agency_staff'),
  asyncHandler(getReviewTimelineController),
)

router.post(
  '/jobs/:jobId/applicants/:applicantId/review-actions',
  requireAuth,
  requireRole('employer', 'agency_staff'),
  validateBody(matchReviewActionSchema),
  asyncHandler(createMatchReviewActionController),
)

router.post(
  '/jobs/:jobId/applicants/:applicantId/review-notes',
  requireAuth,
  requireRole('employer', 'agency_staff'),
  validateBody(reviewNoteSchema),
  asyncHandler(createReviewNoteController),
)

module.exports = router
