const { z } = require('zod')

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters long')
const emailSchema = z.string().trim().email('A valid email address is required')

const applicantRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
})

const employerRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  companyName: z.string().trim().min(1, 'Company name is required'),
  companyDescription: z.string().trim().optional(),
  companyAddress: z.string().trim().optional(),
  companyWebsite: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^https?:\/\/.+/i.test(value), 'Company website must be a valid URL'),
  jobTitle: z.string().trim().optional(),
})

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

module.exports = {
  applicantRegistrationSchema,
  employerRegistrationSchema,
  loginSchema,
}
