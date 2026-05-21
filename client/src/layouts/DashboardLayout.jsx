import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getDashboardPath } from '../utils/roleRoutes'

function getRoleLabel(role) {
  if (role === 'applicant') return 'Applicant'
  if (role === 'employer') return 'Employer'
  if (role === 'agency_staff') return 'Agency Staff'
  return 'User'
}

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

  const dashboardPath = getDashboardPath(user?.role)
  const roleLabel = getRoleLabel(user?.role)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const roleLinks = (() => {
    if (user?.role === 'applicant') {
      return [
        { to: '/dashboard/applicant', label: 'Overview' },
        { to: '/dashboard/applicant/profile', label: 'My Profile' },
        { to: '/dashboard/applicant/documents', label: 'My Documents' },
        { to: '/dashboard/applicant/applications', label: 'My Applications' },
        { to: '/dashboard/applicant/recommendations', label: 'Recommended Jobs' },
      ]
    }

    if (user?.role === 'employer') {
      return [
        { to: '/dashboard/employer', label: 'Overview' },
        { to: '/dashboard/employer/company', label: 'Company Profile' },
        { to: '/dashboard/employer/jobs', label: 'Manage Jobs' },
        { to: '/dashboard/employer/jobs/new', label: 'Post New Job' },
      ]
    }

    if (user?.role === 'agency_staff') {
      return [
        { to: '/dashboard/staff', label: 'Overview' },
        { to: '/dashboard/staff/applications', label: 'ATS Queue' },
        { to: '/dashboard/staff/applicants', label: 'Applicants' },
        { to: '/dashboard/staff/jobs', label: 'Jobs Monitor' },
        { to: '/dashboard/staff/endorsements', label: 'Endorsements' },
      ]
    }

    return [{ to: dashboardPath, label: 'Overview' }]
  })()

  return (
    <div className="min-h-screen bg-slate-100">
      <a href="#dashboard-content" className="skip-link">
        Skip to dashboard content
      </a>
      {isDemoMode && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-900" role="status">
          Demo mode is enabled. Use seeded/demo data for presentation and avoid entering real applicant information.
        </div>
      )}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">FIRA Dashboard</p>
            <h1 className="text-lg font-semibold text-slate-900">{roleLabel} Workspace</h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-sm text-slate-600 sm:block">
              Signed in as <span className="font-medium text-slate-800">{user?.email}</span>
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px,1fr] lg:px-8">
        <aside className="rounded-xl border border-slate-200 bg-white p-4">
          <nav className="flex flex-col gap-2 text-sm" aria-label={`${roleLabel} dashboard navigation`}>
            {roleLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === dashboardPath}
                className={({ isActive }) =>
                  [
                    'rounded-md px-3 py-2',
                    isActive
                      ? 'bg-brand-secondary text-brand-accent font-semibold'
                      : 'text-slate-600 hover:bg-slate-100',
                  ].join(' ')
                }
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink
              to="/"
              className={({ isActive }) =>
                [
                  'rounded-md px-3 py-2',
                  isActive ? 'bg-brand-secondary text-brand-accent font-semibold' : 'text-slate-600 hover:bg-slate-100',
                ].join(' ')
              }
            >
              Public Website
            </NavLink>
          </nav>
        </aside>

        <main id="dashboard-content" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
