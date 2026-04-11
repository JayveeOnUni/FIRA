function notFound(req, res) {
  return res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    requestId: req.requestId || null,
  })
}

module.exports = { notFound }
