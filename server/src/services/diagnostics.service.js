const MAX_EVENTS = 200

const runtime = {
  counters: {},
  events: [],
}

function incrementCounter(counterName, value = 1) {
  if (!counterName) {
    return
  }

  runtime.counters[counterName] = (runtime.counters[counterName] || 0) + value
}

function recordDiagnosticEvent({ service = 'server', severity = 'info', message, metadata = null }) {
  if (!message) {
    return
  }

  const event = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    service,
    severity,
    message,
    metadata: metadata || null,
    createdAt: new Date().toISOString(),
  }

  runtime.events.unshift(event)
  if (runtime.events.length > MAX_EVENTS) {
    runtime.events.length = MAX_EVENTS
  }

  if (severity === 'error') {
    // Keep console output for operational traceability.
    console.error(`[diagnostic:${service}] ${message}`)
  }
}

function listRecentEvents({ limit = 30, severity } = {}) {
  const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(200, Number(limit))) : 30

  const filtered = severity
    ? runtime.events.filter((event) => event.severity === severity)
    : runtime.events

  return filtered.slice(0, safeLimit)
}

function getDiagnosticsSnapshot() {
  const now = Date.now()
  const lastHourErrorCount = runtime.events.filter(
    (event) => event.severity === 'error' && now - new Date(event.createdAt).getTime() <= 60 * 60 * 1000,
  ).length

  return {
    counters: { ...runtime.counters },
    eventCount: runtime.events.length,
    lastHourErrorCount,
    lastEventAt: runtime.events[0]?.createdAt || null,
  }
}

module.exports = {
  incrementCounter,
  recordDiagnosticEvent,
  listRecentEvents,
  getDiagnosticsSnapshot,
}
