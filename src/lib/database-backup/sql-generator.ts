import type { DatabaseBackupSnapshot, TableBackupData } from "./types"

/**
 * Format a single value as a safe PostgreSQL SQL literal
 */
export function formatSqlValue(val: unknown, columnName?: string): string {
  if (val === null || val === undefined) {
    return "NULL"
  }

  if (typeof val === "boolean") {
    return val ? "TRUE" : "FALSE"
  }

  if (typeof val === "number") {
    if (isNaN(val) || !isFinite(val)) return "NULL"
    return String(val)
  }

  if (val instanceof Date) {
    return `'${val.toISOString()}'::timestamptz`
  }

  if (typeof val === "object") {
    if (Array.isArray(val)) {
      if (val.length === 0) {
        return "ARRAY[]::text[]"
      }
      // If array of primitives (strings, numbers)
      if (val.every((item) => typeof item === "string" || typeof item === "number")) {
        const escapedItems = val.map((item) => `'${String(item).replace(/'/g, "''")}'`)
        return `ARRAY[${escapedItems.join(", ")}]::text[]`
      }
      // If array of objects, treat as JSONB
      const jsonStr = JSON.stringify(val).replace(/'/g, "''")
      return `'${jsonStr}'::jsonb`
    }

    // Object -> JSONB
    const jsonStr = JSON.stringify(val).replace(/'/g, "''")
    return `'${jsonStr}'::jsonb`
  }

  const s = String(val)

  // Check if string is an ISO date timestamp
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(s)) {
    return `'${s}'::timestamptz`
  }

  // Check if string is PostgreSQL native array representation e.g. '{USER,MEMBER}' or '{"a","b"}'
  if (s.startsWith("{") && s.endsWith("}") && !s.includes("\n") && (columnName === "roles" || columnName === "skills" || columnName === "tags")) {
    return `'${s.replace(/'/g, "''")}'`
  }

  // Standard string: escape single quotes by doubling them
  return `'${s.replace(/'/g, "''")}'`
}

/**
 * Generate a complete, transaction-safe PostgreSQL SQL dump script from a snapshot
 */
export function generateSqlDump(
  snapshot: DatabaseBackupSnapshot,
  topologicalTableOrder: string[]
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

    lines.push(`-- Data for table: "${tableName}" (${rows.length} rows)`)

    // Batch inserts in groups of 200 rows
    const BATCH_SIZE = 200
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      const valuesSql = batch
        .map((row) => {
          const rowVals = columns.map((col) => formatSqlValue(row[col], col))
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
