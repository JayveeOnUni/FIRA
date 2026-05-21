import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApplicantDashboardSummary } from '../../services/applicantService'
import { useAuth } from '../../hooks/useAuth'

export function ApplicantDashboardPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await getApplicantDashboardSummary()
        setSummary(response)
      } catch (requestError) {
        setError(requestError.message || 'Unable to load dashboard summary.')
      } finally {
        setLoading(false)
      }
    }

    loadSummary()
  }, [])

  const profile = summary?.profile
  const metrics = summary?.metrics || {}
  const statusCountMap =
    summary?.applicationsByStatus?.reduce((acc, item) => {
      acc[item.status] = item.count
      return acc
    }, {}) || {}

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Applicant Dashboard</h2>
        <p className="text-sm text-slate-600">Welcome, {user?.firstName} {user?.lastName}</p>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-4">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Profile Status</p>
          <p className="mt-2 text-2xl font-bold capitalize text-slate-900">{loading ? '...' : profile?.profile_status || 'incomplete'}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Documents</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? '...' : metrics.document_count || 0}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Applications</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? '...' : metrics.application_count || 0}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Endorsed</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? '...' : metrics.endorsed_count || 0}</p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-900">Recruitment Actions</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link to="/dashboard/applicant/profile" className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
              Edit Profile
            </Link>
            <Link to="/dashboard/applicant/documents" className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
              Manage Documents
            </Link>
            <Link to="/dashboard/applicant/applications" className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
              Track Applications
            </Link>
            <Link to="/dashboard/applicant/recommendations" className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
              Recommended Jobs
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

      <article className="rounded-lg border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900">Recent Application Updates</h3>
        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Loading recent updates...</p>
        ) : !summary?.recentApplications?.length ? (
          <p className="mt-3 text-sm text-slate-600">No applications yet. Browse published jobs to get started.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {summary.recentApplications.map((application) => (
              <li key={application.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 p-3">
                <div>
                  <p className="font-medium text-slate-900">{application.job_title}</p>
                  <p className="text-xs text-slate-500">
                    {application.company_name || 'Company unavailable'} • {application.job_location || 'Location TBD'} • Updated{' '}
                    {new Date(application.updated_at).toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {application.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="font-semibold text-slate-900">Profile Signals</h3>
        <p className="mt-2 text-sm text-slate-700">
          Preferred category: <span className="font-medium">{profile?.preferred_job_category || 'Not set'}</span>
        </p>
        <p className="mt-1 text-sm text-slate-700">
          Skills summary: <span className="font-medium">{profile?.skills_summary || 'Not provided yet'}</span>
        </p>
      </article>
    </section>
  )
}
