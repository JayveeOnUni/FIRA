const dotenv = require('dotenv')

dotenv.config()

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || '',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8001',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  authCookieName: process.env.AUTH_COOKIE_NAME || 'fira_auth_token',
  uploadMaxFileSizeMb: Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 5),
  backupDirectory: process.env.BACKUP_DIR || 'backups',
  restoreFile: process.env.RESTORE_FILE || '',
}

function validateProductionEnv() {
  if (env.nodeEnv !== 'production') {
    return
  }

  const missing = []
  if (!env.databaseUrl) missing.push('DATABASE_URL')
  if (!env.clientOrigin) missing.push('CLIENT_ORIGIN')
  if (!env.aiServiceUrl) missing.push('AI_SERVICE_URL')

  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`)
  }

  if (!env.jwtSecret || env.jwtSecret === 'dev-only-secret-change-me' || env.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be set to a strong value of at least 32 characters in production')
  }
}

module.exports = { env, validateProductionEnv }
