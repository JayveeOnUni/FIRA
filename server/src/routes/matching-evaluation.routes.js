const express = require('express')
const { requireAuth } = require('../middleware/authRequired')
const { requireRole } = require('../middleware/roleGuard')
const { asyncHandler } = require('../utils/asyncHandler')
const { validateBody } = require('../middleware/validateRequest')
const {
  createDatasetSchema,
  updateDatasetSchema,
  addDatasetJobsSchema,
  addDatasetApplicantsSchema,
  upsertLabelSchema,
  executeRunSchema,
} = require('../validation/matchEvaluation.validation')
const {
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
} = require('../controllers/matchEvaluation.controller')

const router = express.Router()

router.use(requireAuth, requireRole('agency_staff'))

router.get('/datasets', asyncHandler(listDatasetsController))
router.post('/datasets', validateBody(createDatasetSchema), asyncHandler(createDatasetController))
router.get('/datasets/:datasetId', asyncHandler(getDatasetController))
router.patch(
  '/datasets/:datasetId',
  validateBody(updateDatasetSchema),
  asyncHandler(updateDatasetController),
)
router.post(
  '/datasets/:datasetId/jobs',
  validateBody(addDatasetJobsSchema),
  asyncHandler(addDatasetJobsController),
)
router.post(
  '/datasets/:datasetId/applicants',
  validateBody(addDatasetApplicantsSchema),
  asyncHandler(addDatasetApplicantsController),
)

router.get('/datasets/:datasetId/labels', asyncHandler(listLabelsController))
router.post(
  '/datasets/:datasetId/labels',
  validateBody(upsertLabelSchema),
  asyncHandler(upsertLabelController),
)

router.get('/datasets/:datasetId/runs', asyncHandler(listRunsController))
router.post(
  '/datasets/:datasetId/runs',
  validateBody(executeRunSchema),
  asyncHandler(executeRunController),
)

router.get('/runs/:runId', asyncHandler(getRunController))

module.exports = router
