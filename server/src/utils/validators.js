const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(email) {
  return emailRegex.test(String(email || '').trim().toLowerCase())
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

module.exports = { validateEmail, isNonEmptyString }
