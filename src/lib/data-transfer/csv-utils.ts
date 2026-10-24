/**
 * Zero-dependency, RFC-4180 compliant CSV parser and serializer
 * Includes UTF-8 BOM (\uFEFF) for Microsoft Excel Unicode & Bengali rendering.
 */

const UTF8_BOM = "\uFEFF"

/**
 * Format a single cell value for CSV output
 */
export function formatCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ""
  }

  let str: string
  if (typeof value === "object") {
    if (value instanceof Date) {
      str = value.toISOString()
    } else if (Array.isArray(value)) {
      // If array of URLs, use pipe delimiter so ImageKit/Cloudinary transform commas aren't corrupted
      const isUrlArray = value.length > 0 && value.every(
        (v) => typeof v === "string" && (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("//") || v.startsWith("/"))
      )
      if (isUrlArray) {
        str = value.map(String).join(" | ")
      } else if (value.every((v) => typeof v === "string" || typeof v === "number" || typeof v === "boolean")) {
        str = value.join(",")
      } else {
        str = JSON.stringify(value)
      }
    } else {
      str = JSON.stringify(value)
    }
  } else {
    str = String(value)
  }

  // If contains quote, comma, or newline, escape quotes and wrap in quotes
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Serialize an array of values safely into a delimited string.
 * Uses ' | ' for URL arrays to prevent comma collision with ImageKit/Cloudinary parameters.
 */
export function serializeArrayField(items: unknown[] | null | undefined, isUrlArray = false): string {
  if (!items || !Array.isArray(items) || items.length === 0) return ""
  const delimiter = isUrlArray ? " | " : ","
  return items.map(String).map((s) => s.trim()).filter(Boolean).join(delimiter)
}

/**
 * Parse an array field from CSV or JSON import safely.
 * Handles arrays, JSON strings, pipe-delimited strings, and comma-delimited strings
 * while protecting ImageKit/Cloudinary transform commas in URLs.
 */
export function parseArrayField(value: unknown, isUrlArray = false): string[] {
  if (!value) return []

  if (Array.isArray(value)) {
    return value.map(String).map((s) => s.trim()).filter(Boolean)
  }

  const raw = String(value).trim()
  if (!raw) return []

  // Check if it's a JSON array string e.g. ["url1", "url2"]
  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map(String).map((s) => s.trim()).filter(Boolean)
      }
    } catch {
      // Continue to string parsing
    }
  }

  // If contains pipe delimiter
  if (raw.includes("|")) {
    return raw.split("|").map((s) => s.trim()).filter(Boolean)
  }

  // For URLs, split on comma only if it is followed by http(s):// or //
  // to avoid breaking ImageKit transforms like https://ik.imagekit.io/.../tr:w-300,h-300/photo.jpg
  if (isUrlArray && raw.includes(",")) {
    const urlSplitRegex = /,\s*(?=https?:\/\/|\/\/)/i
    if (urlSplitRegex.test(raw)) {
      return raw.split(urlSplitRegex).map((s) => s.trim()).filter(Boolean)
    }
  }

  // Fallback: split by comma
  return raw.split(",").map((s) => s.trim()).filter(Boolean)
}

/**
 * Parse a date field safely from various string/numeric representations.
 * Returns null if the value is missing or invalid (never returns Invalid Date).
 */
export function parseDateField(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }

  const str = String(value).trim()
  if (!str) return null

  // If numeric timestamp (milliseconds or seconds)
  if (/^\d{10,13}$/.test(str)) {
    const num = Number(str)
    const d = new Date(str.length === 10 ? num * 1000 : num)
    return isNaN(d.getTime()) ? null : d
  }

  // Direct Date parse
  const parsed = new Date(str)
  if (!isNaN(parsed.getTime())) {
    return parsed
  }

  // DD/MM/YYYY or DD-MM-YYYY format common in Excel
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/)
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10)
    const month = parseInt(dmyMatch[2], 10) - 1
    const year = parseInt(dmyMatch[3], 10)
    const hours = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0
    const minutes = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0
    const seconds = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0
    const d = new Date(Date.UTC(year, month, day, hours, minutes, seconds))
    return isNaN(d.getTime()) ? null : d
  }

  return null
}

/**
 * Parse a boolean field safely from various representations.
 */
export function parseBooleanField(value: unknown, defaultValue = false): boolean {
  if (value === undefined || value === null || value === "") return defaultValue
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0

  const s = String(value).trim().toLowerCase()
  if (["true", "yes", "1", "y", "t", "active", "enable", "enabled"].includes(s)) {
    return true
  }
  if (["false", "no", "0", "n", "f", "inactive", "disable", "disabled"].includes(s)) {
    return false
  }

  return defaultValue
}

/**
 * Parse a JSON field safely from string or object/array.
 */
export function parseJsonField<T>(value: unknown, defaultValue: T): T {
  if (value === undefined || value === null || value === "") return defaultValue
  if (typeof value === "object") return value as T

  try {
    return JSON.parse(String(value)) as T
  } catch {
    return defaultValue
  }
}

/**
 * Serialize an array of object records to an RFC-4180 CSV string with UTF-8 BOM
 */
export function serializeToCsv(
  records: Record<string, unknown>[],
  columns?: string[]
): string {
  if (!records || records.length === 0) {
    if (columns && columns.length > 0) {
      return UTF8_BOM + columns.map(formatCsvValue).join(",") + "\r\n"
    }
    return UTF8_BOM
  }

  const cols = columns && columns.length > 0
    ? columns
    : Array.from(
        new Set(
          records.flatMap((rec) => (rec ? Object.keys(rec) : []))
        )
      )

  const headerLine = cols.map(formatCsvValue).join(",")
  const rows = records.map((record) => {
    return cols
      .map((col) => formatCsvValue(record[col]))
      .join(",")
  })

  return UTF8_BOM + [headerLine, ...rows].join("\r\n") + "\r\n"
}

/**
 * Parse an RFC-4180 CSV string into a 2D array of strings
 * Handles multiline quoted strings, escaped quotes (""), and varied newlines.
 */
export function parseCsvRaw(csvText: string): string[][] {
  // Strip BOM if present
  let text = csvText
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
  }

  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ""
  let inQuotes = false
  let i = 0
  const len = text.length

  while (i < len) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        // Lookahead for escaped quote ("")
        if (i + 1 < len && text[i + 1] === '"') {
          currentField += '"'
          i += 2
          continue
        } else {
          // Closing quote
          inQuotes = false
          i++
          continue
        }
      } else {
        currentField += char
        i++
        continue
      }
    } else {
      if (char === '"') {
        inQuotes = true
        i++
        continue
      } else if (char === ",") {
        currentRow.push(currentField)
        currentField = ""
        i++
        continue
      } else if (char === "\r") {
        if (i + 1 < len && text[i + 1] === "\n") {
          i++
        }
        currentRow.push(currentField)
        rows.push(currentRow)
        currentRow = []
        currentField = ""
        i++
        continue
      } else if (char === "\n") {
        currentRow.push(currentField)
        rows.push(currentRow)
        currentRow = []
        currentField = ""
        i++
        continue
      } else {
        currentField += char
        i++
        continue
      }
    }
  }

  // Push remaining field & row if present
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField)
    rows.push(currentRow)
  }

  // Filter out any trailing completely empty rows
  return rows.filter((row) => row.some((cell) => cell.trim().length > 0))
}

/**
 * Parse an RFC-4180 CSV string into an array of object records
 */
export function parseCsv(csvText: string): Record<string, string>[] {
  const rows = parseCsvRaw(csvText)
  if (rows.length === 0) return []

  const rawHeaders = rows[0]
  const headers = rawHeaders.map((h) => h.trim())

  const records: Record<string, string>[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const record: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j]
      if (header) {
        record[header] = row[j] !== undefined ? row[j] : ""
      }
    }
    records.push(record)
  }

  return records
}
