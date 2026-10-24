import type { DatabaseBackupSnapshot, TableBackupData } from "./types"

/**
 * Known JSONB columns across the DPI Computing Society PostgreSQL schema
 */
export const KNOWN_JSONB_COLUMNS = new Set([
  "guestSpeakers",
  "teamMembers",
  "design",
  "customData",
  "metadata",
  "oldData",
  "newData",
  "liveClass",
  "documents",
  "quiz",
  "assignment",
  "resources",
  "externalLinks",
])

/**
 * Known text array columns across the DPI Computing Society PostgreSQL schema
 */
export const KNOWN_TEXT_ARRAY_COLUMNS = new Set([
  "images",
  "image",
  "tags",
  "skills",
  "variables",
  "techStack",
])

/**
 * Format a single value as a safe PostgreSQL SQL literal with exact type matching
 */
export function formatSqlValue(
  val: unknown,
  columnName?: string,
  dataType?: string,
  udtName?: string
): string {
  if (val === null || val === undefined) {
    return "NULL"
  }

  // 1. JSONB Columns
  const isJsonbCol =
    dataType === "jsonb" ||
    dataType === "json" ||
    (columnName && KNOWN_JSONB_COLUMNS.has(columnName))

  if (isJsonbCol) {
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val)
        return `'${JSON.stringify(parsed).replace(/'/g, "''")}'::jsonb`
      } catch {
        return `'${val.replace(/'/g, "''")}'::jsonb`
      }
    }
    const jsonStr = JSON.stringify(val).replace(/'/g, "''")
    return `'${jsonStr}'::jsonb`
  }

  // 2. Role Enum Array Column
  const isRoleArrayCol =
    udtName === "_Role" ||
    columnName === "roles"

  if (isRoleArrayCol) {
    if (Array.isArray(val)) {
      if (val.length === 0) {
        return `ARRAY[]::"Role"[]`
      }
      const items = val.map((item) => `'${String(item).replace(/'/g, "''")}'`)
      return `ARRAY[${items.join(", ")}]::"Role"[]`
    }
    if (typeof val === "string") {
      if (val.startsWith("{") && val.endsWith("}")) {
        return `'${val.replace(/'/g, "''")}'::"Role"[]`
      }
      return `ARRAY['${val.replace(/'/g, "''")}']::"Role"[]`
    }
  }

  // 3. Text Array Columns
  const isTextArrayCol =
    dataType === "ARRAY" ||
    udtName === "_text" ||
    (columnName && KNOWN_TEXT_ARRAY_COLUMNS.has(columnName))

  if (isTextArrayCol) {
    if (Array.isArray(val)) {
      if (val.length === 0) {
        return "ARRAY[]::text[]"
      }
      const items = val.map((item) => `'${String(item).replace(/'/g, "''")}'`)
      return `ARRAY[${items.join(", ")}]::text[]`
    }
    if (typeof val === "string") {
      if (val.startsWith("{") && val.endsWith("}")) {
        return `'${val.replace(/'/g, "''")}'::text[]`
      }
      return `ARRAY['${val.replace(/'/g, "''")}']::text[]`
    }
  }

  // 4. Booleans
  if (typeof val === "boolean") {
    return val ? "TRUE" : "FALSE"
  }

  // 5. Numbers
  if (typeof val === "number") {
    if (isNaN(val) || !isFinite(val)) return "NULL"
    return String(val)
  }

  // 6. Dates & Timestamps
  if (val instanceof Date) {
    return `'${val.toISOString()}'::timestamptz`
  }

  // 7. General Object / Array fallback
  if (typeof val === "object") {
    if (Array.isArray(val)) {
      if (val.length === 0) {
        return "ARRAY[]::text[]"
      }
      if (val.every((item) => typeof item === "string" || typeof item === "number")) {
        const escapedItems = val.map((item) => `'${String(item).replace(/'/g, "''")}'`)
        return `ARRAY[${escapedItems.join(", ")}]::text[]`
      }
      const jsonStr = JSON.stringify(val).replace(/'/g, "''")
      return `'${jsonStr}'::jsonb`
    }

    const jsonStr = JSON.stringify(val).replace(/'/g, "''")
    return `'${jsonStr}'::jsonb`
  }

  const s = String(val)

  // Check if string is an ISO date timestamp
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(s)) {
    return `'${s}'::timestamptz`
  }

  // Check if string is a postgres native array representation
  if (s.startsWith("{") && s.endsWith("}") && !s.includes("\n")) {
    return `'${s.replace(/'/g, "''")}'`
  }

  // Standard string: escape single quotes by doubling them
  return `'${s.replace(/'/g, "''")}'`
}

/**
 * Sanitize and heal legacy SQL dump scripts to ensure 100% restoration compatibility
 */
export function sanitizeSqlScript(sql: string): string {
  let sanitized = sql

  // 1. Fix: In INSERT INTO "event", replace any ARRAY[]::text[] positioned for guestSpeakers
  sanitized = sanitized.replace(
    /INSERT INTO "event" \(([\s\S]*?)\) VALUES([\s\S]*?);/g,
    (match, colsStr: string, valuesStr: string) => {
      const cols = colsStr.split(",").map((c: string) => c.trim().replace(/^"|"$/g, ""))
      const guestSpeakersIdx = cols.indexOf("guestSpeakers")
      if (guestSpeakersIdx === -1) return match

      const fixedValues = replaceColumnInValues(valuesStr, guestSpeakersIdx, (val) => {
        const trimmed = val.trim()
        if (trimmed === "ARRAY[]::text[]" || trimmed.startsWith("ARRAY[")) {
          return "'[]'::jsonb"
        }
        return val
      })

      return `INSERT INTO "event" (${colsStr}) VALUES${fixedValues};`
    }
  )

  // 2. Fix: In INSERT INTO "user", replace text[] cast on roles with "Role"[]
  sanitized = sanitized.replace(
    /INSERT INTO "user" \(([\s\S]*?)\) VALUES([\s\S]*?);/g,
    (match, colsStr: string, valuesStr: string) => {
      const cols = colsStr.split(",").map((c: string) => c.trim().replace(/^"|"$/g, ""))
      const rolesIdx = cols.indexOf("roles")
      if (rolesIdx === -1) return match

      const fixedValues = replaceColumnInValues(valuesStr, rolesIdx, (val) => {
        if (val.includes("::text[]")) {
          return val.replace("::text[]", '::"Role"[]')
        }
        return val
      })

      return `INSERT INTO "user" (${colsStr}) VALUES${fixedValues};`
    }
  )

  return sanitized
}

/**
 * Replace a specific column index within SQL tuples while respecting quotes and nested brackets
 */
function replaceColumnInValues(
  valuesStr: string,
  targetColIdx: number,
  replacer: (val: string) => string
): string {
  return valuesStr.replace(/\(([\s\S]*?)\)(?=,\s*\(|;|$)/g, (_rowMatch, inner: string) => {
    const items: string[] = []
    let current = ""
    let inQuotes = false
    let bracketDepth = 0

    for (let i = 0; i < inner.length; i++) {
      const char = inner[i]
      if (char === "'" && (i === 0 || inner[i - 1] !== "\\")) {
        if (inner[i + 1] === "'") {
          current += "''"
          i++
          continue
        }
        inQuotes = !inQuotes
        current += char
      } else if (!inQuotes && (char === "[" || char === "(")) {
        bracketDepth++
        current += char
      } else if (!inQuotes && (char === "]" || char === ")")) {
        bracketDepth--
        current += char
      } else if (char === "," && !inQuotes && bracketDepth === 0) {
        items.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    if (current.trim()) {
      items.push(current.trim())
    }

    if (items.length > targetColIdx) {
      items[targetColIdx] = replacer(items[targetColIdx])
    }

    return `(${items.join(", ")})`
  })
}

/**
 * Generate a complete, transaction-safe PostgreSQL SQL dump script from a snapshot
 */
export function generateSqlDump(
  snapshot: DatabaseBackupSnapshot,
  topologicalTableOrder: string[],
  columnTypesMap?: Record<string, Record<string, { dataType: string; udtName: string }>>
): string {
  const { manifest, tables } = snapshot
  const lines: string[] = []

  // 1. Header Metadata
  lines.push("-- ============================================================")
  lines.push("-- DPI COMPUTING SOCIETY - FULL DATABASE BACKUP DUMP")
  lines.push(`-- Version: ${manifest.version}`)
  lines.push(`-- Exported At: ${manifest.exportedAt}`)
  lines.push(`-- Environment: ${manifest.environment}`)
  lines.push(`-- PostgreSQL: ${manifest.databaseVersion || "PostgreSQL 17"}`)
  lines.push(`-- Total Tables: ${manifest.totalTables}`)
  lines.push(`-- Total Records: ${manifest.totalRecords}`)
  lines.push(`-- Checksum (SHA-256): ${manifest.checksum}`)
  lines.push("-- ============================================================")
  lines.push("")
  lines.push("BEGIN;")
  lines.push("")
  lines.push("-- Temporarily disable triggers and foreign key enforcement for bulk restoration")
  lines.push("SET session_replication_role = 'replica';")
  lines.push("")

  // 2. Truncate Tables in Reverse Topological Order (Cascading)
  const reverseOrder = [...topologicalTableOrder].reverse()
  const tablesToTruncate = reverseOrder.filter((t) => tables[t])
  if (tablesToTruncate.length > 0) {
    lines.push("-- 1. Clean slate: truncate existing tables")
    lines.push("TRUNCATE TABLE")
    lines.push(tablesToTruncate.map((t) => `  "${t}"`).join(",\n"))
    lines.push("CASCADE;")
    lines.push("")
  }

  // 3. Insert Data Table by Table in Forward Topological Order
  lines.push("-- 2. Bulk data restoration")
  for (const tableName of topologicalTableOrder) {
    const tableData: TableBackupData | undefined = tables[tableName]
    if (!tableData || tableData.rows.length === 0) {
      continue
    }

    const { columns, rows } = tableData
    const escapedCols = columns.map((col) => `"${col}"`).join(", ")
    const tableTypes = columnTypesMap?.[tableName]

    lines.push(`-- Data for table: "${tableName}" (${rows.length} rows)`)

    // Batch inserts in groups of 200 rows
    const BATCH_SIZE = 200
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      const valuesSql = batch
        .map((row) => {
          const rowVals = columns.map((col) => {
            const colType = tableTypes?.[col]
            return formatSqlValue(row[col], col, colType?.dataType, colType?.udtName)
          })
          return `  (${rowVals.join(", ")})`
        })
        .join(",\n")

      lines.push(`INSERT INTO "${tableName}" (${escapedCols}) VALUES\n${valuesSql};`)
    }

    lines.push("")
  }

  // 4. Re-enable Constraints & Commit Transaction
  lines.push("-- 3. Re-enable foreign key constraints and triggers")
  lines.push("SET session_replication_role = 'origin';")
  lines.push("")
  lines.push("COMMIT;")
  lines.push("")
  lines.push("-- ============================================================")
  lines.push("-- BACKUP RESTORATION SCRIPT COMPLETE")
  lines.push("-- ============================================================")

  return lines.join("\n")
}
