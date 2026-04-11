const { env } = require('../config/env')
const { query } = require('../config/db')
const { getDiagnosticsSnapshot } = require('./diagnostics.service')

async function getHealthSummary() {
  const checks = []

  let database = {
    status: 'not_configured',
  }

  if (env.databaseUrl) {
    try {
      await query('SELECT 1')
      database = { status: 'ok' }
      checks.push('database')
    } catch (error) {
      database = {
        status: 'error',
        message: error.message,
      }
    }
  }

  let aiService = {
    status: 'not_configured',
  }

  if (env.aiServiceUrl) {
    try {
      const response = await fetch(`${env.aiServiceUrl}/health`, { method: 'GET' })
      if (!response.ok) {
        throw new Error(`health status ${response.status}`)
      }

      const payload = await response.json().catch(() => ({}))
      aiService = {
        status: 'ok',
        model: payload.model || null,
        matchingReady: Boolean(payload.matching_ready),
      }
      checks.push('ai_service')
    } catch (error) {
      aiService = {
        status: 'error',
        message: error.message,
      }
    }
  }

  const hasCriticalError = [database.status, aiService.status].includes('error')

  return {
    service: 'fira-server',
    status: hasCriticalError ? 'degraded' : 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Number(process.uptime().toFixed(2)),
    phase: 'phase-7-responsible-ai-and-operations-enhancement',
    checks,
    database,
    aiService,
    diagnostics: getDiagnosticsSnapshot(),
  }
}

module.exports = { getHealthSummary }
