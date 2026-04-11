const { z } = require('zod')

const optionalTrimmedString = z.string().trim().optional().or(z.literal(''))

const applicantProfileUpdateSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phone: optionalTrimmedString,
  address: optionalTrimmedString,
  dateOfBirth: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Date of birth must follow YYYY-MM-DD'),
  educationSummary: optionalTrimmedString,
  workExperienceSummary: optionalTrimmedString,
  skillsSummary: optionalTrimmedString,
  preferredJobCategory: optionalTrimmedString,
})

const applicantDocumentMetadataSchema = z.object({
  documentType: z.enum(['resume', 'supporting']).optional().default('resume'),
})

module.exports = {
  applicantProfileUpdateSchema,
  applicantDocumentMetadataSchema,
}
