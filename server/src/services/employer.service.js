const { query, withTransaction } = require('../config/db')
const { ApiError } = require('../utils/ApiError')
const { logAuditEvent } = require('./audit.service')

function normalizeOptional(value) {
  if (value === undefined || value === null) {
    return null
  }

  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : null
}

async function getEmployerContext(userId) {
  const result = await query(
    `
    SELECT
      e.id,
      e.user_id,
      e.company_id,
      e.job_title
    FROM employers e
    WHERE e.user_id = $1
    LIMIT 1
    `,
    [userId],
  )

  if (!result.rows[0]) {
    throw new ApiError(404, 'Employer profile not found')
  }

  return result.rows[0]
}

async function getEmployerCompanyProfile(userId) {
  const employer = await getEmployerContext(userId)

  if (!employer.company_id) {
    return {
      employerId: employer.id,
      company: null,
    }
  }

  const companyResult = await query(
    `
    SELECT
      id,
      name,
      description,
      address,
      website,
      contact_number,
      country,
      created_at,
      updated_at
    FROM companies
    WHERE id = $1
    LIMIT 1
    `,
    [employer.company_id],
  )

  return {
    employerId: employer.id,
    company: companyResult.rows[0] || null,
  }
}

async function upsertEmployerCompanyProfile(userId, payload) {
  const employer = await getEmployerContext(userId)

  const company = await withTransaction(async (client) => {
    if (!employer.company_id) {
      const createResult = await client.query(
        `
        INSERT INTO companies (name, description, address, website, contact_number, country)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
          payload.name.trim(),
          normalizeOptional(payload.description),
          normalizeOptional(payload.address),
          normalizeOptional(payload.website),
          normalizeOptional(payload.contactNumber),
          normalizeOptional(payload.country),
        ],
      )

      await client.query(
        `
        UPDATE employers
        SET company_id = $1
        WHERE id = $2
        `,
        [createResult.rows[0].id, employer.id],
      )

      return createResult.rows[0]
    }

    const updateResult = await client.query(
      `
      UPDATE companies
      SET
        name = $1,
        description = $2,
        address = $3,
        website = $4,
        contact_number = $5,
        country = $6
      WHERE id = $7
      RETURNING *
      `,
      [
        payload.name.trim(),
        normalizeOptional(payload.description),
        normalizeOptional(payload.address),
        normalizeOptional(payload.website),
        normalizeOptional(payload.contactNumber),
        normalizeOptional(payload.country),
        employer.company_id,
      ],
    )

    if (!updateResult.rows[0]) {
      throw new ApiError(404, 'Company profile not found')
    }

    return updateResult.rows[0]
  })

  await logAuditEvent({
    userId,
    action: 'employer.company.upsert',
    entityType: 'companies',
    entityId: company.id,
  })

  return company
}

async function assertEmployerOwnsJob(userId, jobId) {
  const employer = await getEmployerContext(userId)
  if (!employer.company_id) {
    throw new ApiError(400, 'Please complete your company profile before managing jobs')
  }

  const result = await query(
    `
    SELECT
      j.*,
      c.name AS company_name
    FROM jobs j
    JOIN companies c ON c.id = j.company_id
    WHERE j.id = $1
      AND j.company_id = $2
    LIMIT 1
    `,
    [jobId, employer.company_id],
  )

  if (!result.rows[0]) {
    throw new ApiError(404, 'Job not found for your company')
  }

  return result.rows[0]
}

function resolveVisibility(status, isPublic) {
  if (status === 'published' && isPublic === undefined) {
    return true
  }

  if (status !== 'published') {
    return false
  }

  return Boolean(isPublic)
}

async function createEmployerJob(userId, payload) {
  const employer = await getEmployerContext(userId)
  if (!employer.company_id) {
    throw new ApiError(400, 'Please complete your company profile before creating jobs')
  }

  const isPublic = resolveVisibility(payload.status, payload.isPublic)

  const result = await query(
    `
    INSERT INTO jobs (
      company_id,
      title,
      description,
      qualifications,
      required_skills,
      location,
      employment_type,
      salary,
      status,
      is_public,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
    `,
    [
      employer.company_id,
      payload.title.trim(),
      payload.description.trim(),
      normalizeOptional(payload.qualifications),
      normalizeOptional(payload.requiredSkills),
      normalizeOptional(payload.location),
      normalizeOptional(payload.employmentType),
      normalizeOptional(payload.salary),
      payload.status,
      isPublic,
      userId,
    ],
  )

  await logAuditEvent({
    userId,
    action: 'employer.job.create',
    entityType: 'jobs',
    entityId: result.rows[0].id,
  })

  return result.rows[0]
}

function normalizeSearch(search) {
  if (typeof search !== 'string') {
    return null
  }

  const trimmed = search.trim().toLowerCase()
  return trimmed ? `%${trimmed}%` : null
}

async function listEmployerJobs(userId, filters = {}) {
  const employer = await getEmployerContext(userId)
  if (!employer.company_id) {
    return []
  }

  const result = await query(
    `
    SELECT
      j.id,
      j.company_id,
      j.title,
      j.description,
      j.qualifications,
      j.required_skills,
      j.location,
      j.employment_type,
      j.salary,
      j.status,
      j.is_public,
      j.created_at,
      j.updated_at,
      (
        SELECT COUNT(*)
        FROM applications a
        WHERE a.job_id = j.id
      )::INT AS application_count
    FROM jobs j
    WHERE j.company_id = $1
      AND (
        $2::text IS NULL
        OR j.status = $2
      )
      AND (
        $3::text IS NULL
        OR LOWER(j.title) LIKE $3
        OR LOWER(COALESCE(j.description, '')) LIKE $3
        OR LOWER(COALESCE(j.location, '')) LIKE $3
        OR LOWER(COALESCE(j.required_skills, '')) LIKE $3
      )
    ORDER BY j.created_at DESC
    `,
    [
      employer.company_id,
      normalizeOptional(filters.status),
      normalizeSearch(filters.search),
    ],
  )

  return result.rows
}

async function getEmployerJobById(userId, jobId) {
  return assertEmployerOwnsJob(userId, jobId)
}

async function updateEmployerJob(userId, jobId, payload) {
  const job = await assertEmployerOwnsJob(userId, jobId)

  const nextStatus = payload.status || job.status
  const nextPublicValue = payload.isPublic !== undefined ? payload.isPublic : job.is_public
  const resolvedPublic = resolveVisibility(nextStatus, nextPublicValue)

  const result = await query(
    `
    UPDATE jobs
    SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      qualifications = COALESCE($3, qualifications),
      required_skills = COALESCE($4, required_skills),
      location = COALESCE($5, location),
      employment_type = COALESCE($6, employment_type),
      salary = COALESCE($7, salary),
      status = $8,
      is_public = $9
    WHERE id = $10
    RETURNING *
    `,
    [
      payload.title ? payload.title.trim() : null,
      payload.description ? payload.description.trim() : null,
      payload.qualifications !== undefined ? normalizeOptional(payload.qualifications) : null,
      payload.requiredSkills !== undefined ? normalizeOptional(payload.requiredSkills) : null,
      payload.location !== undefined ? normalizeOptional(payload.location) : null,
      payload.employmentType !== undefined ? normalizeOptional(payload.employmentType) : null,
      payload.salary !== undefined ? normalizeOptional(payload.salary) : null,
      nextStatus,
      resolvedPublic,
      jobId,
    ],
  )

  await logAuditEvent({
    userId,
    action: 'employer.job.update',
    entityType: 'jobs',
    entityId: jobId,
  })

  return result.rows[0]
}

async function listApplicantsForEmployerJob(userId, jobId) {
  await assertEmployerOwnsJob(userId, jobId)

  const result = await query(
    `
    SELECT
      a.id AS application_id,
      a.status,
      a.applied_at,
      a.updated_at,
      ap.id AS applicant_id,
      ap.profile_status,
      ap.skills_summary,
      ap.preferred_job_category,
      u.first_name,
      u.last_name,
      u.email,
      en.id AS endorsement_id,
      en.note AS endorsement_note,
      en.created_at AS endorsed_at,
      eu.first_name AS endorsed_by_first_name,
      eu.last_name AS endorsed_by_last_name
    FROM applications a
    JOIN applicants ap ON ap.id = a.applicant_id
    JOIN users u ON u.id = ap.user_id
    LEFT JOIN endorsements en
      ON en.application_id = a.id
     AND en.status = 'active'
    LEFT JOIN users eu ON eu.id = en.endorsed_by
    WHERE a.job_id = $1
    ORDER BY a.applied_at DESC
    `,
    [jobId],
  )

  return result.rows
}

async function listEndorsedCandidatesForEmployerJob(userId, jobId) {
  await assertEmployerOwnsJob(userId, jobId)

  const result = await query(
    `
    SELECT
      en.id AS endorsement_id,
      en.application_id,
      en.note AS endorsement_note,
      en.status AS endorsement_status,
      en.created_at AS endorsed_at,
      a.status AS application_status,
      a.applied_at,
      ap.id AS applicant_id,
      ap.profile_status,
      ap.skills_summary,
      u.first_name,
      u.last_name,
      u.email,
      eu.first_name AS endorsed_by_first_name,
      eu.last_name AS endorsed_by_last_name
    FROM endorsements en
    JOIN applicants ap ON ap.id = en.applicant_id
    JOIN users u ON u.id = ap.user_id
    JOIN jobs j ON j.id = en.job_id
    LEFT JOIN applications a ON a.id = en.application_id
    LEFT JOIN users eu ON eu.id = en.endorsed_by
    WHERE en.job_id = $1
      AND j.company_id = (
        SELECT company_id
        FROM employers
        WHERE user_id = $2
        LIMIT 1
      )
      AND en.status = 'active'
    ORDER BY en.created_at DESC
    `,
    [jobId, userId],
  )

  return result.rows
}

module.exports = {
  getEmployerCompanyProfile,
  upsertEmployerCompanyProfile,
  createEmployerJob,
  listEmployerJobs,
  getEmployerJobById,
  updateEmployerJob,
  listApplicantsForEmployerJob,
  listEndorsedCandidatesForEmployerJob,
}
