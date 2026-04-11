const { env } = require('../config/env')

function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    maxAge: 1000 * 60 * 60 * 12,
    path: '/',
  }
}

function getClearAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    path: '/',
  }
}

module.exports = { getAuthCookieOptions, getClearAuthCookieOptions }
