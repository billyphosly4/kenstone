import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { getPublishedAcademyCourses } from '../lib/academy-courses.js'
import { submissionRateLimit } from '../middleware/submission-rate-limit.js'
import { SECURITY_NOTICE, validateBody } from '../middleware/validation.js'
import { academyCourseRegistrationSchema } from '../schemas/submissions.js'
import { notifySubmissionInBackground } from '../lib/notifications.js'

const router = Router()

router.get('/courses', async (_req, res) => {
  const courses = await getPublishedAcademyCourses()
  res.status(200).json({ courses })
})

router.post(
  '/register',
  submissionRateLimit,
  validateBody(academyCourseRegistrationSchema),
  async (req, res) => {
    const course = await prisma.academyCourse.findFirst({
      where: { id: req.body.courseId, isPublished: true },
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
        fullName: req.body.studentName,
        email: req.body.email,
        phone: req.body.phoneNumber,
        phoneNumber: req.body.phoneNumber,
        notes: req.body.notes || undefined,
      },
      select: { id: true },
    })

    notifySubmissionInBackground({
      type: 'academy registration',
      referenceId: registration.id,
      clientName: req.body.studentName,
      clientEmail: req.body.email,
      contactEmail: req.body.email,
      phone: req.body.phoneNumber,
      metadata: { Course: course.title },
    })

    res.status(201).json({
      registrationId: registration.id,
      message: 'Your course registration has been received.',
      warning: SECURITY_NOTICE,
    })
  },
)

export default router
