const crypto = require('crypto')

function normalizeSegment(value) {
  if (value === undefined || value === null) {
    return ''
  }

  return String(value).replace(/\s+/g, ' ').trim()
}

function buildLabeledSegment(label, value) {
  const normalized = normalizeSegment(value)
  if (!normalized) {
    return ''
  }

  return `${label}: ${normalized}`
}

function hashText(value) {
  return crypto.createHash('sha256').update(value || '').digest('hex')
}

function buildApplicantMatchingText(applicant, options = {}) {
  const resumeText = normalizeSegment(options.resumeText)
  const documentFilenames = normalizeSegment(options.documentFilenames)

  const sections = [
    buildLabeledSegment('Name', `${applicant.first_name || ''} ${applicant.last_name || ''}`),
    buildLabeledSegment('Preferred Job Category', applicant.preferred_job_category),
    buildLabeledSegment('Skills', applicant.skills_summary),
    buildLabeledSegment('Work Experience', applicant.work_experience_summary),
    buildLabeledSegment('Education', applicant.education_summary),
    buildLabeledSegment('Profile Summary', applicant.profile_summary),
    buildLabeledSegment('Resume Text', resumeText),
    buildLabeledSegment('Resume Files', documentFilenames),
  ].filter(Boolean)

  const text = sections.join(' | ').trim()

  return {
    text,
    textHash: hashText(text),
  }
}

function buildJobMatchingText(job) {
  const sections = [
    buildLabeledSegment('Job Title', job.title),
    buildLabeledSegment('Description', job.description),
    buildLabeledSegment('Qualifications', job.qualifications),
    buildLabeledSegment('Required Skills', job.required_skills),
    buildLabeledSegment('Location', job.location),
    buildLabeledSegment('Employment Type', job.employment_type),
    buildLabeledSegment('Company', job.company_name),
  ].filter(Boolean)

  const text = sections.join(' | ').trim()

  return {
    text,
    textHash: hashText(text),
  }
}

module.exports = {
  buildApplicantMatchingText,
  buildJobMatchingText,
  hashText,
}
