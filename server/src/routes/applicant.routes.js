const express = require('express')
const { roleDashboardController } = require('../controllers/dashboard.controller')
const { requireAuth } = require('../middleware/authRequired')
const { requireRole } = require('../middleware/roleGuard')
const {
  getApplicantProfileController,
  updateApplicantProfileController,
  uploadApplicantDocumentController,
  listApplicantDocumentsController,
  listApplicantApplicationsController,
  withdrawApplicantApplicationController,
} = require('../controllers/applicant.controller')
const { asyncHandler } = require('../utils/asyncHandler')
const { validateBody } = require('../middleware/validateRequest')
const { applicantProfileUpdateSchema } = require('../validation/applicant.validation')
const { uploadApplicantDocument } = require('../middleware/uploadApplicantDocument')
const { withdrawApplicationSchema } = require('../validation/applications.validation')

const router = express.Router()

router.get('/dashboard', requireAuth, requireRole('applicant'), roleDashboardController('applicant'))
router.get('/profile', requireAuth, requireRole('applicant'), asyncHandler(getApplicantProfileController))
router.put(
  '/profile',
  requireAuth,
  requireRole('applicant'),
  validateBody(applicantProfileUpdateSchema),
  asyncHandler(updateApplicantProfileController),
)
router.get('/documents', requireAuth, requireRole('applicant'), asyncHandler(listApplicantDocumentsController))
router.post(
  '/documents',
  requireAuth,
  requireRole('applicant'),
  uploadApplicantDocument,
  asyncHandler(uploadApplicantDocumentController),
)
router.get('/applications', requireAuth, requireRole('applicant'), asyncHandler(listApplicantApplicationsController))
router.patch(
  '/applications/:applicationId/withdraw',
  requireAuth,
  requireRole('applicant'),
  validateBody(withdrawApplicationSchema),
  asyncHandler(withdrawApplicantApplicationController),
)

module.exports = router
