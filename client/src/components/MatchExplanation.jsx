export function MatchExplanation({
  summary,
  keywords = [],
  relevanceLabel,
  scoreGuidance,
  matchedSkills = [],
  matchedQualifications = [],
  matchedExperience = [],
  warnings = [],
}) {
  const hasKeywords = Array.isArray(keywords) && keywords.length > 0
  const hasMatchedSkills = Array.isArray(matchedSkills) && matchedSkills.length > 0
  const hasMatchedQualifications = Array.isArray(matchedQualifications) && matchedQualifications.length > 0
  const hasMatchedExperience = Array.isArray(matchedExperience) && matchedExperience.length > 0
  const hasWarnings = Array.isArray(warnings) && warnings.length > 0

  return (
    <div className="space-y-2">
      {relevanceLabel && (
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          {relevanceLabel}
        </p>
      )}

      {summary && <p className="text-xs text-slate-600">{summary}</p>}
      {scoreGuidance && <p className="text-xs text-slate-500">{scoreGuidance}</p>}

      {hasKeywords && (
        <p className="text-xs text-slate-500">
          Shared keywords: {keywords.join(', ')}
        </p>
      )}

      {hasMatchedSkills && (
        <p className="text-xs text-slate-500">
          Skill overlap: {matchedSkills.join(', ')}
        </p>
      )}

      {hasMatchedQualifications && (
        <p className="text-xs text-slate-500">
          Qualification overlap: {matchedQualifications.join(', ')}
        </p>
      )}

      {hasMatchedExperience && (
        <p className="text-xs text-slate-500">
          Experience overlap: {matchedExperience.join(', ')}
        </p>
      )}

      {hasWarnings && (
        <ul className="space-y-1 rounded-md border border-amber-200 bg-amber-50 p-2">
          {warnings.map((warning, index) => (
            <li key={`${warning}-${index}`} className="text-xs text-amber-800">
              {warning}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
