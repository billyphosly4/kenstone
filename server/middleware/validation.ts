import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'

export const SECURITY_NOTICE =
  'IMPORTANT: NEVER submit, accept, or upload sensitive or confidential evidence, legal documents, or private case details through this endpoint. Use only brief, non-confidential information.'

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      res.status(400).json({
        error: 'The submitted information is invalid.',
        details: result.error.issues.map(({ path, message }) => ({
          field: path.join('.'),
          message,
        })),
        warning: SECURITY_NOTICE,
      })
      return
    }

    req.body = result.data
    next()
  }
}
