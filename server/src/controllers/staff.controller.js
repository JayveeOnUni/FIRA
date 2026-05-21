const {
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
} = require('../services/staff.service')
const { parsePositiveInt } = require('../utils/parse')
const { ApiError } = require('../utils/ApiError')
const { APPLICATION_STATUSES, STAFF_ATS_TRANSITIONS } = require('../utils/constants')
const { getAuditActivitySummary, listAuditLogs, auditRowsToCsv } = require('../services/audit.service')
const { getMaintenanceReadinessSummary } = require('../services/maintenance.service')

function parseOptionalPositiveInt(value, fieldName) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return undefined
  }

  return parsePositiveInt(value, fieldName)
}

function parseOptionalBoolean(value, fieldName) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return undefined
  }

  const normalized = String(value).trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false

  throw new ApiError(400, `${fieldName} must be "true" or "false"`)
}

function parseOptionalLimit(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return 50
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 200) {
    throw new ApiError(400, 'limit must be an integer between 1 and 200')
  }

  return parsed
}

function parseOptionalExportFormat(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return 'json'
  }

  const normalized = String(value).trim().toLowerCase()
  if (normalized === 'json' || normalized === 'csv') {
    return normalized
  }

  throw new ApiError(400, 'format must be either "json" or "csv"')
}

async function staffDashboardController(req, res) {
  const summary = await getStaffDashboardSummary()
  return res.status(200).json(summary)
}

async function staffApplicantListController(req, res) {
  const applicants = await listStaffApplicants({
    search: req.query.search,
    profileStatus: req.query.profileStatus,
    applicationStatus: req.query.applicationStatus,
    jobId: parseOptionalPositiveInt(req.query.jobId, 'jobId'),
  })

  return res.status(200).json({
    applicants,
    count: applicants.length,
  })
}

async function staffApplicantDetailController(req, res) {
  const applicantId = parsePositiveInt(req.params.applicantId, 'applicantId')
  const payload = await getStaffApplicantDetail(applicantId)
  return res.status(200).json(payload)
}

async function staffJobsController(req, res) {
  const jobs = await listStaffJobs({
    status: req.query.status,
    search: req.query.search,
  })

  return res.status(200).json({
    jobs,
    count: jobs.length,
  })
}

async function staffJobApplicationsController(req, res) {
  const jobId = parsePositiveInt(req.params.jobId, 'jobId')
  const payload = await getStaffJobApplications(jobId, {
    status: req.query.status,
    search: req.query.search,
  })

  return res.status(200).json(payload)
}

async function staffApplicationsController(req, res) {
  const applications = await listStaffApplications({
    status: req.query.status,
    search: req.query.search,
    jobId: parseOptionalPositiveInt(req.query.jobId, 'jobId'),
    endorsed: parseOptionalBoolean(req.query.endorsed, 'endorsed'),
  })

  return res.status(200).json({
    applications,
    count: applications.length,
  })
}

async function staffUpdateApplicationStatusController(req, res) {
  const applicationId = parsePositiveInt(req.params.applicationId, 'applicationId')
  const application = await updateApplicationStatusByStaff(req.auth.userId, applicationId, req.validatedBody)
  return res.status(200).json({
    message: 'Application status updated successfully',
    application,
  })
}

async function staffCreateEndorsementController(req, res) {
  const applicationId = parsePositiveInt(req.params.applicationId, 'applicationId')
  const payload = await createApplicationEndorsementByStaff(req.auth.userId, applicationId, req.validatedBody)
  return res.status(201).json({
    message: 'Candidate endorsed successfully',
    endorsement: payload.endorsement,
    application: payload.application,
  })
}

async function staffEndorsementsController(req, res) {
  const endorsements = await listStaffEndorsements({
    status: req.query.status,
    search: req.query.search,
    jobId: parseOptionalPositiveInt(req.query.jobId, 'jobId'),
  })

  return res.status(200).json({
    endorsements,
    count: endorsements.length,
  })
}

async function staffOperationalSummaryController(req, res) {
  const summary = await getStaffOperationalSummary()
  return res.status(200).json(summary)
}

async function staffAtsCatalogController(req, res) {
  return res.status(200).json({
    statuses: APPLICATION_STATUSES,
    transitions: STAFF_ATS_TRANSITIONS,
  })
}

async function staffAuditActivitySummaryController(req, res) {
  const summary = await getAuditActivitySummary()
  return res.status(200).json(summary)
}

async function staffAuditLogsController(req, res) {
  const format = parseOptionalExportFormat(req.query.format)
  const logs = await listAuditLogs({
    search: req.query.search,
    entityType: req.query.entityType,
    action: req.query.action,
    userId: parseOptionalPositiveInt(req.query.userId, 'userId'),
    limit: parseOptionalLimit(req.query.limit),
  })

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="audit-activity.csv"')
    return res.status(200).send(auditRowsToCsv(logs))
  }

  return res.status(200).json({
    logs,
    count: logs.length,
  })
}

async function staffMaintenanceReadinessController(req, res) {
  const summary = await getMaintenanceReadinessSummary()
  return res.status(200).json(summary)
}

module.exports = {
  staffDashboardController,
  staffApplicantListController,
  staffApplicantDetailController,
  staffJobsController,
  staffJobApplicationsController,
  staffApplicationsController,
  staffUpdateApplicationStatusController,
  staffCreateEndorsementController,
  staffEndorsementsController,
  staffOperationalSummaryController,
  staffAtsCatalogController,
  staffAuditActivitySummaryController,
  staffAuditLogsController,
  staffMaintenanceReadinessController,
}
