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

export function getStaffAuditSummary() {
  return apiGet('/agency-staff/audit/summary')
}

export function getStaffMaintenanceReadiness() {
  return apiGet('/agency-staff/maintenance/readiness')
}

export function listStaffAuditLogs(filters = {}) {
  return apiGet(`/agency-staff/audit/logs${buildQuery(filters)}`)
}

export async function downloadStaffAuditCsv(filters = {}) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
  const query = buildQuery({
    ...filters,
    format: 'csv',
  })
  const response = await fetch(`${baseUrl}/agency-staff/audit/logs${query}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'text/csv',
    },
  })

  if (!response.ok) {
    let message = `Unable to export audit activity (${response.status})`
    try {
      const payload = await response.json()
      message = payload?.message || message
    } catch {
      // no-op
    }

    const error = new Error(message)
    error.status = response.status
    throw error
  }

  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = 'audit-activity.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(downloadUrl)
}
