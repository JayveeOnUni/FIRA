class ApiError extends Error {
  constructor(statusCode, message, details, exposeMessage = true) {
    super(message)
    this.statusCode = statusCode
    this.details = details
    this.exposeMessage = exposeMessage
  }
}

module.exports = { ApiError }
