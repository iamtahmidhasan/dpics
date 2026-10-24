import prisma from "@/lib/prisma"
import {
  ActivityAction,
  ActivityLogService,
  type ActivityLogActor,
} from "@/lib/services/activity-log.service"
import { serializeToCsv, parseCsv } from "./csv-utils"
import { ENTITY_REGISTRY } from "./registry"
import type { DataFormat, ImportOptions, ImportResult, SupportedEntity } from "./types"

import { exportUsers, importUsers } from "./handlers/users.handler"
import { exportEvents, importEvents } from "./handlers/events.handler"
import { exportTickets, importTickets } from "./handlers/tickets.handler"
import { exportCourses, importCourses } from "./handlers/courses.handler"
import { exportEnrollments, importEnrollments } from "./handlers/enrollments.handler"
import { exportCommittees, importCommittees } from "./handlers/committees.handler"
import {
  exportCategories,
  importCategories,
  exportPosts,
  importPosts,
  exportProjects,
  importProjects,
  exportAchievements,
  importAchievements,
} from "./handlers/content.handler"
import {
  exportMedia,
  importMedia,
  exportTemplates,
  importTemplates,
} from "./handlers/media.handler"
import { exportEmails, importEmails } from "./handlers/emails.handler"

export class DataTransferService {
  /**
   * Export records for an entity in CSV or JSON format
   */
  static async exportData(
    entity: SupportedEntity,
    format: DataFormat,
    options?: { actor?: ActivityLogActor | null }
  ): Promise<{ filename: string; contentType: string; data: string }> {
    let records: Record<string, unknown>[] = []

    switch (entity) {
      case "users":
        records = await exportUsers()
        break
      case "events":
        records = await exportEvents()
        break
      case "tickets":
        records = await exportTickets()
        break
      case "courses":
        records = await exportCourses()
        break
      case "enrollments":
        records = await exportEnrollments()
        break
      case "committees":
        records = await exportCommittees()
        break
      case "achievements":
        records = await exportAchievements()
        break
      case "posts":
        records = await exportPosts()
        break
      case "projects":
        records = await exportProjects()
        break
      case "category":
        records = await exportCategories()
        break
      case "media":
        records = await exportMedia()
        break
      case "templates":
        records = await exportTemplates()
        break
      case "emails":
        records = await exportEmails()
        break
      default:
        throw new Error(`Unsupported entity: ${entity}`)
    }

    const dateStr = new Date().toISOString().slice(0, 10)
    const filename = `${entity}_export_${dateStr}.${format}`

    let output = ""
    let contentType = "text/plain"

    if (format === "csv") {
      contentType = "text/csv; charset=utf-8"
      const meta = ENTITY_REGISTRY[entity]
      const preferredCols = meta ? meta.fields.map((f) => f.key) : undefined
      output = serializeToCsv(records, preferredCols)
    } else {
      contentType = "application/json; charset=utf-8"
      output = JSON.stringify(
        {
          entity,
          exportedAt: new Date().toISOString(),
          totalRecords: records.length,
          data: records,
        },
        null,
        2
      )
    }

    // Log activity
    if (options?.actor) {
      try {
        await ActivityLogService.log({
          actor: options.actor,
          action: ActivityAction.BULK_ACTION,
          actionName: `DATA_EXPORT_${entity.toUpperCase()}`,
          entity: entity,
          description: `Exported ${records.length} ${entity} records as ${format.toUpperCase()}`,
          metadata: { entity, format, count: records.length },
        })
      } catch (err) {
        console.error("Failed to log export activity:", err)
      }
    }

    return { filename, contentType, data: output }
  }

  /**
   * Import records for an entity from raw CSV or JSON text
   */
  static async importData(
    entity: SupportedEntity,
    format: DataFormat,
    content: string,
    options: ImportOptions
  ): Promise<ImportResult> {
    let rows: Record<string, unknown>[] = []

    if (format === "csv") {
      rows = parseCsv(content)
    } else {
      try {
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed)) {
          rows = parsed
        } else if (parsed && Array.isArray(parsed.data)) {
          rows = parsed.data
        } else {
          throw new Error("JSON file must be an array of records or have a 'data' array property")
        }
      } catch (err: unknown) {
        return {
          success: false,
          entity,
          format,
          totalRows: 0,
          created: 0,
          updated: 0,
          skipped: 0,
          failed: 1,
          dryRun: !!options.dryRun,
          errors: [
            {
              row: 0,
              message: err instanceof Error ? err.message : "Malformed JSON content",
            },
          ],
        }
      }
    }

    if (rows.length === 0) {
      return {
        success: false,
        entity,
        format,
        totalRows: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 1,
        dryRun: !!options.dryRun,
        errors: [{ row: 0, message: "File contains no valid data rows" }],
      }
    }

    let result: ImportResult

    switch (entity) {
      case "users":
        result = await importUsers(rows, options)
        break
      case "events":
        result = await importEvents(rows, options)
        break
      case "tickets":
        result = await importTickets(rows, options)
        break
      case "courses":
        result = await importCourses(rows, options)
        break
      case "enrollments":
        result = await importEnrollments(rows, options)
        break
      case "committees":
        result = await importCommittees(rows, options)
        break
      case "achievements":
        result = await importAchievements(rows, options)
        break
      case "posts":
        result = await importPosts(rows, options)
        break
      case "projects":
        result = await importProjects(rows, options)
        break
      case "category":
        result = await importCategories(rows, options)
        break
      case "media":
        result = await importMedia(rows, options)
        break
      case "templates":
        result = await importTemplates(rows, options)
        break
      case "emails":
        result = await importEmails(rows, options)
        break
      default:
        throw new Error(`Unsupported entity: ${entity}`)
    }

    result.format = format

    // Log activity if not dry run
    if (!options.dryRun && (result.created > 0 || result.updated > 0) && options.actor) {
      try {
        await ActivityLogService.log({
          actor: options.actor,
          action: ActivityAction.BULK_ACTION,
          actionName: `DATA_IMPORT_${entity.toUpperCase()}`,
          entity: entity,
          description: `Imported ${entity} (${result.created} created, ${result.updated} updated, ${result.failed} errors)`,
          metadata: {
            entity,
            format,
            mode: options.mode,
            created: result.created,
            updated: result.updated,
            skipped: result.skipped,
            failed: result.failed,
          },
        })
      } catch (err) {
        console.error("Failed to log import activity:", err)
      }
    }

    return result
  }

  /**
   * Generate a sample template in CSV or JSON format
   */
  static getTemplate(
    entity: SupportedEntity,
    format: DataFormat
  ): { filename: string; contentType: string; data: string } {
    const meta = ENTITY_REGISTRY[entity]
    if (!meta) {
      throw new Error(`Unknown entity: ${entity}`)
    }

    const filename = `${entity}_sample_template.${format}`
    const columns = meta.fields.map((f) => f.key)
    const sampleRecord = meta.sampleRow

    if (format === "csv") {
      const csv = serializeToCsv([sampleRecord], columns)
      return {
        filename,
        contentType: "text/csv; charset=utf-8",
        data: csv,
      }
    } else {
      const json = JSON.stringify(
        {
          entity,
          description: meta.description.en,
          fields: meta.fields.map((f) => ({
            name: f.key,
            type: f.type,
            required: !!f.required,
            description: f.description?.en || f.label.en,
          })),
          sampleData: [sampleRecord],
        },
        null,
        2
      )
      return {
        filename,
        contentType: "application/json; charset=utf-8",
        data: json,
      }
    }
  }

  /**
   * Get counts for all 13 entities for the Data Transfer Hub
   */
  static async getAllEntityCounts(): Promise<Record<SupportedEntity, number>> {
    const [
      users,
      events,
      tickets,
      courses,
      enrollments,
      committees,
      achievements,
      posts,
      projects,
      category,
      media,
      templates,
      emails,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.eventRegistration.count(),
      prisma.course.count(),
      prisma.courseEnrollment.count(),
      prisma.committee.count(),
      prisma.achievement.count(),
      prisma.post.count(),
      prisma.project.count(),
      prisma.category.count(),
      prisma.media.count(),
      prisma.mediaTemplate.count(),
      prisma.emailTemplate.count(),
    ])

    return {
      users,
      events,
      tickets,
      courses,
      enrollments,
      committees,
      achievements,
      posts,
      projects,
      category,
      media,
      templates,
      emails,
    }
  }
}
