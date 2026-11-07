import { waitUntil } from '@vercel/functions'
import nodemailer, { type Transporter } from 'nodemailer'

type SubmissionType = 'mediation enquiry' | 'academy registration' | 'consultancy enquiry'

interface NotificationSubmission {
  type: SubmissionType
  referenceId: string
  clientName: string
  clientEmail?: string | null
  contactEmail?: string | null
  phone?: string | null
  metadata: Record<string, string>
}

let transporter: Transporter | undefined

function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST?.trim()
  const port = Number(process.env.SMTP_PORT ?? 587)
  const from = process.env.EMAIL_FROM?.trim()
  const secureValue = process.env.SMTP_SECURE?.trim().toLowerCase()
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !from) {
    throw new Error('SMTP_HOST and EMAIL_FROM must be configured.')
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT must be a valid port number.')
  }
  if (secureValue && secureValue !== 'true' && secureValue !== 'false') {
    throw new Error('SMTP_SECURE must be true or false.')
  }
  if (Boolean(user) !== Boolean(pass)) {
    throw new Error('SMTP_USER and SMTP_PASSWORD must be configured together.')
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: secureValue === 'true',
    ...(user && pass ? { auth: { user, pass } } : {}),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })

  return transporter
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character] ?? character
  })
}

function notificationFields(submission: NotificationSubmission) {
  const fields: [string, string][] = [
    ['Reference', submission.referenceId],
    ['Name', submission.clientName],
    ['Email', submission.contactEmail ?? submission.clientEmail ?? 'Not provided'],
    ['Phone', submission.phone ?? 'Not provided'],
  ]
  fields.push(...Object.entries(submission.metadata))
  return fields
}

function emailLine(value: string) {
  return value.replace(/[\r\n\t]+/g, ' ').trim()
}

function logDeliveryFailure(
  submission: NotificationSubmission,
  notification: 'internal' | 'acknowledgement' | 'configuration',
  error?: unknown,
) {
  console.error(
    JSON.stringify({
      event: 'email_notification_failed',
      submissionType: submission.type,
      referenceId: submission.referenceId,
      notification,
      errorName: error instanceof Error ? error.name : 'ConfigurationError',
    }),
  )
}

async function sendSubmissionNotifications(submission: NotificationSubmission) {
  const mailer = getTransporter()
  const from = process.env.EMAIL_FROM?.trim()
  const adminEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || 'info@kestonemediation.com'
  const fields = notificationFields(submission)
  const text = fields
    .map(([label, value]) => `${emailLine(label)}: ${emailLine(value)}`)
    .join('\n')
  const html = `<dl>${fields
    .map(
      ([label, value]) =>
        `<dt><strong>${escapeHtml(label)}</strong></dt><dd>${escapeHtml(value)}</dd>`,
    )
    .join('')}</dl>`

  const deliveries: {
    notification: 'internal' | 'acknowledgement'
    message: Parameters<Transporter['sendMail']>[0]
  }[] = [
    {
      notification: 'internal',
      message: {
        from,
        to: adminEmail,
        subject: `New ${submission.type} received`,
        text: `A new preliminary ${submission.type} was received.\n\n${text}\n\nFree-text descriptions and notes are intentionally excluded from notification emails.`,
        html: `<p>A new preliminary ${escapeHtml(submission.type)} was received.</p>${html}<p>Free-text descriptions and notes are intentionally excluded from notification emails.</p>`,
      },
    },
  ]

  const acknowledgementEmail = submission.clientEmail?.trim()
  if (acknowledgementEmail) {
    deliveries.push({
      notification: 'acknowledgement',
      message: {
        from,
        to: acknowledgementEmail,
        subject: 'We have received your preliminary request',
        text: [
          `Dear ${submission.clientName},`,
          '',
          `Thank you for contacting Kestone Mediation Centre & Consultancy. We have received your preliminary ${submission.type}.`,
          `Reference: ${submission.referenceId}`,
          '',
          'Our team will review your request and follow up using the contact details you provided.',
          'Please do not reply with confidential case details or attach sensitive documents, evidence, or legal records.',
          '',
          'This acknowledgement does not confirm that mediation is suitable or guarantee an outcome.',
          '',
          'Kestone Mediation Centre & Consultancy',
        ].join('\n'),
        html: `<p>Dear ${escapeHtml(submission.clientName)},</p><p>Thank you for contacting Kestone Mediation Centre &amp; Consultancy. We have received your preliminary ${escapeHtml(submission.type)}.</p><p><strong>Reference:</strong> ${escapeHtml(submission.referenceId)}</p><p>Our team will review your request and follow up using the contact details you provided.</p><p>Please do not reply with confidential case details or attach sensitive documents, evidence, or legal records.</p><p>This acknowledgement does not confirm that mediation is suitable or guarantee an outcome.</p><p>Kestone Mediation Centre &amp; Consultancy</p>`,
      },
    })
  }

  await Promise.all(
    deliveries.map(async ({ notification, message }) => {
      try {
        await mailer.sendMail(message)
      } catch (error) {
        logDeliveryFailure(submission, notification, error)
      }
    }),
  )
}

export function notifySubmissionInBackground(submission: NotificationSubmission) {
  const delivery = Promise.resolve()
    .then(() => sendSubmissionNotifications(submission))
    .catch((error: unknown) =>
      logDeliveryFailure(submission, 'configuration', error),
    )

  if (process.env.VERCEL) {
    waitUntil(delivery)
  } else {
    void delivery
  }
}
