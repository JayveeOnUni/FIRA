const express = require('express')
const { listPublicJobsController, publicJobDetailController } = require('../controllers/jobs.controller')
const { asyncHandler } = require('../utils/asyncHandler')
const { requireAuth } = require('../middleware/authRequired')
const { requireRole } = require('../middleware/roleGuard')
const { applyToJobController } = require('../controllers/application.controller')
const { validateBody } = require('../middleware/validateRequest')
const { applyToJobSchema } = require('../validation/applications.validation')

const router = express.Router()

router.get('/', asyncHandler(listPublicJobsController))
router.get('/:jobId', asyncHandler(publicJobDetailController))
router.post(
  '/:jobId/apply',
  requireAuth,
  requireRole('applicant'),
  validateBody(applyToJobSchema),
  asyncHandler(applyToJobController),
)

module.exports = router
