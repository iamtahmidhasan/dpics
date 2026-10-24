import crypto from "crypto"
import prisma from "@/lib/prisma"
import {
  ActivityAction,
  ActivityLogService,
  type ActivityLogActor,
} from "@/lib/services/activity-log.service"
import { formatSqlValue, generateSqlDump } from "./sql-generator"
import type {
  BackupFormat,
  BackupHistoryItem,
  DatabaseBackupManifest,
  DatabaseBackupSnapshot,
  DatabaseStats,
  RestoreExecutionResult,
  RestoreValidationResult,
  TableBackupData,
  TableDiffComparison,
  TableStatsInfo,
} from "./types"

/**
 * Topologically sorted tables so that parent foreign key references
 * always precede dependent child tables during insertion.
 */
export const TOPOLOGICAL_TABLE_ORDER: string[] = [
  // Level 0: Zero Foreign Key Dependencies
  "user",
  "category",
  "setting",
  "email_template",
  "verification",
  "Committee",
  "course",
  "_prisma_migrations",

  // Level 1: Depends only on Level 0
  "Member",
  "Instructor",
  "CommitteeRole",
  "account",
  "session",
  "media",
  "Post",
  "achievement",
  "project",
  "course_section",
  "email_log",
  "activity_log",
  "invitation",

  // Level 2: Depends on Level 0 & Level 1
  "UserCommitteeRole",
  "media_template",
  "course_lesson",
  "course_enrollment",

  // Level 3: Depends on Level 2
  "event",
  "media_template_assignment",
  "lesson_instructor",
  "lesson_progress",

  // Level 4: Depends on Level 3
  "event_registration",
]

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function categorizeTable(tableName: string): TableStatsInfo["category"] {
  const t = tableName.toLowerCase()
  if (t === "user" || t === "member" || t === "instructor" || t.includes("committee") || t === "invitation") return "core"
  if (t === "post" || t === "achievement" || t === "project" || t === "category") return "content"
  if (t.includes("course") || t.includes("lesson")) return "lms"
  if (t.includes("event") || t === "ticket") return "events"
  if (t.includes("media")) return "media"
  return "system"
}

export class DatabaseBackupService {
  /**
   * Introspect the database and return live statistics, table breakdown and sizes
   */
  static async getDatabaseStats(): Promise<DatabaseStats> {
    // Database name and total size
    const dbRes = await prisma.$queryRaw<Array<{
      db_name: string
      size_bytes: bigint
      pg_version: string
    }>>`
      SELECT 
        current_database() as db_name,
        pg_database_size(current_database()) as size_bytes,
        version() as pg_version;
    `
    const dbInfo = dbRes[0]
    const databaseName = dbInfo?.db_name || "dpics"
    const databaseSizeBytes = Number(dbInfo?.size_bytes || 0)
    const postgresVersion = dbInfo?.pg_version?.split("on")[0]?.trim() || "PostgreSQL"

    // Tables in public schema
    const tablesRes = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `

    const tables: TableStatsInfo[] = []
    let totalRecords = 0

    for (const t of tablesRes) {
      try {
        const countRes = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*) as count FROM "${t.table_name}";`
        )
        const sizeRes = await prisma.$queryRawUnsafe<Array<{ size_bytes: bigint }>>(
          `SELECT pg_total_relation_size('"' || $1 || '"') as size_bytes;`,
          t.table_name
        )

        const rowCount = Number(countRes[0]?.count || 0)
        const sizeBytes = Number(sizeRes[0]?.size_bytes || 0)
        totalRecords += rowCount

        tables.push({
          tableName: t.table_name,
          rowCount,
          sizeBytes,
          sizeFormatted: formatBytes(sizeBytes),
          category: categorizeTable(t.table_name),
        })
      } catch (err) {
        console.warn(`Failed to inspect table stats for ${t.table_name}:`, err)
      }
    }

    // Sort tables by row count descending
    tables.sort((a, b) => b.rowCount - a.rowCount)

    // Last backup from ActivityLog
    const lastBackupLog = await prisma.activityLog.findFirst({
      where: { actionName: "DATABASE_BACKUP_CREATED" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    })

    return {
      databaseName,
      databaseSizeBytes,
      databaseSizeFormatted: formatBytes(databaseSizeBytes),
      totalTables: tables.length,
      totalRecords,
      postgresVersion,
      tables,
      lastBackupAt: lastBackupLog?.createdAt ? lastBackupLog.createdAt.toISOString() : null,
    }
  }

  /**
   * Export the entire database snapshot in JSON or SQL format
   */
  static async exportBackup(
    format: BackupFormat,
    actor?: ActivityLogActor | null
  ): Promise<{ filename: string; contentType: string; data: string; manifest: DatabaseBackupManifest }> {
    // 1. Discover all existing public base tables
    const existingTablesRes = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
    `
    const existingTableSet = new Set(existingTablesRes.map((r) => r.table_name))

    // Use topological ordering, and append any unforeseen custom tables
    const orderedTables = TOPOLOGICAL_TABLE_ORDER.filter((t) => existingTableSet.has(t))
    for (const tbl of existingTableSet) {
      if (!orderedTables.includes(tbl)) {
        orderedTables.push(tbl)
      }
    }

    const tableSnapshots: Record<string, TableBackupData> = {}
    let totalRecords = 0

    // 2. Fetch column definitions & rows for each table
    for (const tableName of orderedTables) {
      const colsRes = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        ORDER BY ordinal_position;
      `
      const columns = colsRes.map((c) => c.column_name)

      // Query rows
      const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT * FROM "${tableName}";`
      )

      totalRecords += rows.length
      tableSnapshots[tableName] = {
        tableName,
        columns,
        rowCount: rows.length,
        rows,
      }
    }

    // 3. Create Manifest and Compute SHA-256 Checksum
    const nowIso = new Date().toISOString()
    const contentToHash = JSON.stringify(tableSnapshots)
    const checksum = crypto.createHash("sha256").update(contentToHash).digest("hex")

    const manifest: DatabaseBackupManifest = {
      version: "1.0.0",
      generator: "DPICS Database Backup Engine",
      exportedAt: nowIso,
      environment: process.env.NODE_ENV || "production",
      totalTables: orderedTables.length,
      totalRecords,
      tableList: orderedTables,
      checksum,
    }

    const snapshot: DatabaseBackupSnapshot = {
      manifest,
      tables: tableSnapshots,
    }

    // 4. Serialize to requested format
    const dateTag = nowIso.slice(0, 10) + "_" + nowIso.slice(11, 16).replace(":", "-")
    let filename: string
    let contentType: string
    let data: string

    if (format === "json") {
      filename = `dpics_database_backup_${dateTag}.json`
      contentType = "application/json; charset=utf-8"
      data = JSON.stringify(snapshot, null, 2)
    } else {
      filename = `dpics_database_backup_${dateTag}.sql`
      contentType = "application/sql; charset=utf-8"
      data = generateSqlDump(snapshot, orderedTables)
    }

    // 5. Record activity log
    if (actor) {
      try {
        await ActivityLogService.log({
          actor,
          action: ActivityAction.BULK_ACTION,
          actionName: "DATABASE_BACKUP_CREATED",
          entity: "Database",
          description: `Created full database backup (${orderedTables.length} tables, ${totalRecords} records, ${format.toUpperCase()})`,
          metadata: {
            format,
            totalTables: orderedTables.length,
            totalRecords,
            fileSize: Buffer.byteLength(data, "utf8"),
            fileSizeFormatted: formatBytes(Buffer.byteLength(data, "utf8")),
            checksum,
            filename,
          },
        })
      } catch (err) {
        console.error("Failed to log database backup creation:", err)
      }
    }

    return { filename, contentType, data, manifest }
  }

  /**
   * Pre-flight validation of an uploaded backup file without touching database
   */
  static async validateBackup(
    fileContent: string,
    format: BackupFormat
  ): Promise<RestoreValidationResult> {
    const warnings: string[] = []
    const errors: string[] = []
    const comparisons: TableDiffComparison[] = []

    // Fetch current table counts for live diff comparison
    const currentStats = await this.getDatabaseStats()
    const currentCountMap = new Map(currentStats.tables.map((t) => [t.tableName, t.rowCount]))

    let manifest: DatabaseBackupManifest | undefined = undefined
    let tablesData: Record<string, { rowCount: number }> = {}
    let totalRecordsInBackup = 0
    let checksumMatched = false

    if (format === "json") {
      try {
        const parsed = JSON.parse(fileContent) as DatabaseBackupSnapshot
        if (!parsed || !parsed.tables || typeof parsed.tables !== "object") {
          errors.push("Invalid JSON backup structure: missing 'tables' payload.")
          return {
            valid: false,
            format,
            totalTablesInBackup: 0,
            totalRecordsInBackup: 0,
            checksumMatched: false,
            comparisons: [],
            warnings,
            errors,
          }
        }

        manifest = parsed.manifest
        tablesData = parsed.tables

        // Verify Checksum if present
        if (manifest?.checksum) {
          const rawHash = crypto.createHash("sha256").update(JSON.stringify(parsed.tables)).digest("hex")
          checksumMatched = rawHash === manifest.checksum
          if (!checksumMatched) {
            warnings.push("Backup file checksum does not match stored manifest hash. File may have been edited.")
          }
        }

        for (const [tableName, tData] of Object.entries(parsed.tables)) {
          const bCount = tData.rowCount ?? (Array.isArray(tData.rows) ? tData.rows.length : 0)
          totalRecordsInBackup += bCount
          const curCount = currentCountMap.get(tableName) ?? 0
          const diff = bCount - curCount

          let status: TableDiffComparison["status"] = "match"
          if (!currentCountMap.has(tableName)) status = "new_table"
          else if (diff > 0) status = "increase"
          else if (diff < 0) status = "decrease"

          comparisons.push({
            tableName,
            currentDbRows: curCount,
            backupRows: bCount,
            diff,
            status,
          })
        }
      } catch (err: unknown) {
        errors.push(`Malformed JSON backup file: ${err instanceof Error ? err.message : "Parse error"}`)
        return {
          valid: false,
          format,
          totalTablesInBackup: 0,
          totalRecordsInBackup: 0,
          checksumMatched: false,
          comparisons: [],
          warnings,
          errors,
        }
      }
    } else {
      // SQL validation: parse table names and estimate insert counts
      try {
        const insertMatches = fileContent.matchAll(/INSERT\s+INTO\s+"?([a-zA-Z0-9_]+)"?/gi)
        const sqlTableCounts: Record<string, number> = {}

        for (const match of insertMatches) {
          const tbl = match[1]
          sqlTableCounts[tbl] = (sqlTableCounts[tbl] || 0) + 1
        }

        // Count approximate rows based on values syntax
        const tableNames = Object.keys(sqlTableCounts)
        for (const tbl of tableNames) {
          // Find the block for this table and count tuples
          const regex = new RegExp(`INSERT\\s+INTO\\s+"?${tbl}"?[^;]+;`, "gi")
          const inserts = fileContent.match(regex) || []
          let rowsCount = 0
          for (const ins of inserts) {
            // Count left parentheses at line starts
            const tupleCount = (ins.match(/\n\s*\(/g) || []).length || 1
            rowsCount += tupleCount
          }

          totalRecordsInBackup += rowsCount
          tablesData[tbl] = { rowCount: rowsCount }

          const curCount = currentCountMap.get(tbl) ?? 0
          const diff = rowsCount - curCount
          let status: TableDiffComparison["status"] = "match"
          if (!currentCountMap.has(tbl)) status = "new_table"
          else if (diff > 0) status = "increase"
          else if (diff < 0) status = "decrease"

          comparisons.push({
            tableName: tbl,
            currentDbRows: curCount,
            backupRows: rowsCount,
            diff,
            status,
          })
        }

        checksumMatched = true
      } catch {
        errors.push("Failed to parse SQL backup script.")
      }
    }

    // Check for tables in current database missing from backup
    for (const [curTable, curCount] of currentCountMap.entries()) {
      if (!tablesData[curTable]) {
        warnings.push(`Table "${curTable}" exists in the current database (${curCount} rows) but is not in this backup.`)
        comparisons.push({
          tableName: curTable,
          currentDbRows: curCount,
          backupRows: 0,
          diff: -curCount,
          status: "missing_in_backup",
        })
      }
    }

    // Sort comparisons by table name
    comparisons.sort((a, b) => a.tableName.localeCompare(b.tableName))

    return {
      valid: errors.length === 0,
      format,
      manifest,
      totalTablesInBackup: Object.keys(tablesData).length,
      totalRecordsInBackup,
      checksumMatched,
      comparisons,
      warnings,
      errors,
    }
  }

  /**
   * Execute an atomic, transaction-isolated restore from backup file content
   */
  static async restoreBackup(
    fileContent: string,
    format: BackupFormat,
    actor?: ActivityLogActor | null
  ): Promise<RestoreExecutionResult> {
    const startTime = Date.now()

    // 1. Pre-validate
    const validation = await this.validateBackup(fileContent, format)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`)
    }

    const restoredTables: Array<{ tableName: string; rowsInserted: number }> = []
    let totalRestoredRecords = 0

    // 2. Execute Restore
    if (format === "json") {
      const snapshot = JSON.parse(fileContent) as DatabaseBackupSnapshot
      const tables = snapshot.tables

      // Determine tables in reverse topological order for truncation
      const reverseOrder = [...TOPOLOGICAL_TABLE_ORDER].reverse().filter((t) => tables[t])

      // Execute within transaction
      await prisma.$transaction(async (tx) => {
        // Step A: Disable constraints/triggers
        try {
          await tx.$executeRawUnsafe(`SET session_replication_role = 'replica';`)
        } catch {
          // If unprivileged on managed cloud, topological order handles constraints
        }

        // Step B: Truncate existing tables in reverse topological order
        if (reverseOrder.length > 0) {
          const truncateSql = `TRUNCATE TABLE ${reverseOrder.map((t) => `"${t}"`).join(", ")} CASCADE;`
          await tx.$executeRawUnsafe(truncateSql)
        }

        // Step C: Insert tables in forward topological order in batches
        for (const tableName of TOPOLOGICAL_TABLE_ORDER) {
          const tableData = tables[tableName]
          if (!tableData || !tableData.rows || tableData.rows.length === 0) {
            continue
          }

          const { columns, rows } = tableData
          const escapedCols = columns.map((col) => `"${col}"`).join(", ")

          const BATCH_SIZE = 200
          for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE)
            const valuesSql = batch
              .map((row) => {
                const rowVals = columns.map((col) => formatSqlValue(row[col], col))
                return `(${rowVals.join(", ")})`
              })
              .join(",\n")

            const insertSql = `INSERT INTO "${tableName}" (${escapedCols}) VALUES\n${valuesSql};`
            await tx.$executeRawUnsafe(insertSql)
          }

          restoredTables.push({
            tableName,
            rowsInserted: rows.length,
          })
          totalRestoredRecords += rows.length
        }

        // Step D: Re-enable constraints/triggers
        try {
          await tx.$executeRawUnsafe(`SET session_replication_role = 'origin';`)
        } catch {
          // Ignore
        }
      }, {
        timeout: 120000, // 2 minutes transaction timeout for large restores
      })
    } else {
      // Execute SQL script within transaction
      await prisma.$transaction(async (tx) => {
        // Run SQL script statements
        await tx.$executeRawUnsafe(fileContent)
      }, {
        timeout: 120000,
      })

      // Query restored counts
      const stats = await this.getDatabaseStats()
      totalRestoredRecords = stats.totalRecords
      for (const t of stats.tables) {
        restoredTables.push({ tableName: t.tableName, rowsInserted: t.rowCount })
      }
    }

    const durationMs = Date.now() - startTime

    // 3. Log restore activity in ActivityLog
    if (actor) {
      try {
        await ActivityLogService.log({
          actor,
          action: ActivityAction.BULK_ACTION,
          actionName: "DATABASE_RESTORED",
          entity: "Database",
          description: `Restored entire database from ${format.toUpperCase()} backup (${restoredTables.length} tables, ${totalRestoredRecords} records, ${durationMs}ms)`,
          metadata: {
            format,
            durationMs,
            tablesRestoredCount: restoredTables.length,
            recordsRestoredCount: totalRestoredRecords,
          },
        })
      } catch (err) {
        console.error("Failed to log database restore activity:", err)
      }
    }

    return {
      success: true,
      durationMs,
      tablesRestoredCount: restoredTables.length,
      recordsRestoredCount: totalRestoredRecords,
      tables: restoredTables,
    }
  }

  /**
   * Fetch recent backup and restore history from ActivityLog
   */
  static async getBackupHistory(limit = 20): Promise<BackupHistoryItem[]> {
    const logs = await prisma.activityLog.findMany({
      where: {
        actionName: { in: ["DATABASE_BACKUP_CREATED", "DATABASE_RESTORED"] },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return logs.map((log) => {
      const meta = (log.metadata as Record<string, unknown>) || {}
      const isExport = log.actionName === "DATABASE_BACKUP_CREATED"

      return {
        id: log.id,
        actionName: log.actionName,
        createdAt: log.createdAt.toISOString(),
        adminName: log.userName,
        adminEmail: log.userEmail,
        format: (meta.format as BackupFormat) || "json",
        totalRecords: Number(meta.totalRecords || meta.recordsRestoredCount || 0),
        totalTables: Number(meta.totalTables || meta.tablesRestoredCount || 0),
        fileSizeFormatted: (meta.fileSizeFormatted as string) || undefined,
        status: "COMPLETED",
        type: isExport ? "EXPORT" : "RESTORE",
        description: log.description,
      }
    })
  }
}
