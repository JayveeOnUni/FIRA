import { apiGet } from './apiClient'

export function listAtsStatuses() {
  return apiGet('/applications/statuses')
}

export function getApplicationStatusHistory(applicationId) {
  return apiGet(`/applications/${applicationId}/history`)
}
