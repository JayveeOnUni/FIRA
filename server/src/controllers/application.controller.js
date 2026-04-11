const {
  createApplicationForApplicant,
  getApplicationStatusHistory,
  listApplicationStatuses,
} = require('../services/application.service')
const { parsePositiveInt } = require('../utils/parse')

async function applyToJobController(req, res) {
  const jobId = parsePositiveInt(req.params.jobId, 'jobId')
  const application = await createApplicationForApplicant(req.auth.userId, jobId, req.validatedBody || {})
  return res.status(201).json({
    message: 'Application submitted successfully',
    application,
  })
}

async function listApplicationStatusesController(req, res) {
  const statuses = listApplicationStatuses()
  return res.status(200).json({ statuses })
}

async function applicationHistoryController(req, res) {
  const applicationId = parsePositiveInt(req.params.applicationId, 'applicationId')
  const history = await getApplicationStatusHistory(req.auth.userId, req.auth.role, applicationId)
  return res.status(200).json({
    history,
    count: history.length,
  })
}

module.exports = {
  applyToJobController,
  listApplicationStatusesController,
  applicationHistoryController,
}
