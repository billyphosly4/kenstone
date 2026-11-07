import axios from 'axios'
import { useEffect, useState, type FormEvent } from 'react'
import mediationTrainingImage from './assets/mediation-training-workshop.jpeg'

interface AcademyCourse {
  id: string
  title: string
  summary: string
  requirements: string[]
  learningOutcomes: string[]
}

function isAcademyCourse(value: unknown): value is AcademyCourse {
  if (typeof value !== 'object' || value === null) return false

  const course = value as Record<string, unknown>
  return (
    typeof course.id === 'string' &&
    typeof course.title === 'string' &&
    typeof course.summary === 'string' &&
    Array.isArray(course.requirements) &&
    course.requirements.every((requirement) => typeof requirement === 'string') &&
    Array.isArray(course.learningOutcomes) &&
    course.learningOutcomes.every((outcome) => typeof outcome === 'string')
  )
}

type CourseFilter = 'all' | 'mediation' | 'property' | 'business'

const courseFilters: { id: CourseFilter; label: string }[] = [
  { id: 'all', label: 'All Courses' },
  { id: 'mediation', label: 'Mediation Training' },
  { id: 'property', label: 'Specialized Property' },
  { id: 'business', label: 'Business & Workplace' },
]

const featuredCoursePreviews: { title: string; category: Exclude<CourseFilter, 'all'> }[] = [
  { title: 'Professional Mediation Training', category: 'mediation' },
  { title: 'Property & Real Estate Mediation', category: 'property' },
  { title: 'Commercial Mediation', category: 'business' },
  { title: 'Civil Dispute Resolution', category: 'mediation' },
  { title: 'Negotiation & Conflict Management', category: 'business' },
]

const participantGroups = [
  {
    title: 'Human Resource Professionals',
    roles:
      'HR managers, HR officers and assistants, employee-relations officers, recruitment officers, and workplace-relations practitioners.',
  },
  {
    title: 'Law and Legal Professionals',
    roles:
      'Law students, advocates, lawyers, legal officers, paralegals, legal assistants, and law graduates.',
  },
  {
    title: 'Recent High School Graduates',
    roles:
      'Young people who have completed secondary education and want to develop professional skills or explore mediation and ADR.',
  },
  {
    title: 'Business and Entrepreneurship',
    roles:
      'Entrepreneurs, business owners, managers, directors, business consultants, and corporate administrators.',
  },
  {
    title: 'Real Estate and Property',
    roles:
      'Estate agents, property managers, landlords, property developers, valuers, facility managers, and real-estate consultants.',
  },
  {
    title: 'Education Professionals',
    roles:
      'Teachers, lecturers, school administrators, guidance and counselling personnel, education officers, and academic managers.',
  },
  {
    title: 'Healthcare Professionals',
    roles:
      'Doctors, nurses, clinical officers, hospital administrators, counsellors, and healthcare managers.',
  },
  {
    title: 'Finance and Accounting',
    roles:
      'Accountants, auditors, bankers, financial officers, insurance professionals, credit officers, and debt-recovery officers.',
  },
  {
    title: 'Public Administration and Government',
    roles:
      'Public administrators, civil servants, county government officers, public officers, and institutional managers.',
  },
  {
    title: 'Social and Community Development',
    roles:
      'Social workers, community-development officers, project officers, community mobilisers, and development practitioners.',
  },
  {
    title: 'NGO and Human Rights Practitioners',
    roles:
      'Programme officers, project coordinators, human-rights and advocacy officers, community paralegals, and civil-society personnel.',
  },
  {
    title: 'Counselling and Psychology',
    roles:
      'Counsellors, psychologists, therapists, social-support practitioners, and guidance personnel.',
  },
  {
    title: 'Procurement and Supply Chain',
    roles:
      'Procurement officers, supply-chain managers, logistics officers, contract administrators, and purchasing professionals.',
  },
  {
    title: 'Security and Workplace Safety',
    roles:
      'Security managers, compliance officers, occupational-safety officers, and workplace-risk managers.',
  },
  {
    title: 'Religious and Community Leaders',
    roles:
      'Clergy, faith-based organisation leaders, elders, community representatives, and others who help resolve interpersonal or community disputes.',
  },
  {
    title: 'Aspiring and Practising Mediators',
    roles:
      'People seeking foundational mediation knowledge, practical training, professional development, or ways to strengthen existing mediation skills.',
  },
]

interface RegistrationForm {
  studentName: string
  email: string
  phoneNumber: string
  notes: string
}

const emptyRegistration: RegistrationForm = {
  studentName: '',
  email: '',
  phoneNumber: '',
  notes: '',
}

const academyApi = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/academy`
const accreditationNotice =
  "Certification reflects the Academy's current formal approval status and professional standing."

export default function Academy() {
  const [courses, setCourses] = useState<AcademyCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeFilter, setActiveFilter] = useState<CourseFilter>('all')
  const [selectedCourse, setSelectedCourse] = useState<AcademyCourse | null>(
    null,
  )
  const [registration, setRegistration] =
    useState<RegistrationForm>(emptyRegistration)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const visibleCourses = courses.filter((course) => {
    const title = course.title.toLowerCase()
    if (activeFilter === 'property') {
      return title.includes('property') || title.includes('real estate') || title.includes('land')
    }
    if (activeFilter === 'business') {
      return title.includes('commercial') || title.includes('business') || title.includes('workplace')
    }
    if (activeFilter === 'mediation') {
      return title.includes('mediation') || title.includes('civil') || title.includes('negotiation')
    }
    return true
  })

  useEffect(() => {
    const controller = new AbortController()

    async function loadCourses() {
      setLoading(true)
      setLoadError('')
      try {
        const response = await axios.get<unknown>(
          `${academyApi}/courses`,
          { signal: controller.signal },
        )
        const data = response.data
        if (
          typeof data !== 'object' ||
          data === null ||
          !('courses' in data) ||
          !Array.isArray(data.courses) ||
          !data.courses.every(isAcademyCourse)
        ) {
          throw new Error('Invalid Academy courses response.')
        }
        setCourses(data.courses)
      } catch {
        if (!controller.signal.aborted) {
          setLoadError(
            'We could not load Academy programmes. Please check your connection and try again.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadCourses()
    return () => controller.abort()
  }, [])

  function openRegistration(course: AcademyCourse) {
    setSelectedCourse(course)
    setRegistration(emptyRegistration)
    setSubmitError('')
  }

  function closeRegistration() {
    if (submitting) return
    setSelectedCourse(null)
    setRegistration(emptyRegistration)
    setSubmitError('')
  }

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCourse) return

    setSubmitting(true)
    setSubmitError('')
    try {
      const response = await axios.post<{ registrationId?: string; id?: string }>(
        `${academyApi}/register`,
        {
          courseId: selectedCourse.id,
          studentName: registration.studentName.trim(),
          email: registration.email.trim(),
          phoneNumber: registration.phoneNumber.trim(),
          notes: registration.notes.trim(),
        },
      )
      const trackingKey = response.data.registrationId ?? response.data.id
      if (!trackingKey) {
        throw new Error('The server did not return a registration tracking key.')
      }

      setSelectedCourse(null)
      setRegistration(emptyRegistration)
      window.alert(`Registration enquiry received.\nTracking key: ${trackingKey}`)
    } catch {
      setSubmitError(
        'We could not submit your registration enquiry. Please try again later.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="academy-page">
      <header
        className="academy-hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgb(7 26 46 / 94%) 0%, rgb(10 37 64 / 80%) 58%, rgb(10 37 64 / 48%) 100%), url("${mediationTrainingImage}")`,
        }}
      >
        <div className="home-container academy-hero-inner">
          <p className="academy-kicker">Kestone Academy</p>
          <h1>Developing Skills. Building Competence. Promoting Resolution.</h1>
          <p>
            Practical learning for people who want to navigate conflict with
            confidence, fairness, and purpose.
          </p>
          <a className="home-button home-button-gold" href="#academy-courses">
            Explore courses <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
        <div className="academy-hero-accent" aria-hidden="true" />
        <div className="hero-marquee" aria-label="Mediation, consultancy, training">
          <div className="hero-marquee-track">
            <div className="hero-marquee-group">
              <span>Mediation</span>
              <i aria-hidden="true" />
              <span>Consultancy</span>
              <i aria-hidden="true" />
              <span>Training</span>
              <i aria-hidden="true" />
              <span>Developing Skills. Building Competence. Promoting Resolution.</span>
              <i aria-hidden="true" />
            </div>
            <div className="hero-marquee-group" aria-hidden="true">
              <span>Mediation</span>
              <i />
              <span>Consultancy</span>
              <i />
              <span>Training</span>
              <i />
              <span>Developing Skills. Building Competence. Promoting Resolution.</span>
              <i />
            </div>
          </div>
        </div>
      </header>

      <section className="academy-overview" aria-labelledby="academy-overview-title">
        <div className="home-container academy-overview-grid">
          <div>
            <p className="academy-section-kicker">Learning with purpose</p>
            <h2 id="academy-overview-title">Build the skills to make dialogue work.</h2>
          </div>
          <div className="academy-overview-copy">
            <p>
              Kestone Academy develops practical mediation, negotiation, and
              conflict-management capability for professionals, organizations,
              and communities.
            </p>
            <p>
              <strong>Our vision</strong> is to be a trusted centre of
              excellence in mediation, alternative dispute resolution and
              professional training, contributing to a society where disputes
              are resolved constructively, relationships are preserved and
              access to justice is strengthened.
            </p>
            <p>
              <strong>Our mission</strong> is to provide impartial,
              confidential, accessible and professionally guided mediation
              services while equipping individuals, professionals and
              institutions with practical skills in mediation, negotiation and
              conflict management. Through ethical practice, continuous
              learning and innovative dispute-resolution approaches, we seek to
              promote lasting solutions and strengthen the culture of
              alternative dispute resolution.
            </p>
            <p>
              Learners build skills in impartial facilitation, active listening,
              issue identification, option generation, and agreement-building.
              Training combines clear frameworks with guided practice and
              reflective feedback.
            </p>
          </div>
        </div>
        <div className="home-container academy-outcome-list">
          <span><b aria-hidden="true">01</b> Listen and communicate effectively</span>
          <span><b aria-hidden="true">02</b> Navigate difficult conversations</span>
          <span><b aria-hidden="true">03</b> Support practical resolution</span>
        </div>
      </section>

      <section
        className="academy-audience"
        aria-labelledby="academy-audience-title"
      >
        <div className="home-container">
          <div className="academy-audience-heading">
            <div>
              <p className="academy-section-kicker">A skill for every profession</p>
              <h2 id="academy-audience-title">
                Who can benefit from Kestone Academy &amp; Training?
              </h2>
            </div>
            <p>
              Our programmes welcome people from diverse academic, professional,
              and career backgrounds who want practical skills in mediation,
              negotiation, conflict management, and alternative dispute
              resolution (ADR).
            </p>
          </div>

          <div className="academy-audience-grid">
            {participantGroups.map((group, index) => (
              <details className="academy-audience-card" key={group.title}>
                <summary>
                  <span className="academy-audience-number" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{group.title}</span>
                  <span className="academy-audience-toggle" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p>{group.roles}</p>
              </details>
            ))}
          </div>

          <aside className="academy-audience-callout">
            <span className="academy-audience-callout-mark" aria-hidden="true">
              &#10003;
            </span>
            <div>
              <h3>You do not need to be a lawyer to benefit.</h3>
              <p>
                Conflict arises in every sector. Our programmes seek to equip
                participants with practical, ethical, and professional skills
                they can apply in their workplaces, businesses, institutions,
                and communities.
              </p>
            </div>
            <a className="home-button home-button-gold" href="#academy-courses">
              Explore courses <span aria-hidden="true">&rarr;</span>
            </a>
          </aside>
        </div>
      </section>

      <section
        className="academy-catalog"
        id="academy-courses"
        aria-labelledby="academy-catalog-title"
      >
        <div className="home-container">
          <div className="academy-section-heading">
            <div>
              <p className="academy-section-kicker">Find your learning path</p>
              <h2 id="academy-catalog-title">Courses &amp; programmes</h2>
            </div>
            <p>Explore current programmes and choose the skills you want to develop.</p>
          </div>
          <div className="academy-filter-tabs" role="group" aria-label="Filter courses">
            {courseFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={activeFilter === filter.id ? 'is-active' : ''}
                aria-pressed={activeFilter === filter.id}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>

      {loading && (
        <div className="academy-state" role="status" aria-live="polite">
          <span className="academy-spinner" aria-hidden="true" />
          <span>Loading Academy programmes...</span>
        </div>
      )}

      {!loading && loadError && (
        <div className="academy-state academy-error" role="alert">
          <p>{loadError}</p>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !loadError && courses.length === 0 && (
        <>
          <div className="academy-state">
            <h2>Course catalogue coming soon</h2>
            <p>
              These are planned learning areas. Registration opens when a
              programme is published.
            </p>
          </div>
          <div className="academy-course-grid academy-course-previews">
            {featuredCoursePreviews
              .filter((course) => activeFilter === 'all' || course.category === activeFilter)
              .map((course) => (
              <article className="academy-course-card academy-course-preview" key={course.title}>
                <p className="academy-course-category">
                  {courseFilters.find((filter) => filter.id === course.category)?.label}
                </p>
                <h3>{course.title}</h3>
                <p className="academy-course-summary">
                  Practical, applied learning designed to build confidence and
                  capability in constructive dispute resolution.
                </p>
                <dl className="academy-course-meta">
                  <div><dt>Audience</dt><dd>Professionals and practitioners</dd></div>
                  <div><dt>Duration</dt><dd>Confirmed with each cohort</dd></div>
                  <div><dt>Mode</dt><dd>Physical or virtual, by arrangement</dd></div>
                </dl>
                <button type="button" className="academy-course-link" disabled>
                  Registration opening soon
                </button>
              </article>
            ))}
          </div>
        </>
      )}

      {!loading && !loadError && courses.length > 0 && (
        <>
          {visibleCourses.length === 0 ? (
            <div className="academy-state">
              <h2>No courses in this category yet</h2>
              <p>Choose another filter to browse available programmes.</p>
            </div>
          ) : (
            <div className="academy-course-grid">
              {visibleCourses.map((course) => (
                <article className="academy-course-card" key={course.id}>
                  <p className="academy-course-category">Academy programme</p>
                  <h3>{course.title}</h3>
                  <p className="academy-course-summary">{course.summary}</p>
                  <dl className="academy-course-meta">
                    <div><dt>Audience</dt><dd>Professionals and practitioners</dd></div>
                    <div><dt>Duration</dt><dd>Confirmed with each cohort</dd></div>
                    <div><dt>Mode</dt><dd>Physical or virtual, by arrangement</dd></div>
                  </dl>
                  <details className="academy-course-details">
                    <summary>View syllabus</summary>
                    <div className="academy-syllabus">
                      <section>
                        <h4>Entry requirements</h4>
                        {course.requirements.length > 0 ? (
                          <ul className="course-requirements">
                            {course.requirements.map((requirement) => (
                              <li key={requirement}>{requirement}</li>
                            ))}
                          </ul>
                        ) : <p>No specific prerequisites are listed.</p>}
                      </section>
                      <section>
                        <h4>Learning outcomes</h4>
                        {course.learningOutcomes.length > 0 ? (
                          <ul className="course-outcomes">
                            {course.learningOutcomes.map((outcome) => (
                              <li key={outcome}><span aria-hidden="true">&#10003;</span>{outcome}</li>
                            ))}
                          </ul>
                        ) : <p>Learning outcomes will be shared soon.</p>}
                      </section>
                    </div>
                  </details>
                  <button
                    type="button"
                    className="academy-course-link"
                    onClick={() => openRegistration(course)}
                  >
                    View Syllabus &amp; Register <span aria-hidden="true">&rarr;</span>
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      )}
        </div>
      </section>

      <section className="academy-methodology" aria-labelledby="academy-methodology-title">
        <div className="home-container academy-methodology-grid">
          <div>
            <p className="academy-section-kicker">Learn by doing</p>
            <h2 id="academy-methodology-title">Practice, reflect, and grow.</h2>
            <p>
              Academy learning emphasizes participation and real-world
              application, so learners can translate concepts into practice.
            </p>
          </div>
          <ul className="academy-method-list">
            <li><span>01</span><div><strong>Roleplays</strong><p>Practise mediator and participant perspectives.</p></div></li>
            <li><span>02</span><div><strong>Case studies</strong><p>Explore realistic scenarios and decision points.</p></div></li>
            <li><span>03</span><div><strong>Simulations</strong><p>Build confidence through structured, guided practice.</p></div></li>
          </ul>
        </div>
        <div className="home-container">
          <aside className="academy-accreditation" role="note">
            <span aria-hidden="true">i</span>
            <p>
              <strong>Accreditation safeguard</strong>
              {accreditationNotice} Please confirm the current accreditation
              status and applicable course recognition before enrolling.
            </p>
          </aside>
        </div>
      </section>

      <section className="academy-registration-callout" id="academy-registration">
        <div className="home-container academy-registration-inner">
          <div>
            <p className="academy-section-kicker">Take the next step</p>
            <h2>Ready to develop your practice?</h2>
            <p>
              Choose a published programme above to view its syllabus and send
              a training registration enquiry.
            </p>
          </div>
          <a className="home-button home-button-gold" href="#academy-courses">
            Browse courses <span aria-hidden="true">&uarr;</span>
          </a>
        </div>
      </section>

      {selectedCourse && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeRegistration()
          }}
        >
          <section
            className="registration-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-title"
          >
            <button
              className="modal-close"
              type="button"
              aria-label="Close registration form"
              onClick={closeRegistration}
              disabled={submitting}
            >
              &times;
            </button>
            <p className="eyebrow">Training enquiry</p>
            <h2 id="registration-title">{selectedCourse.title}</h2>
            <p className="modal-course-reference">
              Selected programme reference: <code>{selectedCourse.id}</code>
            </p>
            <p className="academy-form-safeguard">
              Share registration details only. Do not send sensitive,
              confidential, or legal documents through this form.
            </p>

            <form className="registration-form" onSubmit={submitRegistration}>
              <label>
                Student name <span aria-hidden="true">*</span>
                <input
                  required
                  maxLength={150}
                  autoComplete="name"
                  value={registration.studentName}
                  onChange={(event) =>
                    setRegistration((current) => ({
                      ...current,
                      studentName: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Email <span aria-hidden="true">*</span>
                <input
                  required
                  type="email"
                  maxLength={254}
                  autoComplete="email"
                  value={registration.email}
                  onChange={(event) =>
                    setRegistration((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Phone number <span aria-hidden="true">*</span>
                <input
                  required
                  type="tel"
                  minLength={7}
                  maxLength={40}
                  autoComplete="tel"
                  value={registration.phoneNumber}
                  onChange={(event) =>
                    setRegistration((current) => ({
                      ...current,
                      phoneNumber: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Optional notes
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={registration.notes}
                  onChange={(event) =>
                    setRegistration((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>

              {submitError && (
                <p className="submit-error" role="alert">
                  {submitError}
                </p>
              )}
              <div className="registration-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={closeRegistration}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  className="button academy-button"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Training Enquiry'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
