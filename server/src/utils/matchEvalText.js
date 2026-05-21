const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'to',
  'with',
  'will',
  'can',
  'you',
  'your',
  'our',
  'their',
  'this',
  'those',
  'these',
])

function normalizeText(value) {
  if (value === undefined || value === null) {
    return ''
  }

  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^a-z0-9\s\-+#/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenizeKeywords(value, minLength = 3) {
  const normalized = normalizeText(value)
  if (!normalized) {
    return []
  }

  const tokens = normalized.match(/[a-z0-9+#/-]+/g) || []
  const seen = new Set()
  const unique = []

  tokens.forEach((token) => {
    if (token.length < minLength || STOPWORDS.has(token) || seen.has(token)) {
      return
    }
    seen.add(token)
    unique.push(token)
  })

  return unique
}

function sharedKeywordCount(queryText, candidateText) {
  const queryTokens = new Set(tokenizeKeywords(queryText))
  const candidateTokens = tokenizeKeywords(candidateText)
  let count = 0
  candidateTokens.forEach((token) => {
    if (queryTokens.has(token)) {
      count += 1
    }
  })
  return count
}

module.exports = {
  normalizeText,
  tokenizeKeywords,
  sharedKeywordCount,
}
