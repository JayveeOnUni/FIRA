const express = require('express')
const { roleDashboardController } = require('../controllers/dashboard.controller')
const { requireAuth } = require('../middleware/authRequired')
const { requireRole } = require('../middleware/roleGuard')
const { asyncHandler } = require('../utils/asyncHandler')
const {
  getEmployerCompanyController,
  upsertEmployerCompanyController,
  createEmployerJobController,
  listEmployerJobsController,
  getEmployerJobController,
  updateEmployerJobController,
  listEmployerJobApplicantsController,
  listEmployerEndorsedCandidatesController,
} = require('../controllers/employer.controller')
const { validateBody } = require('../middleware/validateRequest')
const {
  companyProfileSchema,
  jobCreateSchema,
  jobUpdateSchema,
} = require('../validation/employer.validation')

const router = express.Router()

router.get('/dashboard', requireAuth, requireRole('employer'), roleDashboardController('employer'))
router.get('/company', requireAuth, requireRole('employer'), asyncHandler(getEmployerCompanyController))
router.put(
  '/company',
  requireAuth,
  requireRole('employer'),
  validateBody(companyProfileSchema),
  asyncHandler(upsertEmployerCompanyController),
)
router.get('/jobs', requireAuth, requireRole('employer'), asyncHandler(listEmployerJobsController))
router.post(
  '/jobs',
  requireAuth,
  requireRole('employer'),
  validateBody(jobCreateSchema),
  asyncHandler(createEmployerJobController),
)
router.get('/jobs/:jobId', requireAuth, requireRole('employer'), asyncHandler(getEmployerJobController))
router.put(
  '/jobs/:jobId',
  requireAuth,
  requireRole('employer'),
  validateBody(jobUpdateSchema),
  asyncHandler(updateEmployerJobController),
)
router.get(
  '/jobs/:jobId/applicants',
  requireAuth,
  requireRole('employer'),
  asyncHandler(listEmployerJobApplicantsController),
)
router.get(
  '/jobs/:jobId/endorsed-candidates',
  requireAuth,
  requireRole('employer'),
  asyncHandler(listEmployerEndorsedCandidatesController),
)

module.exports = router
