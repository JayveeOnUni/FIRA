const { query } = require('../config/db')
const { ApiError } = require('../utils/ApiError')

async function getApplicantDashboardSummary(userId) {
  const profileResult = await query(
    `
    SELECT
      ap.id AS applicant_id,
      ap.profile_status,
      ap.preferred_job_category,
      ap.skills_summary,
      u.first_name,
      u.last_name,
      u.email
    FROM applicants ap
    JOIN users u ON u.id = ap.user_id
    WHERE ap.user_id = $1
    LIMIT 1
    `,
    [userId],
  )

  const profile = profileResult.rows[0]
  if (!profile) {
    throw new ApiError(404, 'Applicant profile not found')
  }

  const metricsResult = await query(
    `
    SELECT
      (SELECT COUNT(*) FROM applicant_documents d WHERE d.applicant_id = $1)::INT AS document_count,
      (SELECT COUNT(*) FROM applications a WHERE a.applicant_id = $1)::INT AS application_count,
      (SELECT COUNT(*) FROM applications a WHERE a.applicant_id = $1 AND a.status = 'Endorsed')::INT AS endorsed_count,
      (SELECT COUNT(*) FROM applications a WHERE a.applicant_id = $1 AND a.status NOT IN ('Rejected', 'Withdrawn'))::INT AS active_application_count
    `,
    [profile.applicant_id],
  )

  const statusResult = await query(
    `
    SELECT status, COUNT(*)::INT AS count
    FROM applications
    WHERE applicant_id = $1
    GROUP BY status
    ORDER BY status
    `,
    [profile.applicant_id],
  )

  const recentApplicationsResult = await query(
    `
    SELECT
      a.id,
      a.status,
      a.applied_at,
      a.updated_at,
      j.id AS job_id,
      j.title AS job_title,
      j.location AS job_location,
      c.name AS company_name
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    LEFT JOIN companies c ON c.id = j.company_id
    WHERE a.applicant_id = $1
    ORDER BY a.updated_at DESC
    LIMIT 5
    `,
    [profile.applicant_id],
  )

  return {
    profile,
    metrics: metricsResult.rows[0] || {
      document_count: 0,
      application_count: 0,
      endorsed_count: 0,
      active_application_count: 0,
    },
    applicationsByStatus: statusResult.rows,
    recentApplications: recentApplicationsResult.rows,
  }
}

async function getEmployerDashboardSummary(userId) {
  const contextResult = await query(
    `
    SELECT
      e.id AS employer_id,
      e.company_id,
      e.job_title AS employer_job_title,
      c.name AS company_name,
      c.description AS company_description
    FROM employers e
    LEFT JOIN companies c ON c.id = e.company_id
    WHERE e.user_id = $1
    LIMIT 1
    `,
    [userId],
  )

  const employer = contextResult.rows[0]
  if (!employer) {
    throw new ApiError(404, 'Employer profile not found')
  }

  if (!employer.company_id) {
    return {
      employer,
      metrics: {
        job_count: 0,
        published_job_count: 0,
        draft_job_count: 0,
        closed_job_count: 0,
        application_count: 0,
        endorsement_count: 0,
      },
      applicationsByStatus: [],
      recentApplications: [],
      jobsNeedingAttention: [],
    }
  }

  const metricsResult = await query(
    `
    SELECT
      COUNT(DISTINCT j.id)::INT AS job_count,
      COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'published')::INT AS published_job_count,
      COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'draft')::INT AS draft_job_count,
      COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'closed')::INT AS closed_job_count,
      COUNT(DISTINCT a.id)::INT AS application_count,
      COUNT(DISTINCT en.id) FILTER (WHERE en.status = 'active')::INT AS endorsement_count
    FROM jobs j
    LEFT JOIN applications a ON a.job_id = j.id
    LEFT JOIN endorsements en ON en.job_id = j.id
    WHERE j.company_id = $1
    `,
    [employer.company_id],
  )

  const statusResult = await query(
    `
    SELECT a.status, COUNT(*)::INT AS count
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    WHERE j.company_id = $1
    GROUP BY a.status
    ORDER BY a.status
    `,
    [employer.company_id],
  )

  const recentApplicationsResult = await query(
    `
    SELECT
      a.id AS application_id,
      a.status,
      a.applied_at,
      a.updated_at,
      j.id AS job_id,
      j.title AS job_title,
      ap.id AS applicant_id,
      u.first_name,
      u.last_name,
      u.email
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN applicants ap ON ap.id = a.applicant_id
    JOIN users u ON u.id = ap.user_id
    WHERE j.company_id = $1
    ORDER BY a.updated_at DESC
    LIMIT 5
    `,
    [employer.company_id],
  )

  const jobsNeedingAttentionResult = await query(
    `
    SELECT
      j.id,
      j.title,
      j.status,
      j.is_public,
      j.updated_at,
      COUNT(a.id)::INT AS application_count
    FROM jobs j
    LEFT JOIN applications a ON a.job_id = j.id
    WHERE j.company_id = $1
      AND j.status IN ('draft', 'published')
    GROUP BY j.id
    ORDER BY
      CASE WHEN j.status = 'draft' THEN 0 ELSE 1 END,
      application_count DESC,
      j.updated_at DESC
    LIMIT 5
    `,
    [employer.company_id],
  )

  return {
    employer,
    metrics: metricsResult.rows[0] || {
      job_count: 0,
      published_job_count: 0,
      draft_job_count: 0,
      closed_job_count: 0,
      application_count: 0,
      endorsement_count: 0,
    },
    applicationsByStatus: statusResult.rows,
    recentApplications: recentApplicationsResult.rows,
    jobsNeedingAttention: jobsNeedingAttentionResult.rows,
  }
}

module.exports = {
  getApplicantDashboardSummary,
  getEmployerDashboardSummary,
}
