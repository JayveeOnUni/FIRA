const { ApiError } = require('../utils/ApiError')
const { verifyAuthToken } = require('../utils/jwt')
const { env } = require('../config/env')

function extractToken(req) {
  const cookieToken = req.cookies ? req.cookies[env.authCookieName] : null
  if (cookieToken) {
    return cookieToken
  }

  const authorization = req.headers.authorization || ''
  if (authorization.startsWith('Bearer ')) {
    return authorization.slice(7)
  }

  return null
}

function requireAuth(req, res, next) {
  const token = extractToken(req)

  if (!token) {
    return next(new ApiError(401, 'Authentication is required'))
  }

  try {
    const payload = verifyAuthToken(token)
    req.auth = {
      userId: Number(payload.userId),
      role: payload.role,
      email: payload.email,
    }
    return next()
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired authentication token'))
  }
}

module.exports = { requireAuth }
