import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getDashboardPath } from '../utils/roleRoutes'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'FAQ' },
  { to: '/news', label: 'News' },
  { to: '/contact', label: 'Contact' },
  { to: '/jobs', label: 'Job Search' },
]

export function SiteHeader() {
  const { user, loading, logout } = useAuth()
  const dashboardPath = getDashboardPath(user?.role)
  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      // Keep UX resilient even if network logout call fails.
      console.error(error)
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="text-lg font-bold tracking-wide text-brand-primary">
          FIRA Platform
        </NavLink>

        <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Primary navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                [
                  'rounded-md px-3 py-2 transition',
                  isActive ? 'bg-brand-secondary text-brand-accent' : 'text-slate-600 hover:bg-slate-100',
                ].join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-sm">
          {!loading && !user && (
            <>
              <NavLink
                to="/login"
                className="rounded-md border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-100"
              >
                Login
              </NavLink>
              <NavLink
                to="/register/applicant"
                className="rounded-md bg-brand-primary px-3 py-2 font-semibold text-white hover:opacity-90"
              >
                Register
              </NavLink>
            </>
          )}

          {!loading && user && (
            <>
              <NavLink to={dashboardPath} className="rounded-md bg-brand-primary px-3 py-2 font-semibold text-white">
                Dashboard
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-100"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
