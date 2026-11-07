import { randomUUID } from 'node:crypto'
import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import helmet from 'helmet'
import academyRegistrationsRouter from './routes/academy-registrations.js'
import academyRouter from './routes/academy.js'
import consultancyEnquiriesRouter from './routes/consultancy-enquiries.js'
import enquiriesRouter from './routes/enquiries.js'
import { sanitizeRequestBody } from './middleware/sanitize-body.js'
import { SECURITY_NOTICE } from './middleware/validation.js'

const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0)
if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0) {
  throw new Error('TRUST_PROXY_HOPS must be a non-negative integer.')
}

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', trustProxyHops)

app.use((_req, res, next) => {
  res.locals.requestId = randomUUID()
  res.setHeader('X-Request-ID', res.locals.requestId)
  next()
})
app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, !origin || allowedOrigins.includes(origin))
    },
  }),
)
app.use(express.json({ limit: '16kb', strict: true }))
app.use(sanitizeRequestBody)

app.get(['/health', '/api/health'], (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/api/enquiries', enquiriesRouter)
app.use('/api/academy', academyRouter)
app.use('/api/academy-registrations', academyRegistrationsRouter)
app.use('/api/consultancy-enquiries', consultancyEnquiriesRouter)

app.use((_req, res) => {
  res.status(404).json({
    error: 'Route not found.',
    warning: SECURITY_NOTICE,
  })
})

const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  const errorType =
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    typeof error.type === 'string'
      ? error.type
      : undefined
  const status =
    errorType === 'entity.too.large'
      ? 413
      : errorType === 'entity.parse.failed'
        ? 400
        : 500

  if (status === 500) {
    console.error(
      JSON.stringify({
        level: 'error',
        requestId: res.locals.requestId,
        error: error instanceof Error ? error.name : 'UnknownError',
      }),
    )
  }

  res.status(status).json({
    error:
      status === 413
        ? 'Request body exceeds the 16 KB limit.'
        : status === 400
          ? 'The request body must contain valid JSON.'
          : 'An unexpected server error occurred.',
    warning: SECURITY_NOTICE,
  })
}

app.use(errorHandler)

export default app
