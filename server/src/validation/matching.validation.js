const { z } = require('zod')
const { MATCH_REVIEW_ACTION_TYPES, MATCH_REVIEW_NOTE_TYPES } = require('../utils/constants')

const optionalTrimmedString = z.string().trim().optional().or(z.literal(''))

const matchReviewActionSchema = z.object({
  actionType: z.enum(MATCH_REVIEW_ACTION_TYPES),
  note: optionalTrimmedString,
  applicationId: z.coerce.number().int().positive().optional(),
})

const reviewNoteSchema = z.object({
  noteType: z.enum(MATCH_REVIEW_NOTE_TYPES).default('general'),
  note: z.string().trim().min(3).max(2000),
  applicationId: z.coerce.number().int().positive().optional(),
})

module.exports = {
  matchReviewActionSchema,
  reviewNoteSchema,
}
