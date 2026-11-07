import type { Request, Response } from 'express'
import { prisma } from '../server/lib/prisma.js'
import {
  logSubmissionFailure,
  validatePublicSubmission,
} from '../server/lib/public-submission.js'
import { SECURITY_NOTICE } from '../server/middleware/validation.js'
import { consultancyEnquirySchema } from '../server/schemas/submissions.js'

export default async function consultancyEnquiries(
  req: Request,
  res: Response,
) {
  const data = validatePublicSubmission(req, res, consultancyEnquirySchema)
  if (!data) return

  try {
    const enquiry = await prisma.consultancyEnquiry.create({ data })
    void import('../server/lib/notifications.js')
      .then(({ notifySubmissionInBackground }) =>
        notifySubmissionInBackground({
          type: 'consultancy enquiry',
          referenceId: enquiry.id,
          clientName: data.contactName,
          clientEmail: data.email,
          contactEmail: data.email,
          phone: data.phone,
          metadata: {
            Organization: data.organizationName,
            County: data.county || 'Not provided',
          },
        }),
      )
      .catch((error: unknown) =>
        logSubmissionFailure('consultancy_enquiry_notification_failed', error),
      )

    res.status(201).json({
      id: enquiry.id,
      message: 'Your consultancy request has been received.',
      warning: SECURITY_NOTICE,
    })
  } catch (error) {
    logSubmissionFailure('consultancy_enquiry_save_failed', error)
    res.status(503).json({
      error:
        'Your consultancy enquiry could not be saved right now. Please try again later.',
      warning: SECURITY_NOTICE,
    })
  }
}
