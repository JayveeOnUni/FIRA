const express = require('express')
const { createModulePlaceholderHandler } = require('../controllers/modulePlaceholder.controller')

const router = express.Router()

router.use(createModulePlaceholderHandler('ats'))

module.exports = router
