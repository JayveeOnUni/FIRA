import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getEmployerJob, updateEmployerJob } from '../../services/employerService'

export function EditJobPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadJob = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await getEmployerJob(jobId)
        const job = response.job
        setForm({
          title: job.title || '',
          description: job.description || '',
          qualifications: job.qualifications || '',
          requiredSkills: job.required_skills || '',
          location: job.location || '',
          employmentType: job.employment_type || '',
          salary: job.salary || '',
          status: job.status || 'draft',
          isPublic: Boolean(job.is_public),
        })
      } catch (requestError) {
        setError(requestError.message || 'Unable to load job')
      } finally {
        setLoading(false)
      }
    }

    loadJob()
  }, [jobId])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.')
      return
    }

    setSubmitting(true)
    try {
      await updateEmployerJob(jobId, form)
      setMessage('Job updated successfully.')
    } catch (requestError) {
      setError(requestError.message || 'Failed to update job')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <section className="text-sm text-slate-600">Loading job details...</section>
  }

  if (!form) {
    return (
      <section className="space-y-3">
        <p className="text-sm text-red-700">{error || 'Job not found'}</p>
        <Link to="/dashboard/employer/jobs" className="text-sm font-semibold text-brand-primary">
          Back to Manage Jobs
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Edit Job</h2>
          <p className="text-sm text-slate-600">Update job details and visibility settings.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/employer/jobs')}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
        >
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Qualifications</label>
          <textarea
            name="qualifications"
            value={form.qualifications}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Required Skills</label>
          <textarea
            name="requiredSkills"
            value={form.requiredSkills}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Employment Type</label>
            <select
              name="employmentType"
              value={form.employmentType}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
            >
              <option value="">Select type</option>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Salary</label>
            <input
              name="salary"
              value={form.salary}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="isPublic"
                checked={form.isPublic}
                onChange={handleChange}
                className="h-4 w-4"
              />
              Show publicly in job search
            </label>
          </div>
        </div>

        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </section>
  )
}
