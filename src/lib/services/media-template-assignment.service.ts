import "server-only"

import prisma from "@/lib/prisma"
import { ApiError } from "@/lib/api-error"
import type { Prisma } from "@/generated/prisma/client"
import {
  Department,
  Role,
  Semester,
  Shift,
  MembershipStatus,
} from "@/generated/prisma/enums"
import type {
  BulkAssignCriteria,
  MediaTemplateSummary,
  TemplateAssignmentSummary,
  TemplateDesign,
} from "@/lib/template-engine/types"

function serializeAssignment(item: {
  id: string
  userId: string
  templateId: string
  assignedById: string | null
  customData: Prisma.JsonValue | null
  status: string
  createdAt: Date
  updatedAt: Date
  template: {
    id: string
    name: string
    description: string | null
    type: string
    width: number
    height: number
    design: Prisma.JsonValue
    isActive: boolean
    mediaId: string
    media: {
      id: string
      name: string
      url: string
      thumbnailUrl: string | null
      width: number | null
      height: number | null
    }
    createdById: string | null
    createdBy?: {
      id: string
      name: string
      email: string
    } | null
    createdAt: Date
    updatedAt: Date
  }
  user?: {
    id: string
    name: string
    email: string
    phone: string | null
    image: string[]
    roles: Role[]
    member: {
      studentId: string | null
      department: string | null
      session: string | null
      shift: string | null
      semester: string | null
    } | null
  } | null
  assignedBy?: {
    id: string
    name: string
  } | null
}): TemplateAssignmentSummary {
  let designObj: TemplateDesign = {
    version: 1,
    width: item.template.width,
    height: item.template.height,
    elements: [],
  }

  if (item.template.design && typeof item.template.design === "object" && !Array.isArray(item.template.design)) {
    designObj = item.template.design as unknown as TemplateDesign
  }

  const templateSummary: MediaTemplateSummary = {
    id: item.template.id,
    name: item.template.name,
    description: item.template.description,
    type: item.template.type as any,
    width: item.template.width,
    height: item.template.height,
    design: designObj,
    isActive: item.template.isActive,
    mediaId: item.template.mediaId,
    media: {
      id: item.template.media.id,
      name: item.template.media.name,
      url: item.template.media.url,
      thumbnailUrl: item.template.media.thumbnailUrl,
      width: item.template.media.width,
      height: item.template.media.height,
    },
    createdById: item.template.createdById,
    createdBy: item.template.createdBy
      ? {
          id: item.template.createdBy.id,
          name: item.template.createdBy.name,
          email: item.template.createdBy.email,
        }
      : null,
    createdAt: item.template.createdAt.toISOString(),
    updatedAt: item.template.updatedAt.toISOString(),
  }

  return {
    id: item.id,
    userId: item.userId,
    templateId: item.templateId,
    template: templateSummary,
    user: item.user
      ? {
          id: item.user.id,
          name: item.user.name,
          email: item.user.email,
          phone: item.user.phone,
          image: item.user.image,
          roles: item.user.roles,
          member: item.user.member
            ? {
                studentId: item.user.member.studentId,
                department: item.user.member.department,
                session: item.user.member.session,
                shift: item.user.member.shift,
                semester: item.user.member.semester,
              }
            : null,
        }
      : null,
    assignedById: item.assignedById,
    assignedBy: item.assignedBy ? { id: item.assignedBy.id, name: item.assignedBy.name } : null,
    customData:
      item.customData && typeof item.customData === "object" && !Array.isArray(item.customData)
        ? (item.customData as Record<string, unknown>)
        : null,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

/**
 * Build Prisma User filter from BulkAssignCriteria
 */
export function buildUserFilterFromCriteria(criteria: BulkAssignCriteria): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {
    isActive: true,
  }

  if (criteria.targetType === "all_users") {
    return where
  }

  if (criteria.targetType === "all_members") {
    where.member = {
      is: {
        status: { in: [MembershipStatus.ACTIVE, MembershipStatus.PENDING] },
      },
    }
    return where
  }

  if (criteria.targetType === "specific_users" && criteria.userIds?.length) {
    where.id = { in: criteria.userIds }
    return where
  }

  // by_filter mode
  const andConditions: Prisma.UserWhereInput[] = []

  if (criteria.roles && criteria.roles.length > 0) {
    const validRoles = criteria.roles.filter((r): r is Role => Object.values(Role).includes(r as Role))
    if (validRoles.length > 0) {
      andConditions.push({
        roles: { hasSome: validRoles },
      })
    }
  }

  const memberConditions: Prisma.MemberWhereInput = {}
  let hasMemberFilter = false

  if (criteria.departments && criteria.departments.length > 0) {
    const validDeps = criteria.departments.filter((d): d is Department => Object.values(Department).includes(d as Department))
    if (validDeps.length > 0) {
      memberConditions.department = { in: validDeps }
      hasMemberFilter = true
    }
  }

  if (criteria.shifts && criteria.shifts.length > 0) {
    const validShifts = criteria.shifts.filter((s): s is Shift => Object.values(Shift).includes(s as Shift))
    if (validShifts.length > 0) {
      memberConditions.shift = { in: validShifts }
      hasMemberFilter = true
    }
  }

  if (criteria.semesters && criteria.semesters.length > 0) {
    const validSemesters = criteria.semesters.filter((s): s is Semester => Object.values(Semester).includes(s as Semester))
    if (validSemesters.length > 0) {
      memberConditions.semester = { in: validSemesters }
      hasMemberFilter = true
    }
  }

  if (criteria.sessions && criteria.sessions.length > 0) {
    memberConditions.session = { in: criteria.sessions }
    hasMemberFilter = true
  }

  if (hasMemberFilter) {
    andConditions.push({
      member: {
        is: memberConditions,
      },
    })
  }

  if (andConditions.length > 0) {
    where.AND = andConditions
  }

  return where
}

/**
 * Count matching users for a given bulk assignment criteria
 */
export async function countMatchingUsers(criteria: BulkAssignCriteria): Promise<{ count: number; sampleUsers: Array<{ id: string; name: string; email: string; department?: string; studentId?: string }> }> {
  const where = buildUserFilterFromCriteria(criteria)

  const [count, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        member: {
          select: {
            department: true,
            studentId: true,
          },
        },
      },
    }),
  ])

  return {
    count,
    sampleUsers: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      department: u.member?.department || undefined,
      studentId: u.member?.studentId || undefined,
    })),
  }
}

/**
 * List all active template assignments for a specific user
 */
export async function listUserTemplateAssignments(userId: string): Promise<TemplateAssignmentSummary[]> {
  const items = await prisma.mediaTemplateAssignment.findMany({
    where: {
      userId,
      status: "ACTIVE",
      template: {
        isActive: true,
      },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      template: {
        include: {
          media: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      assignedBy: {
        select: { id: true, name: true },
      },
    },
  })

  return items.map((item) => serializeAssignment(item as any))
}

/**
 * List assignments for a given template
 */
export async function listTemplateAssignments(
  templateId: string,
  {
    search,
    limit = 50,
    page = 1,
  }: {
    search?: string
    limit?: number
    page?: number
  } = {}
): Promise<{ items: TemplateAssignmentSummary[]; total: number }> {
  const where: Prisma.MediaTemplateAssignmentWhereInput = {
    templateId,
  }

  if (search?.trim()) {
    const q = search.trim()
    where.user = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { member: { studentId: { contains: q, mode: "insensitive" } } },
      ],
    }
  }

  const [total, items] = await Promise.all([
    prisma.mediaTemplateAssignment.count({ where }),
    prisma.mediaTemplateAssignment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        template: {
          include: {
            media: true,
            createdBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            roles: true,
            member: {
              select: {
                studentId: true,
                department: true,
                session: true,
                shift: true,
                semester: true,
              },
            },
          },
        },
        assignedBy: {
          select: { id: true, name: true },
        },
      },
    }),
  ])

  return {
    items: items.map((item) => serializeAssignment(item as any)),
    total,
  }
}

/**
 * Assign a template to specific user(s) or by bulk criteria
 */
export async function assignTemplateToUsers({
  templateId,
  userIds,
  assignedById,
  customData,
}: {
  templateId: string
  userIds: string[]
  assignedById?: string
  customData?: Record<string, unknown>
}): Promise<{ count: number; assignedUserIds: string[] }> {
  const template = await prisma.mediaTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, name: true },
  })

  if (!template) {
    throw ApiError.notFound("Template not found")
  }

  if (!userIds || userIds.length === 0) {
    return { count: 0, assignedUserIds: [] }
  }

  const uniqueUserIds = Array.from(new Set(userIds))

  // Perform bulk upsert
  let assignedCount = 0
  const successfulUserIds: string[] = []

  for (const userId of uniqueUserIds) {
    try {
      await prisma.mediaTemplateAssignment.upsert({
        where: {
          userId_templateId: {
            userId,
            templateId,
          },
        },
        create: {
          userId,
          templateId,
          assignedById,
          customData: customData ? (customData as Prisma.InputJsonValue) : undefined,
          status: "ACTIVE",
        },
        update: {
          assignedById,
          customData: customData ? (customData as Prisma.InputJsonValue) : undefined,
          status: "ACTIVE",
          updatedAt: new Date(),
        },
      })
      assignedCount++
      successfulUserIds.push(userId)
    } catch {
      // Continue next user
    }
  }

  // Create activity log
  try {
    await prisma.activityLog.create({
      data: {
        userId: assignedById,
        actionName: "TEMPLATE_ASSIGNED",
        entity: "MediaTemplate",
        entityId: templateId,
        description: `Assigned template "${template.name}" to ${assignedCount} user(s)`,
        metadata: {
          templateId,
          templateName: template.name,
          assignedCount,
          userIds: successfulUserIds.slice(0, 50),
        },
      },
    })
  } catch {
    // Non-blocking log
  }

  return {
    count: assignedCount,
    assignedUserIds: successfulUserIds,
  }
}

/**
 * Bulk assign template based on criteria
 */
export async function bulkAssignTemplateByCriteria({
  templateId,
  criteria,
  assignedById,
  customData,
}: {
  templateId: string
  criteria: BulkAssignCriteria
  assignedById?: string
  customData?: Record<string, unknown>
}): Promise<{ matchedCount: number; assignedCount: number }> {
  const template = await prisma.mediaTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, name: true },
  })

  if (!template) {
    throw ApiError.notFound("Template not found")
  }

  const where = buildUserFilterFromCriteria(criteria)

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  })

  const userIds = users.map((u) => u.id)
  if (userIds.length === 0) {
    return { matchedCount: 0, assignedCount: 0 }
  }

  const res = await assignTemplateToUsers({
    templateId,
    userIds,
    assignedById,
    customData,
  })

  return {
    matchedCount: userIds.length,
    assignedCount: res.count,
  }
}

/**
 * Unassign template from user
 */
export async function unassignTemplateFromUser({
  templateId,
  userId,
}: {
  templateId: string
  userId: string
}): Promise<void> {
  await prisma.mediaTemplateAssignment.deleteMany({
    where: {
      templateId,
      userId,
    },
  })
}
