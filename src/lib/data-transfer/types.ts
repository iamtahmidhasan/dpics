import type { ActivityLogActor } from "@/lib/services/activity-log.service"

export type SupportedEntity =
  | "users"
  | "events"
  | "tickets"
  | "courses"
  | "enrollments"
  | "committees"
  | "achievements"
  | "posts"
  | "projects"
  | "category"
  | "media"
  | "templates"
  | "emails"

export type DataFormat = "csv" | "json"

export type ImportMode = "upsert" | "create_only"

export interface ImportOptions {
  mode: ImportMode
  dryRun?: boolean
  actor?: ActivityLogActor | null
}

export interface ImportRowError {
  row: number
  identifier?: string
  message: string
}

export interface ImportResult {
  success: boolean
  entity: SupportedEntity
  format: DataFormat
  totalRows: number
  created: number
  updated: number
  skipped: number
  failed: number
  dryRun: boolean
  errors: ImportRowError[]
  sample?: unknown[]
}

export interface EntityFieldDefinition {
  key: string
  label: { en: string; bn: string }
  type: "string" | "number" | "boolean" | "date" | "enum" | "array" | "json"
  required?: boolean
  description?: { en: string; bn: string }
  options?: string[]
}

export interface EntityMetadata {
  key: SupportedEntity
  label: { en: string; bn: string }
  description: { en: string; bn: string }
  uniqueKey: string
  fields: EntityFieldDefinition[]
  sampleRow: Record<string, unknown>
}
