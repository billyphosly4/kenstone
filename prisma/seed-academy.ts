import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const courses = [
  {
    title: 'Professional Mediation Training',
    summary:
      'An introduction to mediation principles, process design, impartial facilitation, and constructive negotiation.',
    requirements: [],
    learningOutcomes: [
      'Explain core mediation principles and stages.',
      'Use practical communication and facilitation techniques.',
      'Identify when a matter may need independent professional advice.',
    ],
  },
  {
    title: 'Property & Real Estate Mediation',
    summary:
      'A learning programme focused on facilitated dialogue around property, land-use, tenancy, and real-estate disagreements.',
    requirements: [],
    learningOutcomes: [
      'Identify common interests and issues in property-related disputes.',
      'Structure a balanced discussion between participants.',
      'Explore practical options while recognizing when legal advice is needed.',
    ],
  },
  {
    title: 'Commercial Mediation',
    summary:
      'Practical learning on communication, interests, and resolution options in commercial and business disagreements.',
    requirements: [],
    learningOutcomes: [
      'Distinguish positions from underlying commercial interests.',
      'Support focused discussion between business participants.',
      'Generate and assess possible forward-looking options.',
    ],
  },
  {
    title: 'Civil Dispute Resolution',
    summary:
      'An overview of constructive dispute-resolution approaches for civil disagreements and ongoing relationships.',
    requirements: [],
    learningOutcomes: [
      'Describe the role of facilitated dialogue in civil disputes.',
      'Organize issues for a productive resolution discussion.',
      'Recognize procedural or legal questions requiring independent advice.',
    ],
  },
  {
    title: 'Negotiation & Conflict Management',
    summary:
      'Applied learning in communication, negotiation preparation, and constructive approaches to managing conflict.',
    requirements: [],
    learningOutcomes: [
      'Prepare for a negotiation by identifying interests and priorities.',
      'Apply active listening and clear communication techniques.',
      'Select constructive responses to common conflict situations.',
    ],
  },
]

async function seedAcademyCourses() {
  for (const course of courses) {
    await prisma.academyCourse.upsert({
      where: { title: course.title },
      create: { ...course, isPublished: true },
      update: {
        summary: course.summary,
        requirements: course.requirements,
        learningOutcomes: course.learningOutcomes,
        isPublished: true,
      },
    })
  }

  console.log(`Seeded ${courses.length} Academy courses.`)
}

seedAcademyCourses()
  .catch((error: unknown) => {
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'academy_course_seed_failed',
        error: error instanceof Error ? error.name : 'UnknownError',
      }),
    )
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
