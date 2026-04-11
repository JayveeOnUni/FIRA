import { useEffect, useState } from 'react'
import { getEmployerCompanyProfile, upsertEmployerCompanyProfile } from '../../services/employerService'

export function EmployerCompanyProfilePage() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    website: '',
    contactNumber: '',
    country: '',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCompany = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await getEmployerCompanyProfile()
        const company = response.company
        if (company) {
          setForm({
            name: company.name || '',
            description: company.description || '',
            address: company.address || '',
            website: company.website || '',
            contactNumber: company.contact_number || '',
            country: company.country || '',
          })
        }
      } catch (requestError) {
        setError(requestError.message || 'Unable to load company profile')
      } finally {
        setLoading(false)
      }
    }

    loadCompany()
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

    if (!form.name.trim()) {
      setError('Company name is required.')
      return
    }

    setSubmitting(true)
    try {
      await upsertEmployerCompanyProfile(form)
      setMessage('Company profile saved successfully.')
    } catch (requestError) {
      setError(requestError.message || 'Failed to save company profile.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <section className="text-sm text-slate-600">Loading company profile...</section>
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Company Profile</h2>
        <p className="text-sm text-slate-600">Maintain your company details used in job postings.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Company Name</label>
          <input
            name="name"
            value={form.name}
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
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
          />
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

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Website</label>
            <input
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="https://example.com"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contact Number</label>
            <input
              name="contactNumber"
              value={form.contactNumber}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Country</label>
          <input
            name="country"
            value={form.country}
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
          {submitting ? 'Saving...' : 'Save Company Profile'}
        </button>
      </form>
    </section>
  )
}
