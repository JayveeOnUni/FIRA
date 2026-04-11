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

module.exports = {
  APPLICATION_STATUSES,
  MATCH_REVIEW_ACTION_TYPES,
  MATCH_REVIEW_NOTE_TYPES,
  STAFF_ATS_TRANSITIONS,
  JOB_STATUSES,
  MATCH_SCORE_TYPE_SBERT,
  MATCH_SOURCE_VERSION,
}
