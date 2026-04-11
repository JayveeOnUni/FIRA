const { env } = require('../config/env')
const { ApiError } = require('../utils/ApiError')
const { incrementCounter, recordDiagnosticEvent } = require('./diagnostics.service')

async function requestAi(path, payload) {
  const url = `${env.aiServiceUrl}${path}`
  const startedAt = Date.now()
  incrementCounter('ai_client.requests.total')

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    incrementCounter('ai_client.requests.failed')
    recordDiagnosticEvent({
      service: 'ai-client',
      severity: 'error',
      message: 'AI service request failed (network)',
      metadata: {
        path,
      },
    })
    throw new ApiError(503, 'AI matching service is unreachable')
  }

  let body = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (!response.ok) {
    incrementCounter('ai_client.requests.failed')
    recordDiagnosticEvent({
      service: 'ai-client',
      severity: 'error',
      message: 'AI service request failed (response status)',
      metadata: {
        path,
        status: response.status,
      },
    })
    throw new ApiError(503, body?.detail || body?.message || 'AI matching service request failed')
  }

  incrementCounter('ai_client.requests.success')
  incrementCounter('ai_client.requests.duration_ms.total', Date.now() - startedAt)

  return body
}

async function getAiHealth() {
  incrementCounter('ai_client.health_checks.total')
  const url = `${env.aiServiceUrl}/health`
  let response
  try {
    response = await fetch(url)
  } catch {
    incrementCounter('ai_client.health_checks.failed')
    recordDiagnosticEvent({
      service: 'ai-client',
      severity: 'error',
      message: 'AI service health check failed (network)',
    })
    throw new ApiError(503, 'AI matching service health check failed')
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    incrementCounter('ai_client.health_checks.failed')
    recordDiagnosticEvent({
      service: 'ai-client',
      severity: 'error',
      message: 'AI service health check failed (response status)',
      metadata: {
        status: response.status,
      },
    })
    throw new ApiError(503, payload?.message || 'AI matching service is unavailable')
  }

  incrementCounter('ai_client.health_checks.success')

  return payload
}

async function rankSemanticMatches({ queryText, candidates, topK, minScore }) {
  incrementCounter('ai_client.rank_requests.total')
  return requestAi('/v1/match/rank', {
    query_text: queryText,
    candidates: candidates.map((candidate) => ({
      id: String(candidate.id),
      text: candidate.text,
      metadata: candidate.metadata || null,
    })),
    top_k: topK,
    min_score: minScore,
  })
}

async function generateEmbeddings(texts = []) {
  incrementCounter('ai_client.embedding_requests.total')
  return requestAi('/v1/embeddings', { texts })
}

module.exports = {
  getAiHealth,
  rankSemanticMatches,
  generateEmbeddings,
}
