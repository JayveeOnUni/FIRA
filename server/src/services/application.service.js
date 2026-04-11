const { query, withTransaction } = require('../config/db')
const { ApiError } = require('../utils/ApiError')
const { APPLICATION_STATUSES } = require('../utils/constants')
const { logAuditEvent } = require('./audit.service')
const { getApplicantByUserId } = require('./applicant.service')

function normalizeOptional(value) {
  if (value === undefined || value === null) {
    return null
  }

  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : null
}

async function createApplicationForApplicant(userId, jobId, payload = {}) {
  const applicant = await getApplicantByUserId(userId)

  const application = await withTransaction(async (client) => {
    const jobResult = await client.query(
      `
      SELECT id
      FROM jobs
      WHERE id = $1
        AND status = 'published'
        AND is_public = TRUE
      LIMIT 1
      `,
      [jobId],
    )

    if (!jobResult.rows[0]) {
      throw new ApiError(404, 'Job not found or not available for applications')
    }

    let inserted
    try {
      inserted = await client.query(
        `
        INSERT INTO applications (applicant_id, job_id, status, last_updated_by)
        VALUES ($1, $2, 'Applied', $3)
        RETURNING id, applicant_id, job_id, status, applied_at, created_at, updated_at, last_updated_by
        `,
        [applicant.id, jobId, userId],
      )
    } catch (error) {
      if (error.code === '23505') {
        throw new ApiError(409, 'You have already applied to this job')
      }
      throw error
    }

    const created = inserted.rows[0]

    await client.query(
      `
      INSERT INTO application_status_history (
        application_id,
        old_status,
        new_status,
        changed_by,
        note
      )
      VALUES ($1, $2, $3, $4, $5)
      `,
      [created.id, null, 'Applied', userId, normalizeOptional(payload.note)],
    )

    return created
  })

  await logAuditEvent({
    userId,
    action: 'application.create',
    entityType: 'applications',
    entityId: application.id,
  })

  return application
}

async function listApplicantApplications(userId) {
  const applicant = await getApplicantByUserId(userId)

  const result = await query(
    `
    SELECT
      a.id,
      a.status,
      a.applied_at,
      a.created_at,
      a.updated_at,
      a.last_updated_by,
      j.id AS job_id,
      j.title AS job_title,
      j.location AS job_location,
      j.employment_type AS job_employment_type,
      c.name AS company_name,
      en.id AS endorsement_id,
      en.created_at AS endorsed_at
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    LEFT JOIN companies c ON c.id = j.company_id
    LEFT JOIN endorsements en
      ON en.application_id = a.id
     AND en.status = 'active'
    WHERE a.applicant_id = $1
    ORDER BY a.applied_at DESC
    `,
    [applicant.id],
  )

  return result.rows
}

async function withdrawApplicantApplication(userId, applicationId, payload = {}) {
  const applicant = await getApplicantByUserId(userId)

  const updated = await withTransaction(async (client) => {
    const appResult = await client.query(
      `
      SELECT id, status
      FROM applications
      WHERE id = $1
        AND applicant_id = $2
      LIMIT 1
      `,
      [applicationId, applicant.id],
    )

    const application = appResult.rows[0]
    if (!application) {
      throw new ApiError(404, 'Application not found')
    }

    if (application.status === 'Withdrawn') {
      return application
    }

    const updateResult = await client.query(
      `
      UPDATE applications
      SET status = 'Withdrawn',
          last_updated_by = $2
      WHERE id = $1
      RETURNING id, status, applicant_id, job_id, applied_at, created_at, updated_at, last_updated_by
      `,
      [applicationId, userId],
    )

    await client.query(
      `
      INSERT INTO application_status_history (
        application_id,
        old_status,
        new_status,
        changed_by,
        note
      )
      VALUES ($1, $2, $3, $4, $5)
      `,
      [applicationId, application.status, 'Withdrawn', userId, normalizeOptional(payload.note)],
    )

    return updateResult.rows[0]
  })

  await logAuditEvent({
    userId,
    action: 'application.withdraw',
    entityType: 'applications',
    entityId: applicationId,
  })

  return updated
}

async function getApplicationStatusHistory(userId, role, applicationId) {
  if (role === 'applicant') {
    const ownership = await query(
      `
      SELECT 1
      FROM applications a
      JOIN applicants ap ON ap.id = a.applicant_id
      WHERE a.id = $1
        AND ap.user_id = $2
      LIMIT 1
      `,
      [applicationId, userId],
    )

    if (!ownership.rows[0]) {
      throw new ApiError(404, 'Application history not found')
    }
  } else if (role === 'employer') {
    const ownership = await query(
      `
      SELECT 1
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN employers e ON e.company_id = j.company_id
      WHERE a.id = $1
        AND e.user_id = $2
      LIMIT 1
      `,
      [applicationId, userId],
    )

    if (!ownership.rows[0]) {
      throw new ApiError(404, 'Application history not found')
    }
  } else if (role !== 'agency_staff') {
    throw new ApiError(403, 'You do not have access to this application history')
  }

  const result = await query(
    `
    SELECT
      h.id,
      h.application_id,
      h.old_status,
      h.new_status,
      h.note,
      h.created_at,
      u.id AS changed_by_user_id,
      u.first_name AS changed_by_first_name,
      u.last_name AS changed_by_last_name
    FROM application_status_history h
    LEFT JOIN users u ON u.id = h.changed_by
    WHERE h.application_id = $1
    ORDER BY h.created_at DESC
    `,
    [applicationId],
  )

  return result.rows
}

function listApplicationStatuses() {
  return APPLICATION_STATUSES
}

module.exports = {
  createApplicationForApplicant,
  listApplicantApplications,
  withdrawApplicantApplication,
  getApplicationStatusHistory,
  listApplicationStatuses,
}
