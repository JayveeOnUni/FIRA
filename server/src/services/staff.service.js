const { query, withTransaction } = require('../config/db')
const { ApiError } = require('../utils/ApiError')
const { APPLICATION_STATUSES, STAFF_ATS_TRANSITIONS } = require('../utils/constants')
const { logAuditEvent } = require('./audit.service')

function normalizeOptional(value) {
  if (value === undefined || value === null) {
    return null
  }

  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeSearch(search) {
  if (typeof search !== 'string') {
    return null
  }

  const trimmed = search.trim().toLowerCase()
  return trimmed ? `%${trimmed}%` : null
}

function assertValidApplicationStatus(status) {
  if (!APPLICATION_STATUSES.includes(status)) {
    throw new ApiError(400, 'Invalid application status value')
  }
}

function assertValidTransition(oldStatus, newStatus) {
  const allowed = STAFF_ATS_TRANSITIONS[oldStatus] || []
  if (!allowed.includes(newStatus)) {
    throw new ApiError(400, `Status cannot transition from "${oldStatus}" to "${newStatus}"`)
  }
}

async function getStaffDashboardSummary() {
  const totalsResult = await query(
    `
    SELECT
      (SELECT COUNT(*) FROM applicants)::INT AS total_applicants,
      (SELECT COUNT(*) FROM jobs WHERE status = 'published')::INT AS active_jobs,
      (SELECT COUNT(*) FROM applications)::INT AS total_applications,
      (SELECT COUNT(*) FROM endorsements WHERE status = 'active')::INT AS total_endorsements
    `,
  )

  const statusCountsResult = await query(
    `
    SELECT status, COUNT(*)::INT AS count
    FROM applications
    GROUP BY status
    ORDER BY status ASC
    `,
  )

  const recentStatusChangesResult = await query(
    `
    SELECT
      h.id,
      h.application_id,
      h.old_status,
      h.new_status,
      h.note,
      h.created_at,
      a.job_id,
      j.title AS job_title,
      ap.id AS applicant_id,
      au.first_name AS applicant_first_name,
      au.last_name AS applicant_last_name,
      cu.first_name AS changed_by_first_name,
      cu.last_name AS changed_by_last_name
    FROM application_status_history h
    JOIN applications a ON a.id = h.application_id
    JOIN jobs j ON j.id = a.job_id
    JOIN applicants ap ON ap.id = a.applicant_id
    JOIN users au ON au.id = ap.user_id
    LEFT JOIN users cu ON cu.id = h.changed_by
    ORDER BY h.created_at DESC
    LIMIT 10
    `,
  )

  const recentEndorsementsResult = await query(
    `
    SELECT
      en.id,
      en.application_id,
      en.note,
      en.created_at,
      en.job_id,
      j.title AS job_title,
      ap.id AS applicant_id,
      au.first_name AS applicant_first_name,
      au.last_name AS applicant_last_name,
      su.first_name AS endorsed_by_first_name,
      su.last_name AS endorsed_by_last_name
    FROM endorsements en
    JOIN jobs j ON j.id = en.job_id
    JOIN applicants ap ON ap.id = en.applicant_id
    JOIN users au ON au.id = ap.user_id
    JOIN users su ON su.id = en.endorsed_by
    WHERE en.status = 'active'
    ORDER BY en.created_at DESC
    LIMIT 10
    `,
  )

  return {
    totals: totalsResult.rows[0] || {
      total_applicants: 0,
      active_jobs: 0,
      total_applications: 0,
      total_endorsements: 0,
    },
    applicationsByStatus: statusCountsResult.rows,
    recentStatusChanges: recentStatusChangesResult.rows,
    recentEndorsements: recentEndorsementsResult.rows,
  }
}

async function listStaffApplicants(filters = {}) {
  const result = await query(
    `
    SELECT
      ap.id AS applicant_id,
      ap.user_id,
      ap.phone,
      ap.address,
      ap.profile_status,
      ap.preferred_job_category,
      ap.skills_summary,
      ap.updated_at,
      u.first_name,
      u.last_name,
      u.email,
      (
        SELECT COUNT(*)
        FROM applications a
        WHERE a.applicant_id = ap.id
      )::INT AS application_count,
      (
        SELECT a2.status
        FROM applications a2
        WHERE a2.applicant_id = ap.id
        ORDER BY a2.updated_at DESC
        LIMIT 1
      ) AS latest_application_status
    FROM applicants ap
    JOIN users u ON u.id = ap.user_id
    WHERE (
      $1::text IS NULL
      OR LOWER(u.first_name || ' ' || u.last_name) LIKE $1
      OR LOWER(u.email) LIKE $1
    )
      AND (
        $2::text IS NULL
        OR ap.profile_status = $2
      )
      AND (
        $3::text IS NULL
        OR EXISTS (
          SELECT 1
          FROM applications a
          WHERE a.applicant_id = ap.id
            AND a.status = $3
        )
      )
      AND (
        $4::bigint IS NULL
        OR EXISTS (
          SELECT 1
          FROM applications a
          WHERE a.applicant_id = ap.id
            AND a.job_id = $4
        )
      )
    ORDER BY ap.updated_at DESC
    LIMIT 100
    `,
    [
      normalizeSearch(filters.search),
      normalizeOptional(filters.profileStatus),
      normalizeOptional(filters.applicationStatus),
      filters.jobId || null,
    ],
  )

  return result.rows
}

async function getStaffApplicantDetail(applicantId) {
  const profileResult = await query(
    `
    SELECT
      ap.id AS applicant_id,
      ap.user_id,
      ap.phone,
      ap.address,
      ap.date_of_birth,
      ap.education_summary,
      ap.work_experience_summary,
      ap.skills_summary,
      ap.preferred_job_category,
      ap.profile_status,
      ap.created_at,
      ap.updated_at,
      u.first_name,
      u.last_name,
      u.email
    FROM applicants ap
    JOIN users u ON u.id = ap.user_id
    WHERE ap.id = $1
    LIMIT 1
    `,
    [applicantId],
  )

  const applicant = profileResult.rows[0]
  if (!applicant) {
    throw new ApiError(404, 'Applicant not found')
  }

  const documentsResult = await query(
    `
    SELECT
      id,
      document_type,
      original_filename,
      stored_filename,
      mime_type,
      file_size,
      uploaded_at
    FROM applicant_documents
    WHERE applicant_id = $1
    ORDER BY uploaded_at DESC
    `,
    [applicantId],
  )

  const applicationsResult = await query(
    `
    SELECT
      a.id AS application_id,
      a.status,
      a.applied_at,
      a.updated_at,
      j.id AS job_id,
      j.title AS job_title,
      c.name AS company_name,
      en.id AS endorsement_id,
      en.created_at AS endorsed_at,
      en.note AS endorsement_note
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    LEFT JOIN companies c ON c.id = j.company_id
    LEFT JOIN endorsements en
      ON en.application_id = a.id
     AND en.status = 'active'
    WHERE a.applicant_id = $1
    ORDER BY a.updated_at DESC
    `,
    [applicantId],
  )

  return {
    applicant,
    documents: documentsResult.rows,
    applications: applicationsResult.rows,
  }
}

async function listStaffJobs(filters = {}) {
  const result = await query(
    `
    SELECT
      j.id,
      j.title,
      j.status,
      j.is_public,
      j.location,
      j.employment_type,
      j.created_at,
      j.updated_at,
      c.id AS company_id,
      c.name AS company_name,
      COUNT(a.id)::INT AS application_count,
      COUNT(*) FILTER (WHERE a.status = 'Applied')::INT AS applied_count,
      COUNT(*) FILTER (WHERE a.status = 'Under Review')::INT AS under_review_count,
      COUNT(*) FILTER (WHERE a.status = 'Verified')::INT AS verified_count,
      COUNT(*) FILTER (WHERE a.status = 'Shortlisted')::INT AS shortlisted_count,
      COUNT(*) FILTER (WHERE a.status = 'Endorsed')::INT AS endorsed_count
    FROM jobs j
    LEFT JOIN companies c ON c.id = j.company_id
    LEFT JOIN applications a ON a.job_id = j.id
    WHERE (
      $1::text IS NULL
      OR j.status = $1
    )
      AND (
        $2::text IS NULL
        OR LOWER(j.title) LIKE $2
        OR LOWER(COALESCE(c.name, '')) LIKE $2
      )
    GROUP BY j.id, c.id
    ORDER BY j.updated_at DESC
    LIMIT 100
    `,
    [normalizeOptional(filters.status), normalizeSearch(filters.search)],
  )

  return result.rows
}

async function getStaffJobApplications(jobId, filters = {}) {
  const jobResult = await query(
    `
    SELECT
      j.id,
      j.title,
      j.status,
      j.is_public,
      j.location,
      j.employment_type,
      c.id AS company_id,
      c.name AS company_name
    FROM jobs j
    LEFT JOIN companies c ON c.id = j.company_id
    WHERE j.id = $1
    LIMIT 1
    `,
    [jobId],
  )

  const job = jobResult.rows[0]
  if (!job) {
    throw new ApiError(404, 'Job not found')
  }

  const applicationsResult = await query(
    `
    SELECT
      a.id AS application_id,
      a.status,
      a.applied_at,
      a.updated_at,
      ap.id AS applicant_id,
      ap.profile_status,
      au.first_name,
      au.last_name,
      au.email,
      en.id AS endorsement_id,
      en.created_at AS endorsed_at
    FROM applications a
    JOIN applicants ap ON ap.id = a.applicant_id
    JOIN users au ON au.id = ap.user_id
    LEFT JOIN endorsements en
      ON en.application_id = a.id
     AND en.status = 'active'
    WHERE a.job_id = $1
      AND (
        $2::text IS NULL
        OR a.status = $2
      )
      AND (
        $3::text IS NULL
        OR LOWER(au.first_name || ' ' || au.last_name) LIKE $3
        OR LOWER(au.email) LIKE $3
      )
    ORDER BY a.updated_at DESC
    `,
    [jobId, normalizeOptional(filters.status), normalizeSearch(filters.search)],
  )

  return {
    job,
    applications: applicationsResult.rows,
  }
}

async function listStaffApplications(filters = {}) {
  const result = await query(
    `
    SELECT
      a.id AS application_id,
      a.status,
      a.applied_at,
      a.updated_at,
      a.last_updated_by,
      ap.id AS applicant_id,
      au.first_name AS applicant_first_name,
      au.last_name AS applicant_last_name,
      au.email AS applicant_email,
      j.id AS job_id,
      j.title AS job_title,
      c.name AS company_name,
      en.id AS endorsement_id,
      en.created_at AS endorsed_at
    FROM applications a
    JOIN applicants ap ON ap.id = a.applicant_id
    JOIN users au ON au.id = ap.user_id
    JOIN jobs j ON j.id = a.job_id
    LEFT JOIN companies c ON c.id = j.company_id
    LEFT JOIN endorsements en
      ON en.application_id = a.id
     AND en.status = 'active'
    WHERE (
      $1::text IS NULL
      OR a.status = $1
    )
      AND (
        $2::bigint IS NULL
        OR a.job_id = $2
      )
      AND (
        $3::boolean IS NULL
        OR ($3 = TRUE AND en.id IS NOT NULL)
        OR ($3 = FALSE AND en.id IS NULL)
      )
      AND (
        $4::text IS NULL
        OR LOWER(au.first_name || ' ' || au.last_name) LIKE $4
        OR LOWER(au.email) LIKE $4
        OR LOWER(j.title) LIKE $4
      )
    ORDER BY a.updated_at DESC
    LIMIT 150
    `,
    [
      normalizeOptional(filters.status),
      filters.jobId || null,
      filters.endorsed === undefined ? null : Boolean(filters.endorsed),
      normalizeSearch(filters.search),
    ],
  )

  return result.rows
}

async function getApplicationForStaff(client, applicationId) {
  const result = await client.query(
    `
    SELECT
      a.id,
      a.status,
      a.applicant_id,
      a.job_id
    FROM applications a
    WHERE a.id = $1
    LIMIT 1
    `,
    [applicationId],
  )

  const application = result.rows[0]
  if (!application) {
    throw new ApiError(404, 'Application not found')
  }

  return application
}

async function updateApplicationStatusByStaff(staffUserId, applicationId, payload) {
  const newStatus = payload.newStatus
  assertValidApplicationStatus(newStatus)

  if (newStatus === 'Endorsed') {
    throw new ApiError(400, 'Use the endorsement action to move an application to Endorsed')
  }

  const note = normalizeOptional(payload.note)

  const updated = await withTransaction(async (client) => {
    const application = await getApplicationForStaff(client, applicationId)

    if (application.status === newStatus) {
      return {
        id: application.id,
        status: application.status,
        applicant_id: application.applicant_id,
        job_id: application.job_id,
      }
    }

    assertValidTransition(application.status, newStatus)

    const updateResult = await client.query(
      `
      UPDATE applications
      SET
        status = $1,
        last_updated_by = $2
      WHERE id = $3
      RETURNING id, applicant_id, job_id, status, applied_at, updated_at, created_at, last_updated_by
      `,
      [newStatus, staffUserId, application.id],
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
      [application.id, application.status, newStatus, staffUserId, note],
    )

    return updateResult.rows[0]
  })

  await logAuditEvent({
    userId: staffUserId,
    action: 'staff.application.status.update',
    entityType: 'applications',
    entityId: applicationId,
    metadata: {
      next_status: updated.status,
    },
  })

  return updated
}

async function createApplicationEndorsementByStaff(staffUserId, applicationId, payload = {}) {
  const note = normalizeOptional(payload.note)

  const result = await withTransaction(async (client) => {
    const application = await getApplicationForStaff(client, applicationId)

    if (application.status === 'Rejected' || application.status === 'Withdrawn') {
      throw new ApiError(400, 'Rejected or withdrawn applications cannot be endorsed')
    }

    if (application.status !== 'Endorsed') {
      assertValidTransition(application.status, 'Endorsed')
    }

    const endorsementResult = await client.query(
      `
      INSERT INTO endorsements (
        application_id,
        applicant_id,
        job_id,
        endorsed_by,
        note,
        status
      )
      VALUES ($1, $2, $3, $4, $5, 'active')
      ON CONFLICT (applicant_id, job_id)
      DO UPDATE SET
        application_id = EXCLUDED.application_id,
        endorsed_by = EXCLUDED.endorsed_by,
        note = COALESCE(EXCLUDED.note, endorsements.note),
        status = 'active',
        updated_at = NOW()
      RETURNING id, application_id, applicant_id, job_id, endorsed_by, note, status, created_at, updated_at
      `,
      [application.id, application.applicant_id, application.job_id, staffUserId, note],
    )

    let updatedApplication

    if (application.status !== 'Endorsed') {
      const updateResult = await client.query(
        `
        UPDATE applications
        SET
          status = 'Endorsed',
          last_updated_by = $1
        WHERE id = $2
        RETURNING id, applicant_id, job_id, status, applied_at, updated_at, created_at, last_updated_by
        `,
        [staffUserId, application.id],
      )

      updatedApplication = updateResult.rows[0]

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
        [
          application.id,
          application.status,
          'Endorsed',
          staffUserId,
          note || 'Candidate endorsed by agency staff',
        ],
      )
    } else {
      const currentResult = await client.query(
        `
        SELECT id, applicant_id, job_id, status, applied_at, updated_at, created_at, last_updated_by
        FROM applications
        WHERE id = $1
        LIMIT 1
        `,
        [application.id],
      )
      updatedApplication = currentResult.rows[0]
    }

    return {
      endorsement: endorsementResult.rows[0],
      application: updatedApplication,
    }
  })

  await logAuditEvent({
    userId: staffUserId,
    action: 'staff.endorsement.upsert',
    entityType: 'endorsements',
    entityId: result.endorsement.id,
    metadata: {
      application_id: applicationId,
      job_id: result.endorsement.job_id,
    },
  })

  return result
}

async function listStaffEndorsements(filters = {}) {
  const result = await query(
    `
    SELECT
      en.id AS endorsement_id,
      en.application_id,
      en.note AS endorsement_note,
      en.status AS endorsement_status,
      en.created_at AS endorsed_at,
      en.updated_at,
      ap.id AS applicant_id,
      au.first_name AS applicant_first_name,
      au.last_name AS applicant_last_name,
      au.email AS applicant_email,
      j.id AS job_id,
      j.title AS job_title,
      c.name AS company_name,
      su.first_name AS endorsed_by_first_name,
      su.last_name AS endorsed_by_last_name
    FROM endorsements en
    JOIN applicants ap ON ap.id = en.applicant_id
    JOIN users au ON au.id = ap.user_id
    JOIN jobs j ON j.id = en.job_id
    LEFT JOIN companies c ON c.id = j.company_id
    JOIN users su ON su.id = en.endorsed_by
    WHERE (
      $1::text IS NULL
      OR en.status = $1
    )
      AND (
        $2::bigint IS NULL
        OR en.job_id = $2
      )
      AND (
        $3::text IS NULL
        OR LOWER(au.first_name || ' ' || au.last_name) LIKE $3
        OR LOWER(au.email) LIKE $3
        OR LOWER(j.title) LIKE $3
        OR LOWER(COALESCE(c.name, '')) LIKE $3
      )
    ORDER BY en.created_at DESC
    LIMIT 150
    `,
    [normalizeOptional(filters.status), filters.jobId || null, normalizeSearch(filters.search)],
  )

  return result.rows
}

async function getStaffOperationalSummary() {
  const applicationsByStatusResult = await query(
    `
    SELECT status, COUNT(*)::INT AS count
    FROM applications
    GROUP BY status
    ORDER BY status
    `,
  )

  const applicantsByProfileStatusResult = await query(
    `
    SELECT profile_status, COUNT(*)::INT AS count
    FROM applicants
    GROUP BY profile_status
    ORDER BY profile_status
    `,
  )

  const jobsResult = await query(
    `
    SELECT
      j.id AS job_id,
      j.title AS job_title,
      c.name AS company_name,
      COUNT(a.id)::INT AS application_count
    FROM jobs j
    LEFT JOIN companies c ON c.id = j.company_id
    LEFT JOIN applications a ON a.job_id = j.id
    GROUP BY j.id, c.id
    ORDER BY application_count DESC, j.created_at DESC
    LIMIT 25
    `,
  )

  return {
    applicationsByStatus: applicationsByStatusResult.rows,
    applicantsByProfileStatus: applicantsByProfileStatusResult.rows,
    jobs: jobsResult.rows,
  }
}

module.exports = {
  getStaffDashboardSummary,
  listStaffApplicants,
  getStaffApplicantDetail,
  listStaffJobs,
  getStaffJobApplications,
  listStaffApplications,
  updateApplicationStatusByStaff,
  createApplicationEndorsementByStaff,
  listStaffEndorsements,
  getStaffOperationalSummary,
}
