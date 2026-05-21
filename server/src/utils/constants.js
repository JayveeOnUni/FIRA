const APPLICATION_STATUSES = ['Applied', 'Under Review', 'Verified', 'Shortlisted', 'Endorsed', 'Rejected', 'Withdrawn']
const MATCH_REVIEW_ACTION_TYPES = ['reviewed', 'shortlisted_by_human', 'deferred', 'needs_more_information']
const MATCH_REVIEW_NOTE_TYPES = ['general', 'manual_assessment', 'fairness_check', 'data_quality']

const STAFF_ATS_TRANSITIONS = {
  Applied: ['Under Review', 'Rejected', 'Withdrawn'],
  'Under Review': ['Verified', 'Shortlisted', 'Endorsed', 'Rejected', 'Withdrawn'],
  Verified: ['Shortlisted', 'Endorsed', 'Rejected', 'Withdrawn'],
  Shortlisted: ['Endorsed', 'Rejected', 'Withdrawn'],
  Endorsed: ['Rejected', 'Withdrawn'],
  Rejected: [],
  Withdrawn: [],
}

const JOB_STATUSES = ['draft', 'published', 'closed']
const MATCH_SCORE_TYPE_SBERT = 'sbert_cosine_similarity'
const MATCH_SOURCE_VERSION = 'phase5_v1'

const MATCH_EVAL_RELEVANCE_LABELS = ['highly_relevant', 'relevant', 'partially_relevant', 'not_relevant']
const MATCH_EVAL_DATASET_STATUSES = ['draft', 'active', 'archived']
const MATCH_EVAL_RUN_STATUSES = ['pending', 'running', 'completed', 'failed', 'partial']
const MATCH_EVAL_METHODS = ['sbert', 'keyword_overlap', 'tfidf']
const MATCH_EVAL_GRADE_BY_LABEL = {
  highly_relevant: 3,
  relevant: 2,
  partially_relevant: 1,
  not_relevant: 0,
}

module.exports = {
  APPLICATION_STATUSES,
  MATCH_REVIEW_ACTION_TYPES,
  MATCH_REVIEW_NOTE_TYPES,
  STAFF_ATS_TRANSITIONS,
  JOB_STATUSES,
  MATCH_SCORE_TYPE_SBERT,
  MATCH_SOURCE_VERSION,
  MATCH_EVAL_RELEVANCE_LABELS,
  MATCH_EVAL_DATASET_STATUSES,
  MATCH_EVAL_RUN_STATUSES,
  MATCH_EVAL_METHODS,
  MATCH_EVAL_GRADE_BY_LABEL,
}
