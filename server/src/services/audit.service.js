const { query } = require('../config/db')

async function logAuditEvent({ userId = null, action, entityType = null, entityId = null, metadata = null }) {
  if (!action) {
    return
  }

  try {
    await query(
      `
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [userId, action, entityType, entityId, metadata || null],
    )
  } catch (error) {
    // Audit logging should never block the main request path.
    console.error('Audit log write failed:', error.message)
  }
}

module.exports = { logAuditEvent }
