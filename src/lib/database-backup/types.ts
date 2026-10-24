export type BackupFormat = "json" | "sql"

export interface DatabaseBackupManifest {
  version: string
  generator: string
  exportedAt: string
  databaseVersion?: string
  environment: string
  totalTables: number
  totalRecords: number
  tableList: string[]
  checksum: string
}

export interface TableBackupData {
  tableName: string
  columns: string[]
  rowCount: number
  rows: Record<string, unknown>[]
}

export interface DatabaseBackupSnapshot {
  manifest: DatabaseBackupManifest
  tables: Record<string, TableBackupData>
}

export interface TableStatsInfo {
  tableName: string
  rowCount: number
  sizeBytes: number
  sizeFormatted: string
  category: "core" | "content" | "lms" | "events" | "media" | "system"
}

export interface DatabaseStats {
  databaseName: string
  databaseSizeFormatted: string
  databaseSizeBytes: number
  totalTables: number
  totalRecords: number
  postgresVersion: string
  tables: TableStatsInfo[]
  lastBackupAt?: string | null
}

export interface TableDiffComparison {
  tableName: string
  currentDbRows: number
  backupRows: number
  diff: number
  status: "match" | "increase" | "decrease" | "new_table" | "missing_in_backup"
}

export interface RestoreValidationResult {
  valid: boolean
  format: BackupFormat
  manifest?: DatabaseBackupManifest
  totalTablesInBackup: number
  totalRecordsInBackup: number
  checksumMatched: boolean
  comparisons: TableDiffComparison[]
  warnings: string[]
  errors: string[]
}

export interface RestoreExecutionResult {
  success: boolean
  durationMs: number
  tablesRestoredCount: number
  recordsRestoredCount: number
  tables: Array<{
    tableName: string
    rowsInserted: number
  }>
  error?: string
}

export interface BackupHistoryItem {
  id: string
  actionName: string
  createdAt: string
  adminName?: string | null
  adminEmail?: string | null
  format: BackupFormat
  totalRecords: number
  totalTables: number
  fileSizeFormatted?: string
  status: "COMPLETED" | "FAILED"
  type: "EXPORT" | "RESTORE"
  description?: string | null
}
