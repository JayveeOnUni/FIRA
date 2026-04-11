import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getDashboardPath } from '../../utils/roleRoutes'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      navigate(getDashboardPath(user.role), { replace: true })
    }
  }, [user, navigate])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError('Email and password are required.')
      return
    }

    setSubmitting(true)
    try {
      const response = await login(form)
      const fallback = getDashboardPath(response.user.role)
      const redirectTarget = location.state?.from?.pathname || fallback
      navigate(redirectTarget, { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Login</h1>
      <p className="mb-6 text-sm text-slate-600">Sign in to access your role-specific dashboard.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
            autoComplete="current-password"
          />
        </div>

        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? 'Signing in...' : 'Login'}
        </button>
      </form>

      <div className="mt-5 space-y-2 text-sm text-slate-600">
        <p>
          Applicant? <Link className="font-medium text-brand-primary" to="/register/applicant">Create an account</Link>
        </p>
        <p>
          Employer? <Link className="font-medium text-brand-primary" to="/register/employer">Register your company account</Link>
        </p>
      </div>
    </section>
  )
}
