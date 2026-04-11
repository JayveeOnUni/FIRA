import { useEffect, useState } from 'react'
import { getApplicantProfile, updateApplicantProfile } from '../../services/applicantService'

export function ApplicantProfilePage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    educationSummary: '',
    workExperienceSummary: '',
    skillsSummary: '',
    preferredJobCategory: '',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await getApplicantProfile()
        const profile = response.profile
        setForm({
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          phone: profile.phone || '',
          address: profile.address || '',
          dateOfBirth: profile.date_of_birth ? profile.date_of_birth.slice(0, 10) : '',
          educationSummary: profile.education_summary || '',
          workExperienceSummary: profile.work_experience_summary || '',
          skillsSummary: profile.skills_summary || '',
          preferredJobCategory: profile.preferred_job_category || '',
        })
      } catch (requestError) {
        setError(requestError.message || 'Unable to load profile.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required.')
      return
    }

    setSubmitting(true)
    try {
      await updateApplicantProfile(form)
      setMessage('Profile saved successfully.')
    } catch (requestError) {
      setError(requestError.message || 'Failed to save profile.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <section className="text-sm text-slate-600">Loading applicant profile...</section>
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Applicant Profile</h2>
        <p className="text-sm text-slate-600">Complete your profile to improve job application readiness.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">First Name</label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Last Name</label>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Date of Birth</label>
            <input
              name="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Education Summary</label>
          <textarea
            name="educationSummary"
            value={form.educationSummary}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Work Experience Summary</label>
          <textarea
            name="workExperienceSummary"
            value={form.workExperienceSummary}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Skills Summary</label>
          <textarea
            name="skillsSummary"
            value={form.skillsSummary}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Preferred Job Category</label>
          <input
            name="preferredJobCategory"
            value={form.preferredJobCategory}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
          />
        </div>

        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </section>
  )
}
