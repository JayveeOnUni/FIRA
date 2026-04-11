const path = require('path')
const fs = require('fs')
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

function determineProfileStatus(payload) {
  const required = [
    payload.phone,
    payload.address,
    payload.educationSummary,
    payload.workExperienceSummary,
    payload.skillsSummary,
  ].map(normalizeOptional)

  const isComplete = required.every((value) => value !== null)
  return isComplete ? 'complete' : 'incomplete'
}

async function getApplicantByUserId(userId) {
  const result = await query(
    `
    SELECT
      a.id,
      a.user_id,
      a.phone,
      a.address,
      a.date_of_birth,
      a.education_summary,
      a.work_experience_summary,
      a.skills_summary,
      a.preferred_job_category,
      a.profile_status,
      a.created_at,
      a.updated_at,
      u.first_name,
      u.last_name,
      u.email
    FROM applicants a
    JOIN users u ON u.id = a.user_id
    WHERE a.user_id = $1
    LIMIT 1
    `,
    [userId],
  )

  if (!result.rows[0]) {
    throw new ApiError(404, 'Applicant profile not found')
  }

  return result.rows[0]
}

async function getApplicantProfile(userId) {
  return getApplicantByUserId(userId)
}

async function updateApplicantProfile(userId, payload) {
  const profileStatus = determineProfileStatus(payload)

  const updatedProfile = await withTransaction(async (client) => {
    await client.query(
      `
      UPDATE users
      SET first_name = $1,
          last_name = $2
      WHERE id = $3
      `,
      [payload.firstName.trim(), payload.lastName.trim(), userId],
    )

    const updateResult = await client.query(
      `
      UPDATE applicants
      SET
        phone = $1,
        address = $2,
        date_of_birth = $3,
        education_summary = $4,
        work_experience_summary = $5,
        skills_summary = $6,
        preferred_job_category = $7,
        profile_status = $8
      WHERE user_id = $9
      RETURNING
        id,
        user_id,
        phone,
        address,
        date_of_birth,
        education_summary,
        work_experience_summary,
        skills_summary,
        preferred_job_category,
        profile_status,
        created_at,
        updated_at
      `,
      [
        normalizeOptional(payload.phone),
        normalizeOptional(payload.address),
        normalizeOptional(payload.dateOfBirth),
        normalizeOptional(payload.educationSummary),
        normalizeOptional(payload.workExperienceSummary),
        normalizeOptional(payload.skillsSummary),
        normalizeOptional(payload.preferredJobCategory),
        profileStatus,
        userId,
      ],
    )

    if (!updateResult.rows[0]) {
      throw new ApiError(404, 'Applicant profile not found')
    }

    return updateResult.rows[0]
  })

  await logAuditEvent({
    userId,
    action: 'applicant.profile.update',
    entityType: 'applicants',
    entityId: updatedProfile.id,
  })

  return updatedProfile
}

async function addApplicantDocument(userId, file, documentType) {
  if (!file) {
    throw new ApiError(400, 'Please provide a file to upload')
  }

  const applicant = await getApplicantByUserId(userId)
  const storagePath = path.posix.join('applicant-documents', file.filename)

  let document
  try {
    const result = await query(
      `
      INSERT INTO applicant_documents (
        applicant_id,
        document_type,
        original_filename,
        stored_filename,
        storage_path,
        mime_type,
        file_size
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        applicant_id,
        document_type,
        original_filename,
        stored_filename,
        mime_type,
        file_size,
        uploaded_at,
        created_at,
        updated_at
      `,
      [applicant.id, documentType, file.originalname, file.filename, storagePath, file.mimetype, file.size],
    )

    document = result.rows[0]
  } catch (error) {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path)
    }
    throw error
  }

  await logAuditEvent({
    userId,
    action: 'applicant.document.upload',
    entityType: 'applicant_documents',
    entityId: document.id,
  })

  return document
}

async function listApplicantDocuments(userId) {
  const applicant = await getApplicantByUserId(userId)

  const result = await query(
    `
    SELECT
      id,
      document_type,
      original_filename,
      stored_filename,
      mime_type,
      file_size,
      uploaded_at,
      created_at,
      updated_at
    FROM applicant_documents
    WHERE applicant_id = $1
    ORDER BY uploaded_at DESC
    `,
    [applicant.id],
  )

  return result.rows
}

module.exports = {
  getApplicantProfile,
  updateApplicantProfile,
  addApplicantDocument,
  listApplicantDocuments,
  getApplicantByUserId,
}
