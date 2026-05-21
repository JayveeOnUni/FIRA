import { apiGet, apiRequest } from './apiClient'

export function getApplicantProfile() {
  return apiGet('/applicants/profile')
}

export function getApplicantDashboardSummary() {
  return apiGet('/applicants/dashboard')
}

export function updateApplicantProfile(payload) {
  return apiRequest('/applicants/profile', {
    method: 'PUT',
    body: payload,
  })
}

export function listApplicantDocuments() {
  return apiGet('/applicants/documents')
}

export async function uploadApplicantDocument({ file, documentType = 'resume' }) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('documentType', documentType)

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
  const response = await fetch(`${baseUrl}/applicants/documents`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const error = new Error(payload?.message || `Upload failed with status ${response.status}`)
    error.status = response.status
    error.details = payload?.details
    throw error
  }

  return payload
}

export function listApplicantApplications() {
  return apiGet('/applicants/applications')
}

export function withdrawApplicantApplication(applicationId, payload = {}) {
  return apiRequest(`/applicants/applications/${applicationId}/withdraw`, {
    method: 'PATCH',
    body: payload,
  })
}
