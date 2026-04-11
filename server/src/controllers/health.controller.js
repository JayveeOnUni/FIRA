const { getHealthSummary } = require('../services/health.service')

async function getHealth(req, res) {
  const summary = await getHealthSummary()
  return res.status(200).json(summary)
}

module.exports = { getHealth }
