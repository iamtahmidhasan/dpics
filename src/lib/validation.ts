import { ApiError } from "@/lib/api-error"

export const MAX_NAME_LENGTH = 120
export const MAX_EMAIL_LENGTH = 254
export const MAX_PHONE_LENGTH = 20
export const MAX_WHATSAPP_LENGTH = 20
export const MAX_SESSION_LENGTH = 20
export const MAX_STUDENT_ID_LENGTH = 40
export const MAX_TRANSACTION_ID_LENGTH = 60
export const MAX_URL_LENGTH = 2048
export const MAX_BIO_LENGTH = 1000
export const MAX_EXPERTISE_LENGTH = 500
export const MAX_IMAGES = 5
export const MAX_REGISTRATION_FEE = 999_999

const MAX_DATE_LENGTH = 40

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Validates a required string field, trimming and bounding its length. */
export function toText(
  value: unknown,
  field: string,
  { required = true, max }: { required?: boolean; max: number }
): string {
  const text = typeof value === "string" ? value.trim() : ""

  if (!text) {
    if (required) throw ApiError.badRequest(`${field} is required`)

    return ""
  }

  if (text.length > max) {
    throw ApiError.badRequest(`${field} must be ${max} characters or fewer`)
  }

  return text
}

export function toOptionalText(value: unknown, field: string, max: number): string | null {
  return toText(value, field, { required: false, max }) || null
}

/** Accepts root-relative paths and http(s) urls only, never a script or data uri. */
export function toUrl(value: unknown, field: string): string | null {
  const text = toOptionalText(value, field, MAX_URL_LENGTH)

  if (!text) return null

  if (!text.startsWith("/") && !/^https?:\/\//.test(text)) {
    throw ApiError.badRequest(`${field} must be a valid url`)
  }

  return text
}

export function toEnum<T extends string>(
  value: unknown,
  field: string,
  values: readonly T[]
): T {
  if (typeof value !== "string" || !values.includes(value as T)) {
    throw ApiError.badRequest(`${field} is not a valid option`)
  }

  return value as T
}

export function toEnumList<T extends string>(
  value: unknown,
  field: string,
  values: readonly T[]
): T[] {
  if (!Array.isArray(value)) throw ApiError.badRequest(`${field} must be a list`)

  const result: T[] = []

  for (const entry of value) {
    const item = toEnum(entry, field, values)

    if (!result.includes(item)) result.push(item)
  }

  return result
}

export function toBoolean(value: unknown, field: string): boolean {
  if (typeof value === "boolean") return value

  if (value === "true") return true

  if (value === "false") return false

  throw ApiError.badRequest(`${field} must be true or false`)
}

/** Like `toEnum` but treats an absent/empty value as "not set". */
export function toOptionalEnum<T extends string>(
  value: unknown,
  field: string,
  values: readonly T[]
): T | null {
  if (value === null || value === undefined || value === "") return null

  return toEnum(value, field, values)
}

/** Parses an ISO date string (or epoch millis) coming from a form input. */
export function toDateTime(value: unknown, field: string): Date | null {
  const text = toOptionalText(value, field, MAX_DATE_LENGTH)

  if (!text) return null

  const date = new Date(/^\d+$/.test(text) ? Number(text) : text)

  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest(`${field} is not a valid date`)
  }

  return date
}

/** A list of unique, valid image urls. */
export function toImages(value: unknown): string[] {
  if (!Array.isArray(value)) throw ApiError.badRequest("images must be a list")

  if (value.length > MAX_IMAGES) {
    throw ApiError.badRequest(`You can keep at most ${MAX_IMAGES} pictures`)
  }

  const images: string[] = []

  for (const entry of value) {
    const url = toUrl(entry, "Picture")

    if (url && !images.includes(url)) images.push(url)
  }

  return images
}

/** Clamps a picture selection to something that actually exists in the list. */
export function toSelectedImageIndex(value: unknown, imageCount: number): number {
  if (imageCount === 0) return 0

  const parsed = Number.parseInt(String(value ?? 0), 10) || 0

  return Math.min(Math.max(parsed, 0), imageCount - 1)
}