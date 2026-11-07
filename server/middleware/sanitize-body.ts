import type { RequestHandler } from 'express'
import sanitizeHtml from 'sanitize-html'

function stripControlCharacters(value: string) {
  return Array.from(value)
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
}

export function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    const sanitized = sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'discard',
    })

    return stripControlCharacters(sanitized).normalize('NFC').trim()
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitizeValue(item)]),
    )
  }

  return value
}

export const sanitizeRequestBody: RequestHandler = (req, _res, next) => {
  req.body = sanitizeValue(req.body)
  next()
}
