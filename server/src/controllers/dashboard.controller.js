const {
  getApplicantDashboardSummary,
  getEmployerDashboardSummary,
} = require('../services/dashboard.service')

function roleDashboardController(roleName) {
  return (req, res) => {
    return res.status(200).json({
      role: roleName,
      message: 'Dashboard foundation endpoint ready for feature expansion in later phases.',
      userId: req.auth.userId,
    })
  }
}

async function applicantDashboardController(req, res) {
  const summary = await getApplicantDashboardSummary(req.auth.userId)
  return res.status(200).json(summary)
}

async function employerDashboardController(req, res) {
  const summary = await getEmployerDashboardSummary(req.auth.userId)
  return res.status(200).json(summary)
}

module.exports = {
  roleDashboardController,
  applicantDashboardController,
  employerDashboardController,
}
