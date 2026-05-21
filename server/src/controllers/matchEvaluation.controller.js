const { ApiError } = require('../utils/ApiError')
const { parsePositiveInt } = require('../utils/parse')
const {
  createEvaluationDataset,
  updateEvaluationDataset,
  listEvaluationDatasets,
  getEvaluationDataset,
  addDatasetJobs,
  addDatasetApplicants,
  upsertRelevanceLabel,
  listRelevanceLabels,
  executeEvaluationRun,
  listEvaluationRuns,
  getEvaluationRun,
  evaluationSummaryToCsv,
} = require('../services/matchEvaluation.service')

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

async function createDatasetController(req, res) {
  const dataset = await createEvaluationDataset({
    userId: req.auth.userId,
    ...req.validatedBody,
  })

  return res.status(201).json({
    message: 'Evaluation dataset created',
    dataset,
  })
}

async function updateDatasetController(req, res) {
  const datasetId = parsePositiveInt(req.params.datasetId, 'datasetId')
  const dataset = await updateEvaluationDataset(datasetId, {
    userId: req.auth.userId,
    ...req.validatedBody,
  })

  return res.status(200).json({
    message: 'Evaluation dataset updated',
    dataset,
  })
}

async function listDatasetsController(req, res) {
  const datasets = await listEvaluationDatasets()
  return res.status(200).json({
    message: 'Evaluation datasets retrieved',
    datasets,
  })
}

async function getDatasetController(req, res) {
  const datasetId = parsePositiveInt(req.params.datasetId, 'datasetId')
  const payload = await getEvaluationDataset(datasetId)

  return res.status(200).json({
    message: 'Evaluation dataset retrieved',
    ...payload,
  })
}

async function addDatasetJobsController(req, res) {
  const datasetId = parsePositiveInt(req.params.datasetId, 'datasetId')
  const payload = await addDatasetJobs(datasetId, {
    userId: req.auth.userId,
    ...req.validatedBody,
  })

  return res.status(200).json({
    message: 'Evaluation dataset jobs updated',
    ...payload,
  })
}

async function addDatasetApplicantsController(req, res) {
  const datasetId = parsePositiveInt(req.params.datasetId, 'datasetId')
  const payload = await addDatasetApplicants(datasetId, {
    userId: req.auth.userId,
    ...req.validatedBody,
  })

  return res.status(200).json({
    message: 'Evaluation dataset applicants updated',
    ...payload,
  })
}

async function upsertLabelController(req, res) {
  const datasetId = parsePositiveInt(req.params.datasetId, 'datasetId')
  const label = await upsertRelevanceLabel(datasetId, {
    userId: req.auth.userId,
    ...req.validatedBody,
  })

  return res.status(200).json({
    message: 'Relevance label saved',
    label,
  })
}

async function listLabelsController(req, res) {
  const datasetId = parsePositiveInt(req.params.datasetId, 'datasetId')
  const labels = await listRelevanceLabels(datasetId)

  return res.status(200).json({
    message: 'Relevance labels retrieved',
    labels,
  })
}

async function executeRunController(req, res) {
  const datasetId = parsePositiveInt(req.params.datasetId, 'datasetId')
  const payload = await executeEvaluationRun(datasetId, {
    userId: req.auth.userId,
    ...req.validatedBody,
  })

  return res.status(201).json({
    message: 'Evaluation run completed',
    ...payload,
  })
}

async function listRunsController(req, res) {
  const datasetId = parsePositiveInt(req.params.datasetId, 'datasetId')
  const runs = await listEvaluationRuns(datasetId)

  return res.status(200).json({
    message: 'Evaluation runs retrieved',
    runs,
  })
}

async function getRunController(req, res) {
  const runId = parsePositiveInt(req.params.runId, 'runId')
  const format = parseOptionalExportFormat(req.query.format)
  const payload = await getEvaluationRun(runId)

  if (format === 'csv') {
    const summary = payload.run.summary || {}
    const csv = evaluationSummaryToCsv(summary)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="match-eval-run-${runId}.csv"`)
    return res.status(200).send(csv)
  }

  return res.status(200).json({
    message: 'Evaluation run retrieved',
    ...payload,
  })
}

module.exports = {
  createDatasetController,
  updateDatasetController,
  listDatasetsController,
  getDatasetController,
  addDatasetJobsController,
  addDatasetApplicantsController,
  upsertLabelController,
  listLabelsController,
  executeRunController,
  listRunsController,
  getRunController,
}
