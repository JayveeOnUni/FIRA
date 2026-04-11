import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPublicJobs } from '../../services/jobService'

export function JobSearchPage() {
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    employmentType: '',
  })
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadJobs = useCallback(async (activeFilters) => {
    setLoading(true)
    setError('')

    try {
      const response = await listPublicJobs(activeFilters)
      setJobs(response.jobs || [])
    } catch (requestError) {
      setError(requestError.message || 'Unable to load jobs right now.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs({
      search: '',
      location: '',
      employmentType: '',
    })
  }, [loadJobs])

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSearchSubmit = async (event) => {
    event.preventDefault()
    await loadJobs(filters)
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-3 text-2xl font-bold text-slate-900">Job Search</h1>
      <p className="mb-4 text-slate-700">Browse published jobs powered by the live recruitment workflow backend.</p>

      <form onSubmit={handleSearchSubmit} className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          type="text"
          placeholder="Search jobs by keyword, location, or company"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        />
        <input
          name="location"
          value={filters.location}
          onChange={handleFilterChange}
          type="text"
          placeholder="Location"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary sm:max-w-[180px]"
        />
        <select
          name="employmentType"
          value={filters.employmentType}
          onChange={handleFilterChange}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary sm:max-w-[180px]"
        >
          <option value="">All Types</option>
          <option value="full_time">Full Time</option>
          <option value="part_time">Part Time</option>
          <option value="contract">Contract</option>
        </select>
        <button type="submit" className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
          Search
        </button>
      </form>

      {loading && <p className="text-sm text-slate-600">Loading jobs...</p>}
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {!loading && !error && jobs.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          No jobs found for the selected search input.
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{job.title}</h2>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {job.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{job.company_name || 'Company to be assigned'}</p>
              <p className="mt-3 text-sm text-slate-700">{job.description}</p>
              <p className="mt-2 text-xs text-slate-500">
                {job.location || 'Location TBD'} • {job.employment_type || 'Employment type TBD'}
              </p>
              <Link
                to={`/jobs/${job.id}`}
                className="mt-3 inline-flex rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                View Details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
