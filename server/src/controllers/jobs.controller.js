const { listPublicJobs, getPublicJobById } = require('../services/jobs.service')
const { parsePositiveInt } = require('../utils/parse')

async function listPublicJobsController(req, res) {
  const jobs = await listPublicJobs({
    search: req.query.search,
    location: req.query.location,
    employmentType: req.query.employmentType,
  })

  return res.status(200).json({
    jobs,
    count: jobs.length,
  })
}

async function publicJobDetailController(req, res) {
  const jobId = parsePositiveInt(req.params.jobId, 'jobId')
  const job = await getPublicJobById(jobId)
  return res.status(200).json({ job })
}

module.exports = { listPublicJobsController, publicJobDetailController }
