export function MatchScoreBadge({ score, relevanceLabel }) {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">No score</span>
  }

  const percentage = Math.max(0, Math.min(100, Math.round(score * 100)))

  const tone =
    percentage >= 75
      ? 'bg-emerald-50 text-emerald-700'
      : percentage >= 55
        ? 'bg-amber-50 text-amber-700'
        : 'bg-slate-100 text-slate-700'

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${tone}`} title={relevanceLabel || 'Decision-support score'}>
      Match {percentage}%
    </span>
  )
}
