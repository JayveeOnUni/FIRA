const { z } = require('zod')

const applyToJobSchema = z.object({
  note: z.string().trim().max(500).optional().or(z.literal('')),
})

const withdrawApplicationSchema = z.object({
  note: z.string().trim().max(500).optional().or(z.literal('')),
})

module.exports = {
  applyToJobSchema,
  withdrawApplicationSchema,
}
