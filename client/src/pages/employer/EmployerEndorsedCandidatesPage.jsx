import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { listEmployerEndorsedCandidates } from '../../services/employerService'

export function EmployerEndorsedCandidatesPage() {
  const { jobId } = useParams()
  const [endorsements, setEndorsements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadEndorsements = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await listEmployerEndorsedCandidates(jobId)
      setEndorsements(response.endorsements || [])
    } catch (requestError) {
      setError(requestError.message || 'Unable to load endorsed candidates')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    loadEndorsements()
  }, [loadEndorsements])

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Endorsed Candidates</h2>
          <p className="text-sm text-slate-600">Review agency-endorsed applicants for this job.</p>
        </div>
        <Link to={`/dashboard/employer/jobs/${jobId}/applicants`} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
          Back to Applicants
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-600">Loading endorsements...</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      {!loading && !error && endorsements.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          No endorsed candidates yet for this job.
        </div>
      )}

      {!loading && endorsements.length > 0 && (
        <div className="space-y-3">
          {endorsements.map((item) => (
            <article key={item.endorsement_id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {item.first_name} {item.last_name}
                  </h3>
                  <p className="text-sm text-slate-600">{item.email}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Endorsed</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Endorsed by {item.endorsed_by_first_name} {item.endorsed_by_last_name} on{' '}
                {new Date(item.endorsed_at).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">Current ATS status: {item.application_status || 'N/A'}</p>
              {item.endorsement_note && <p className="mt-2 text-sm text-slate-700">Note: {item.endorsement_note}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
