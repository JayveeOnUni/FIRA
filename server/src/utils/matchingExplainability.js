function normalizeText(value) {
  if (value === undefined || value === null) {
    return ''
  }

  return String(value).toLowerCase().replace(/[^a-z0-9\s\-\+#/]/g, ' ').replace(/\s+/g, ' ').trim()
}

function tokenize(value, minimumLength = 3) {
  const normalized = normalizeText(value)
  if (!normalized) {
    return []
  }

  const stopwords = new Set([
    'the',
    'and',
    'for',
    'with',
    'from',
    'that',
    'this',
    'are',
    'your',
    'you',
    'our',
    'will',
    'job',
    'work',
  ])

  const seen = new Set()
  const tokens = []
  normalized.split(' ').forEach((token) => {
    if (token.length < minimumLength) {
      return
    }

    if (stopwords.has(token)) {
      return
    }

    if (seen.has(token)) {
      return
    }

    seen.add(token)
    tokens.push(token)
  })

  return tokens
}

function intersectTerms(left, right, limit = 6) {
  const leftTokens = tokenize(left)
  const rightSet = new Set(tokenize(right))
  const overlap = leftTokens.filter((token) => rightSet.has(token))
  return overlap.slice(0, limit)
}

function getRelevanceLabel(score) {
  const safeScore = Number(score)
  if (!Number.isFinite(safeScore)) {
    return {
      level: 'unknown',
      label: 'Unknown relevance',
      guidance: 'This score is unavailable. Continue with manual profile and job review.',
    }
  }

  if (safeScore >= 0.78) {
    return {
      level: 'high',
      label: 'High relevance',
      guidance: 'Strong text overlap detected. Validate fit with interviews and manual review.',
    }
  }

  if (safeScore >= 0.58) {
    return {
      level: 'medium',
      label: 'Moderate relevance',
      guidance: 'Partial text overlap detected. Review qualifications and experience carefully.',
    }
  }

  return {
    level: 'low',
    label: 'Exploratory relevance',
    guidance: 'Limited text overlap detected. Human review is required before any decision.',
  }
}

function getConfidenceLabel({ score, warnings = [] }) {
  const safeScore = Number(score)
  if (!Number.isFinite(safeScore)) {
    return {
      level: 'unknown',
      label: 'Unknown confidence',
      guidance: 'Confidence cannot be computed because the match score is unavailable.',
    }
  }

  if (warnings.length >= 2) {
    return {
      level: 'low',
      label: 'Low confidence',
      guidance: 'Several input-quality warnings are present. Treat this ranking as exploratory.',
    }
  }

  if (safeScore >= 0.78 && warnings.length === 0) {
    return {
      level: 'high',
      label: 'High confidence',
      guidance: 'Strong score and adequate text detail. Still validate manually before any decision.',
    }
  }

  if (safeScore >= 0.58 && warnings.length <= 1) {
    return {
      level: 'medium',
      label: 'Moderate confidence',
      guidance: 'Useful signal, but the match should be paired with manual review.',
    }
  }

  return {
    level: 'low',
    label: 'Low confidence',
    guidance: 'Limited signal strength. Use only as a starting point for review.',
  }
}

function buildMatchFactors({ applicant, job }) {
  const matchedSkills = intersectTerms(
    `${applicant?.skills_summary || ''} ${applicant?.preferred_job_category || ''}`,
    `${job?.required_skills || ''} ${job?.title || ''}`,
    6,
  )

  const matchedQualifications = intersectTerms(
    `${applicant?.education_summary || ''}`,
    `${job?.qualifications || ''}`,
    5,
  )

  const matchedExperience = intersectTerms(
    `${applicant?.work_experience_summary || ''}`,
    `${job?.description || ''} ${job?.qualifications || ''}`,
    5,
  )

  return {
    matched_skills: matchedSkills,
    matched_qualifications: matchedQualifications,
    matched_experience: matchedExperience,
  }
}

function buildDataQualityWarnings({ applicant, job }) {
  const warnings = []

  if (!normalizeText(applicant?.skills_summary) && !normalizeText(applicant?.work_experience_summary)) {
    warnings.push('Applicant profile has limited skills/experience text; relevance may be less reliable.')
  }

  if (!normalizeText(job?.required_skills) && !normalizeText(job?.qualifications)) {
    warnings.push('Job post has limited skills/qualification detail; ranking confidence may be lower.')
  }

  if (!normalizeText(job?.description)) {
    warnings.push('Job description is sparse; semantic matching may miss important context.')
  }

  return warnings.slice(0, 3)
}

function buildRankingReasons({ score, keywords = [], factors, warnings }) {
  const reasons = []
  const safeScore = Number(score)

  if (Number.isFinite(safeScore)) {
    reasons.push(`SBERT cosine similarity: ${safeScore.toFixed(3)}`)
  }

  if (Array.isArray(keywords) && keywords.length > 0) {
    reasons.push(`Shared semantic terms: ${keywords.slice(0, 5).join(', ')}`)
  }

  if (factors.matched_skills.length > 0) {
    reasons.push(`Skill overlap: ${factors.matched_skills.join(', ')}`)
  }

  if (factors.matched_qualifications.length > 0) {
    reasons.push(`Qualification overlap: ${factors.matched_qualifications.join(', ')}`)
  }

  if (factors.matched_experience.length > 0) {
    reasons.push(`Experience overlap: ${factors.matched_experience.join(', ')}`)
  }

  if (warnings.length > 0) {
    reasons.push('Input completeness warnings reduce confidence.')
  }

  return reasons.slice(0, 6)
}

function buildExplainabilityPayload({ score, summary, keywords = [], applicant, job }) {
  const relevance = getRelevanceLabel(score)
  const factors = buildMatchFactors({ applicant, job })
  const warnings = buildDataQualityWarnings({ applicant, job })
  const confidence = getConfidenceLabel({ score, warnings })
  const safeKeywords = Array.isArray(keywords) ? keywords : []

  return {
    explanation_summary: summary || 'Semantic relevance generated from available profile and job text.',
    explanation_keywords: safeKeywords,
    relevance_level: relevance.level,
    relevance_label: relevance.label,
    score_guidance: relevance.guidance,
    confidence_level: confidence.level,
    confidence_label: confidence.label,
    confidence_guidance: confidence.guidance,
    ranking_reasons: buildRankingReasons({
      score,
      keywords: safeKeywords,
      factors,
      warnings,
    }),
    matched_skills: factors.matched_skills,
    matched_qualifications: factors.matched_qualifications,
    matched_experience: factors.matched_experience,
    data_quality_warnings: warnings,
    fairness_reminder:
      'Matching quality can vary with text completeness and wording. Do not use this score as a final hiring decision.',
  }
}

module.exports = {
  getRelevanceLabel,
  getConfidenceLabel,
  buildExplainabilityPayload,
}
