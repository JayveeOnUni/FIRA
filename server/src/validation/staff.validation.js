const { z } = require('zod')
const { APPLICATION_STATUSES } = require('../utils/constants')

const optionalTrimmedString = z.string().trim().optional().or(z.literal(''))

const staffStatusUpdateSchema = z.object({
  newStatus: z.enum(APPLICATION_STATUSES),
  note: optionalTrimmedString,
})

const staffEndorsementSchema = z.object({
  note: optionalTrimmedString,
})

module.exports = {
  staffStatusUpdateSchema,
  staffEndorsementSchema,
}
