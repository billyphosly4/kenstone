import type { Request, Response } from 'express'
import { prisma } from '../server/lib/prisma.js'
import {
  logSubmissionFailure,
  validatePublicSubmission,
} from '../server/lib/public-submission.js'
import { SECURITY_NOTICE } from '../server/middleware/validation.js'
import { enquirySchema } from '../server/schemas/submissions.js'

export default async function enquiries(req: Request, res: Response) {
  const data = validatePublicSubmission(req, res, enquirySchema)
  if (!data) return

  try {
    const enquiry = await prisma.enquiry.create({ data })
    void import('../server/lib/notifications.js')
      .then(({ notifySubmissionInBackground }) =>
        notifySubmissionInBackground({
          type: 'mediation enquiry',
          referenceId: enquiry.id,
          clientName: data.fullName,
          clientEmail: data.email,
          contactEmail: data.email,
          phone: data.phone,
          metadata: {
            'Dispute category': data.disputeCategory,
            County: data.county,
            'Preferred contact method':
              data.preferredContactMethod ?? 'Not specified',
          },
        }),
      )
      .catch((error: unknown) =>
        logSubmissionFailure('mediation_enquiry_notification_failed', error),
      )

    res.status(201).json({
      id: enquiry.id,
      message: 'Your enquiry has been received.',
      warning: SECURITY_NOTICE,
    })
  } catch (error) {
    logSubmissionFailure('mediation_enquiry_save_failed', error)
    res.status(503).json({
      error: 'Your enquiry could not be saved right now. Please try again later.',
      warning: SECURITY_NOTICE,
    })
  }
}
