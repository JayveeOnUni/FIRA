import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPublicJobDetail, applyToJob } from '../../services/jobService'
import { useAuth } from '../../hooks/useAuth'

export function JobDetailPage() {
  const { jobId } = useParams()
  const { user, loading: authLoading } = useAuth()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [applyNote, setApplyNote] = useState('')
  const [applyState, setApplyState] = useState({
    submitting: false,
    successMessage: '',
    errorMessage: '',
  })

  useEffect(() => {
    const loadJobDetail = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await getPublicJobDetail(jobId)
        setJob(response.job)
      } catch (requestError) {
        setError(requestError.message || 'Unable to load job detail')
      } finally {
        setLoading(false)
      }
    }

    loadJobDetail()
  }, [jobId])

  const handleApply = async (event) => {
    event.preventDefault()
    setApplyState({
      submitting: true,
      successMessage: '',
      errorMessage: '',
    })

    try {
      await applyToJob(jobId, { note: applyNote })
      setApplyState({
        submitting: false,
        successMessage: 'Application submitted successfully.',
        errorMessage: '',
      })
      setApplyNote('')
    } catch (requestError) {
      setApplyState({
        submitting: false,
        successMessage: '',
        errorMessage: requestError.message || 'Failed to submit application.',
      })
    }
  }

  if (loading) {
    return <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">Loading job details...</section>
  }

  if (error) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="mb-4 text-sm text-red-700">{error}</p>
        <Link to="/jobs" className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
          Back to Job Search
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{job.company_name || 'Company unavailable'}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          {job.status}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <p className="text-sm text-slate-600">Location: {job.location || 'Not specified'}</p>
        <p className="text-sm text-slate-600">Employment Type: {job.employment_type || 'Not specified'}</p>
        <p className="text-sm text-slate-600">Salary: {job.salary || 'Not specified'}</p>
      </div>

      <article>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Job Description</h2>
        <p className="whitespace-pre-wrap text-sm text-slate-700">{job.description}</p>
      </article>

      <article>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Qualifications</h2>
        <p className="whitespace-pre-wrap text-sm text-slate-700">{job.qualifications || 'No qualifications provided.'}</p>
      </article>

      <article>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Required Skills</h2>
        <p className="whitespace-pre-wrap text-sm text-slate-700">{job.required_skills || 'No required skills provided.'}</p>
      </article>

      {!authLoading && !user && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Please <Link className="font-semibold text-brand-primary" to="/login">login</Link> as an applicant to apply.
        </div>
      )}

      {!authLoading && user?.role === 'applicant' && (
        <form onSubmit={handleApply} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Apply to this Job</h2>
          <textarea
            value={applyNote}
            onChange={(event) => setApplyNote(event.target.value)}
            rows={3}
            placeholder="Optional note for your application"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
          />
          {applyState.errorMessage && <p className="text-sm text-red-700">{applyState.errorMessage}</p>}
          {applyState.successMessage && <p className="text-sm text-emerald-700">{applyState.successMessage}</p>}
          <button
            type="submit"
            disabled={applyState.submitting}
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {applyState.submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      )}

      {!authLoading && user && user.role !== 'applicant' && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Only applicant accounts can submit job applications.
        </div>
      )}

      <Link to="/jobs" className="inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700">
        Back to Job Search
      </Link>
    </section>
  )
}
