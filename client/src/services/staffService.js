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

export function getStaffDashboardSummary() {
  return apiGet('/agency-staff/dashboard')
}

export function getStaffAtsCatalog() {
  return apiGet('/agency-staff/ats/catalog')
}

export function listStaffApplicants(filters = {}) {
  return apiGet(`/agency-staff/applicants${buildQuery(filters)}`)
}

export function getStaffApplicantDetail(applicantId) {
  return apiGet(`/agency-staff/applicants/${applicantId}`)
}

export function listStaffJobs(filters = {}) {
  return apiGet(`/agency-staff/jobs${buildQuery(filters)}`)
}

export function getStaffJobApplications(jobId, filters = {}) {
  return apiGet(`/agency-staff/jobs/${jobId}/applications${buildQuery(filters)}`)
}

export function listStaffApplications(filters = {}) {
  return apiGet(`/agency-staff/applications${buildQuery(filters)}`)
}

export function updateStaffApplicationStatus(applicationId, payload) {
  return apiRequest(`/agency-staff/applications/${applicationId}/status`, {
    method: 'PATCH',
    body: payload,
  })
}

export function endorseStaffApplication(applicationId, payload = {}) {
  return apiPost(`/agency-staff/applications/${applicationId}/endorse`, payload)
}

export function listStaffEndorsements(filters = {}) {
  return apiGet(`/agency-staff/endorsements${buildQuery(filters)}`)
}

export function getStaffOperationalSummary() {
  return apiGet('/agency-staff/reports/summary')
}
