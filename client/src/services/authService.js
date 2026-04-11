import { apiGet, apiPost } from './apiClient'

export function registerApplicantRequest(payload) {
  return apiPost('/auth/register/applicant', payload)
}

export function registerEmployerRequest(payload) {
  return apiPost('/auth/register/employer', payload)
}

export function loginRequest(payload) {
  return apiPost('/auth/login', payload)
}

export function logoutRequest() {
  return apiPost('/auth/logout', {})
}

export function getCurrentUser() {
  return apiGet('/auth/me')
}

export function getCurrentProfile() {
  return apiGet('/users/me/profile')
}
