const express = require('express')
const { requireAuth } = require('../middleware/authRequired')
const { requireRole } = require('../middleware/roleGuard')
const { asyncHandler } = require('../utils/asyncHandler')
const { validateBody } = require('../middleware/validateRequest')
const { staffStatusUpdateSchema, staffEndorsementSchema } = require('../validation/staff.validation')
const {
  staffDashboardController,
  staffApplicantListController,
  staffApplicantDetailController,
  staffJobsController,
  staffJobApplicationsController,
  staffApplicationsController,
  staffUpdateApplicationStatusController,
  staffCreateEndorsementController,
  staffEndorsementsController,
  staffOperationalSummaryController,
  staffAtsCatalogController,
} = require('../controllers/staff.controller')

const router = express.Router()

router.use(requireAuth, requireRole('agency_staff'))

router.get('/dashboard', asyncHandler(staffDashboardController))
router.get('/ats/catalog', asyncHandler(staffAtsCatalogController))
router.get('/reports/summary', asyncHandler(staffOperationalSummaryController))

router.get('/applicants', asyncHandler(staffApplicantListController))
router.get('/applicants/:applicantId', asyncHandler(staffApplicantDetailController))

router.get('/jobs', asyncHandler(staffJobsController))
router.get('/jobs/:jobId/applications', asyncHandler(staffJobApplicationsController))

router.get('/applications', asyncHandler(staffApplicationsController))
router.patch(
  '/applications/:applicationId/status',
  validateBody(staffStatusUpdateSchema),
  asyncHandler(staffUpdateApplicationStatusController),
)

router.get('/endorsements', asyncHandler(staffEndorsementsController))
router.post(
  '/applications/:applicationId/endorse',
  validateBody(staffEndorsementSchema),
  asyncHandler(staffCreateEndorsementController),
)

module.exports = router
