const { tokenizeKeywords, sharedKeywordCount } = require('./matchEvalText')

function rankByKeywordOverlap({ queryText, candidates }) {
  return [...candidates]
    .map((candidate) => ({
      applicantId: candidate.applicantId,
      score: sharedKeywordCount(queryText, candidate.text),
      metadata: {
        method: 'keyword_overlap',
      },
    }))
    .sort((a, b) => b.score - a.score)
}

function buildTfidfVectors(documents) {
  const documentFrequency = new Map()
  const termDocumentCounts = documents.map((document) => {
    const terms = new Set(tokenizeKeywords(document.text))
    terms.forEach((term) => {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1)
    })
    return terms
  })

  const totalDocuments = documents.length || 1

  return documents.map((document, index) => {
    const terms = [...termDocumentCounts[index]]
    const termFrequency = new Map()
    const rawTokens = tokenizeKeywords(document.text)
    rawTokens.forEach((term) => {
      termFrequency.set(term, (termFrequency.get(term) || 0) + 1)
    })

    const vector = new Map()
    let magnitude = 0
    terms.forEach((term) => {
      const tf = termFrequency.get(term) || 0
      const df = documentFrequency.get(term) || 1
      const idf = Math.log((totalDocuments + 1) / (df + 1)) + 1
      const weight = tf * idf
      vector.set(term, weight)
      magnitude += weight * weight
    })

    return {
      applicantId: document.applicantId,
      vector,
      magnitude: Math.sqrt(magnitude) || 1,
    }
  })
}

function cosineSimilarity(vectorA, vectorB, magnitudeA, magnitudeB) {
  let dot = 0
  vectorA.forEach((weight, term) => {
    if (vectorB.has(term)) {
      dot += weight * vectorB.get(term)
    }
  })

  return dot / (magnitudeA * magnitudeB || 1)
}

function rankByTfidf({ queryText, candidates }) {
  const documents = [
    { applicantId: '__query__', text: queryText },
    ...candidates.map((candidate) => ({
      applicantId: candidate.applicantId,
      text: candidate.text,
    })),
  ]

  const vectors = buildTfidfVectors(documents)
  const queryVector = vectors[0]

  return candidates
    .map((candidate, index) => {
      const candidateVector = vectors[index + 1]
      return {
        applicantId: candidate.applicantId,
        score: cosineSimilarity(
          queryVector.vector,
          candidateVector.vector,
          queryVector.magnitude,
          candidateVector.magnitude,
        ),
        metadata: {
          method: 'tfidf',
        },
      }
    })
    .sort((a, b) => b.score - a.score)
}

module.exports = {
  rankByKeywordOverlap,
  rankByTfidf,
}
