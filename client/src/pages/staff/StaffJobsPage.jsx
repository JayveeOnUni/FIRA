import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listStaffJobs } from '../../services/staffService'

const initialFilters = {
  status: '',
  search: '',
}

export function StaffJobsPage() {
  const [filters, setFilters] = useState(initialFilters)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadJobs = useCallback(async (activeFilters = {}) => {
    setLoading(true)
    setError('')

    try {
      const response = await listStaffJobs(activeFilters)
      setJobs(response.jobs || [])
    } catch (requestError) {
      setError(requestError.message || 'Unable to load jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs({})
  }, [loadJobs])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await loadJobs(filters)
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Vacancy Monitoring</h2>
        <p className="text-sm text-slate-600">Track jobs and monitor application pipeline health across vacancies.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[180px,1fr,140px]">
        <select
          name="status"
          value={filters.status}
          onChange={handleChange}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
        </select>
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleChange}
          placeholder="Search job or company"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        />
        <button type="submit" className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
          Filter
        </button>
      </form>

      {loading && <p className="text-sm text-slate-600">Loading jobs...</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      {!loading && !error && jobs.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          No jobs found for the selected filters.
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((job) => (
            <article key={job.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                  <p className="text-sm text-slate-600">{job.company_name || 'Unassigned company'}</p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{job.status}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {job.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3 lg:grid-cols-6">
                <p>Applied: {job.applied_count || 0}</p>
                <p>Under Review: {job.under_review_count || 0}</p>
                <p>Verified: {job.verified_count || 0}</p>
                <p>Shortlisted: {job.shortlisted_count || 0}</p>
                <p>Endorsed: {job.endorsed_count || 0}</p>
                <p>Total: {job.application_count || 0}</p>
              </div>

              <div className="mt-3">
                <Link
                  to={`/dashboard/staff/jobs/${job.id}/applications`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View Job Applications
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
