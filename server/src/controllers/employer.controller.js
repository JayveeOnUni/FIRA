const {
  getEmployerCompanyProfile,
  upsertEmployerCompanyProfile,
  createEmployerJob,
  listEmployerJobs,
  getEmployerJobById,
  updateEmployerJob,
  listApplicantsForEmployerJob,
  listEndorsedCandidatesForEmployerJob,
} = require('../services/employer.service')
const { parsePositiveInt } = require('../utils/parse')

async function getEmployerCompanyController(req, res) {
  const payload = await getEmployerCompanyProfile(req.auth.userId)
  return res.status(200).json(payload)
}

async function upsertEmployerCompanyController(req, res) {
  const company = await upsertEmployerCompanyProfile(req.auth.userId, req.validatedBody)
  return res.status(200).json({
    message: 'Company profile saved successfully',
    company,
  })
}

async function createEmployerJobController(req, res) {
  const job = await createEmployerJob(req.auth.userId, req.validatedBody)
  return res.status(201).json({
    message: 'Job created successfully',
    job,
  })
}

async function listEmployerJobsController(req, res) {
  const jobs = await listEmployerJobs(req.auth.userId)
  return res.status(200).json({
    jobs,
    count: jobs.length,
  })
}

async function getEmployerJobController(req, res) {
  const jobId = parsePositiveInt(req.params.jobId, 'jobId')
  const job = await getEmployerJobById(req.auth.userId, jobId)
  return res.status(200).json({ job })
}

async function updateEmployerJobController(req, res) {
  const jobId = parsePositiveInt(req.params.jobId, 'jobId')
  const job = await updateEmployerJob(req.auth.userId, jobId, req.validatedBody)
  return res.status(200).json({
    message: 'Job updated successfully',
    job,
  })
}

async function listEmployerJobApplicantsController(req, res) {
  const jobId = parsePositiveInt(req.params.jobId, 'jobId')
  const applicants = await listApplicantsForEmployerJob(req.auth.userId, jobId)
  return res.status(200).json({
    applicants,
    count: applicants.length,
  })
}

async function listEmployerEndorsedCandidatesController(req, res) {
  const jobId = parsePositiveInt(req.params.jobId, 'jobId')
  const endorsements = await listEndorsedCandidatesForEmployerJob(req.auth.userId, jobId)
  return res.status(200).json({
    endorsements,
    count: endorsements.length,
  })
}

module.exports = {
  getEmployerCompanyController,
  upsertEmployerCompanyController,
  createEmployerJobController,
  listEmployerJobsController,
  getEmployerJobController,
  updateEmployerJobController,
  listEmployerJobApplicantsController,
  listEmployerEndorsedCandidatesController,
}
