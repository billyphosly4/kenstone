import { z } from 'zod'

const optionalEmail = z
  .string()
  .email()
  .max(254)
  .optional()
  .or(z.literal(''))
  .transform((value) => (value ? value : undefined))

const optionalPhone = z
  .string()
  .trim()
  .min(7)
  .max(40)
  .regex(/^[+0-9().\-\s]+$/)
  .optional()
  .or(z.literal(''))
  .transform((value) => (value ? value : undefined))

function requiresContact<T extends { email?: string; phone?: string }>(
  schema: z.ZodType<T>,
) {
  return schema.refine((value) => Boolean(value.email || value.phone), {
    message: 'Provide at least one contact method: email or phone.',
    path: ['email'],
  })
}

export const enquirySchema = requiresContact(
  z
    .object({
      fullName: z.string().trim().min(2).max(150),
      email: optionalEmail,
      phone: optionalPhone,
      preferredContactMethod: z.enum(['EMAIL', 'PHONE', 'WHATSAPP']).optional(),
      preferredContactTime: z.string().trim().max(120).optional(),
      disputeCategory: z.enum([
        'LAND_PROPERTY',
        'REAL_ESTATE',
        'CIVIL',
        'COMMERCIAL',
        'FAMILY',
        'FAMILY_SUCCESSION',
        'EMPLOYMENT',
        'CONSTRUCTION',
        'OTHER',
      ]),
      otherPartyStatus: z.enum(['AWARE', 'AGREED', 'UNAWARE']).optional(),
      consultationPreference: z.enum(['PHYSICAL', 'VIRTUAL']).optional(),
      county: z.string().trim().min(2).max(100),
      opponentAware: z.boolean(),
      description: z.string().trim().min(2).max(2000),
    })
    .strict(),
)

export const academyRegistrationSchema = requiresContact(
  z
    .object({
      fullName: z.string().trim().min(2).max(150),
      email: optionalEmail,
      phone: optionalPhone,
      course: z.string().trim().min(2).max(150),
    })
    .strict(),
)

export const academyCourseRegistrationSchema = z
  .object({
    courseId: z.string().trim().min(1).max(100),
    studentName: z.string().trim().min(2).max(150),
    email: z.string().trim().email().max(254),
    phoneNumber: z
      .string()
      .trim()
      .min(7)
      .max(40)
      .regex(/^[+0-9().\-\s]+$/),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict()

export const consultancyEnquirySchema = requiresContact(
  z
    .object({
      organizationName: z.string().trim().min(2).max(200),
      contactName: z.string().trim().min(2).max(150),
      contactRole: z.string().trim().max(120).optional(),
      email: optionalEmail,
      phone: optionalPhone,
      county: z.string().trim().max(100).optional(),
      requestDetails: z.string().trim().min(2).max(2000),
    })
    .strict(),
)
