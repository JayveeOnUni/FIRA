import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentProfile } from '../../services/authService'
import { useAuth } from '../../hooks/useAuth'

export function EmployerDashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getCurrentProfile()
        setProfile(response.profile)
      } catch {
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Employer Dashboard</h2>
        <p className="text-sm text-slate-600">Welcome, {user?.firstName} {user?.lastName}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-900">Company Foundation</h3>
          {loading ? (
            <p className="mt-2 text-sm text-slate-600">Loading company profile...</p>
          ) : (
            <p className="mt-2 text-sm text-slate-700">
              Company: <span className="font-medium">{profile?.company_name || 'Not yet linked'}</span>
            </p>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-900">Recruitment Actions</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link to="/dashboard/employer/company" className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
              Edit Company
            </Link>
            <Link to="/dashboard/employer/jobs" className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
              Manage Jobs
            </Link>
            <Link to="/dashboard/employer/jobs/new" className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
              Create Job
            </Link>
          </div>
        </article>
      </div>
    </section>
  )
}
