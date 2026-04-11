export function ResponsibleAiNotice({ decisionSupportNotice, fairnessNotice, humanReviewPrompt }) {
  const items = [decisionSupportNotice, fairnessNotice, humanReviewPrompt].filter(Boolean)

  if (!items.length) {
    return null
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      <p className="font-semibold uppercase tracking-wide text-amber-800">Responsible Use Reminder</p>
      <ul className="mt-2 space-y-1">
        {items.map((item, index) => (
          <li key={`${index}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
