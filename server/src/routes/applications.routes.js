const express = require('express')
const { requireAuth } = require('../middleware/authRequired')
const { asyncHandler } = require('../utils/asyncHandler')
const { applicationHistoryController, listApplicationStatusesController } = require('../controllers/application.controller')

const router = express.Router()

router.get('/statuses', asyncHandler(listApplicationStatusesController))
router.get('/:applicationId/history', requireAuth, asyncHandler(applicationHistoryController))

module.exports = router
