export function getDashboardPath(role) {
  if (role === 'applicant') return '/dashboard/applicant'
  if (role === 'employer') return '/dashboard/employer'
  if (role === 'agency_staff') return '/dashboard/staff'
  return '/'
}
