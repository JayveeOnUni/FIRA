import { apiGet, apiPost } from './apiClient'

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

export function getMatchingHealth() {
  return apiGet('/matching/health')
}

export function getApplicantRecommendedJobs(params = {}) {
  return apiGet(`/matching/applicant/recommended-jobs${buildQuery(params)}`)
}

export function getEmployerRankedApplicants(jobId, params = {}) {
  return apiGet(`/matching/employer/jobs/${jobId}/ranked-applicants${buildQuery(params)}`)
}

export function getStaffRankedApplicants(jobId, params = {}) {
  return apiGet(`/matching/staff/jobs/${jobId}/ranked-applicants${buildQuery(params)}`)
}

export function createMatchReviewAction(jobId, applicantId, payload) {
  return apiPost(`/matching/jobs/${jobId}/applicants/${applicantId}/review-actions`, payload)
}

export function createReviewNote(jobId, applicantId, payload) {
  return apiPost(`/matching/jobs/${jobId}/applicants/${applicantId}/review-notes`, payload)
}

export function getReviewTimeline(jobId, applicantId) {
  return apiGet(`/matching/jobs/${jobId}/applicants/${applicantId}/review-timeline`)
}

export function getMatchingOperationsSummary() {
  return apiGet('/matching/operations/summary')
}

export async function downloadJobReviewSummaryCsv(jobId) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
  const response = await fetch(`${baseUrl}/matching/jobs/${jobId}/review-summary?format=csv`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'text/csv',
    },
  })

  if (!response.ok) {
    let message = `Unable to export review summary (${response.status})`
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
  link.download = `job-${jobId}-review-summary.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(downloadUrl)
}
