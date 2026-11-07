import type { Request, Response } from 'express'
import { getPublishedAcademyCourses } from '../../server/lib/academy-courses.js'

export default async function academyCourses(req: Request, res: Response) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  try {
    const courses = await getPublishedAcademyCourses()
    res.status(200).json({ courses })
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'academy_courses_load_failed',
        error: error instanceof Error ? error.name : 'UnknownError',
      }),
    )
    res.status(503).json({
      error: 'Academy programmes are temporarily unavailable.',
    })
  }
}
