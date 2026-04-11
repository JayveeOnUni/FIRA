const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const multer = require('multer')
const { ApiError } = require('../utils/ApiError')
const { env } = require('../config/env')

const uploadDirectory = path.resolve(__dirname, '..', '..', 'uploads', 'applicant-documents')

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true })
}

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
])

const allowedExtensions = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'])

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDirectory)
  },
  filename(req, file, cb) {
    const safeBase = String(file.originalname || 'document')
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .slice(0, 120)
    const randomPart = crypto.randomBytes(8).toString('hex')
    cb(null, `${Date.now()}-${randomPart}-${safeBase}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: env.uploadMaxFileSizeMb * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    const extension = path.extname(String(file.originalname || '')).toLowerCase()
    const isMimeAllowed = allowedMimeTypes.has(file.mimetype)
    const isFallbackAllowed = file.mimetype === 'application/octet-stream' && allowedExtensions.has(extension)

    if (!isMimeAllowed && !isFallbackAllowed) {
      return cb(new ApiError(400, 'Unsupported file type. Allowed: PDF, DOC, DOCX, JPG, PNG'))
    }
    return cb(null, true)
  },
})

function uploadApplicantDocument(req, res, next) {
  const middleware = upload.single('file')

  middleware(req, res, (error) => {
    if (!error) {
      return next()
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, `File is too large. Maximum size is ${env.uploadMaxFileSizeMb}MB.`))
    }

    if (error instanceof ApiError) {
      return next(error)
    }

    return next(new ApiError(400, 'Failed to upload document'))
  })
}

module.exports = { uploadApplicantDocument }
