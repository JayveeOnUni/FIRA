const { getUserById, getCurrentUserProfile } = require('../services/auth.service')

async function currentAccountController(req, res) {
  const user = await getUserById(req.auth.userId)

  if (!user) {
    return res.status(404).json({
      message: 'User account not found',
    })
  }

  return res.status(200).json({ user })
}

async function currentProfileController(req, res) {
  const user = await getUserById(req.auth.userId)

  if (!user) {
    return res.status(404).json({
      message: 'User account not found',
    })
  }

  const profileData = await getCurrentUserProfile(user)

  return res.status(200).json(profileData)
}

module.exports = {
  currentAccountController,
  currentProfileController,
}
