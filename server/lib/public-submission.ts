import type { Request, Response } from 'express'
import type { ZodType } from 'zod'
import { SECURITY_NOTICE } from '../middleware/validation.js'

const requestWindowMs = 15 * 60 * 1000
const requestLimit = 5
const requestsByAddress = new Map<string, { count: number; resetAt: number }>()

function sanitizeSubmissionValue(value: unknown): unknown {
  if (typeof value === 'string') {
    const withoutMarkup = value.replace(/<[^>]*>/g, '')
    return Array.from(withoutMarkup)
      .filter((character) => {
        const code = character.charCodeAt(0)
        return !(
          code <= 0x08 ||
          code === 0x0b ||
          code === 0x0c ||
          (code >= 0x0e && code <= 0x1f) ||
          code === 0x7f
        )
      })
      .join('')
      .normalize('NFC')
      .trim()
  }

  if (Array.isArray(value)) return value.map(sanitizeSubmissionValue)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        sanitizeSubmissionValue(item),
      ]),
    )
  }

  return value
}

function applyPublicHeaders(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')

  const origin = req.headers.origin
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
}

function getClientAddress(req: Request) {
  const vercelAddress = req.headers['x-real-ip']
  if (typeof vercelAddress === 'string' && vercelAddress.trim()) {
    return vercelAddress.trim()
  }

  return req.socket?.remoteAddress ?? 'unknown'
}

function takeSubmissionSlot(req: Request, res: Response) {
  const now = Date.now()
  for (const [address, entry] of requestsByAddress) {
    if (entry.resetAt <= now) requestsByAddress.delete(address)
  }

  const address = getClientAddress(req)
  const current = requestsByAddress.get(address)
  if (current && current.resetAt > now && current.count >= requestLimit) {
    res.setHeader(
      'Retry-After',
      String(Math.ceil((current.resetAt - now) / 1000)),
    )
    res.status(429).json({
      error: 'Too many submissions. Please try again later.',
      warning: SECURITY_NOTICE,
    })
    return false
  }

  if (!current || current.resetAt <= now) {
    requestsByAddress.set(address, {
      count: 1,
      resetAt: now + requestWindowMs,
    })
  } else {
    current.count += 1
  }

  return true
}

export function validatePublicSubmission<T>(
  req: Request,
  res: Response,
  schema: ZodType<T>,
): T | undefined {
  applyPublicHeaders(req, res)

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.status(204).end()
    return undefined
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'Method not allowed.' })
    return undefined
  }

  const contentType = req.headers['content-type']
  if (
    typeof contentType !== 'string' ||
    !/^application\/json(?:\s*;|$)/i.test(contentType)
  ) {
    res.status(415).json({ error: 'Content-Type must be application/json.' })
    return undefined
  }

  const sanitizedBody = sanitizeSubmissionValue(req.body)
  if (Buffer.byteLength(JSON.stringify(sanitizedBody) ?? '') > 16 * 1024) {
    res.status(413).json({
      error: 'Request body exceeds the 16 KB limit.',
      warning: SECURITY_NOTICE,
    })
    return undefined
  }

  if (!takeSubmissionSlot(req, res)) return undefined

  const result = schema.safeParse(sanitizedBody)
  if (!result.success) {
    res.status(400).json({
      error: 'The submitted information is invalid.',
      details: result.error.issues.map(({ path, message }) => ({
        field: path.join('.'),
        message,
      })),
      warning: SECURITY_NOTICE,
    })
    return undefined
  }

  return result.data
}

export function logSubmissionFailure(event: string, error: unknown) {
  console.error(
    JSON.stringify({
      level: 'error',
      event,
      error: error instanceof Error ? error.name : 'UnknownError',
    }),
  )
}
