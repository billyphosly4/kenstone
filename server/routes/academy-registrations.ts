import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { submissionRateLimit } from '../middleware/submission-rate-limit.js'
import { SECURITY_NOTICE, validateBody } from '../middleware/validation.js'
import { academyRegistrationSchema } from '../schemas/submissions.js'
import { notifySubmissionInBackground } from '../lib/notifications.js'

const router = Router()

router.post(
  '/',
  submissionRateLimit,
  validateBody(academyRegistrationSchema),
  async (req, res) => {
    const registration = await prisma.academyRegistration.create({
      data: req.body,
    })

    notifySubmissionInBackground({
      type: 'academy registration',
      referenceId: registration.id,
      clientName: req.body.fullName,
      clientEmail: req.body.email,
      contactEmail: req.body.email,
      phone: req.body.phone,
      metadata: { Course: req.body.course },
    })

    res.status(201).json({
      id: registration.id,
      message: 'Your course registration has been received.',
      warning: SECURITY_NOTICE,
    })
  },
)

export default router
