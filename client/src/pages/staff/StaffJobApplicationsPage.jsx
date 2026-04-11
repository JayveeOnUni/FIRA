import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MatchExplanation } from '../../components/MatchExplanation'
import { MatchScoreBadge } from '../../components/MatchScoreBadge'
import { ResponsibleAiNotice } from '../../components/ResponsibleAiNotice'
import { getApplicationStatusHistory } from '../../services/applicationService'
import {
  endorseStaffApplication,
  getStaffAtsCatalog,
  getStaffJobApplications,
  updateStaffApplicationStatus,
} from '../../services/staffService'
import {
  createMatchReviewAction,
  createReviewNote,
  downloadJobReviewSummaryCsv,
  getReviewTimeline,
  getStaffRankedApplicants,
} from '../../services/matchingService'

const REVIEW_ACTION_OPTIONS = [
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'shortlisted_by_human', label: 'Shortlisted by Human' },
  { value: 'deferred', label: 'Deferred' },
  { value: 'needs_more_information', label: 'Needs More Information' },
]

export function StaffJobApplicationsPage() {
  const { jobId } = useParams()
  const [payload, setPayload] = useState(null)
  const [atsCatalog, setAtsCatalog] = useState(null)
  const [rankedApplicants, setRankedApplicants] = useState([])
  const [rankingMeta, setRankingMeta] = useState(null)
  const [filters, setFilters] = useState({ status: '', search: '' })
  const [selectedStatusByApplication, setSelectedStatusByApplication] = useState({})
  const [noteByApplication, setNoteByApplication] = useState({})
  const [historyByApplication, setHistoryByApplication] = useState({})
  const [reviewActionByApplicant, setReviewActionByApplicant] = useState({})
  const [reviewTimelineByApplicant, setReviewTimelineByApplicant] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [matchingError, setMatchingError] = useState('')
  const [message, setMessage] = useState('')

  const statusOptions = useMemo(
    () => (atsCatalog?.statuses || []).filter((status) => status !== 'Endorsed'),
    [atsCatalog],
  )

  const loadData = useCallback(async (activeFilters = {}) => {
    setLoading(true)
    setError('')
    setMatchingError('')

    try {
      const [jobResponse, catalogResponse] = await Promise.all([
        getStaffJobApplications(jobId, activeFilters),
        getStaffAtsCatalog(),
      ])

      setPayload(jobResponse)
      setAtsCatalog(catalogResponse)
    } catch (requestError) {
      setError(requestError.message || 'Unable to load job applications')
    }

    try {
      const rankingResponse = await getStaffRankedApplicants(jobId, {
        topN: 150,
        minScore: 0,
        refresh: false,
      })
      setRankedApplicants(rankingResponse.rankedApplicants || [])
      setRankingMeta(rankingResponse.meta || null)
    } catch (requestError) {
      setMatchingError(requestError.message || 'Unable to load semantic ranking.')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    loadData({})
  }, [loadData])

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleFilterSubmit = async (event) => {
    event.preventDefault()
    await loadData(filters)
  }

  const handleStatusSelect = (applicationId, value) => {
    setSelectedStatusByApplication((previous) => ({
      ...previous,
      [applicationId]: value,
    }))
  }

  const handleNoteChange = (applicationId, value) => {
    setNoteByApplication((previous) => ({
      ...previous,
      [applicationId]: value,
    }))
  }

  const handleUpdateStatus = async (applicationId) => {
    setError('')
    setMessage('')

    const nextStatus = selectedStatusByApplication[applicationId]
    if (!nextStatus) {
      setError('Please select a new status before updating.')
      return
    }

    try {
      await updateStaffApplicationStatus(applicationId, {
        newStatus: nextStatus,
        note: noteByApplication[applicationId] || '',
      })
      setMessage('Application status updated.')
      await loadData(filters)
    } catch (requestError) {
      setError(requestError.message || 'Unable to update application status')
    }
  }

  const handleEndorse = async (applicationId) => {
    setError('')
    setMessage('')

    try {
      await endorseStaffApplication(applicationId, {
        note: noteByApplication[applicationId] || '',
      })
      setMessage('Candidate endorsed successfully.')
      await loadData(filters)
    } catch (requestError) {
      setError(requestError.message || 'Unable to endorse candidate')
    }
  }

  const handleLoadHistory = async (applicationId) => {
    setError('')

    try {
      const response = await getApplicationStatusHistory(applicationId)
      setHistoryByApplication((previous) => ({
        ...previous,
        [applicationId]: response.history || [],
      }))
    } catch (requestError) {
      setError(requestError.message || 'Unable to load application history')
    }
  }

  const handleRefreshRankings = async () => {
    setMatchingError('')
    try {
      const rankingResponse = await getStaffRankedApplicants(jobId, {
        topN: 150,
        minScore: 0,
        refresh: true,
      })
      setRankedApplicants(rankingResponse.rankedApplicants || [])
      setRankingMeta(rankingResponse.meta || null)
    } catch (requestError) {
      setMatchingError(requestError.message || 'Unable to refresh semantic ranking.')
    }
  }

  const rankingMap = rankedApplicants.reduce((acc, item) => {
    acc[item.applicant_id] = item
    return acc
  }, {})

  const handleReviewActionChange = (applicantId, value) => {
    setReviewActionByApplicant((previous) => ({
      ...previous,
      [applicantId]: value,
    }))
  }

  const handleSaveReviewAction = async (applicantId, applicationId) => {
    const actionType = reviewActionByApplicant[applicantId]
    if (!actionType) {
      setError('Please select a human review action.')
      return
    }

    try {
      await createMatchReviewAction(jobId, applicantId, {
        actionType,
        note: noteByApplication[applicationId] || '',
        applicationId: Number(applicationId) || undefined,
      })
      setMessage('Human review action saved.')
      await loadData(filters)
    } catch (requestError) {
      setError(requestError.message || 'Unable to save review action.')
    }
  }

  const handleSaveReviewNote = async (applicantId, applicationId) => {
    const note = (noteByApplication[applicationId] || '').trim()
    if (note.length < 3) {
      setError('Review note must be at least 3 characters.')
      return
    }

    try {
      await createReviewNote(jobId, applicantId, {
        noteType: 'manual_assessment',
        note,
        applicationId: Number(applicationId) || undefined,
      })
      setMessage('Review note saved.')
      await loadData(filters)
    } catch (requestError) {
      setError(requestError.message || 'Unable to save review note.')
    }
  }

  const handleLoadReviewTimeline = async (applicantId) => {
    try {
      const payload = await getReviewTimeline(jobId, applicantId)
      setReviewTimelineByApplicant((previous) => ({
        ...previous,
        [applicantId]: payload,
      }))
      setError('')
    } catch (requestError) {
      setError(requestError.message || 'Unable to load review timeline.')
    }
  }

  const handleExportReviewSummary = async () => {
    try {
      await downloadJobReviewSummaryCsv(jobId)
      setError('')
    } catch (requestError) {
      setError(requestError.message || 'Unable to export review summary.')
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Job Application Pipeline</h2>
          <p className="text-sm text-slate-600">Manage ATS transitions and endorsement actions for this vacancy.</p>
        </div>
        <Link to="/dashboard/staff/jobs" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
          Back to Jobs
        </Link>
      </div>

      {payload?.job && (
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-900">{payload.job.title}</h3>
          <p className="text-sm text-slate-600">{payload.job.company_name || 'Unassigned company'}</p>
        </article>
      )}

      <form onSubmit={handleFilterSubmit} className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-[220px,1fr,120px]">
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        >
          <option value="">All ATS statuses</option>
          {(atsCatalog?.statuses || []).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search applicant name or email"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        />
        <button type="submit" className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
          Filter
        </button>
      </form>

      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {matchingError && <p className="text-sm text-amber-700">{matchingError}</p>}

      <ResponsibleAiNotice
        decisionSupportNotice={rankingMeta?.decisionSupportNotice}
        fairnessNotice={rankingMeta?.fairnessNotice}
        humanReviewPrompt={rankingMeta?.humanReviewPrompt}
      />

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={handleExportReviewSummary}
          className="rounded-md border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          Export Review CSV
        </button>
        <button
          type="button"
          onClick={handleRefreshRankings}
          className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh Match Scores
        </button>
      </div>

      {!loading && !matchingError && rankedApplicants.length > 0 && (
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-900">Top Ranked Candidates</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {rankedApplicants.slice(0, 5).map((item) => (
              <li key={item.applicant_id} className="flex items-center justify-between rounded-md bg-white px-3 py-2">
                <span className="font-medium text-slate-800">
                  {item.first_name} {item.last_name}
                </span>
                <MatchScoreBadge score={item.match_score} relevanceLabel={item.relevance_label} />
              </li>
            ))}
          </ul>
        </article>
      )}

      {loading && <p className="text-sm text-slate-600">Loading applications...</p>}

      {!loading && !error && (!payload?.applications || payload.applications.length === 0) && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          No applications found for this job and filter set.
        </div>
      )}

      {!loading && payload?.applications?.length > 0 && (
        <div className="space-y-3">
          {payload.applications.map((item) => (
            <article key={item.application_id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {item.first_name} {item.last_name}
                  </h3>
                  <p className="text-sm text-slate-600">{item.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{item.status}</span>
                  <MatchScoreBadge
                    score={rankingMap[item.applicant_id]?.match_score}
                    relevanceLabel={rankingMap[item.applicant_id]?.relevance_label}
                  />
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Applied: {new Date(item.applied_at).toLocaleString()} • Profile: {item.profile_status || 'incomplete'}
              </p>
              {item.endorsement_id && <p className="mt-1 text-xs font-semibold text-emerald-700">Endorsed candidate</p>}

              {rankingMap[item.applicant_id] && (
                <div className="mt-2 rounded-md bg-slate-50 p-2">
                  <MatchExplanation
                    summary={rankingMap[item.applicant_id].explanation_summary}
                    keywords={rankingMap[item.applicant_id].explanation_keywords}
                    relevanceLabel={rankingMap[item.applicant_id].relevance_label}
                    scoreGuidance={rankingMap[item.applicant_id].score_guidance}
                    matchedSkills={rankingMap[item.applicant_id].matched_skills}
                    matchedQualifications={rankingMap[item.applicant_id].matched_qualifications}
                    matchedExperience={rankingMap[item.applicant_id].matched_experience}
                    warnings={rankingMap[item.applicant_id].data_quality_warnings}
                  />
                </div>
              )}

              {rankingMap[item.applicant_id] && (
                <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
                  <p>
                    Latest human review action:{' '}
                    <span className="font-semibold text-slate-700">
                      {rankingMap[item.applicant_id].latest_review_action || 'Not recorded yet'}
                    </span>
                  </p>
                  {rankingMap[item.applicant_id].latest_reviewed_by && (
                    <p>
                      By {rankingMap[item.applicant_id].latest_reviewed_by} on{' '}
                      {new Date(rankingMap[item.applicant_id].latest_reviewed_at).toLocaleString()}
                    </p>
                  )}
                  <p>Review note count: {rankingMap[item.applicant_id].review_note_count || 0}</p>
                </div>
              )}

              <div className="mt-3 grid gap-2 md:grid-cols-[1fr,1fr,auto,auto]">
                <select
                  value={selectedStatusByApplication[item.application_id] || ''}
                  onChange={(event) => handleStatusSelect(item.application_id, event.target.value)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
                >
                  <option value="">Select status</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <input
                  value={noteByApplication[item.application_id] || ''}
                  onChange={(event) => handleNoteChange(item.application_id, event.target.value)}
                  placeholder="Staff note (optional)"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(item.application_id)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Update Status
                </button>
                <button
                  type="button"
                  onClick={() => handleEndorse(item.application_id)}
                  className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Endorse
                </button>
              </div>

              <div className="mt-2 grid gap-2 md:grid-cols-[1fr,auto,auto]">
                <select
                  value={reviewActionByApplicant[item.applicant_id] || ''}
                  onChange={(event) => handleReviewActionChange(item.applicant_id, event.target.value)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
                >
                  <option value="">Select human review action</option>
                  {REVIEW_ACTION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleSaveReviewAction(item.applicant_id, item.application_id)}
                  className="rounded-md border border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  Save Review Action
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveReviewNote(item.applicant_id, item.application_id)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Save Review Note
                </button>
              </div>

              <div className="mt-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadHistory(item.application_id)}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View Status History
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadReviewTimeline(item.applicant_id)}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View Review Timeline
                  </button>
                </div>
              </div>

              {historyByApplication[item.application_id] && (
                <ul className="mt-3 space-y-2 rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                  {historyByApplication[item.application_id].map((entry) => (
                    <li key={entry.id} className="border-b border-slate-200 pb-2 last:border-b-0 last:pb-0">
                      <p>{entry.old_status ? `${entry.old_status} -> ${entry.new_status}` : entry.new_status}</p>
                      <p className="text-slate-500">
                        {entry.changed_by_first_name ? `${entry.changed_by_first_name} ${entry.changed_by_last_name}` : 'System'} •{' '}
                        {new Date(entry.created_at).toLocaleString()}
                      </p>
                      {entry.note && <p className="text-slate-600">Note: {entry.note}</p>}
                    </li>
                  ))}
                </ul>
              )}

              {reviewTimelineByApplicant[item.applicant_id] && (
                <div className="mt-3 grid gap-3 rounded-md bg-slate-50 p-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Review Actions</p>
                    {reviewTimelineByApplicant[item.applicant_id].actions?.length ? (
                      <ul className="mt-2 space-y-1 text-xs text-slate-600">
                        {reviewTimelineByApplicant[item.applicant_id].actions.map((entry) => (
                          <li key={`a-${entry.id}`}>
                            {entry.action_type} • {entry.acted_by_first_name} {entry.acted_by_last_name} •{' '}
                            {new Date(entry.created_at).toLocaleString()}
                            {entry.note && <span> • {entry.note}</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">No review actions recorded yet.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Review Notes</p>
                    {reviewTimelineByApplicant[item.applicant_id].notes?.length ? (
                      <ul className="mt-2 space-y-1 text-xs text-slate-600">
                        {reviewTimelineByApplicant[item.applicant_id].notes.map((entry) => (
                          <li key={`n-${entry.id}`}>
                            {entry.note_type} • {entry.created_by_first_name} {entry.created_by_last_name} •{' '}
                            {new Date(entry.created_at).toLocaleString()} • {entry.note}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">No review notes recorded yet.</p>
                    )}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
