const { ApiError } = require('../utils/ApiError')

function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body)

    if (!parsed.success) {
      return next(
        new ApiError(400, 'Invalid request payload', {
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        }),
      )
    }

    req.validatedBody = parsed.data
    return next()
  }
}

module.exports = { validateBody }
