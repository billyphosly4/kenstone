import { rateLimit } from 'express-rate-limit'
import { SECURITY_NOTICE } from './validation.js'

export const submissionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many submissions. Please try again later.',
    warning: SECURITY_NOTICE,
  },
})
