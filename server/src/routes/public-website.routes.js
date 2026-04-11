const express = require('express')

const router = express.Router()

router.get('/pages', (req, res) => {
  return res.status(200).json({
    pages: ['home', 'about', 'faq', 'news', 'contact', 'job-search'],
  })
})

module.exports = router
