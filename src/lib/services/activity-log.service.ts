import prisma from "@/lib/prisma"
import { ActivityAction } from "@/generated/prisma/enums"
import type { Prisma } from "@/generated/prisma/client"

export { ActivityAction }

export interface ActivityLogActor {
  id?: string | null
  name?: string | null
  email?: string | null
  roles?: string[] | null
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
  oldData: Record<string, unknown> | null
  newData: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

// Sensitive fields to strip before logging snapshots
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
])

function sanitizeData(data: unknown, depth = 0): unknown {
  if (depth > 6) return "[Truncated: Max Depth]"
  if (data === null || data === undefined) return null

  if (data instanceof Date) {
    return data.toISOString()
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, depth + 1))
  }

  if (typeof data === "object") {
    const cleanObj: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase()
      if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes("password") || lowerKey.includes("secret")) {
        cleanObj[key] = "[REDACTED]"
      } else {
        cleanObj[key] = sanitizeData(value, depth + 1)
      }
    }
    return cleanObj
  }

  return data
}

export class ActivityLogService {
  /**
   * Records an activity log entry asynchronously without blocking or failing the main request.
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

      await prisma.activityLog.create({
        data: {
          userId: params.actor?.id || null,
          userName: params.actor?.name || null,
          userEmail: params.actor?.email || null,
          userRole: userRoleStr || null,
          action: params.action,
          actionName: params.actionName,
          entity: params.entity,
          entityId: params.entityId ? String(params.entityId) : null,
          description: params.description || null,
          oldData: sanitizedOld,
          newData: sanitizedNew,
          metadata: sanitizedMeta,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      })
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
    if (params.action && params.action !== "ALL") {
      where.action = params.action
    }

    // Entity filter
    if (params.entity && params.entity !== "ALL") {
      where.entity = params.entity
    }

    // Specific actor
    if (params.userId) {
      where.userId = params.userId
    }

    // Date range
    if (params.startDate || params.endDate) {
      where.createdAt = {}
      if (params.startDate) where.createdAt.gte = new Date(params.startDate)
      if (params.endDate) where.createdAt.lte = new Date(params.endDate)
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

    const totalPages = Math.ceil(total / limit) || 1

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
      oldData: (r.oldData as Record<string, unknown>) || null,
      newData: (r.newData as Record<string, unknown>) || null,
      metadata: (r.metadata as Record<string, unknown>) || null,
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
      return {
        entities: results.map((r: { entity: string }) => r.entity).filter(Boolean),
      }
    } catch {
      return { entities: [] }
    }
  }
}
