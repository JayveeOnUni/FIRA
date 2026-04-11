import { apiGet } from './apiClient'
import { apiPost } from './apiClient'

export function listPublicJobs({ search = '', location = '', employmentType = '' } = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (location) params.set('location', location)
  if (employmentType) params.set('employmentType', employmentType)

  const query = params.toString() ? `?${params.toString()}` : ''
  return apiGet(`/jobs${query}`)
}

export function getPublicJobDetail(jobId) {
  return apiGet(`/jobs/${jobId}`)
}

export function applyToJob(jobId, payload = {}) {
  return apiPost(`/jobs/${jobId}/apply`, payload)
}
