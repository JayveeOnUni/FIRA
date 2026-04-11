import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listApplicantApplications, withdrawApplicantApplication } from '../../services/applicantService'
import { getApplicationStatusHistory, listAtsStatuses } from '../../services/applicationService'

export function ApplicantApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [statusCatalog, setStatusCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [historyByApplication, setHistoryByApplication] = useState({})
  const [historyLoadingFor, setHistoryLoadingFor] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [appsResponse, statusesResponse] = await Promise.all([
        listApplicantApplications(),
        listAtsStatuses(),
      ])

      setApplications(appsResponse.applications || [])
      setStatusCatalog(statusesResponse.statuses || [])
    } catch (requestError) {
      setError(requestError.message || 'Unable to load applications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleWithdraw = async (applicationId) => {
    setActionMessage('')
    setError('')

    try {
      await withdrawApplicantApplication(applicationId, {})
      setActionMessage('Application withdrawn successfully.')
      await loadData()
    } catch (requestError) {
      setError(requestError.message || 'Failed to withdraw application.')
    }
  }

  const handleLoadHistory = async (applicationId) => {
    setHistoryLoadingFor(applicationId)
    try {
      const response = await getApplicationStatusHistory(applicationId)
      setHistoryByApplication((previous) => ({
        ...previous,
        [applicationId]: response.history || [],
      }))
    } catch (requestError) {
      setError(requestError.message || 'Failed to load status history.')
    } finally {
      setHistoryLoadingFor(null)
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">My Applications</h2>
        <p className="text-sm text-slate-600">Track your submitted applications and basic ATS status updates.</p>
      </div>

      {statusCatalog.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          Available ATS statuses: {statusCatalog.join(', ')}
        </div>
      )}

      {actionMessage && <p className="text-sm text-emerald-700">{actionMessage}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-600">Loading applications...</p>
      ) : applications.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No applications yet. Browse open roles on the <Link className="font-semibold text-brand-primary" to="/jobs">job search page</Link>.
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <article key={application.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{application.job_title}</h3>
                  <p className="text-sm text-slate-600">{application.company_name || 'Company unavailable'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {application.status}
                  </span>
                  {application.endorsement_id && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Endorsed</span>
                  )}
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Applied on {new Date(application.applied_at).toLocaleString()} • {application.job_location || 'Location TBD'}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={`/jobs/${application.job_id}`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View Job
                </Link>

                {application.status !== 'Withdrawn' && (
                  <button
                    type="button"
                    onClick={() => handleWithdraw(application.id)}
                    className="rounded-md border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                  >
                    Withdraw
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleLoadHistory(application.id)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {historyLoadingFor === application.id ? 'Loading history...' : 'View Status History'}
                </button>
              </div>

              {historyByApplication[application.id] && (
                <ul className="mt-3 space-y-2 rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                  {historyByApplication[application.id].map((entry) => (
                    <li key={entry.id} className="border-b border-slate-200 pb-2 last:border-b-0 last:pb-0">
                      <p>
                        {entry.old_status ? `${entry.old_status} -> ${entry.new_status}` : entry.new_status}
                      </p>
                      <p className="text-slate-500">
                        {entry.changed_by_first_name ? `${entry.changed_by_first_name} ${entry.changed_by_last_name}` : 'System'} •{' '}
                        {new Date(entry.created_at).toLocaleString()}
                      </p>
                      {entry.note && <p className="text-slate-600">Note: {entry.note}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
