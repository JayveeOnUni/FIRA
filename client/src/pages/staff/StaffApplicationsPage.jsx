import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApplicationStatusHistory } from '../../services/applicationService'
import {
  endorseStaffApplication,
  getStaffAtsCatalog,
  listStaffApplications,
  updateStaffApplicationStatus,
} from '../../services/staffService'

const initialFilters = {
  status: '',
  endorsed: '',
  search: '',
  jobId: '',
}

export function StaffApplicationsPage() {
  const [filters, setFilters] = useState(initialFilters)
  const [applications, setApplications] = useState([])
  const [statusCatalog, setStatusCatalog] = useState([])
  const [selectedStatusByApplication, setSelectedStatusByApplication] = useState({})
  const [noteByApplication, setNoteByApplication] = useState({})
  const [historyByApplication, setHistoryByApplication] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadData = useCallback(async (activeFilters = {}) => {
    setLoading(true)
    setError('')

    try {
      const [applicationsResponse, statusResponse] = await Promise.all([
        listStaffApplications(activeFilters),
        getStaffAtsCatalog(),
      ])
      setApplications(applicationsResponse.applications || [])
      setStatusCatalog(statusResponse.statuses || [])
    } catch (requestError) {
      setError(requestError.message || 'Unable to load applications queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData({})
  }, [loadData])

  const buildActiveFilters = useCallback(
    () => ({
      status: filters.status || undefined,
      search: filters.search || undefined,
      endorsed: filters.endorsed === '' ? undefined : filters.endorsed === 'true',
      jobId: filters.jobId || undefined,
    }),
    [filters],
  )

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleFilterSubmit = async (event) => {
    event.preventDefault()
    await loadData(buildActiveFilters())
  }

  const handleStatusUpdate = async (applicationId) => {
    const nextStatus = selectedStatusByApplication[applicationId]
    if (!nextStatus) {
      setError('Select a status before updating.')
      return
    }

    setMessage('')
    setError('')
    try {
      await updateStaffApplicationStatus(applicationId, {
        newStatus: nextStatus,
        note: noteByApplication[applicationId] || '',
      })
      setMessage('Application status updated.')
      await loadData(buildActiveFilters())
    } catch (requestError) {
      setError(requestError.message || 'Unable to update status')
    }
  }

  const handleEndorse = async (applicationId) => {
    setMessage('')
    setError('')
    try {
      await endorseStaffApplication(applicationId, {
        note: noteByApplication[applicationId] || '',
      })
      setMessage('Candidate endorsed.')
      await loadData(buildActiveFilters())
    } catch (requestError) {
      setError(requestError.message || 'Unable to endorse application')
    }
  }

  const handleHistory = async (applicationId) => {
    setError('')

    try {
      const response = await getApplicationStatusHistory(applicationId)
      setHistoryByApplication((previous) => ({
        ...previous,
        [applicationId]: response.history || [],
      }))
    } catch (requestError) {
      setError(requestError.message || 'Unable to load application history')
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">ATS Applications Queue</h2>
        <p className="text-sm text-slate-600">Filter and manage applications across all jobs from one queue.</p>
      </div>

      <form onSubmit={handleFilterSubmit} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-5">
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        >
          <option value="">All statuses</option>
          {statusCatalog.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          name="endorsed"
          value={filters.endorsed}
          onChange={handleFilterChange}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        >
          <option value="">All endorsements</option>
          <option value="true">Endorsed only</option>
          <option value="false">Not endorsed</option>
        </select>
        <input
          name="jobId"
          type="text"
          value={filters.jobId}
          onChange={handleFilterChange}
          placeholder="Job ID"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        />
        <input
          name="search"
          type="text"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search applicant or job"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        />
        <button type="submit" className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
          Filter
        </button>
      </form>

      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-slate-600">Loading queue...</p>}

      {!loading && !error && applications.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          No applications found for the selected filters.
        </div>
      )}

      {!loading && applications.length > 0 && (
        <div className="space-y-3">
          {applications.map((item) => (
            <article key={item.application_id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {item.applicant_first_name} {item.applicant_last_name}
                  </h3>
                  <p className="text-sm text-slate-600">{item.applicant_email}</p>
                  <p className="text-sm text-slate-600">
                    Job #{item.job_id}: {item.job_title} ({item.company_name || 'No company'})
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{item.status}</span>
                  {item.endorsement_id && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Endorsed</span>
                  )}
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-500">Applied: {new Date(item.applied_at).toLocaleString()}</p>

              <div className="mt-3 grid gap-2 md:grid-cols-[1fr,1fr,auto,auto,auto]">
                <select
                  value={selectedStatusByApplication[item.application_id] || ''}
                  onChange={(event) =>
                    setSelectedStatusByApplication((previous) => ({
                      ...previous,
                      [item.application_id]: event.target.value,
                    }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
                >
                  <option value="">Select status</option>
                  {statusCatalog
                    .filter((status) => status !== 'Endorsed')
                    .map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                </select>
                <input
                  value={noteByApplication[item.application_id] || ''}
                  onChange={(event) =>
                    setNoteByApplication((previous) => ({
                      ...previous,
                      [item.application_id]: event.target.value,
                    }))
                  }
                  placeholder="Staff note (optional)"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
                />
                <button
                  type="button"
                  onClick={() => handleStatusUpdate(item.application_id)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => handleEndorse(item.application_id)}
                  className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Endorse
                </button>
                <Link
                  to={`/dashboard/staff/jobs/${item.job_id}/applications`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Job Queue
                </Link>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => handleHistory(item.application_id)}
                  className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View History
                </button>
              </div>

              {historyByApplication[item.application_id] && (
                <ul className="mt-3 space-y-2 rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                  {historyByApplication[item.application_id].map((entry) => (
                    <li key={entry.id} className="border-b border-slate-200 pb-2 last:border-b-0 last:pb-0">
                      <p>{entry.old_status ? `${entry.old_status} -> ${entry.new_status}` : entry.new_status}</p>
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
