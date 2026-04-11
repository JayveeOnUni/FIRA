import { apiGet, apiPost } from './apiClient'

export function getEmployerCompanyProfile() {
  return apiGet('/employers/company')
}

export function upsertEmployerCompanyProfile(payload) {
  return apiRequest('/employers/company', {
    method: 'PUT',
    body: payload,
  })
}

export function listEmployerJobs() {
  return apiGet('/employers/jobs')
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
