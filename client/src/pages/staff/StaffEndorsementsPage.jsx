import { useCallback, useEffect, useState } from 'react'
import { listStaffEndorsements } from '../../services/staffService'

const initialFilters = {
  status: 'active',
  search: '',
  jobId: '',
}

export function StaffEndorsementsPage() {
  const [filters, setFilters] = useState(initialFilters)
  const [endorsements, setEndorsements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadEndorsements = useCallback(async (activeFilters = {}) => {
    setLoading(true)
    setError('')

    try {
      const response = await listStaffEndorsements(activeFilters)
      setEndorsements(response.endorsements || [])
    } catch (requestError) {
      setError(requestError.message || 'Unable to load endorsements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEndorsements({ status: 'active' })
  }, [loadEndorsements])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await loadEndorsements({
      status: filters.status || undefined,
      search: filters.search || undefined,
      jobId: filters.jobId || undefined,
    })
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Candidate Endorsements</h2>
        <p className="text-sm text-slate-600">Trace endorsed candidates and the staff actions tied to each job.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[150px,1fr,120px,120px]">
        <select
          name="status"
          value={filters.status}
          onChange={handleChange}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
        </select>
        <input
          name="search"
          value={filters.search}
          onChange={handleChange}
          placeholder="Search applicant, email, company, or job"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        />
        <input
          name="jobId"
          value={filters.jobId}
          onChange={handleChange}
          placeholder="Job ID"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        />
        <button type="submit" className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
          Filter
        </button>
      </form>

      {loading && <p className="text-sm text-slate-600">Loading endorsements...</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      {!loading && !error && endorsements.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          No endorsements found.
        </div>
      )}

      {!loading && endorsements.length > 0 && (
        <div className="space-y-3">
          {endorsements.map((item) => (
            <article key={item.endorsement_id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {item.applicant_first_name} {item.applicant_last_name}
                  </h3>
                  <p className="text-sm text-slate-600">{item.applicant_email}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {item.endorsement_status}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-700">
                Job #{item.job_id}: {item.job_title} ({item.company_name || 'No company'})
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Endorsed by {item.endorsed_by_first_name} {item.endorsed_by_last_name} on{' '}
                {new Date(item.endorsed_at).toLocaleString()}
              </p>
              {item.endorsement_note && <p className="mt-2 text-xs text-slate-600">Note: {item.endorsement_note}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
