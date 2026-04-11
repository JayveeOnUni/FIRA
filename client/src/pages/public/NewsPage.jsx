export function NewsPage() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-3 text-2xl font-bold text-slate-900">News</h1>
      <ul className="space-y-3 text-slate-700">
        <li className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">April 2026</p>
          <p className="font-semibold text-slate-900">Phase 7 responsible-AI enhancements completed for post-prototype use.</p>
        </li>
        <li className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Current Focus</p>
          <p className="font-semibold text-slate-900">Human-review governance, explainability, and operational diagnostics are active in matching workflows.</p>
        </li>
      </ul>
    </section>
  )
}
