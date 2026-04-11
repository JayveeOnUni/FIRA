import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-3 text-2xl font-bold text-slate-900">Page Not Found</h1>
      <p className="mb-4 text-slate-700">The requested route does not exist in the current application map.</p>
      <Link to="/" className="inline-flex rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
        Back to Home
      </Link>
    </section>
  )
}
