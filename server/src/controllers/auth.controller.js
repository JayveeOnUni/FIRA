const {
  registerApplicant,
  registerEmployer,
  login,
  getUserById,
} = require('../services/auth.service')
const { signAuthToken } = require('../utils/jwt')
const { getAuthCookieOptions, getClearAuthCookieOptions } = require('../utils/cookies')
const { env } = require('../config/env')

function setAuthCookie(res, user) {
  const token = signAuthToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  res.cookie(env.authCookieName, token, getAuthCookieOptions())
}

async function registerApplicantController(req, res) {
  const user = await registerApplicant(req.validatedBody)
  setAuthCookie(res, user)

  return res.status(201).json({
    message: 'Applicant account created successfully',
    user,
  })
}

async function registerEmployerController(req, res) {
  const user = await registerEmployer(req.validatedBody)
  setAuthCookie(res, user)

  return res.status(201).json({
    message: 'Employer account created successfully',
    user,
  })
}

async function loginController(req, res) {
  const user = await login(req.validatedBody)
  setAuthCookie(res, user)

  return res.status(200).json({
    message: 'Login successful',
    user,
  })
}

async function logoutController(req, res) {
  res.clearCookie(env.authCookieName, getClearAuthCookieOptions())

  return res.status(200).json({
    message: 'Logout successful',
  })
}

async function currentUserController(req, res) {
  const user = await getUserById(req.auth.userId)

  if (!user) {
    res.clearCookie(env.authCookieName, getClearAuthCookieOptions())
    return res.status(401).json({
      message: 'Session is no longer valid',
    })
  }

  return res.status(200).json({ user })
}

module.exports = {
  registerApplicantController,
  registerEmployerController,
  loginController,
  logoutController,
  currentUserController,
}
