function roleDashboardController(roleName) {
  return (req, res) => {
    return res.status(200).json({
      role: roleName,
      message: 'Dashboard foundation endpoint ready for feature expansion in later phases.',
      userId: req.auth.userId,
    })
  }
}

module.exports = { roleDashboardController }
