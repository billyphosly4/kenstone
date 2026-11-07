import { prisma } from './prisma.js'

export function getPublishedAcademyCourses() {
  return prisma.academyCourse.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      summary: true,
      requirements: true,
      learningOutcomes: true,
    },
    orderBy: { title: 'asc' },
  })
}
