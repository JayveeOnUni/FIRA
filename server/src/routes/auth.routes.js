const express = require('express')
const {
  registerApplicantController,
  registerEmployerController,
  loginController,
  logoutController,
  currentUserController,
} = require('../controllers/auth.controller')
const { asyncHandler } = require('../utils/asyncHandler')
const { validateBody } = require('../middleware/validateRequest')
const { requireAuth } = require('../middleware/authRequired')
const {
  applicantRegistrationSchema,
  employerRegistrationSchema,
  loginSchema,
} = require('../validation/auth.validation')

const router = express.Router()

router.post('/register/applicant', validateBody(applicantRegistrationSchema), asyncHandler(registerApplicantController))
router.post('/register/employer', validateBody(employerRegistrationSchema), asyncHandler(registerEmployerController))
router.post('/login', validateBody(loginSchema), asyncHandler(loginController))
router.post('/logout', asyncHandler(logoutController))
router.get('/me', requireAuth, asyncHandler(currentUserController))

module.exports = router
