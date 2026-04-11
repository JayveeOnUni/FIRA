const { query } = require('../config/db')
const { ApiError } = require('../utils/ApiError')
const { logAuditEvent } = require('./audit.service')

function normalizeOptional(value) {
  if (value === undefined || value === null) {
    return null
  }

  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : null
}

async function assertReviewerCanAccessJob(userId, role, jobId) {
  if (role === 'agency_staff') {
    return
  }

  if (role !== 'employer') {
    throw new ApiError(403, 'You do not have access to review governance actions for this job')
  }

  const ownershipResult = await query(
    `
    SELECT j.id
    FROM jobs j
    JOIN employers e ON e.company_id = j.company_id
    WHERE j.id = $1
      AND e.user_id = $2
    LIMIT 1
    `,
    [jobId, userId],
  )

  if (!ownershipResult.rows[0]) {
    throw new ApiError(404, 'Job not found for your employer account')
  }
}

async function getApplicationContext(applicantId, jobId, applicationId = null) {
  const result = await query(
    `
    SELECT id, applicant_id, job_id, status
    FROM applications
    WHERE applicant_id = $1
      AND job_id = $2
      AND ($3::bigint IS NULL OR id = $3)
    ORDER BY updated_at DESC
    LIMIT 1
    `,
    [applicantId, jobId, applicationId || null],
  )

  if (!result.rows[0]) {
    throw new ApiError(404, 'Applicant is not currently linked to this job application workflow')
  }

  return result.rows[0]
}

async function createMatchReviewAction({ actorUserId, actorRole, applicantId, jobId, payload }) {
  await assertReviewerCanAccessJob(actorUserId, actorRole, jobId)

  const application = await getApplicationContext(applicantId, jobId, payload.applicationId)
  const note = normalizeOptional(payload.note)

  const insertResult = await query(
    `
    INSERT INTO match_review_actions (
      application_id,
      applicant_id,
      job_id,
      acted_by,
      action_type,
      note
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, application_id, applicant_id, job_id, acted_by, action_type, note, created_at, updated_at
    `,
    [application.id, applicantId, jobId, actorUserId, payload.actionType, note],
  )

  await logAuditEvent({
    userId: actorUserId,
    action: 'matching.review_action.create',
    entityType: 'match_review_actions',
    entityId: insertResult.rows[0].id,
    metadata: {
      job_id: jobId,
      applicant_id: applicantId,
      action_type: payload.actionType,
    },
  })

  return insertResult.rows[0]
}

async function createReviewNote({ actorUserId, actorRole, applicantId, jobId, payload }) {
  await assertReviewerCanAccessJob(actorUserId, actorRole, jobId)

  const application = await getApplicationContext(applicantId, jobId, payload.applicationId)

  const insertResult = await query(
    `
    INSERT INTO review_notes (
      application_id,
      applicant_id,
      job_id,
      created_by,
      note_type,
      note
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, application_id, applicant_id, job_id, created_by, note_type, note, created_at, updated_at
    `,
    [application.id, applicantId, jobId, actorUserId, payload.noteType, payload.note.trim()],
  )

  await logAuditEvent({
    userId: actorUserId,
    action: 'matching.review_note.create',
    entityType: 'review_notes',
    entityId: insertResult.rows[0].id,
    metadata: {
      job_id: jobId,
      applicant_id: applicantId,
      note_type: payload.noteType,
    },
  })

  return insertResult.rows[0]
}

async function getReviewTimeline({ actorUserId, actorRole, applicantId, jobId }) {
  await assertReviewerCanAccessJob(actorUserId, actorRole, jobId)
  const application = await getApplicationContext(applicantId, jobId)

  const [actionsResult, notesResult] = await Promise.all([
    query(
      `
      SELECT
        a.id,
        a.application_id,
        a.applicant_id,
        a.job_id,
        a.action_type,
        a.note,
        a.created_at,
        u.first_name AS acted_by_first_name,
        u.last_name AS acted_by_last_name
      FROM match_review_actions a
      JOIN users u ON u.id = a.acted_by
      WHERE a.applicant_id = $1
        AND a.job_id = $2
      ORDER BY a.created_at DESC
      LIMIT 50
      `,
      [applicantId, jobId],
    ),
    query(
      `
      SELECT
        n.id,
        n.application_id,
        n.applicant_id,
        n.job_id,
        n.note_type,
        n.note,
        n.created_at,
        u.first_name AS created_by_first_name,
        u.last_name AS created_by_last_name
      FROM review_notes n
      JOIN users u ON u.id = n.created_by
      WHERE n.applicant_id = $1
        AND n.job_id = $2
      ORDER BY n.created_at DESC
      LIMIT 50
      `,
      [applicantId, jobId],
    ),
  ])

  return {
    applicationId: Number(application.id),
    applicantId: Number(applicantId),
    jobId: Number(jobId),
    actions: actionsResult.rows,
    notes: notesResult.rows,
  }
}

function toCsvField(value) {
  if (value === undefined || value === null) {
    return '""'
  }

  return `"${String(value).replace(/"/g, '""')}"`
}

function toCsv(rows = []) {
  const columns = [
    'job_id',
    'job_title',
    'applicant_id',
    'applicant_name',
    'applicant_email',
    'application_status',
    'match_score',
    'latest_review_action',
    'latest_review_note',
    'latest_reviewed_by',
    'latest_reviewed_at',
    'review_note_count',
  ]

  const lines = [columns.join(',')]
  rows.forEach((row) => {
    lines.push(
      [
        row.job_id,
        row.job_title,
        row.applicant_id,
        row.applicant_name,
        row.applicant_email,
        row.application_status,
        row.match_score,
        row.latest_review_action,
        row.latest_review_note,
        row.latest_reviewed_by,
        row.latest_reviewed_at,
        row.review_note_count,
      ]
        .map(toCsvField)
        .join(','),
    )
  })

  return lines.join('\n')
}

async function getJobReviewSummary({ actorUserId, actorRole, jobId }) {
  await assertReviewerCanAccessJob(actorUserId, actorRole, jobId)

  const rowsResult = await query(
    `
    SELECT
      j.id AS job_id,
      j.title AS job_title,
      ap.id AS applicant_id,
      (u.first_name || ' ' || u.last_name) AS applicant_name,
      u.email AS applicant_email,
      a.status AS application_status,
      ms.score AS match_score,
      latest.action_type AS latest_review_action,
      latest.note AS latest_review_note,
      latest.created_at AS latest_reviewed_at,
      (latest_u.first_name || ' ' || latest_u.last_name) AS latest_reviewed_by,
      COALESCE(note_stats.note_count, 0)::INT AS review_note_count
    FROM applications a
    JOIN applicants ap ON ap.id = a.applicant_id
    JOIN users u ON u.id = ap.user_id
    JOIN jobs j ON j.id = a.job_id
    LEFT JOIN match_scores ms
      ON ms.applicant_id = a.applicant_id
     AND ms.job_id = a.job_id
    LEFT JOIN LATERAL (
      SELECT mra.*
      FROM match_review_actions mra
      WHERE mra.applicant_id = a.applicant_id
        AND mra.job_id = a.job_id
      ORDER BY mra.created_at DESC
      LIMIT 1
    ) latest ON TRUE
    LEFT JOIN users latest_u ON latest_u.id = latest.acted_by
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::INT AS note_count
      FROM review_notes rn
      WHERE rn.applicant_id = a.applicant_id
        AND rn.job_id = a.job_id
    ) note_stats ON TRUE
    WHERE a.job_id = $1
    ORDER BY ms.score DESC NULLS LAST, a.applied_at DESC
    `,
    [jobId],
  )

  const rows = rowsResult.rows.map((row) => ({
    ...row,
    match_score: row.match_score === null || row.match_score === undefined ? null : Number(row.match_score),
  }))

  return {
    rows,
    csv: toCsv(rows),
  }
}

async function getLatestReviewContextMap(jobId, applicantIds = []) {
  if (!applicantIds.length) {
    return new Map()
  }

  const [latestActionResult, noteStatsResult] = await Promise.all([
    query(
      `
      SELECT DISTINCT ON (mra.applicant_id)
        mra.applicant_id,
        mra.action_type,
        mra.note,
        mra.created_at,
        u.first_name AS acted_by_first_name,
        u.last_name AS acted_by_last_name
      FROM match_review_actions mra
      JOIN users u ON u.id = mra.acted_by
      WHERE mra.job_id = $1
        AND mra.applicant_id = ANY($2::bigint[])
      ORDER BY mra.applicant_id, mra.created_at DESC
      `,
      [jobId, applicantIds],
    ),
    query(
      `
      SELECT
        applicant_id,
        COUNT(*)::INT AS note_count,
        MAX(created_at) AS last_note_at
      FROM review_notes
      WHERE job_id = $1
        AND applicant_id = ANY($2::bigint[])
      GROUP BY applicant_id
      `,
      [jobId, applicantIds],
    ),
  ])

  const noteStatsMap = new Map(
    noteStatsResult.rows.map((row) => [Number(row.applicant_id), row]),
  )

  const contextMap = new Map()

  latestActionResult.rows.forEach((row) => {
    const applicantId = Number(row.applicant_id)
    const noteStats = noteStatsMap.get(applicantId)

    contextMap.set(applicantId, {
      latest_review_action: row.action_type,
      latest_review_note: row.note,
      latest_reviewed_at: row.created_at,
      latest_reviewed_by: `${row.acted_by_first_name || ''} ${row.acted_by_last_name || ''}`.trim() || null,
      review_note_count: Number(noteStats?.note_count || 0),
      last_review_note_at: noteStats?.last_note_at || null,
    })
  })

  noteStatsResult.rows.forEach((row) => {
    const applicantId = Number(row.applicant_id)
    if (!contextMap.has(applicantId)) {
      contextMap.set(applicantId, {
        latest_review_action: null,
        latest_review_note: null,
        latest_reviewed_at: null,
        latest_reviewed_by: null,
        review_note_count: Number(row.note_count || 0),
        last_review_note_at: row.last_note_at || null,
      })
    }
  })

  return contextMap
}

module.exports = {
  createMatchReviewAction,
  createReviewNote,
  getReviewTimeline,
  getJobReviewSummary,
  getLatestReviewContextMap,
}
