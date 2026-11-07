import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { submissionRateLimit } from '../middleware/submission-rate-limit.js'
import { SECURITY_NOTICE, validateBody } from '../middleware/validation.js'
import { enquirySchema } from '../schemas/submissions.js'
import { notifySubmissionInBackground } from '../lib/notifications.js'

const router = Router()

router.post(
  '/',
  submissionRateLimit,
  validateBody(enquirySchema),
  async (req, res) => {
    const enquiry = await prisma.enquiry.create({ data: req.body })

    notifySubmissionInBackground({
      type: 'mediation enquiry',
      referenceId: enquiry.id,
      clientName: req.body.fullName,
      clientEmail: req.body.email,
      contactEmail: req.body.email,
      phone: req.body.phone,
      metadata: {
        'Dispute category': req.body.disputeCategory,
        County: req.body.county,
        'Preferred contact method': req.body.preferredContactMethod ?? 'Not specified',
      },
    })

    res.status(201).json({
      id: enquiry.id,
      message: 'Your enquiry has been received.',
      warning: SECURITY_NOTICE,
    })
  },
)

export default router
