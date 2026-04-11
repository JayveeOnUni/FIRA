const express = require('express')
const { currentAccountController, currentProfileController } = require('../controllers/user.controller')
const { requireAuth } = require('../middleware/authRequired')
const { asyncHandler } = require('../utils/asyncHandler')

const router = express.Router()

router.get('/me', requireAuth, asyncHandler(currentAccountController))
router.get('/me/profile', requireAuth, asyncHandler(currentProfileController))

module.exports = router
