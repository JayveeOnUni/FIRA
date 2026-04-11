import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listEmployerJobs } from '../../services/employerService'

export function EmployerJobsPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await listEmployerJobs()
        setJobs(response.jobs || [])
      } catch (requestError) {
        setError(requestError.message || 'Unable to load employer jobs')
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Manage Jobs</h2>
          <p className="text-sm text-slate-600">Create, update, and monitor job postings for your company.</p>
        </div>
        <Link to="/dashboard/employer/jobs/new" className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
          Create Job
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-600">Loading jobs...</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      {!loading && !error && jobs.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          No jobs posted yet. Create your first job to start receiving applications.
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((job) => (
            <article key={job.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{job.status}</span>
                  <span
                    className={[
                      'rounded-full px-2 py-1 text-xs font-semibold',
                      job.is_public ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                    ].join(' ')}
                  >
                    {job.is_public ? 'Public' : 'Hidden'}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-sm text-slate-700">{job.description}</p>
              <p className="mt-2 text-xs text-slate-500">
                {job.location || 'Location TBD'} • {job.employment_type || 'Type TBD'} • Applications: {job.application_count}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={`/dashboard/employer/jobs/${job.id}/edit`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Edit Job
                </Link>
                <Link
                  to={`/dashboard/employer/jobs/${job.id}/applicants`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View Applicants
                </Link>
                <Link
                  to={`/dashboard/employer/jobs/${job.id}/endorsed`}
                  className="rounded-md border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  Endorsed Candidates
                </Link>
                <Link
                  to={`/jobs/${job.id}`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Public Preview
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
