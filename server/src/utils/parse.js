const { ApiError } = require('./ApiError')

function parsePositiveInt(value, fieldName) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, `${fieldName} must be a positive integer`)
  }

  return parsed
}

module.exports = { parsePositiveInt }
