export function HomePage() {
  return (
    <section className="space-y-6">
      <article className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-primary">Recruitment Platform</p>
        <h1 className="mb-4 text-3xl font-bold text-slate-900">Fil International Recruitment Agency</h1>
        <p className="max-w-3xl text-slate-700">
          FIRA provides a role-aware recruitment platform connecting applicants, employers, and agency staff through a
          single web-based system with baseline recruitment workflows now active.
        </p>
      </article>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">For Applicants</h2>
          <p className="text-sm text-slate-700">Create your account, manage your basic profile, and access your dashboard.</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">For Employers</h2>
          <p className="text-sm text-slate-700">Register your company and prepare your recruitment workspace for upcoming modules.</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">For Agency Staff</h2>
          <p className="text-sm text-slate-700">Use role-based access to monitor the foundational operations dashboard.</p>
        </article>
      </div>
    </section>
  )
}
