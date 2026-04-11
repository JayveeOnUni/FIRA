const { recordDiagnosticEvent } = require('../services/diagnostics.service')

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500
  const isServerError = statusCode >= 500
  const exposeMessage = err.exposeMessage === true || !isServerError

  const payload = {
    message: exposeMessage ? err.message : 'An unexpected error occurred',
    path: req.originalUrl,
    requestId: req.requestId || null,
  }

  if (!isServerError && err.details) {
    payload.details = err.details
  }

  if (isServerError && process.env.NODE_ENV !== 'production') {
    payload.debug = err.message
  }

  if (isServerError) {
    recordDiagnosticEvent({
      service: 'server',
      severity: 'error',
      message: 'Unhandled server error returned to client',
      metadata: {
        path: req.originalUrl,
        method: req.method,
        requestId: req.requestId || null,
      },
    })
  }

  return res.status(statusCode).json(payload)
}

module.exports = { errorHandler }
