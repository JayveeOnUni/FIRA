import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listStaffApplicants } from '../../services/staffService'

const initialFilters = {
  search: '',
  profileStatus: '',
  applicationStatus: '',
}

export function StaffApplicantsPage() {
  const [filters, setFilters] = useState(initialFilters)
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadApplicants = useCallback(async (activeFilters = {}) => {
    setLoading(true)
    setError('')

    try {
      const response = await listStaffApplicants(activeFilters)
      setApplicants(response.applicants || [])
    } catch (requestError) {
      setError(requestError.message || 'Unable to load applicants')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadApplicants({})
  }, [loadApplicants])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await loadApplicants(filters)
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Applicant Review Queue</h2>
        <p className="text-sm text-slate-600">Monitor applicants, profile readiness, and active pipeline participation.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleChange}
          placeholder="Search name or email"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        />
        <select
          name="profileStatus"
          value={filters.profileStatus}
          onChange={handleChange}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        >
          <option value="">All profile states</option>
          <option value="complete">Complete</option>
          <option value="incomplete">Incomplete</option>
        </select>
        <select
          name="applicationStatus"
          value={filters.applicationStatus}
          onChange={handleChange}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        >
          <option value="">All ATS states</option>
          <option value="Applied">Applied</option>
          <option value="Under Review">Under Review</option>
          <option value="Verified">Verified</option>
          <option value="Shortlisted">Shortlisted</option>
          <option value="Endorsed">Endorsed</option>
          <option value="Rejected">Rejected</option>
          <option value="Withdrawn">Withdrawn</option>
        </select>
        <button type="submit" className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
          Apply Filters
        </button>
      </form>

      {loading && <p className="text-sm text-slate-600">Loading applicants...</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      {!loading && !error && applicants.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          No applicants found for the selected filters.
        </div>
      )}

      {!loading && !error && applicants.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">Applicant</th>
                <th className="px-3 py-3">Profile</th>
                <th className="px-3 py-3">Applications</th>
                <th className="px-3 py-3">Latest ATS</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {applicants.map((applicant) => (
                <tr key={applicant.applicant_id}>
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-900">
                      {applicant.first_name} {applicant.last_name}
                    </p>
                    <p className="text-xs text-slate-500">{applicant.email}</p>
                  </td>
                  <td className="px-3 py-3">{applicant.profile_status || 'incomplete'}</td>
                  <td className="px-3 py-3">{applicant.application_count}</td>
                  <td className="px-3 py-3">{applicant.latest_application_status || 'No applications'}</td>
                  <td className="px-3 py-3">
                    <Link
                      to={`/dashboard/staff/applicants/${applicant.applicant_id}`}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
