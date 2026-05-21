const { z } = require('zod')
const {
  MATCH_EVAL_RELEVANCE_LABELS,
  MATCH_EVAL_DATASET_STATUSES,
  MATCH_EVAL_METHODS,
} = require('../utils/constants')

const optionalTrimmedString = z.string().trim().optional().or(z.literal(''))

const createDatasetSchema = z.object({
  name: z.string().trim().min(3).max(200),
  version: z.string().trim().min(1).max(80).default('v1'),
  description: optionalTrimmedString,
  sourceNotes: optionalTrimmedString,
  status: z.enum(MATCH_EVAL_DATASET_STATUSES).optional(),
})

const updateDatasetSchema = z.object({
  name: z.string().trim().min(3).max(200).optional(),
  description: optionalTrimmedString,
  sourceNotes: optionalTrimmedString,
  status: z.enum(MATCH_EVAL_DATASET_STATUSES).optional(),
})

const addDatasetJobsSchema = z.object({
  jobIds: z.array(z.coerce.number().int().positive()).min(1),
  notes: optionalTrimmedString,
})

const addDatasetApplicantsSchema = z.object({
  applicantIds: z.array(z.coerce.number().int().positive()).min(1),
  notes: optionalTrimmedString,
})

const upsertLabelSchema = z.object({
  jobId: z.coerce.number().int().positive(),
  applicantId: z.coerce.number().int().positive(),
  relevanceLabel: z.enum(MATCH_EVAL_RELEVANCE_LABELS),
  labelNotes: optionalTrimmedString,
  reviewedBy: z.coerce.number().int().positive().optional(),
})

const executeRunSchema = z.object({
  runName: z.string().trim().min(3).max(200).optional(),
  methods: z.array(z.enum(MATCH_EVAL_METHODS)).min(1).optional(),
  scoringConfig: z
    .object({
      topK: z.coerce.number().int().positive().max(100).optional(),
      minScore: z.number().min(-1).max(1).optional(),
    })
    .optional(),
})

module.exports = {
  createDatasetSchema,
  updateDatasetSchema,
  addDatasetJobsSchema,
  addDatasetApplicantsSchema,
  upsertLabelSchema,
  executeRunSchema,
}
