const { randomUUID } = require('crypto')

function attachRequestContext(req, res, next) {
  const incomingRequestId = req.headers['x-request-id']
  const requestId = incomingRequestId ? String(incomingRequestId) : randomUUID()

  req.requestId = requestId
  res.setHeader('x-request-id', requestId)

  return next()
}

module.exports = { attachRequestContext }
