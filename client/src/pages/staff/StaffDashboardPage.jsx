import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStaffDashboardSummary } from '../../services/staffService'
import { getMatchingOperationsSummary } from '../../services/matchingService'
import { useAuth } from '../../hooks/useAuth'

export function StaffDashboardPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [matchingOps, setMatchingOps] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true)
      setError('')

      try {
        const [summaryResult, matchingResult] = await Promise.allSettled([
          getStaffDashboardSummary(),
          getMatchingOperationsSummary(),
        ])

        if (summaryResult.status === 'fulfilled') {
          setSummary(summaryResult.value)
        } else {
          throw summaryResult.reason
        }

        if (matchingResult.status === 'fulfilled') {
          setMatchingOps(matchingResult.value)
        } else {
          setMatchingOps(null)
        }
      } catch (requestError) {
        setError(requestError.message || 'Unable to load staff dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadSummary()
  }, [])

  const statusCountMap =
    summary?.applicationsByStatus?.reduce((acc, item) => {
      acc[item.status] = item.count
      return acc
    }, {}) || {}

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Agency Staff Dashboard</h2>
        <p className="text-sm text-slate-600">Welcome, {user?.firstName} {user?.lastName}</p>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-4">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Applicants</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? '...' : summary?.totals?.total_applicants || 0}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active Jobs</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? '...' : summary?.totals?.active_jobs || 0}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Applications</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? '...' : summary?.totals?.total_applications || 0}
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active Endorsements</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? '...' : summary?.totals?.total_endorsements || 0}
          </p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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

        <article className="rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900">Quick Links</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/dashboard/staff/applications" className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
              ATS Queue
            </Link>
            <Link to="/dashboard/staff/applicants" className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
              Applicant Review
            </Link>
            <Link to="/dashboard/staff/jobs" className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
              Vacancy Monitor
            </Link>
            <Link to="/dashboard/staff/endorsements" className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
              Endorsements
            </Link>
          </div>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900">Recent Status Changes</h3>
          {loading ? (
            <p className="mt-3 text-sm text-slate-600">Loading updates...</p>
          ) : !summary?.recentStatusChanges?.length ? (
            <p className="mt-3 text-sm text-slate-600">No status changes yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {summary.recentStatusChanges.map((item) => (
                <li key={item.id} className="rounded-md bg-slate-50 p-3">
                  <p className="font-medium text-slate-900">
                    {item.applicant_first_name} {item.applicant_last_name}: {item.old_status || 'New'} {'->'} {item.new_status}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.job_title} • {new Date(item.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900">Recent Endorsements</h3>
          {loading ? (
            <p className="mt-3 text-sm text-slate-600">Loading endorsements...</p>
          ) : !summary?.recentEndorsements?.length ? (
            <p className="mt-3 text-sm text-slate-600">No endorsements yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {summary.recentEndorsements.map((item) => (
                <li key={item.id} className="rounded-md bg-slate-50 p-3">
                  <p className="font-medium text-slate-900">
                    {item.applicant_first_name} {item.applicant_last_name} endorsed for {item.job_title}
                  </p>
                  <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900">Matching Operations Snapshot</h3>
          {loading ? (
            <p className="mt-3 text-sm text-slate-600">Loading operations data...</p>
          ) : (
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p>
                Match scores stored: <span className="font-semibold text-slate-800">{matchingOps?.database?.matchScores?.total_scores || 0}</span>
              </p>
              <p>
                Scores generated (24h): <span className="font-semibold text-slate-800">{matchingOps?.database?.matchScores?.scores_last_24h || 0}</span>
              </p>
              <p>
                Review actions logged: <span className="font-semibold text-slate-800">{matchingOps?.database?.humanReview?.total_review_actions || 0}</span>
              </p>
              <p>
                Review notes logged: <span className="font-semibold text-slate-800">{matchingOps?.database?.humanReview?.total_review_notes || 0}</span>
              </p>
              <p>
                Runtime diagnostic events: <span className="font-semibold text-slate-800">{matchingOps?.runtime?.eventCount || 0}</span>
              </p>
              <p>
                AI service status: <span className="font-semibold text-slate-800">{matchingOps?.aiService?.status || 'unknown'}</span>
              </p>
            </div>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900">Responsible Use Guidance</h3>
          {loading ? (
            <p className="mt-3 text-sm text-slate-600">Loading guidance...</p>
          ) : (
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              <li>{matchingOps?.guidance?.decisionSupport || 'Use matching as decision support only.'}</li>
              <li>{matchingOps?.guidance?.fairness || 'Review text quality before relying on match scores.'}</li>
              <li>{matchingOps?.guidance?.humanReview || 'Record explicit human review actions for traceability.'}</li>
            </ul>
          )}
        </article>
      </div>
    </section>
  )
}
