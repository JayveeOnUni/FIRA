const { query } = require('../config/db')
const { ApiError } = require('../utils/ApiError')

async function listPublicJobs(filters = {}) {
  const { search, location, employmentType } = filters
  const hasSearch = typeof search === 'string' && search.trim().length > 0
  const normalizedSearch = hasSearch ? `%${search.trim().toLowerCase()}%` : null
  const normalizedLocation = location ? `%${String(location).trim().toLowerCase()}%` : null
  const normalizedEmploymentType = employmentType ? String(employmentType).trim().toLowerCase() : null

  const result = await query(
    `
    SELECT
      j.id,
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
      c.name AS company_name
    FROM jobs j
    LEFT JOIN companies c ON c.id = j.company_id
    WHERE j.status = 'published'
      AND j.is_public = TRUE
      AND (
        $1::text IS NULL
        OR LOWER(j.title) LIKE $1
        OR LOWER(COALESCE(j.description, '')) LIKE $1
        OR LOWER(COALESCE(j.location, '')) LIKE $1
        OR LOWER(COALESCE(c.name, '')) LIKE $1
      )
      AND (
        $2::text IS NULL
        OR LOWER(COALESCE(j.location, '')) LIKE $2
      )
      AND (
        $3::text IS NULL
        OR LOWER(COALESCE(j.employment_type, '')) = $3
      )
    ORDER BY j.created_at DESC
    LIMIT 50
    `,
    [normalizedSearch, normalizedLocation, normalizedEmploymentType],
  )

  return result.rows
}

async function getPublicJobById(jobId) {
  const result = await query(
    `
    SELECT
      j.id,
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
      c.id AS company_id,
      c.name AS company_name,
      c.description AS company_description,
      c.address AS company_address,
      c.website AS company_website,
      c.contact_number AS company_contact_number,
      c.country AS company_country
    FROM jobs j
    LEFT JOIN companies c ON c.id = j.company_id
    WHERE j.id = $1
      AND j.status = 'published'
      AND j.is_public = TRUE
    LIMIT 1
    `,
    [jobId],
  )

  if (!result.rows[0]) {
    throw new ApiError(404, 'Job not found')
  }

  return result.rows[0]
}

module.exports = { listPublicJobs, getPublicJobById }
