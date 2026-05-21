import { apiGet, apiPost, apiRequest } from './apiClient'

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export function getEmployerDashboardSummary() {
  return apiGet('/employers/dashboard')
}

export function getEmployerCompanyProfile() {
  return apiGet('/employers/company')
}

export function upsertEmployerCompanyProfile(payload) {
  return apiRequest('/employers/company', {
    method: 'PUT',
    body: payload,
  })
}

export function listEmployerJobs(filters = {}) {
  return apiGet(`/employers/jobs${buildQuery(filters)}`)
}

export function createEmployerJob(payload) {
  return apiPost('/employers/jobs', payload)
}

export function getEmployerJob(jobId) {
  return apiGet(`/employers/jobs/${jobId}`)
}

export function updateEmployerJob(jobId, payload) {
  return apiRequest(`/employers/jobs/${jobId}`, {
    method: 'PUT',
    body: payload,
  })
}

export function listEmployerJobApplicants(jobId) {
  return apiGet(`/employers/jobs/${jobId}/applicants`)
}

export function listEmployerEndorsedCandidates(jobId) {
  return apiGet(`/employers/jobs/${jobId}/endorsed-candidates`)
}
