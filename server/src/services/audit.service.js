const { query } = require('../config/db')

function normalizeOptional(value) {
  if (value === undefined || value === null) {
    return null
  }

  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : null
}

function toCsvField(value) {
  if (value === undefined || value === null) {
    return '""'
  }

  return `"${String(value).replace(/"/g, '""')}"`
}

function auditRowsToCsv(rows = []) {
  const columns = [
    'id',
    'created_at',
    'actor',
    'actor_email',
    'action',
    'entity_type',
    'entity_id',
    'metadata',
  ]

  const lines = [columns.join(',')]
  rows.forEach((row) => {
    lines.push(
      [
        row.id,
        row.created_at,
        row.actor_name,
        row.actor_email,
        row.action,
        row.entity_type,
        row.entity_id,
        row.metadata ? JSON.stringify(row.metadata) : '',
      ]
        .map(toCsvField)
        .join(','),
    )
  })

  return lines.join('\n')
}

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

async function listAuditLogs(filters = {}) {
  const limit = Math.min(Math.max(Number(filters.limit) || 50, 1), 200)

  const result = await query(
    `
    SELECT
      al.id,
      al.user_id,
      al.action,
      al.entity_type,
      al.entity_id,
      al.metadata,
      al.created_at,
      u.email AS actor_email,
      u.first_name AS actor_first_name,
      u.last_name AS actor_last_name,
      r.name AS actor_role
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.user_id
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE (
      $1::text IS NULL
      OR LOWER(al.action) LIKE $1
      OR LOWER(COALESCE(al.entity_type, '')) LIKE $1
      OR LOWER(COALESCE(u.email, '')) LIKE $1
      OR LOWER(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) LIKE $1
    )
      AND (
        $2::text IS NULL
        OR al.entity_type = $2
      )
      AND (
        $3::bigint IS NULL
        OR al.user_id = $3
      )
      AND (
        $4::text IS NULL
        OR al.action = $4
      )
    ORDER BY al.created_at DESC
    LIMIT $5
    `,
    [
      normalizeOptional(filters.search) ? `%${normalizeOptional(filters.search).toLowerCase()}%` : null,
      normalizeOptional(filters.entityType),
      filters.userId || null,
      normalizeOptional(filters.action),
      limit,
    ],
  )

  return result.rows.map((row) => ({
    ...row,
    actor_name: `${row.actor_first_name || ''} ${row.actor_last_name || ''}`.trim() || 'System',
  }))
}

async function getAuditActivitySummary() {
  const [totalsResult, actionResult, entityResult, recentResult] = await Promise.all([
    query(
      `
      SELECT
        COUNT(*)::INT AS total_events,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::INT AS events_last_24h,
        COUNT(DISTINCT user_id)::INT AS distinct_actors,
        MAX(created_at) AS latest_event_at
      FROM audit_logs
      `,
    ),
    query(
      `
      SELECT action, COUNT(*)::INT AS count
      FROM audit_logs
      GROUP BY action
      ORDER BY count DESC, action ASC
      LIMIT 10
      `,
    ),
    query(
      `
      SELECT COALESCE(entity_type, 'system') AS entity_type, COUNT(*)::INT AS count
      FROM audit_logs
      GROUP BY COALESCE(entity_type, 'system')
      ORDER BY count DESC, entity_type ASC
      LIMIT 10
      `,
    ),
    listAuditLogs({ limit: 10 }),
  ])

  return {
    totals: totalsResult.rows[0] || {
      total_events: 0,
      events_last_24h: 0,
      distinct_actors: 0,
      latest_event_at: null,
    },
    byAction: actionResult.rows,
    byEntityType: entityResult.rows,
    recent: recentResult,
  }
}

module.exports = {
  logAuditEvent,
  listAuditLogs,
  getAuditActivitySummary,
  auditRowsToCsv,
}
