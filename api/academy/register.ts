import type { Request, Response } from 'express'
import { prisma } from '../../server/lib/prisma.js'
import {
  logSubmissionFailure,
  validatePublicSubmission,
} from '../../server/lib/public-submission.js'
import { notifySubmissionInBackground } from '../../server/lib/notifications.js'
import { SECURITY_NOTICE } from '../../server/middleware/validation.js'
import { academyCourseRegistrationSchema } from '../../server/schemas/submissions.js'

export default async function academyRegistration(
  req: Request,
  res: Response,
) {
  const data = validatePublicSubmission(
    req,
    res,
    academyCourseRegistrationSchema,
  )
  if (!data) return

  try {
    const course = await prisma.academyCourse.findFirst({
      where: { id: data.courseId, isPublished: true },
      select: { id: true, title: true },
    })

    if (!course) {
      res.status(404).json({
        error: 'The selected course is not available for registration.',
        warning: SECURITY_NOTICE,
      })
      return
    }

    const registration = await prisma.academyRegistration.create({
      data: {
        course: course.title,
        courseInfo: { connect: { id: course.id } },
        fullName: data.studentName,
        email: data.email,
        phone: data.phoneNumber,
        phoneNumber: data.phoneNumber,
        notes: data.notes || undefined,
      },
      select: { id: true },
    })

    notifySubmissionInBackground({
      type: 'academy registration',
      referenceId: registration.id,
      clientName: data.studentName,
      clientEmail: data.email,
      contactEmail: data.email,
      phone: data.phoneNumber,
      metadata: { Course: course.title },
    })

    res.status(201).json({
      registrationId: registration.id,
      message: 'Your course registration has been received.',
      warning: SECURITY_NOTICE,
    })
  } catch (error) {
    logSubmissionFailure('academy_registration_save_failed', error)
    res.status(503).json({
      error:
        'Your registration could not be saved right now. Please try again later.',
      warning: SECURITY_NOTICE,
    })
  }
}
