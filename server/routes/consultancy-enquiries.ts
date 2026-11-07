import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { submissionRateLimit } from '../middleware/submission-rate-limit.js'
import { SECURITY_NOTICE, validateBody } from '../middleware/validation.js'
import { consultancyEnquirySchema } from '../schemas/submissions.js'
import { notifySubmissionInBackground } from '../lib/notifications.js'

const router = Router()

router.post(
  '/',
  submissionRateLimit,
  validateBody(consultancyEnquirySchema),
  async (req, res) => {
    const enquiry = await prisma.consultancyEnquiry.create({
      data: req.body,
    })

    notifySubmissionInBackground({
      type: 'consultancy enquiry',
      referenceId: enquiry.id,
      clientName: req.body.contactName,
      clientEmail: req.body.email,
      contactEmail: req.body.email,
      phone: req.body.phone,
      metadata: {
        Organization: req.body.organizationName,
        County: req.body.county || 'Not provided',
      },
    })

    res.status(201).json({
      id: enquiry.id,
      message: 'Your consultancy request has been received.',
      warning: SECURITY_NOTICE,
    })
  },
)

export default router
