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

function buildExplainabilityPayload({ score, summary, keywords = [], applicant, job }) {
  const relevance = getRelevanceLabel(score)
  const factors = buildMatchFactors({ applicant, job })
  const warnings = buildDataQualityWarnings({ applicant, job })

  return {
    explanation_summary: summary || 'Semantic relevance generated from available profile and job text.',
    explanation_keywords: Array.isArray(keywords) ? keywords : [],
    relevance_level: relevance.level,
    relevance_label: relevance.label,
    score_guidance: relevance.guidance,
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
  buildExplainabilityPayload,
}
