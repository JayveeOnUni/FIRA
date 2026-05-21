import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  downloadStaffAuditCsv,
  getStaffAuditSummary,
  getStaffDashboardSummary,
  getStaffMaintenanceReadiness,
} from '../../services/staffService'
import { getMatchingOperationsSummary } from '../../services/matchingService'
import { useAuth } from '../../hooks/useAuth'

export function StaffDashboardPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [matchingOps, setMatchingOps] = useState(null)
  const [auditSummary, setAuditSummary] = useState(null)
  const [maintenanceReadiness, setMaintenanceReadiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [auditMessage, setAuditMessage] = useState('')

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true)
      setError('')

      try {
        const [summaryResult, matchingResult, auditResult, maintenanceResult] = await Promise.allSettled([
          getStaffDashboardSummary(),
          getMatchingOperationsSummary(),
          getStaffAuditSummary(),
          getStaffMaintenanceReadiness(),
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

        if (auditResult.status === 'fulfilled') {
          setAuditSummary(auditResult.value)
        } else {
          setAuditSummary(null)
        }

        if (maintenanceResult.status === 'fulfilled') {
          setMaintenanceReadiness(maintenanceResult.value)
        } else {
          setMaintenanceReadiness(null)
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

  const handleAuditExport = async () => {
    setAuditMessage('')
    try {
      await downloadStaffAuditCsv({ limit: 200 })
      setAuditMessage('Audit activity exported.')
    } catch (requestError) {
      setAuditMessage(requestError.message || 'Unable to export audit activity.')
    }
  }

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

      <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Maintenance Readiness</h3>
            <p className="mt-1 text-sm text-slate-600">
              {loading
                ? 'Checking readiness...'
                : maintenanceReadiness?.readiness?.ready
                  ? 'Ready for controlled demo/deployment review.'
                  : 'Needs attention before final handover.'}
            </p>
          </div>
          <span
            className={[
              'rounded-full px-3 py-1 text-xs font-semibold',
              maintenanceReadiness?.readiness?.ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800',
            ].join(' ')}
          >
            {loading ? 'Checking' : maintenanceReadiness?.readiness?.ready ? 'Ready' : 'Review'}
          </span>
        </div>
        {!loading && maintenanceReadiness?.readiness?.blockers?.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-700">
            {maintenanceReadiness.readiness.blockers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        {!loading && maintenanceReadiness?.readiness?.warnings?.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-800">
            {maintenanceReadiness.readiness.warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </article>

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

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-900">Audit Activity Monitor</h3>
            <button
              type="button"
              onClick={handleAuditExport}
              className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Export CSV
            </button>
          </div>
          {auditMessage && <p className="mt-2 text-xs text-slate-600">{auditMessage}</p>}
          {loading ? (
            <p className="mt-3 text-sm text-slate-600">Loading audit activity...</p>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-medium">Total events</span>: {auditSummary?.totals?.total_events || 0}
              </div>
              <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-medium">Last 24h</span>: {auditSummary?.totals?.events_last_24h || 0}
              </div>
              <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-medium">Actors</span>: {auditSummary?.totals?.distinct_actors || 0}
              </div>
              <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-medium">Latest</span>:{' '}
                {auditSummary?.totals?.latest_event_at
                  ? new Date(auditSummary.totals.latest_event_at).toLocaleString()
                  : 'None'}
              </div>
            </div>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900">Recent Audit Events</h3>
          {loading ? (
            <p className="mt-3 text-sm text-slate-600">Loading recent events...</p>
          ) : !auditSummary?.recent?.length ? (
            <p className="mt-3 text-sm text-slate-600">No audit events recorded yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {auditSummary.recent.map((event) => (
                <li key={event.id} className="rounded-md bg-slate-50 p-3">
                  <p className="font-medium text-slate-900">{event.action}</p>
                  <p className="text-xs text-slate-500">
                    {event.actor_name || event.actor_email || 'System'} • {event.entity_type || 'system'} #{event.entity_id || 'n/a'} •{' '}
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  )
}
