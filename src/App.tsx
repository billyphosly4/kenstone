import axios from 'axios'
import { domAnimation, LazyMotion } from 'framer-motion'
import { FormikProvider, useFormik } from 'formik'
import { useEffect, useRef, useState } from 'react'
import * as Yup from 'yup'
import Academy from './Academy'
import FadeIn from './components/animations/FadeIn'
import commercialMediationImage from './assets/commercial-mediation-meeting.jpeg'
import corporateConsultancyImage from './assets/corporate-consultancy-meeting.jpeg'
import courtAnnexedImage from './assets/court-annexed-mediation-workshop.jpeg'
import facilitatedConflictImage from './assets/facilitated-conflict-discussion.jpeg'
import familyMediationImage from './assets/family-mediation-session.jpeg'
import kestoneLogo from './assets/kestone-logo.png'
import landDocumentImage from './assets/land-document-consultation.jpeg'
import landSurveyImage from './assets/land-survey-discussion.jpeg'
import mediationAgreementImage from './assets/mediation-agreement-meeting.jpeg'
import mediationHero from './assets/mediation-hero.png'
import virtualMediationImage from './assets/virtual-mediation-consultation.jpeg'
import './App.css'

const currentYear = new Date().getFullYear()
type AppPage = 'home' | 'academy' | 'enquiries' | 'consultancy' | 'property'

type DisputeCategoryChoice =
  | 'LAND_PROPERTY'
  | 'REAL_ESTATE'
  | 'CIVIL'
  | 'COMMERCIAL'
  | 'FAMILY_SUCCESSION'
  | 'EMPLOYMENT'
  | 'CONSTRUCTION'
  | 'OTHER'
  | ''
type PreferredContactMethod = 'EMAIL' | 'PHONE' | 'WHATSAPP' | ''
type OtherPartyStatus = 'AWARE' | 'AGREED' | 'UNAWARE' | ''
type ConsultationPreference = 'PHYSICAL' | 'VIRTUAL' | ''

interface EnquiryValues {
  disputeCategory: DisputeCategoryChoice | ''
  fullName: string
  email: string
  phone: string
  preferredContactMethod: PreferredContactMethod
  preferredContactTime: string
  otherPartyStatus: OtherPartyStatus
  consultationPreference: ConsultationPreference
  county: string
  safetyFlags: string[]
  description: string
}

const initialValues: EnquiryValues = {
  disputeCategory: '',
  fullName: '',
  email: '',
  phone: '',
  preferredContactMethod: '',
  preferredContactTime: '',
  otherPartyStatus: '',
  consultationPreference: '',
  county: '',
  safetyFlags: [],
  description: '',
}

const safetyConditions = [
  'Presence of severe coercion or threats to physical safety',
  'Unmanageable power imbalances',
  'Serious ongoing criminal conduct',
]

const validationSchema = Yup.object({
  disputeCategory: Yup.string()
    .oneOf([
      'LAND_PROPERTY',
      'REAL_ESTATE',
      'CIVIL',
      'COMMERCIAL',
      'FAMILY_SUCCESSION',
      'EMPLOYMENT',
      'CONSTRUCTION',
      'OTHER',
    ])
    .required('Choose a dispute category.'),
  fullName: Yup.string()
    .trim()
    .min(2, 'Enter your full name.')
    .max(150, 'Name must be 150 characters or fewer.')
    .required('Full name is required.'),
  email: Yup.string()
    .transform((value) => value?.trim() || undefined)
    .email('Enter a valid email address.')
    .max(254, 'Email must be 254 characters or fewer.')
    .optional(),
  phone: Yup.string()
    .transform((value) => value?.trim() || undefined)
    .min(7, 'Enter a valid phone number.')
    .max(40, 'Phone number must be 40 characters or fewer.')
    .matches(/^[+0-9().\-\s]+$/, 'Enter a valid phone number.')
    .optional(),
  preferredContactMethod: Yup.string()
    .oneOf(['', 'EMAIL', 'PHONE', 'WHATSAPP'])
    .required('Choose a preferred contact method.'),
  otherPartyStatus: Yup.string()
    .oneOf(['AWARE', 'AGREED', 'UNAWARE'])
    .required('Choose the other party’s current status.'),
  consultationPreference: Yup.string()
    .oneOf(['PHYSICAL', 'VIRTUAL'])
    .required('Choose a consultation preference.'),
  preferredContactTime: Yup.string().max(
    120,
    'Preferred time must be 120 characters or fewer.',
  ),
  county: Yup.string()
    .trim()
    .min(2, 'Enter the county or general location.')
    .max(100, 'Location must be 100 characters or fewer.')
    .required('County or general location is required.'),
  safetyFlags: Yup.array().of(Yup.string().defined()).defined(),
  description: Yup.string()
    .trim()
    .min(2, 'Please provide a brief description.')
    .max(1000, 'Description must be 1000 characters or fewer.')
    .required('A brief description is required.'),
}).test(
  'at-least-one-contact',
  'Provide the contact details needed for your preferred contact method.',
  function validateContact(values) {
    if (!values?.email && !values?.phone) {
      return this.createError({
        path: 'email',
        message: 'Provide at least one contact method: email or phone.',
      })
    }
    if (values.preferredContactMethod === 'EMAIL' && !values.email) {
      return this.createError({
        path: 'email',
        message: 'Email is required for your preferred contact method.',
      })
    }
    if (
      ['PHONE', 'WHATSAPP'].includes(values.preferredContactMethod ?? '') &&
      !values.phone
    ) {
      return this.createError({
        path: 'phone',
        message: 'Phone number is required for your preferred contact method.',
      })
    }
    return true
  },
)

const steps = [
  'Dispute category',
  'Location & contact',
  'Safety screening',
  'Final details',
]

function Enquiries() {
  const [step, setStep] = useState(1)
  const [submitError, setSubmitError] = useState('')
  const [submittedReference, setSubmittedReference] = useState('')
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const successCloseRef = useRef<HTMLButtonElement>(null)

  function dismissSuccess() {
    setSubmittedReference('')
    requestAnimationFrame(() => submitButtonRef.current?.focus())
  }

  useEffect(() => {
    if (!submittedReference) return

    successCloseRef.current?.focus()
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') dismissSuccess()
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [submittedReference])

  const formik = useFormik<EnquiryValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, helpers) => {
      if (values.safetyFlags.length > 0) return

      setSubmitError('')
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/enquiries`,
          {
            disputeCategory: values.disputeCategory,
            fullName: values.fullName.trim(),
            email: values.email.trim() || undefined,
            phone: values.phone.trim() || undefined,
            preferredContactMethod: values.preferredContactMethod,
            preferredContactTime: values.preferredContactTime || undefined,
            otherPartyStatus: values.otherPartyStatus,
            consultationPreference: values.consultationPreference,
            county: values.county.trim(),
            opponentAware: values.otherPartyStatus !== 'UNAWARE',
            description: values.description.trim(),
          },
        )

        const referenceId = response.data.id
        if (typeof referenceId !== 'string' || referenceId.length === 0) {
          throw new Error('The server did not return a reference ID.')
        }

        setSubmittedReference(referenceId)
      } catch {
        setSubmitError(
          'We could not submit your enquiry. Please try again later or contact our offices directly.',
        )
      } finally {
        helpers.setSubmitting(false)
      }
    },
  })

  const activeSafetyFlags = formik.values.safetyFlags
  const hasSafetyConcern = activeSafetyFlags.length > 0

  async function continueToNextStep() {
    const errors = await formik.validateForm()
    const fieldsByStep: Record<number, (keyof EnquiryValues)[]> = {
      1: ['disputeCategory'],
      2: [
        'fullName',
        'email',
        'phone',
        'preferredContactMethod',
        'preferredContactTime',
        'otherPartyStatus',
        'consultationPreference',
        'county',
      ],
      3: ['safetyFlags'],
    }
    const currentFields = fieldsByStep[step] ?? []
    const stepHasErrors = currentFields.some((field) => Boolean(errors[field]))

    await formik.setTouched(
      Object.fromEntries(currentFields.map((field) => [field, true])),
    )

    if (!stepHasErrors && !hasSafetyConcern) {
      setStep((currentStep) => Math.min(currentStep + 1, 4))
      setSubmitError('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function showFieldError(field: keyof EnquiryValues) {
    const error = formik.errors[field]
    return formik.touched[field] && typeof error === 'string' ? error : ''
  }

  if (submittedReference) {
    return (
    <main className="success-modal-backdrop">
      <section
        className="wizard-card success-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-success-title"
        aria-describedby="enquiry-success-description"
      >
          <div className="success-icon" aria-hidden="true">
            &#10003;
          </div>
          <p className="eyebrow">Enquiry received</p>
          <h1 id="enquiry-success-title">Thank you for reaching out.</h1>
          <p id="enquiry-success-description">
            Your preliminary enquiry has been received. Please keep this
            reference ID for your records.
          </p>
          <p className="reference-id">Reference ID: {submittedReference}</p>
          <p className="privacy-note">
            Please do not email or upload confidential evidence or legal
            documents in response to this submission.
          </p>
          <button
            className="button button-secondary success-dismiss"
            type="button"
            onClick={dismissSuccess}
            autoFocus
            ref={successCloseRef}
          >
            Close confirmation
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <header className="page-heading">
        <p className="eyebrow">Kestone Mediation Centre &amp; Consultancy</p>
        <h1>Request Mediation</h1>
        <p>
          Share a few non-confidential details so our team can understand how to
          direct your enquiry.
        </p>
      </header>

      <section className="wizard-card" aria-label="Preliminary dispute enquiry">
        <nav className="step-indicator" aria-label="Form progress">
          {steps.map((label, index) => {
            const stepNumber = index + 1
            return (
              <div
                className={`step-indicator-item ${
                  stepNumber === step ? 'is-current' : ''
                } ${stepNumber < step ? 'is-complete' : ''}`}
                key={label}
                aria-current={stepNumber === step ? 'step' : undefined}
              >
                <span className="step-number">{stepNumber}</span>
                <span className="step-label">{label}</span>
              </div>
            )
          })}
        </nav>

        <FormikProvider value={formik}>
          <form
            noValidate
            onSubmit={formik.handleSubmit}
            className="wizard-form"
          >
            {step === 1 && (
              <section className="form-step">
                <p className="step-kicker">Step 1 of 4</p>
                <h2>Tell us about the dispute</h2>
                <p className="step-description">
                  Choose the category that best describes your preliminary
                  enquiry.
                </p>

                <label className="field-label" htmlFor="disputeCategory">
                  Dispute category <span aria-hidden="true">*</span>
                </label>
                <div className="flagship-tags" aria-label="Flagship mediation options">
                  <span>Land</span>
                  <span>Property</span>
                  <span>Real estate mediation</span>
                </div>
                <select
                  id="disputeCategory"
                  name="disputeCategory"
                  value={formik.values.disputeCategory}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  aria-invalid={Boolean(showFieldError('disputeCategory'))}
                  aria-describedby="category-error"
                >
                  <option value="">Select a dispute category</option>
                  <option value="LAND_PROPERTY">Land &amp; Property</option>
                  <option value="REAL_ESTATE">Real Estate</option>
                  <option value="CIVIL">Civil</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="FAMILY_SUCCESSION">Family / Succession</option>
                  <option value="EMPLOYMENT">Employment</option>
                  <option value="CONSTRUCTION">Construction</option>
                  <option value="OTHER">Other</option>
                </select>
                <FieldError id="category-error">
                  {showFieldError('disputeCategory')}
                </FieldError>
                <div className="confidentiality-warning request-safeguard" role="note">
                  <strong>PRELIMINARY AND NON-CONFIDENTIAL</strong>
                  <p>
                    Please provide preliminary details only. Do not upload or
                    transmit sensitive legal evidence or confidential documents
                    through this form.
                  </p>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="form-step">
                <p className="step-kicker">Step 2 of 4</p>
                <h2>Where is the dispute, and how can we reach you?</h2>
                <p className="step-description">
                  Share contact information for a response. At least one email
                  address or phone number is required; choose the detail that
                  matches your preferred contact method.
                </p>

                <div className="form-grid">
                  <TextField
                    id="fullName"
                    label="Full name"
                    required
                    value={formik.values.fullName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={showFieldError('fullName')}
                    autoComplete="name"
                  />
                  <TextField
                    id="county"
                    label="County or general location in Kenya"
                    required
                    value={formik.values.county}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={showFieldError('county')}
                    placeholder="For example, Nairobi County"
                  />
                  <TextField
                    id="email"
                    label="Email address"
                    type="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={showFieldError('email')}
                    autoComplete="email"
                  />
                  <TextField
                    id="phone"
                    label="Phone number"
                    type="tel"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={showFieldError('phone')}
                    autoComplete="tel"
                  />
                </div>
                <div className="form-grid contact-preferences">
                  <div>
                    <label className="field-label" htmlFor="preferredContactMethod">
                      Preferred contact method
                    </label>
                    <select
                      id="preferredContactMethod"
                      name="preferredContactMethod"
                      value={formik.values.preferredContactMethod}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      <option value="">No preference</option>
                      <option value="EMAIL">Email</option>
                      <option value="PHONE">Phone</option>
                      <option value="WHATSAPP">WhatsApp</option>
                    </select>
                    <FieldError>
                      {showFieldError('preferredContactMethod')}
                    </FieldError>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="preferredContactTime">
                      Preferred time
                    </label>
                    <select
                      id="preferredContactTime"
                      name="preferredContactTime"
                      value={formik.values.preferredContactTime}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      <option value="">No preference</option>
                      <option value="Morning (8am - 12pm)">
                        Morning (8am - 12pm)
                      </option>
                      <option value="Afternoon (12pm - 5pm)">
                        Afternoon (12pm - 5pm)
                      </option>
                      <option value="Evening (after 5pm)">Evening (after 5pm)</option>
                    </select>
                  </div>
                </div>
                <fieldset className="choice-fieldset">
                  <legend className="field-label">
                    Status of other party <span aria-hidden="true">*</span>
                  </legend>
                  <div className="choice-grid">
                    {[
                      ['AWARE', 'Other party is aware'],
                      ['AGREED', 'Other party has agreed'],
                      ['UNAWARE', 'Other party is unaware'],
                    ].map(([value, label]) => (
                      <label className="choice-option" key={value}>
                        <input
                          type="radio"
                          name="otherPartyStatus"
                          value={value}
                          checked={formik.values.otherPartyStatus === value}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          aria-invalid={Boolean(showFieldError('otherPartyStatus'))}
                          aria-describedby="otherPartyStatus-error"
                          required
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                  <FieldError id="otherPartyStatus-error">
                    {showFieldError('otherPartyStatus')}
                  </FieldError>
                </fieldset>

                <fieldset className="choice-fieldset">
                  <legend className="field-label">
                    Consultation preference <span aria-hidden="true">*</span>
                  </legend>
                  <div className="choice-grid choice-grid-two">
                    {[
                      ['PHYSICAL', 'Physical mediation'],
                      ['VIRTUAL', 'Virtual mediation'],
                    ].map(([value, label]) => (
                      <label className="choice-option" key={value}>
                        <input
                          type="radio"
                          name="consultationPreference"
                          value={value}
                          checked={formik.values.consultationPreference === value}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          aria-invalid={Boolean(showFieldError('consultationPreference'))}
                          aria-describedby="consultationPreference-error"
                          required
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                  <FieldError id="consultationPreference-error">
                    {showFieldError('consultationPreference')}
                  </FieldError>
                </fieldset>
              </section>
            )}

            {step === 3 && (
              <section className="form-step">
                <p className="step-kicker">Step 3 of 4 - Crucial safeguard</p>
                <h2>Is mediation appropriate right now?</h2>
                <p className="step-description">
                  Please identify any of the following circumstances. This
                  screening helps us avoid routing situations that may require
                  specialized support.
                </p>

                <div className="safety-list">
                  {safetyConditions.map((condition) => (
                    <label className="checkbox-row" key={condition}>
                      <input
                        type="checkbox"
                        name="safetyFlags"
                        value={condition}
                        checked={activeSafetyFlags.includes(condition)}
                        onChange={formik.handleChange}
                      />
                      <span>{condition}</span>
                    </label>
                  ))}
                </div>

                {hasSafetyConcern && (
                  <div className="safety-stop" role="alert">
                    <strong>Specialized intervention is recommended</strong>
                    <p>
                      Based on your selections, this dispute requires
                      specialized intervention. Please contact our offices
                      directly for private human consultation or seek formal
                      legal representation.
                    </p>
                  </div>
                )}
              </section>
            )}

            {step === 4 && (
              <section className="form-step">
                <p className="step-kicker">Step 4 of 4</p>
                <h2>A brief description</h2>
                <p className="step-description">
                  Keep this summary short and non-confidential. Please do not
                  include names of other parties or sensitive case details.
                </p>

                <label className="field-label" htmlFor="description">
                  Brief, non-confidential description{' '}
                  <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  maxLength={1000}
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  aria-invalid={Boolean(showFieldError('description'))}
                  aria-describedby="description-count description-error"
                  placeholder="In a few sentences, describe the general nature of the dispute."
                />
                <div className="textarea-meta">
                  <FieldError id="description-error">
                    {showFieldError('description')}
                  </FieldError>
                  <span id="description-count">
                    {formik.values.description.length}/1000
                  </span>
                </div>

                <div className="confidentiality-warning" role="note">
                  <strong>PLEASE PROVIDE PRELIMINARY DETAILS ONLY</strong>
                  <p>
                    Please provide preliminary details only. Do not upload or
                    transmit sensitive legal evidence or confidential documents
                    through this form.
                  </p>
                </div>

                {submitError && (
                  <div className="submit-error" role="alert">
                    {submitError}
                  </div>
                )}
              </section>
            )}

            <div className="wizard-actions">
              {step > 1 && (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setStep((currentStep) => currentStep - 1)
                    setSubmitError('')
                  }}
                  disabled={formik.isSubmitting}
                >
                  Back
                </button>
              )}
              <span className="action-spacer" />
              {step < 3 && (
                <button
                  type="button"
                  className="button button-primary"
                  onClick={continueToNextStep}
                >
                  Continue
                </button>
              )}
              {step === 3 && !hasSafetyConcern && (
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setStep(4)}
                >
                  Continue to final details
                </button>
              )}
              {step === 4 && (
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={formik.isSubmitting || hasSafetyConcern}
                  aria-busy={formik.isSubmitting}
                  ref={submitButtonRef}
                >
                  {formik.isSubmitting ? (
                    <>
                      <span className="button-spinner" aria-hidden="true" />
                      Submitting request...
                    </>
                  ) : (
                    'Submit Mediation Request'
                  )}
                </button>
              )}
            </div>
          </form>
        </FormikProvider>
      </section>

      <p className="page-footer">
        This form is for preliminary triage only and does not create a
        mediator-client relationship.
      </p>
    </main>
  )
}

interface ConsultancyEnquiryValues {
  organizationName: string
  contactName: string
  contactRole: string
  email: string
  phone: string
  county: string
  requestDetails: string
}

const initialConsultancyValues: ConsultancyEnquiryValues = {
  organizationName: '',
  contactName: '',
  contactRole: '',
  email: '',
  phone: '',
  county: '',
  requestDetails: '',
}

function ConsultancyEnquiries() {
  const [values, setValues] = useState(initialConsultancyValues)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [referenceId, setReferenceId] = useState('')

  function updateField(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.currentTarget
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function submitEnquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError('')

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/consultancy-enquiries`,
        {
          organizationName: values.organizationName.trim(),
          contactName: values.contactName.trim(),
          contactRole: values.contactRole.trim() || undefined,
          email: values.email.trim() || undefined,
          phone: values.phone.trim() || undefined,
          county: values.county.trim() || undefined,
          requestDetails: values.requestDetails.trim(),
        },
      )

      if (typeof response.data.id !== 'string' || !response.data.id) {
        throw new Error('The server did not return a reference ID.')
      }

      setReferenceId(response.data.id)
      setValues(initialConsultancyValues)
    } catch {
      setSubmitError(
        'We could not submit your consultancy enquiry. Please try again later or contact our offices directly.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="page-shell">
      <header className="page-heading consultancy-page-heading">
        <div>
          <p className="eyebrow">Kestone Consultancy</p>
          <h1>Institutional &amp; Corporate Enquiry</h1>
          <p>
            Tell us how your organization would like to explore mediation,
            facilitation, or conflict-management support.
          </p>
        </div>
        <img
          src={corporateConsultancyImage}
          alt="Colleagues discussing an organizational matter around a conference table"
        />
      </header>

      {referenceId ? (
        <section className="success-card" role="status">
          <h1>Enquiry received</h1>
          <p>
            Thank you. Your preliminary consultancy enquiry has been recorded.
            Reference: <strong>{referenceId}</strong>
          </p>
          <p>Our team will follow up using the contact details you provided.</p>
        </section>
      ) : (
        <section className="wizard-card">
          <form className="wizard-form form-step" onSubmit={submitEnquiry}>
            <h2>Organization details</h2>
            <p className="step-description">
              Provide preliminary, non-confidential information. Fields marked
              with * are required.
            </p>
            <div className="form-grid">
              <div>
                <label className="field-label" htmlFor="organizationName">
                  Organization name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="organizationName"
                  name="organizationName"
                  value={values.organizationName}
                  onChange={updateField}
                  autoComplete="organization"
                  minLength={2}
                  maxLength={200}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="contactName">
                  Contact person <span aria-hidden="true">*</span>
                </label>
                <input
                  id="contactName"
                  name="contactName"
                  value={values.contactName}
                  onChange={updateField}
                  autoComplete="name"
                  minLength={2}
                  maxLength={150}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="contactRole">
                  Role or title
                </label>
                <input
                  id="contactRole"
                  name="contactRole"
                  value={values.contactRole}
                  onChange={updateField}
                  maxLength={120}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="consultancyEmail">
                  Email
                </label>
                <input
                  id="consultancyEmail"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={updateField}
                  autoComplete="email"
                  maxLength={254}
                  required={!values.phone}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="consultancyPhone">
                  Phone
                </label>
                <input
                  id="consultancyPhone"
                  name="phone"
                  type="tel"
                  value={values.phone}
                  onChange={updateField}
                  autoComplete="tel"
                  minLength={7}
                  maxLength={40}
                  required={!values.email}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="consultancyCounty">
                  County or location
                </label>
                <input
                  id="consultancyCounty"
                  name="county"
                  value={values.county}
                  onChange={updateField}
                  maxLength={100}
                />
              </div>
            </div>
            <label className="field-label" htmlFor="requestDetails">
              How can we support your organization?{' '}
              <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="requestDetails"
              name="requestDetails"
              rows={5}
              minLength={2}
              maxLength={2000}
              value={values.requestDetails}
              onChange={updateField}
              required
            />
            <div className="confidentiality-warning" role="note">
              <strong>PRELIMINARY INFORMATION ONLY</strong>
              <p>
                Never submit or upload sensitive, confidential evidence, legal
                documents, or private case details through this form.
              </p>
            </div>
            {submitError && (
              <div className="submit-error" role="alert">
                {submitError}
              </div>
            )}
            <div className="wizard-actions">
              <button
                type="submit"
                className="button button-primary"
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting
                  ? 'Submitting enquiry...'
                  : 'Submit Consultancy Enquiry'}
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  )
}

interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
  onBlur: React.FocusEventHandler<HTMLInputElement>
  error?: string
  type?: string
  placeholder?: string
  autoComplete?: string
  required?: boolean
}

function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  type = 'text',
  placeholder,
  autoComplete,
  required = false,
}: TextFieldProps) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        required={required}
      />
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  )
}

function FieldError({
  children,
  id,
}: {
  children: React.ReactNode
  id?: string
}) {
  if (!children) return null
  return (
    <span className="field-error" id={id} role="alert">
      {children}
    </span>
  )
}

const practiceAreas = [
  {
    icon: 'property',
    image: landSurveyImage,
    imageAlt: 'A family and surveyor reviewing a land plot boundary',
    title: 'Land & Property Mediation',
    label: 'Flagship practice',
    description:
      'A structured, impartial space to address land, property, tenancy, and real estate disagreements.',
    href: '#contact',
  },
  {
    icon: 'civil',
    image: facilitatedConflictImage,
    imageAlt: 'Two people discussing a disagreement in a facilitated meeting',
    title: 'Civil & Contractual Disputes',
    description:
      'Facilitated conversations for civil matters, service disagreements, and contractual concerns.',
    href: '#contact',
  },
  {
    icon: 'business',
    image: commercialMediationImage,
    imageAlt: 'Business representatives meeting to discuss a commercial agreement',
    title: 'Commercial & Business Disputes',
    description:
      'Practical dispute resolution that supports business relationships and forward-looking outcomes.',
    href: '#consultancy',
  },
  {
    icon: 'family',
    image: familyMediationImage,
    imageAlt: 'A mediator listening as family members discuss an issue',
    title: 'Family, Matrimonial & Succession',
    description:
      'Respectful dialogue for family matters, with care for relationships and individual perspectives.',
    href: '#contact',
  },
]

const principles = [
  {
    icon: 'balance',
    title: 'Impartiality',
    description: 'A balanced process where every party has space to be heard.',
  },
  {
    icon: 'lock',
    title: 'Confidentiality',
    description: 'A private, carefully managed setting for constructive dialogue.',
  },
  {
    icon: 'badge',
    title: 'Professionalism',
    description: 'Thoughtful preparation, clear process, and respectful facilitation.',
  },
  {
    icon: 'access',
    title: 'Accessible options',
    description: 'Physical and virtual engagement options to suit the parties.',
  },
  {
    icon: 'solution',
    title: 'Practical solutions',
    description: 'Keep attention on workable next steps and durable agreements.',
  },
]

const mediationSteps = [
  {
    number: '01',
    title: 'Enquiry & Initial Consultation',
    description: 'We listen to the broad outline and explain the mediation process.',
  },
  {
    number: '02',
    title: 'Preliminary Assessment',
    description: 'We consider suitability, needs, and an appropriate way forward.',
  },
  {
    number: '03',
    title: 'Invitation & Mediator Appointment',
    description: 'With appropriate consent, parties are invited and a mediator is appointed.',
  },
  {
    number: '04',
    title: 'Mediation & Possible Agreement',
    description: 'Parties work through issues and document any agreement reached.',
  },
]

const resourceCategories = [
  'All topics',
  'Land Disputes',
  'Commercial Law',
  'Mediation vs Litigation',
  'Articles',
] as const

type ResourceCategory = (typeof resourceCategories)[number]

const legalFrameworks = [
  {
    title: 'Constitution of Kenya',
    reference: 'Article 159(2)(c)',
    category: 'Constitutional foundation',
    icon: 'balance',
    summary:
      'Recognizes the promotion of alternative forms of dispute resolution, including reconciliation, mediation, arbitration, and traditional dispute resolution mechanisms, subject to constitutional safeguards.',
  },
  {
    title: 'Civil Procedure Act & Rules',
    reference: 'Order 46',
    category: 'Civil procedure',
    icon: 'civil',
    summary:
      'Provides a court-connected framework for reference of matters to arbitration and other dispute resolution processes. The applicable procedure depends on the matter and court directions.',
  },
  {
    title: 'Land Act & Land Registration Act',
    reference: '2012',
    category: 'Land framework',
    icon: 'property',
    summary:
      'Set out key rules for land administration, dealings, registration, and rights. A dispute’s facts and the relevant statutory provisions determine the appropriate process.',
  },
  {
    title: 'Sectional Properties Act',
    reference: '2020',
    category: 'Property framework',
    icon: 'property',
    summary:
      'Establishes a framework for ownership and management of units in sectional properties, including the role of corporations and shared property arrangements.',
  },
  {
    title: 'Matrimonial Property & Marriage Acts',
    reference: '2013 & 2014',
    category: 'Family framework',
    icon: 'family',
    summary:
      'Provide statutory context for marriage and matrimonial property matters. Individual rights and outcomes depend on the circumstances and applicable law.',
  },
]

const resourceArticles: {
  title: string
  category: Exclude<ResourceCategory, 'All topics'>
  readTime: string
  published: string
  excerpt: string
  body: string
  icon: string
  image: string
  imageAlt: string
}[] = [
  {
    title: 'Why mediation can be effective in resolving land disputes in Kenya',
    category: 'Land Disputes',
    readTime: '5 min read',
    published: '06 Nov 2026',
    excerpt:
      'Land disagreements can involve long-standing relationships and practical needs. A structured conversation can help parties identify issues, clarify interests, and consider options together.',
    body:
      'A facilitated discussion can give parties space to identify the practical issues beneath a land disagreement, such as access, boundaries, use, or a continuing relationship. Each participant can consider possible options without being required to accept an outcome. Suitability varies; complex rights, urgent deadlines, or safety concerns call for independent professional guidance.',
    icon: 'property',
    image: landSurveyImage,
    imageAlt: 'A family and surveyor reviewing a land plot',
  },
  {
    title: 'Mediation and litigation: understanding the difference',
    category: 'Mediation vs Litigation',
    readTime: '4 min read',
    published: '06 Nov 2026',
    excerpt:
      'A concise overview of how mediation differs from court proceedings, including party participation, decision-making, privacy considerations, and when independent legal advice matters.',
    body:
      'In mediation, an impartial mediator supports discussion while the parties retain control over whether to reach an agreement. In litigation, a court determines the issues presented under the applicable law and procedure. The processes are not interchangeable in every circumstance. Parties should seek independent legal advice about their rights, deadlines, and available options.',
    icon: 'balance',
    image: virtualMediationImage,
    imageAlt: 'A lawyer joining a virtual consultation from an office',
  },
  {
    title: 'Constructive conversations in commercial disagreements',
    category: 'Commercial Law',
    readTime: '6 min read',
    published: '06 Nov 2026',
    excerpt:
      'Businesses may need to address both the immediate dispute and an ongoing working relationship. Preparation and clear communication can support a focused discussion.',
    body:
      'Commercial discussions may involve payment, delivery, performance, or expectations about future work. A structured process can help participants separate the issues, clarify what information they need, and explore workable next steps. Any resolution remains voluntary and should be reviewed with appropriate professional advisers.',
    icon: 'business',
    image: commercialMediationImage,
    imageAlt: 'Business representatives discussing a commercial agreement',
  },
  {
    title: 'Preparing for a first mediation conversation',
    category: 'Articles',
    readTime: '3 min read',
    published: '06 Nov 2026',
    excerpt:
      'Learn what to expect from an initial discussion, what non-confidential information may be useful, and why mediation remains voluntary.',
    body:
      'A first conversation can focus on the broad nature of the disagreement, who is involved, and what each person hopes to resolve. Share only preliminary, non-confidential information. Do not send evidence, title deeds, legal documents, or sensitive case histories through an open enquiry form. An initial discussion does not guarantee that mediation is suitable or that parties will reach agreement.',
    icon: 'civil',
    image: mediationAgreementImage,
    imageAlt: 'Participants concluding a facilitated meeting with an agreement',
  },
]

function LineIcon({ name }: { name: string }) {
  const common = {
    'aria-hidden': true as const,
    fill: 'none',
    height: 28,
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.7,
    viewBox: '0 0 32 32',
    width: 28,
  }

  const paths: Record<string, React.ReactNode> = {
    property: (
      <>
        <path d="m4 14 12-10 12 10" />
        <path d="M7 13v15h18V13M12 28V18h8v10" />
        <path d="M3 29h26" />
      </>
    ),
    civil: (
      <>
        <path d="M6 5h20v22H6zM10 10h12M10 15h12M10 20h8" />
        <path d="m20 24 2 2 5-6" />
      </>
    ),
    business: (
      <>
        <path d="M4 27h24M7 27V12h7v15M18 27V5h7v22" />
        <path d="M9 16h3M9 20h3M20 10h3M20 14h3M20 18h3" />
      </>
    ),
    family: (
      <>
        <circle cx="11" cy="10" r="4" />
        <circle cx="22" cy="12" r="3" />
        <path d="M3 27v-3a8 8 0 0 1 16 0v3M19 20a6 6 0 0 1 10 4v3h-5" />
      </>
    ),
    balance: (
      <>
        <path d="M16 5v22M8 27h16M8 8h16" />
        <path d="m8 8-5 9h10L8 8ZM24 8l-5 9h10l-5-9Z" />
        <path d="M11 5h10" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="13" width="22" height="16" rx="3" />
        <path d="M10 13V9a6 6 0 0 1 12 0v4M16 19v4" />
      </>
    ),
    badge: (
      <>
        <circle cx="16" cy="13" r="9" />
        <path d="m11 21-1 8 6-3 6 3-1-8M12 13l3 3 5-6" />
      </>
    ),
    access: (
      <>
        <circle cx="16" cy="6" r="3" />
        <path d="M5 12h22M16 9v8M16 17l-7 11M16 17l7 11M9 12l-4 8h8l-4-8ZM23 12l-4 8h8l-4-8Z" />
      </>
    ),
    solution: (
      <>
        <path d="M16 4a9 9 0 0 0-5.5 16.1c1 .8 1.5 1.5 1.5 2.9h8c0-1.4.5-2.1 1.5-2.9A9 9 0 0 0 16 4Z" />
        <path d="M12 27h8M13 30h6M16 8v5M13.5 10.5h5" />
      </>
    ),
  }

  return <svg {...common}>{paths[name] ?? paths.solution}</svg>
}

const propertyTopics = [
  {
    icon: 'property',
    title: 'Land Ownership & Occupation',
    summary:
      'Facilitated dialogue for people whose interests, use, or occupation of land overlap.',
    examples: [
      'Co-owner and shared ownership disagreements',
      'Boundary and access concerns',
      'Rights of way and use of land',
      'Family land and occupation disputes',
    ],
  },
  {
    icon: 'civil',
    title: 'Land Sale & Purchase',
    summary:
      'A structured setting for buyers, sellers, and related parties to discuss transaction concerns.',
    examples: [
      'Buyer and seller disagreements',
      'Purchase completion concerns',
      'Communication and expectation gaps',
      'Disagreements involving agents',
    ],
  },
  {
    icon: 'family',
    title: 'Landlord & Tenant',
    summary:
      'Support for landlords and tenants seeking a practical way to discuss rental or lease issues.',
    examples: [
      'Rent arrears and payment arrangements',
      'Security deposit disagreements',
      'Commercial lease concerns',
      'Repairs and maintenance issues',
    ],
  },
  {
    icon: 'business',
    title: 'Real Estate Development',
    summary:
      'Facilitated conversation around development expectations, timelines, and project-related concerns.',
    examples: [
      'Developer and purchaser off-plan disputes',
      'Construction delays and completion expectations',
      'Project communication concerns',
      'Handover and delivery disagreements',
    ],
  },
  {
    icon: 'access',
    title: 'Property Management',
    summary:
      'A neutral process for owners, managers, tenants, and service providers to address property operations.',
    examples: [
      'Rental accounting and reporting',
      'Service charge disagreements',
      'Caretaker and management concerns',
      'Communication about shared facilities',
    ],
  },
  {
    icon: 'solution',
    title: 'Commercial & Investment Property',
    summary:
      'Dialogue for parties with shared commercial property or investment interests.',
    examples: [
      'Joint property investment disagreements',
      'Real estate partnership concerns',
      'Shared obligations and decision-making',
      'Commercial property use and management',
    ],
  },
]

function PropertyPracticeArea({
  onNavigate,
}: {
  onNavigate: (page: AppPage) => void
}) {
  return (
    <main className="property-page">
      <header className="property-hero">
        <div className="hero-pattern" aria-hidden="true" />
        <img
          className="property-hero-image"
          src={landDocumentImage}
          alt=""
          aria-hidden="true"
        />
        <div className="home-container property-hero-content">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <a href="#home" onClick={() => onNavigate('home')}>
              Home
            </a>
            <span aria-hidden="true">/</span>
            <a href="#practice-areas" onClick={() => onNavigate('home')}>
              Practice Areas
            </a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Land &amp; Property</span>
          </nav>
          <p className="home-eyebrow">Flagship practice area</p>
          <h1>Land, Property &amp; Real Estate Mediation</h1>
          <p>
            A neutral, structured space to discuss property-related
            disagreements and explore practical next steps.
          </p>
        </div>
        <div className="hero-ornament property-hero-ornament" aria-hidden="true">
          <div className="ornament-ring ornament-ring-one" />
          <div className="ornament-ring ornament-ring-two" />
          <span className="ornament-center">
            <LineIcon name="property" />
          </span>
        </div>
      </header>

      <section className="property-overview home-section">
        <div className="home-container property-overview-grid">
          <div>
            <p className="home-eyebrow home-eyebrow-gold">Property mediation</p>
            <h2>Make room for a constructive property conversation.</h2>
            <p>
              Kestone facilitates dialogue among owners, developers, landlords,
              tenants, buyers, and sellers. A mediator helps participants
              clarify the issues, hear each other’s perspectives, and consider
              options in a structured setting.
            </p>
            <p>
              The process is impartial and voluntary. The parties retain
              control over whether they reach an agreement and what that
              agreement says.
            </p>
          </div>

          <aside className="property-sidebar" aria-label="Property mediation resources">
            <div className="property-cta-card">
              <span className="property-cta-icon" aria-hidden="true">
                <LineIcon name="solution" />
              </span>
              <p className="home-eyebrow">Start a conversation</p>
              <h2>Need Assistance with a Property Dispute?</h2>
              <p>
                Send a preliminary enquiry to discuss suitability and possible
                next steps.
              </p>
              <button
                type="button"
                className="home-button home-button-gold"
                onClick={() => onNavigate('enquiries')}
              >
                Request a Consultation <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
            <a
              className="property-guide-link"
              href="/property-mediation-guide.pdf"
              download
            >
              <span className="guide-icon" aria-hidden="true">
                <svg
                  fill="none"
                  height="28"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                  viewBox="0 0 28 28"
                  width="28"
                >
                  <path d="M7 3h10l5 5v17H7zM17 3v6h5M10 14h9M10 18h9M10 22h6" />
                </svg>
              </span>
              <span>
                <strong>Download Property Mediation Guide</strong>
                <small>PDF guide · General information</small>
              </span>
              <span className="guide-download" aria-hidden="true">
                &#8595;
              </span>
            </a>
          </aside>
        </div>
      </section>

      <section className="property-topics-section home-section">
        <div className="home-container">
          <div className="section-heading">
            <p className="home-eyebrow home-eyebrow-gold">
              Areas we can help explore
            </p>
            <h2>Property matters take many forms.</h2>
            <p>
              These examples are illustrative. Each enquiry is considered on
              its own circumstances and suitability.
            </p>
          </div>
          <div className="property-topics-grid">
            {propertyTopics.map((topic, index) => (
              <details className="property-topic-card" key={topic.title}>
                <summary>
                  <span className="property-topic-icon">
                    <LineIcon name={topic.icon} />
                  </span>
                  <span className="property-topic-title-wrap">
                    <span className="property-topic-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="property-topic-title">{topic.title}</span>
                  </span>
                  <span className="accordion-indicator" aria-hidden="true">
                    +
                  </span>
                </summary>
                <div className="property-topic-content">
                  <p>{topic.summary}</p>
                  <ul>
                    {topic.examples.map((example) => (
                      <li key={example}>{example}</li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="property-bottom-cta">
        <div className="home-container property-bottom-cta-inner">
          <div>
            <p className="home-eyebrow">A preliminary first step</p>
            <h2>Explore whether mediation may be suitable.</h2>
            <p>
              Share only a brief, non-confidential outline through the enquiry
              form. Do not upload evidence or legal documents.
            </p>
          </div>
          <button
            className="home-button home-button-gold"
            type="button"
            onClick={() => onNavigate('enquiries')}
          >
            Request Mediation <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </section>
      <footer className="property-footer">
        <div className="home-container">
          Kestone provides mediation services and does not replace independent
          legal advice.
        </div>
      </footer>
    </main>
  )
}

function HomePage({
  onNavigate,
}: {
  onNavigate: (page: AppPage) => void
}) {
  const [resourceSearch, setResourceSearch] = useState('')
  const [resourceCategory, setResourceCategory] =
    useState<ResourceCategory>('All topics')
  const filteredArticles = resourceArticles.filter((article) => {
    const matchesCategory =
      resourceCategory === 'All topics' || article.category === resourceCategory
    const searchText =
      `${article.title} ${article.category} ${article.excerpt}`.toLowerCase()
    return matchesCategory && searchText.includes(resourceSearch.trim().toLowerCase())
  })

  return (
    <>
      <header
        className="home-hero"
        id="home"
        style={{
          backgroundImage: `linear-gradient(90deg, rgb(7 26 46 / 96%) 0%, rgb(10 37 64 / 86%) 48%, rgb(10 37 64 / 45%) 100%), url("${mediationHero}")`,
        }}
      >
        <div className="hero-pattern" aria-hidden="true" />
        <div className="home-container hero-layout">
          <FadeIn
            as="div"
            className="hero-content"
            trigger="mount"
            staggerChildren={0.1}
          >
            <FadeIn as="p" className="home-eyebrow" trigger="parent">
              Kestone Mediation Centre &amp; Consultancy
            </FadeIn>
            <FadeIn as="div" trigger="parent">
              <h1>Disputes Deserve Solutions, Not Endless Conflict.</h1>
            </FadeIn>
            <FadeIn as="p" className="hero-subtitle" trigger="parent">
              Professional mediation and consultancy services in property,
              real estate, civil, commercial, family and institutional disputes.
            </FadeIn>
            <FadeIn as="div" className="hero-actions" trigger="parent">
              <button
                className="home-button home-button-gold"
                type="button"
                onClick={() => onNavigate('enquiries')}
              >
                Request a Mediation Consultation
                <span aria-hidden="true">&rarr;</span>
              </button>
              <a className="home-button home-button-outline" href="#services">
                Explore Our Services
              </a>
            </FadeIn>
            <FadeIn as="div" className="hero-assurance" trigger="parent">
              <span className="assurance-mark" aria-hidden="true">
                &#10003;
              </span>
              Impartial facilitation <span aria-hidden="true">&middot;</span>{' '}
              Practical pathways forward
            </FadeIn>
          </FadeIn>
        </div>
        <div className="hero-marquee" aria-label="Mediation, consultancy, training">
          <div className="hero-marquee-track">
            <div className="hero-marquee-group">
              <span>Mediation</span>
              <i aria-hidden="true" />
              <span>Consultancy</span>
              <i aria-hidden="true" />
              <span>Training</span>
              <i aria-hidden="true" />
              <span>Connecting Parties. Creating Solutions.</span>
              <i aria-hidden="true" />
            </div>
            <div className="hero-marquee-group" aria-hidden="true">
              <span>Mediation</span>
              <i />
              <span>Consultancy</span>
              <i />
              <span>Training</span>
              <i />
              <span>Connecting Parties. Creating Solutions.</span>
              <i />
            </div>
          </div>
        </div>
        <a className="hero-scroll" href="#about">
          <span aria-hidden="true">&darr;</span> Discover Kestone
        </a>
      </header>

      <main>
        <section className="home-section introduction-section" id="about">
          <div className="home-container introduction-grid">
            <div className="introduction-copy">
              <p className="home-eyebrow home-eyebrow-gold">A better way forward</p>
              <h2>Dialogue can open the door to meaningful solutions.</h2>
              <p>
                At Kestone Mediation Centre &amp; Consultancy, we believe that
                meaningful solutions begin with dialogue. We provide a
                considered, impartial setting where parties can be heard,
                understand the issues, and explore a constructive way forward.
              </p>
              <a className="text-link" href="#process">
                Discover our approach <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
            <div className="introduction-points">
              <article className="introduction-point">
                <span className="point-number">01</span>
                <div>
                  <h3>Impartial facilitation</h3>
                  <p>A balanced process that gives each participant a voice.</p>
                </div>
              </article>
              <article className="introduction-point">
                <span className="point-number">02</span>
                <div>
                  <h3>Structured engagement</h3>
                  <p>Clear stages designed to help parties work through issues.</p>
                </div>
              </article>
              <article className="introduction-point">
                <span className="point-number">03</span>
                <div>
                  <h3>Broad practice experience</h3>
                  <p>Support across property, civil, commercial, and family matters.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="home-section practice-section" id="services">
          <div className="home-container">
            <div className="section-heading">
              <p className="home-eyebrow home-eyebrow-gold">What we do</p>
              <h2>Mediation for the matters that move life and business.</h2>
              <p>
                A thoughtful process tailored to the people, relationships, and
                issues involved.
              </p>
            </div>
            <FadeIn
              as="div"
              className="practice-grid"
              id="practice-areas"
              staggerChildren={0.12}
            >
              {practiceAreas.map((area) => (
                <FadeIn
                  as="article"
                  className="practice-card"
                  key={area.title}
                  trigger="parent"
                >
                  <img
                    className="practice-card-image"
                    src={area.image}
                    alt={area.imageAlt}
                    loading="lazy"
                  />
                  <div className="practice-icon">
                    <LineIcon name={area.icon} />
                  </div>
                  {area.label && <span className="practice-label">{area.label}</span>}
                  <h3>{area.title}</h3>
                  <p>{area.description}</p>
                  <a
                    className="text-link"
                    href={area.title === 'Land & Property Mediation' ? '#land-property' : area.href}
                    onClick={
                      area.title === 'Land & Property Mediation'
                        ? (event) => {
                            event.preventDefault()
                            onNavigate('property')
                          }
                        : undefined
                    }
                  >
                    Read More <span aria-hidden="true">&rarr;</span>
                  </a>
                </FadeIn>
              ))}
            </FadeIn>
          </div>
        </section>

        <section
          className="home-section court-annexed-section"
          id="court-annexed-mediation"
          aria-labelledby="court-annexed-title"
        >
          <div className="home-container court-annexed-layout">
            <FadeIn className="court-annexed-copy">
              <p className="home-eyebrow home-eyebrow-gold">
                Supporting access to justice
              </p>
              <h2 id="court-annexed-title">Court-Annexed Mediation</h2>
              <p>
                Court-annexed mediation is an important part of Kenya’s justice
                system and offers an alternative to resolving suitable disputes
                solely through the conventional adversarial court process. In
                appropriate court-referred matters, mediation provides a
                structured, impartial and confidential setting for parties to
                explore common ground, address differences and work towards
                mutually acceptable settlements.
              </p>
              <p>
                The framework is grounded in Article 159(2)(c) of the
                Constitution of Kenya, 2010, which recognises reconciliation,
                mediation, arbitration and other forms of alternative dispute
                resolution. Sections 59A–59D of the Civil Procedure Act, Cap.
                21, provide a statutory framework for mediation, including the
                Mediation Accreditation Committee.
              </p>
              <p>
                Court referral may give parties an opportunity to participate
                actively in resolving their dispute, promote access to justice,
                reduce avoidable litigation delays and preserve relationships
                where possible. Referral and suitability remain subject to the
                court’s directions and applicable requirements.
              </p>
              <a
                className="home-button home-button-gold court-annexed-cta"
                href="#contact"
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate('enquiries')
                }}
              >
                Request a Consultation <span aria-hidden="true">&rarr;</span>
              </a>
            </FadeIn>
            <FadeIn className="court-annexed-safeguards" delay={0.12}>
              <img
                className="court-annexed-image"
                src={courtAnnexedImage}
                alt="Participants in a Kenyan dispute-resolution workshop"
                loading="lazy"
              />
              <p className="court-annexed-card-kicker">Our commitments</p>
              <h3>A fair, party-led process.</h3>
              <ul>
                <li>Impartiality and procedural fairness</li>
                <li>Party self-determination and good faith</li>
                <li>Confidentiality, subject to applicable law</li>
                <li>
                  Where court-annexed matters are undertaken, mediators will be
                  duly accredited and appointed in accordance with applicable
                  legal and Judiciary requirements.
                </li>
              </ul>
              <p className="court-annexed-note">
                Our objective is to complement the administration of justice
                through consensual, efficient and sustainable dispute
                resolution.
              </p>
            </FadeIn>
          </div>
        </section>

        <section className="home-section why-section" id="why-kestone">
          <div className="home-container">
            <div className="section-heading section-heading-light">
              <p className="home-eyebrow">The Kestone difference</p>
              <h2>A process built around people and progress.</h2>
            </div>
            <FadeIn
              as="div"
              className="principle-grid"
              staggerChildren={0.1}
            >
              {principles.map((principle) => (
                <FadeIn
                  as="article"
                  className="principle-card"
                  key={principle.title}
                  trigger="parent"
                >
                  <div className="principle-icon">
                    <LineIcon name={principle.icon} />
                  </div>
                  <h3>{principle.title}</h3>
                  <p>{principle.description}</p>
                </FadeIn>
              ))}
            </FadeIn>
          </div>
        </section>

        <section className="home-section process-section" id="process">
          <div className="home-container">
            <div className="section-heading">
              <p className="home-eyebrow home-eyebrow-gold">Our process</p>
              <h2>Four considered steps towards resolution.</h2>
              <p>
                We guide parties through a clear process while keeping
                participation informed and voluntary.
              </p>
            </div>
            <FadeIn
              as="ol"
              className="process-timeline"
              staggerChildren={0.14}
            >
              {mediationSteps.map((step) => (
                <FadeIn
                  as="li"
                  className="process-step"
                  key={step.number}
                  trigger="parent"
                >
                  <span className="process-number">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </FadeIn>
              ))}
            </FadeIn>
          </div>
        </section>

        <section className="academy-callout" id="academy">
          <div className="home-container academy-callout-inner">
            <div>
              <p className="home-eyebrow">Kestone Academy</p>
              <h2>Developing Skills. Building Competence. Promoting Resolution.</h2>
              <p>
                Explore professional mediation training designed to strengthen
                practical skills and promote constructive resolution.
              </p>
            </div>
            <button
              className="home-button home-button-gold"
              type="button"
              onClick={() => onNavigate('academy')}
            >
              Explore Kestone Academy <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </section>

        <section className="resources-page" id="resources">
          <header className="resources-hero">
            <div className="home-container resources-hero-inner">
              <p className="home-eyebrow">Knowledge, context, and practical tools</p>
              <h2>Resources &amp; Legal Framework</h2>
              <p>
                Explore key statutory context, practical articles, and
                downloadable resources for mediation and dispute resolution in
                Kenya.
              </p>
            </div>
          </header>

          <section className="resources-framework" aria-labelledby="framework-title">
            <div className="home-container">
              <div className="resources-heading">
                <div>
                  <p className="home-eyebrow home-eyebrow-gold">Kenyan context</p>
                  <h3 id="framework-title">Legal framework at a glance</h3>
                </div>
                <p>
                  These statutes provide important context. The relevant rules
                  depend on the facts of each matter; this overview is not legal
                  advice.
                </p>
              </div>
              <div className="framework-grid">
                {legalFrameworks.map((framework) => (
                  <details className="framework-card" key={framework.title}>
                    <summary>
                      <span className="framework-icon">
                        <LineIcon name={framework.icon} />
                      </span>
                      <span className="framework-title-wrap">
                        <small>{framework.category}</small>
                        <strong>{framework.title}</strong>
                        <span>{framework.reference}</span>
                      </span>
                      <span className="framework-expand" aria-hidden="true">+</span>
                    </summary>
                    <p>{framework.summary}</p>
                  </details>
                ))}
              </div>
              <p className="framework-disclaimer">
                Statutory references are provided for general information only.
                Consult a qualified legal professional for advice on your
                circumstances.
              </p>
            </div>
          </section>

          <section className="resources-articles" aria-labelledby="articles-title">
            <div className="home-container">
              <div className="resources-heading articles-heading">
                <div>
                  <p className="home-eyebrow home-eyebrow-gold">Insights &amp; guidance</p>
                  <h3 id="articles-title">Knowledge base</h3>
                </div>
                <p>Browse practical perspectives on mediation and dispute resolution.</p>
              </div>
              <div className="article-controls">
                <label className="article-search">
                  <span className="sr-only">Search articles</span>
                  <span className="article-search-icon" aria-hidden="true">⌕</span>
                  <input
                    type="search"
                    value={resourceSearch}
                    onChange={(event) => setResourceSearch(event.target.value)}
                    placeholder="Search articles and topics"
                  />
                </label>
                <div className="article-filters" role="group" aria-label="Filter articles by category">
                  {resourceCategories.map((category) => (
                    <button
                      type="button"
                      key={category}
                      className={resourceCategory === category ? 'is-active' : ''}
                      aria-pressed={resourceCategory === category}
                      onClick={() => setResourceCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              {filteredArticles.length > 0 ? (
                <div className="article-grid" aria-live="polite">
                  {filteredArticles.map((article) => (
                    <article className="article-card" key={article.title}>
                      <div className={`article-art article-art-${article.icon}`}>
                        <img src={article.image} alt={article.imageAlt} loading="lazy" />
                        <span aria-hidden="true"><LineIcon name={article.icon} /></span>
                        <small aria-hidden="true">Kestone Insights</small>
                      </div>
                      <div className="article-card-body">
                        <span className="article-badge">{article.category}</span>
                        <h4>{article.title}</h4>
                        <div className="article-meta">
                          <span>{article.readTime}</span>
                          <span aria-hidden="true">·</span>
                          <time dateTime="2026-11-06">{article.published}</time>
                        </div>
                        <p>{article.excerpt}</p>
                        <details className="article-read-more">
                          <summary>Read article <span aria-hidden="true">&rarr;</span></summary>
                          <p>{article.body}</p>
                        </details>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="article-empty" role="status">
                  <h4>No matching articles</h4>
                  <p>Try another search phrase or select a different category.</p>
                </div>
              )}
            </div>
          </section>

          <section className="resource-hub" aria-labelledby="resource-hub-title">
            <div className="home-container">
              <div className="resources-heading">
                <div>
                  <p className="home-eyebrow home-eyebrow-gold">Practical downloads</p>
                  <h3 id="resource-hub-title">Resource hub</h3>
                </div>
                <p>Helpful starting points for learning about Kestone’s services.</p>
              </div>
              <div className="resource-card-grid">
                <article className="resource-download-card">
                  <span className="resource-file-icon" aria-hidden="true">PDF</span>
                  <div>
                    <p className="resource-file-type">Property mediation guide</p>
                    <h4>Land &amp; Property Mediation Guide</h4>
                    <p>Download an overview of property mediation topics and process.</p>
                  </div>
                  <a href="/property-mediation-guide.pdf" download>
                    Download PDF <span aria-hidden="true">&darr;</span>
                  </a>
                </article>
                <article className="resource-download-card">
                  <span className="resource-file-icon resource-file-icon-form" aria-hidden="true">
                    <LineIcon name="civil" />
                  </span>
                  <div>
                    <p className="resource-file-type">Preliminary enquiry</p>
                    <h4>Request Mediation</h4>
                    <p>Share basic, non-confidential details using the secure form fields.</p>
                  </div>
                  <button type="button" onClick={() => onNavigate('enquiries')}>
                    Open enquiry form <span aria-hidden="true">&rarr;</span>
                  </button>
                </article>
                <article className="resource-download-card">
                  <span className="resource-file-icon resource-file-icon-course" aria-hidden="true">
                    <LineIcon name="badge" />
                  </span>
                  <div>
                    <p className="resource-file-type">Learning programmes</p>
                    <h4>Training syllabi</h4>
                    <p>Browse published course outlines, entry requirements, and learning outcomes.</p>
                  </div>
                  <button type="button" onClick={() => onNavigate('academy')}>
                    Browse Academy <span aria-hidden="true">&rarr;</span>
                  </button>
                </article>
              </div>
              <p className="resource-safeguard">
                Do not send sensitive evidence, title deeds, confidential case
                histories, or legal documents through preliminary enquiry
                channels. Resources are for general information and do not
                replace independent legal advice.
              </p>
            </div>
          </section>
        </section>
      </main>

      <footer className="home-footer" id="contact">
        <div className="home-container">
          <div className="footer-grid">
            <div className="footer-about">
              <a className="footer-brand" href="#home">
                Kestone
              </a>
              <p className="footer-slogan">
                Connecting Parties. Creating Solutions.
              </p>
              <p>
                Kestone Mediation Centre &amp; Consultancy supports constructive
                dialogue through professional mediation and consultancy.
              </p>
            </div>
            <div>
              <h2>Practice areas</h2>
              <a href="#practice-areas">Land &amp; Property</a>
              <a href="#practice-areas">Civil &amp; Contractual</a>
              <a href="#practice-areas">Commercial &amp; Business</a>
              <a href="#practice-areas">Family &amp; Succession</a>
            </div>
            <div>
              <h2>Quick links</h2>
              <a href="#about">About Kestone</a>
              <a href="#services">Mediation Services</a>
              <button type="button" onClick={() => onNavigate('consultancy')}>
                Consultancy enquiry
              </button>
              <button type="button" onClick={() => onNavigate('academy')}>
                Kestone Academy
              </button>
              <a href="#process">Our Process</a>
              <a href="#resources">Resources</a>
            </div>
            <div id="consultancy">
              <h2>Contact</h2>
              <p>Kenya · In-person and virtual options</p>
              <p>
                Corporate or institutional request:{' '}
                <button type="button" onClick={() => onNavigate('consultancy')}>
                  Send a consultancy enquiry
                </button>
              </p>
              <p>
                Phone &amp; WhatsApp:{' '}
                <button type="button" onClick={() => onNavigate('enquiries')}>
                  Request a callback
                </button>
              </p>
              <p>
                Email:{' '}
                <button type="button" onClick={() => onNavigate('enquiries')}>
                  Send a preliminary enquiry
                </button>
              </p>
              <button
                className="footer-contact-button"
                type="button"
                onClick={() => onNavigate('enquiries')}
              >
                Request Consultation
              </button>
            </div>
          </div>
          <div className="footer-disclaimer">
            Kestone provides specialized mediation and consultancy services.
            These services do not replace independent legal advice. Mediation is
            voluntary, and outcomes depend on the parties.
          </div>
          <div className="footer-bottom">
            <span>&copy; {currentYear} Kestone Mediation Centre &amp; Consultancy</span>
            <span>Connecting Parties. Creating Solutions.</span>
          </div>
        </div>
      </footer>
    </>
  )
}

function App() {
  const [activePage, setActivePage] = useState<AppPage>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuToggleRef = useRef<HTMLButtonElement>(null)

  function navigateTo(page: AppPage) {
    setActivePage(page)
    setMenuOpen(false)
  }

  useEffect(() => {
    if (!menuOpen) return

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuToggleRef.current?.focus()
      }
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  return (
    <LazyMotion features={domAnimation}>
      <div className="app-shell">
        <nav className="site-navigation home-navigation" aria-label="Main navigation">
        <a
          className="site-brand"
          href="#home"
          aria-label="Kestone home"
          onClick={() => navigateTo('home')}
        >
          <span className="site-brand-mark">
            <img src={kestoneLogo} alt="" />
          </span>
          <span className="site-brand-name">
            <strong>Kestone</strong>
            <span>Mediation Centre &amp; Consultancy</span>
          </span>
        </a>
        <button
          className="navigation-menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation-links"
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
          ref={menuToggleRef}
        >
          <span />
          <span />
          <span />
        </button>
        <div
          className={`site-navigation-links${menuOpen ? ' is-open' : ''}`}
          id="primary-navigation-links"
        >
          <a
            href="#home"
            className={activePage === 'home' ? 'is-active' : ''}
            onClick={() => navigateTo('home')}
          >
            Home
          </a>
          <a href="#about" onClick={() => navigateTo('home')}>About Kestone</a>
          <a href="#services" onClick={() => navigateTo('home')}>Mediation Services</a>
          <button
            type="button"
            className={activePage === 'property' ? 'is-active' : ''}
            aria-current={activePage === 'property' ? 'page' : undefined}
            onClick={() => navigateTo('property')}
          >
            Practice Areas
          </button>
          <button
            type="button"
            className={activePage === 'consultancy' ? 'is-active' : ''}
            aria-current={activePage === 'consultancy' ? 'page' : undefined}
            onClick={() => navigateTo('consultancy')}
          >
            Consultancy
          </button>
          <button
            type="button"
            className={activePage === 'academy' ? 'is-active' : ''}
            aria-current={activePage === 'academy' ? 'page' : undefined}
            onClick={() => navigateTo('academy')}
          >
            Kestone Academy
          </button>
          <a href="#process" onClick={() => navigateTo('home')}>Our Process</a>
          <a href="#resources" onClick={() => navigateTo('home')}>Resources</a>
          <a href="#contact" onClick={() => navigateTo('home')}>Contact Us</a>
          <button
            type="button"
            className="menu-consultation-link"
            onClick={() => navigateTo('enquiries')}
          >
            Request Consultation
          </button>
        </div>
        <button
          className="navigation-cta"
          type="button"
          onClick={() => navigateTo('enquiries')}
        >
          Request Consultation
        </button>
        </nav>
        {activePage === 'home' && <HomePage onNavigate={setActivePage} />}
        {activePage === 'academy' && <Academy />}
        {activePage === 'enquiries' && <Enquiries />}
        {activePage === 'consultancy' && <ConsultancyEnquiries />}
        {activePage === 'property' && (
          <PropertyPracticeArea onNavigate={setActivePage} />
        )}
      </div>
    </LazyMotion>
  )
}

export default App
