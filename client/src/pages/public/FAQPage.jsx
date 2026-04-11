export function FAQPage() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-3 text-2xl font-bold text-slate-900">FAQ</h1>
      <div className="space-y-4 text-slate-700">
        <article>
          <h2 className="font-semibold text-slate-900">What can I do in this version?</h2>
          <p>
            You can register/login by role, manage applicant/employer/staff workflows, submit job applications, track ATS
            status, and review matching recommendations with human-review controls.
          </p>
        </article>
        <article>
          <h2 className="font-semibold text-slate-900">Can matching scores automatically decide hiring outcomes?</h2>
          <p>No. Scores are decision-support signals only. Final decisions require human review and explicit action.</p>
        </article>
        <article>
          <h2 className="font-semibold text-slate-900">Is AI matching already active?</h2>
          <p>
            Yes. SBERT-based semantic matching is active for recommendations and ranking, with explainability hints and
            fairness-awareness reminders.
          </p>
        </article>
      </div>
    </section>
  )
}
