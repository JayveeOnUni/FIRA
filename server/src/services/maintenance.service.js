const { getHealthSummary } = require('./health.service')
const { getAuditActivitySummary } = require('./audit.service')
const { getDiagnosticsSnapshot, listRecentEvents } = require('./diagnostics.service')

function evaluateReadiness({ health, auditSummary, diagnostics }) {
  const blockers = []
  const warnings = []

  if (health.status !== 'ok') {
    blockers.push('Health check is degraded. Review database and AI service connectivity.')
  }

  if (diagnostics.lastHourErrorCount > 0) {
    warnings.push(`${diagnostics.lastHourErrorCount} runtime error event(s) recorded in the last hour.`)
  }

  if (!auditSummary?.totals?.latest_event_at) {
    warnings.push('No audit activity has been recorded yet. Run a role workflow before final demo evidence capture.')
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
  }
}

async function getMaintenanceReadinessSummary() {
  const [health, auditSummary] = await Promise.all([
    getHealthSummary(),
    getAuditActivitySummary(),
  ])
  const diagnostics = getDiagnosticsSnapshot()
  const readiness = evaluateReadiness({ health, auditSummary, diagnostics })

  return {
    generatedAt: new Date().toISOString(),
    readiness,
    health: {
      status: health.status,
      database: health.database,
      aiService: health.aiService,
      uptimeSeconds: health.uptimeSeconds,
    },
    audit: {
      totals: auditSummary.totals,
      topActions: auditSummary.byAction,
    },
    diagnostics,
    recentDiagnosticEvents: listRecentEvents({ limit: 10 }),
    checklist: [
      'Run frontend build and backend checks.',
      'Create or confirm a recent database backup.',
      'Confirm staff audit monitoring is accessible only to agency staff.',
      'Run applicant, employer, and staff demo workflows.',
      'Confirm AI matching remains decision support and does not auto-change ATS statuses.',
    ],
  }
}

module.exports = { getMaintenanceReadinessSummary }
