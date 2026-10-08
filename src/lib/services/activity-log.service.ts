import prisma from "@/lib/prisma"
import { ActivityAction } from "@/generated/prisma/enums"
import type { Prisma } from "@/generated/prisma/client"

export { ActivityAction }

export interface ActivityLogActor {
  id?: string | null
  name?: string | null
  email?: string | null
  roles?: string[] | null | string
}

export interface LogActivityParams {
  actor?: ActivityLogActor | null
  action: ActivityAction
  actionName: string
  entity: string
  entityId?: string | null
  description?: string | null
  oldData?: unknown
  newData?: unknown
  metadata?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
}

export interface GetActivityLogsParams {
  page?: number
  limit?: number
  search?: string
  action?: ActivityAction | "ALL"
  entity?: string | "ALL"
  userId?: string
  startDate?: string | Date
  endDate?: string | Date
}

export interface ActivityLogSummary {
  id: string
  userId: string | null
  userName: string | null
  userEmail: string | null
  userRole: string | null
  action: ActivityAction
  actionName: string
  entity: string
  entityId: string | null
  description: string | null
  oldData: Record<string, unknown> | unknown | null
  newData: Record<string, unknown> | unknown | null
  metadata: Record<string, unknown> | unknown | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

// Sensitive keys to strip before logging snapshots
const SENSITIVE_KEYS = new Set([
  "password",
  "hash",
  "token",
  "secret",
  "apikey",
  "api_key",
  "smtppass",
  "smtp_pass",
  "access_token",
  "refresh_token",
  "sessiontoken",
  "verificationtoken",
  "authorization",
  "cookie",
])

/**
 * Recursively sanitizes payloads for Prisma Json storage:
 * - Redacts sensitive keys (passwords, tokens, secrets)
 * - Safely handles circular references via WeakSet
 * - Converts BigInt, Error, Map, Set, and Date to JSON-safe representations
 * - Strips functions, symbols, and undefined
 */
function sanitizeData(data: unknown, depth = 0, visited = new WeakSet<object>()): unknown {
  if (depth > 6) return "[Truncated: Max Depth]"
  if (data === null || data === undefined) return null

  // Primitive types
  if (typeof data === "bigint") return data.toString()
  if (typeof data === "function" || typeof data === "symbol") return undefined
  if (typeof data !== "object") return data

  // Date objects
  if (data instanceof Date) {
    return isNaN(data.getTime()) ? null : data.toISOString()
  }

  // Error objects
  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack ? data.stack.split("\n").slice(0, 3).join("\n") : undefined,
    }
  }

  // Set / Map
  if (data instanceof Set) {
    return Array.from(data).map((item) => sanitizeData(item, depth + 1, visited))
  }
  if (data instanceof Map) {
    const mapObj: Record<string, unknown> = {}
    for (const [k, v] of data.entries()) {
      mapObj[String(k)] = sanitizeData(v, depth + 1, visited)
    }
    return mapObj
  }

  // Prevent circular references
  if (visited.has(data)) {
    return "[Circular Reference]"
  }
  visited.add(data)

  if (Array.isArray(data)) {
    return data
      .map((item) => sanitizeData(item, depth + 1, visited))
      .filter((item) => item !== undefined)
  }

  // Plain objects
  const cleanObj: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (value === undefined || typeof value === "function" || typeof value === "symbol") {
      continue
    }

    const lowerKey = key.toLowerCase()
    if (
      SENSITIVE_KEYS.has(lowerKey) ||
      lowerKey.includes("password") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("token")
    ) {
      cleanObj[key] = "[REDACTED]"
    } else {
      cleanObj[key] = sanitizeData(value, depth + 1, visited)
    }
  }

  return cleanObj
}

export class ActivityLogService {
  /**
   * Records an activity log entry asynchronously and resiliently.
   * If the actor's userId triggers a foreign-key error (e.g. non-existent user),
   * it falls back to recording with userId: null so audit trails are never dropped.
   */
  static async log(params: LogActivityParams): Promise<void> {
    try {
      const sanitizedOld = params.oldData ? (sanitizeData(params.oldData) as Prisma.InputJsonValue) : undefined
      const sanitizedNew = params.newData ? (sanitizeData(params.newData) as Prisma.InputJsonValue) : undefined
      const sanitizedMeta = params.metadata ? (sanitizeData(params.metadata) as Prisma.InputJsonValue) : undefined

      const userRoleStr = Array.isArray(params.actor?.roles)
        ? params.actor?.roles.join(", ")
        : typeof params.actor?.roles === "string"
        ? params.actor?.roles
        : undefined

      const validUserId = params.actor?.id && typeof params.actor.id === "string" && params.actor.id.trim().length > 0
        ? params.actor.id.trim()
        : null

      const baseData = {
        userName: params.actor?.name || null,
        userEmail: params.actor?.email || null,
        userRole: userRoleStr || null,
        action: params.action || ActivityAction.OTHER,
        actionName: params.actionName || "ACTION",
        entity: params.entity || "System",
        entityId: params.entityId ? String(params.entityId).trim() : null,
        description: params.description || null,
        oldData: sanitizedOld,
        newData: sanitizedNew,
        metadata: sanitizedMeta,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      }

      try {
        await prisma.activityLog.create({
          data: {
            userId: validUserId,
            ...baseData,
          },
        })
      } catch (innerError: any) {
        // Fallback: If foreign key on userId failed (e.g. user does not exist in User table), retry with userId: null
        if (validUserId && (innerError?.code === "P2003" || String(innerError?.message).includes("Foreign key constraint"))) {
          await prisma.activityLog.create({
            data: {
              userId: null,
              ...baseData,
              metadata: {
                ...((sanitizedMeta as Record<string, unknown>) || {}),
                _unlinkedUserId: validUserId,
              },
            },
          })
        } else {
          throw innerError
        }
      }
    } catch (error) {
      console.error("[ActivityLogService.log] Failed to write activity log:", error)
    }
  }

  /**
   * Retrieves paginated, searchable, and filterable activity logs.
   */
  static async getLogs(params: GetActivityLogsParams = {}): Promise<{
    logs: ActivityLogSummary[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const page = Math.max(1, Number(params.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20))
    const skip = (page - 1) * limit

    const where: Prisma.ActivityLogWhereInput = {}

    // Action filter
    if (params.action && params.action !== "ALL" && Object.values(ActivityAction).includes(params.action as ActivityAction)) {
      where.action = params.action as ActivityAction
    }

    // Entity filter
    if (params.entity && params.entity !== "ALL" && params.entity.trim()) {
      where.entity = params.entity.trim()
    }

    // Specific actor
    if (params.userId && params.userId !== "ALL" && params.userId.trim()) {
      where.userId = params.userId.trim()
    }

    // Date range with safety validation
    if (params.startDate || params.endDate) {
      const dateCondition: Prisma.DateTimeFilter = {}
      if (params.startDate) {
        const start = new Date(params.startDate)
        if (!isNaN(start.getTime())) {
          dateCondition.gte = start
        }
      }
      if (params.endDate) {
        const end = new Date(params.endDate)
        if (!isNaN(end.getTime())) {
          dateCondition.lte = end
        }
      }
      if (dateCondition.gte || dateCondition.lte) {
        where.createdAt = dateCondition
      }
    }

    // Text search (actor name, email, actionName, entity, entityId, description)
    if (params.search?.trim()) {
      const q = params.search.trim()
      where.OR = [
        { userName: { contains: q, mode: "insensitive" } },
        { userEmail: { contains: q, mode: "insensitive" } },
        { actionName: { contains: q, mode: "insensitive" } },
        { entity: { contains: q, mode: "insensitive" } },
        { entityId: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ]
    }

    const [total, rows] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    const logs: ActivityLogSummary[] = rows.map((r: {
      id: string
      userId: string | null
      userName: string | null
      userEmail: string | null
      userRole: string | null
      action: ActivityAction
      actionName: string
      entity: string
      entityId: string | null
      description: string | null
      oldData: Prisma.JsonValue | null
      newData: Prisma.JsonValue | null
      metadata: Prisma.JsonValue | null
      ipAddress: string | null
      userAgent: string | null
      createdAt: Date
    }) => ({
      id: r.id,
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      userRole: r.userRole,
      action: r.action,
      actionName: r.actionName,
      entity: r.entity,
      entityId: r.entityId,
      description: r.description,
      oldData: r.oldData as any,
      newData: r.newData as any,
      metadata: r.metadata as any,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      createdAt: r.createdAt.toISOString(),
    }))

    return {
      logs,
      total,
      page,
      limit,
      totalPages,
    }
  }

  /**
   * Fetches distinct entity names present in the activity logs to populate filter dropdowns.
   */
  static async getFilterOptions(): Promise<{ entities: string[] }> {
    try {
      const results = await prisma.activityLog.findMany({
        select: { entity: true },
        distinct: ["entity"],
        orderBy: { entity: "asc" },
      })
      const found = results.map((r: { entity: string }) => r.entity).filter(Boolean)
      const standardEntities = [
        "User",
        "Member",
        "MediaTemplate",
        "MediaTemplateAssignment",
        "Settings",
        "Enrollment",
        "Transaction",
        "Course",
        "Event",
        "Post",
        "Achievement",
      ]
      const combined = Array.from(new Set([...found, ...standardEntities])).sort()
      return {
        entities: combined,
      }
    } catch {
      return { entities: ["User", "Member", "MediaTemplate", "MediaTemplateAssignment", "Settings"] }
    }
  }
}
