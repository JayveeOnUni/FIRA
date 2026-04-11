const { ApiError } = require('../utils/ApiError')

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth?.role) {
      return next(new ApiError(401, 'Authentication context is missing'))
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return next(new ApiError(403, 'You do not have permission to access this resource'))
    }

    return next()
  }
}

module.exports = { requireRole }
