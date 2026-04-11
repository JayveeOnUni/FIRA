import { Link } from 'react-router-dom'

export function UnauthorizedPage() {
  return (
    <section className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-3 text-2xl font-bold text-slate-900">Unauthorized</h1>
      <p className="mb-5 text-slate-700">Your current account role does not have access to this page.</p>
      <Link to="/" className="inline-flex rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
        Return to Home
      </Link>
    </section>
  )
}
