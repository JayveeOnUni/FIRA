import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEmployerDashboardSummary } from '../../services/employerService'
import { useAuth } from '../../hooks/useAuth'

export function EmployerDashboardPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await getEmployerDashboardSummary()
        setSummary(response)
      } catch (requestError) {
        setError(requestError.message || 'Unable to load employer dashboard.')
      } finally {
        setLoading(false)
      }
    }

    loadSummary()
  }, [])

  const employer = summary?.employer
  const metrics = summary?.metrics || {}
  const statusCountMap =
    summary?.applicationsByStatus?.reduce((acc, item) => {
      acc[item.status] = item.count
      return acc
    }, {}) || {}

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Employer Dashboard</h2>
        <p className="text-sm text-slate-600">Welcome, {user?.firstName} {user?.lastName}</p>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-4">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Company</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{loading ? '...' : employer?.company_name || 'Not linked'}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Jobs</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? '...' : metrics.job_count || 0}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Applications</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? '...' : metrics.application_count || 0}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Endorsements</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? '...' : metrics.endorsement_count || 0}</p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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

        <article className="rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900">Applications by Status</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {['Applied', 'Under Review', 'Verified', 'Shortlisted', 'Endorsed', 'Rejected', 'Withdrawn'].map((status) => (
              <div key={status} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-medium">{status}</span>: {statusCountMap[status] || 0}
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900">Recent Applicant Activity</h3>
          {loading ? (
            <p className="mt-3 text-sm text-slate-600">Loading activity...</p>
          ) : !summary?.recentApplications?.length ? (
            <p className="mt-3 text-sm text-slate-600">No applications have been submitted yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {summary.recentApplications.map((application) => (
                <li key={application.application_id} className="rounded-md bg-slate-50 p-3">
                  <p className="font-medium text-slate-900">
                    {application.first_name} {application.last_name} for {application.job_title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {application.status} • Updated {new Date(application.updated_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900">Jobs Needing Attention</h3>
          {loading ? (
            <p className="mt-3 text-sm text-slate-600">Loading jobs...</p>
          ) : !summary?.jobsNeedingAttention?.length ? (
            <p className="mt-3 text-sm text-slate-600">No active or draft jobs to review.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {summary.jobsNeedingAttention.map((job) => (
                <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 p-3">
                  <div>
                    <p className="font-medium text-slate-900">{job.title}</p>
                    <p className="text-xs text-slate-500">
                      {job.status} • {job.application_count} applications
                    </p>
                  </div>
                  <Link
                    to={`/dashboard/employer/jobs/${job.id}/edit`}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  )
}
