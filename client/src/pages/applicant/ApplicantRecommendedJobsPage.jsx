import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MatchExplanation } from '../../components/MatchExplanation'
import { MatchScoreBadge } from '../../components/MatchScoreBadge'
import { ResponsibleAiNotice } from '../../components/ResponsibleAiNotice'
import { getApplicantRecommendedJobs } from '../../services/matchingService'

export function ApplicantRecommendedJobsPage() {
  const [recommendations, setRecommendations] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadRecommendations = async (refresh = false) => {
    setLoading(true)
    setError('')

    try {
      const response = await getApplicantRecommendedJobs({
        topN: 12,
        minScore: 0,
        refresh,
      })
      setRecommendations(response.recommendations || [])
      setMeta(response.meta || null)
    } catch (requestError) {
      setError(requestError.message || 'Unable to load recommended jobs right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecommendations(false)
  }, [])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Recommended Jobs</h2>
          <p className="text-sm text-slate-600">Semantic recommendations based on your profile and resume-related text.</p>
        </div>
        <button
          type="button"
          onClick={() => loadRecommendations(true)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh Matches
        </button>
      </div>

      <ResponsibleAiNotice
        decisionSupportNotice={meta?.decisionSupportNotice}
        fairnessNotice={meta?.fairnessNotice}
        humanReviewPrompt={meta?.humanReviewPrompt}
      />

      {error && <p className="text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-slate-600">Loading recommendations...</p>}

      {!loading && !error && recommendations.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          No recommendations yet. Complete your profile details and upload resume-related documents for stronger matches.
        </div>
      )}

      {!loading && !error && recommendations.length > 0 && (
        <div className="space-y-3">
          {recommendations.map((item) => (
            <article key={item.job_id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.company_name || 'Company unavailable'}</p>
                </div>
                <MatchScoreBadge score={item.match_score} relevanceLabel={item.relevance_label} />
              </div>

              <p className="mt-2 text-sm text-slate-700">{item.description}</p>
              <p className="mt-2 text-xs text-slate-500">
                {item.location || 'Location TBD'} • {item.employment_type || 'Type TBD'}
              </p>

              <div className="mt-3">
                <MatchExplanation
                  summary={item.explanation_summary}
                  keywords={item.explanation_keywords}
                  relevanceLabel={item.relevance_label}
                  scoreGuidance={item.score_guidance}
                  confidenceLabel={item.confidence_label}
                  confidenceGuidance={item.confidence_guidance}
                  rankingReasons={item.ranking_reasons}
                  matchedSkills={item.matched_skills}
                  matchedQualifications={item.matched_qualifications}
                  matchedExperience={item.matched_experience}
                  warnings={item.data_quality_warnings}
                />
              </div>

              <div className="mt-3">
                <Link
                  to={`/jobs/${item.job_id}`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View Job Detail
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
