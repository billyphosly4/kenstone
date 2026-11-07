import axios from 'axios'
import { useEffect, useState, type FormEvent } from 'react'
import mediationHero from './assets/mediation-hero.png'

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
          backgroundImage: `linear-gradient(90deg, rgb(7 26 46 / 94%) 0%, rgb(10 37 64 / 80%) 58%, rgb(10 37 64 / 48%) 100%), url("${mediationHero}")`,
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
              Our vision is a culture where people can address disagreement
              constructively. Our mission is to make the knowledge and practice
              of resolution accessible through focused, applied learning.
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
