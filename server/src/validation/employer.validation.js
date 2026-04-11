const { z } = require('zod')
const { JOB_STATUSES } = require('../utils/constants')

const optionalTrimmedString = z.string().trim().optional().or(z.literal(''))

const companyProfileSchema = z.object({
  name: z.string().trim().min(1, 'Company name is required'),
  description: optionalTrimmedString,
  address: optionalTrimmedString,
  website: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || /^https?:\/\/.+/i.test(value), 'Company website must be a valid URL'),
  contactNumber: optionalTrimmedString,
  country: optionalTrimmedString,
})

const jobCreateSchema = z.object({
  title: z.string().trim().min(1, 'Job title is required'),
  description: z.string().trim().min(1, 'Job description is required'),
  qualifications: optionalTrimmedString,
  requiredSkills: optionalTrimmedString,
  location: optionalTrimmedString,
  employmentType: optionalTrimmedString,
  salary: optionalTrimmedString,
  status: z.enum(JOB_STATUSES).optional().default('draft'),
  isPublic: z.boolean().optional().default(false),
})

const jobUpdateSchema = z
  .object({
    title: z.string().trim().min(1, 'Job title is required').optional(),
    description: z.string().trim().min(1, 'Job description is required').optional(),
    qualifications: optionalTrimmedString.optional(),
    requiredSkills: optionalTrimmedString.optional(),
    location: optionalTrimmedString.optional(),
    employmentType: optionalTrimmedString.optional(),
    salary: optionalTrimmedString.optional(),
    status: z.enum(JOB_STATUSES).optional(),
    isPublic: z.boolean().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required for update')

module.exports = {
  companyProfileSchema,
  jobCreateSchema,
  jobUpdateSchema,
}
