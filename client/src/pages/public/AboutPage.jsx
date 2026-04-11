export function AboutPage() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-3 text-2xl font-bold text-slate-900">About</h1>
      <p className="text-slate-700">
        FIRA is a recruitment platform initiative for Fil International Recruitment Agency. The system is designed with
        three layers: Public Website, Recruitment Management, and Intelligent Matching.
      </p>
      <p className="mt-3 text-slate-700">
        The current prototype includes ATS workflows, endorsements, and SBERT-based matching with responsible-use
        safeguards. Matching is presented strictly as decision support, while final recruitment decisions remain
        human-controlled.
      </p>
    </section>
  )
}
