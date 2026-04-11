const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

function buildRequestOptions(options = {}) {
  const { method = 'GET', body, headers = {}, credentials = 'include' } = options
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  }

  const requestOptions = {
    method,
    credentials,
    headers: requestHeaders,
  }

  if (body !== undefined) {
    requestOptions.body = JSON.stringify(body)
  }

  return requestOptions
}

function createApiError(status, message, details) {
  const error = new Error(message || 'Request failed')
  error.status = status
  error.details = details
  return error
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, buildRequestOptions(options))
  let payload = null

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw createApiError(
      response.status,
      payload?.message || `API request failed with status ${response.status}`,
      payload?.details,
    )
  }

  return payload
}

export function apiGet(path) {
  return apiRequest(path, { method: 'GET' })
}

export function apiPost(path, body) {
  return apiRequest(path, { method: 'POST', body })
}
