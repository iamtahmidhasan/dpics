import "server-only"

import { ApiError } from "@/lib/api-error"
import prisma from "@/lib/prisma"
import { resolveUserImage } from "@/lib/user-image"
import {
  isRecord,
  toBoolean,
  toDateTime,
  toOptionalText,
  toText,
} from "@/lib/validation"

export const MAX_COMMITTEE_NAME_LENGTH = 120
export const MAX_COMMITTEE_SLUG_LENGTH = 120
export const MAX_COMMITTEE_DESCRIPTION_LENGTH = 1000

export type CommitteeSummary = {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  rolesCount: number
  membersCount: number
  createdAt: string
  updatedAt: string
}

export type CommitteeRoleDetail = {
  id: string
  committeeId: string
  name: string
  slug: string
  description: string | null
  usersCount: number
  createdAt: string
  updatedAt: string
}

export type CommitteeMemberDetail = {
  id: string
  userId: string
  userName: string
  userEmail: string
  userPhone: string | null
  userAvatar: string | null
  roleId: string
  roleName: string
  roleSlug: string
  startDate: string | null
  endDate: string | null
  isActive: boolean
  createdAt: string
}

export type CommitteeDetail = {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  roles: CommitteeRoleDetail[]
  members: CommitteeMemberDetail[]
}

export type CommitteeInput = {
  name: string
  slug: string
  description: string | null
  isActive: boolean
}

export type CommitteeRoleInput = {
  name: string
  slug: string
  description: string | null
}

export type UserCommitteeRoleInput = {
  userId: string
  roleId: string
  startDate: Date | null
  endDate: Date | null
  isActive: boolean
}

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function listCommittees(): Promise<CommitteeSummary[]> {
  const rows = await prisma.committee.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    include: {
      _count: {
        select: {
          roles: true,
        },
      },
      roles: {
        select: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      },
    },
  })

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    isActive: row.isActive,
    rolesCount: row._count.roles,
    membersCount: row.roles.reduce((acc, r) => acc + r._count.users, 0),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export async function getCommitteeDetail(id: string): Promise<CommitteeDetail> {
  if (!id) throw ApiError.badRequest("Committee id is required")

  const committee = await prisma.committee.findUnique({
    where: { id },
    include: {
      roles: {
        orderBy: { createdAt: "asc" },
        include: {
          _count: {
            select: { users: true },
          },
          users: {
            orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  image: true,
                  selactedImg: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!committee) throw ApiError.notFound("Committee not found")

  const roles: CommitteeRoleDetail[] = committee.roles.map((r) => ({
    id: r.id,
    committeeId: r.committeeId,
    name: r.name,
    slug: r.slug,
    description: r.description,
    usersCount: r._count.users,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))

  const members: CommitteeMemberDetail[] = []
  for (const role of committee.roles) {
    for (const userRole of role.users) {
      const { avatar } = resolveUserImage(userRole.user.image, userRole.user.selactedImg)
      members.push({
        id: userRole.id,
        userId: userRole.user.id,
        userName: userRole.user.name,
        userEmail: userRole.user.email,
        userPhone: userRole.user.phone,
        userAvatar: avatar,
        roleId: role.id,
        roleName: role.name,
        roleSlug: role.slug,
        startDate: toIso(userRole.startDate),
        endDate: toIso(userRole.endDate),
        isActive: userRole.isActive,
        createdAt: userRole.createdAt.toISOString(),
      })
    }
  }

  return {
    id: committee.id,
    name: committee.name,
    slug: committee.slug,
    description: committee.description,
    isActive: committee.isActive,
    createdAt: committee.createdAt.toISOString(),
    updatedAt: committee.updatedAt.toISOString(),
    roles,
    members,
  }
}

export function parseCommitteeInput(body: unknown): CommitteeInput {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

  const name = toText(body.name, "Name", { max: MAX_COMMITTEE_NAME_LENGTH })
  let slug = toOptionalText(body.slug, "Slug", MAX_COMMITTEE_SLUG_LENGTH)

  if (!slug) {
    slug = toSlug(name)
  } else {
    slug = toSlug(slug)
  }

  if (!slug) throw ApiError.badRequest("Slug is required")

  const description = toOptionalText(body.description, "Description", MAX_COMMITTEE_DESCRIPTION_LENGTH)
  const isActive = typeof body.isActive === "boolean" ? body.isActive : toBoolean(body.isActive ?? true, "Is active")

  return { name, slug, description, isActive }
}

export async function createCommittee(input: CommitteeInput): Promise<CommitteeDetail> {
  const existing = await prisma.committee.findUnique({ where: { slug: input.slug } })
  if (existing) throw ApiError.badRequest("A committee with this slug already exists")

  const created = await prisma.committee.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      isActive: input.isActive,
    },
  })

  return getCommitteeDetail(created.id)
}

export async function updateCommittee(
  id: string,
  input: Partial<CommitteeInput>
): Promise<CommitteeDetail> {
  if (!id) throw ApiError.badRequest("Committee id is required")

  const existing = await prisma.committee.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Committee not found")

  if (input.slug && input.slug !== existing.slug) {
    const slugOwner = await prisma.committee.findUnique({ where: { slug: input.slug } })
    if (slugOwner) throw ApiError.badRequest("A committee with this slug already exists")
  }

  await prisma.committee.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      isActive: input.isActive,
    },
  })

  return getCommitteeDetail(id)
}

export async function deleteCommittee(id: string): Promise<void> {
  if (!id) throw ApiError.badRequest("Committee id is required")

  const existing = await prisma.committee.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Committee not found")

  await prisma.committee.delete({ where: { id } })
}

export function parseCommitteeRoleInput(body: unknown): CommitteeRoleInput {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

  const name = toText(body.name, "Name", { max: MAX_COMMITTEE_NAME_LENGTH })
  let slug = toOptionalText(body.slug, "Slug", MAX_COMMITTEE_SLUG_LENGTH)

  if (!slug) {
    slug = toSlug(name)
  } else {
    slug = toSlug(slug)
  }

  if (!slug) throw ApiError.badRequest("Role slug is required")

  const description = toOptionalText(body.description, "Description", MAX_COMMITTEE_DESCRIPTION_LENGTH)

  return { name, slug, description }
}

export async function createCommitteeRole(
  committeeId: string,
  input: CommitteeRoleInput
): Promise<CommitteeRoleDetail> {
  if (!committeeId) throw ApiError.badRequest("Committee id is required")

  const committee = await prisma.committee.findUnique({ where: { id: committeeId } })
  if (!committee) throw ApiError.notFound("Committee not found")

  const existing = await prisma.committeeRole.findUnique({
    where: { committeeId_slug: { committeeId, slug: input.slug } },
  })
  if (existing) throw ApiError.badRequest("A role with this slug already exists in this committee")

  const role = await prisma.committeeRole.create({
    data: {
      committeeId,
      name: input.name,
      slug: input.slug,
      description: input.description,
    },
    include: {
      _count: { select: { users: true } },
    },
  })

  return {
    id: role.id,
    committeeId: role.committeeId,
    name: role.name,
    slug: role.slug,
    description: role.description,
    usersCount: role._count.users,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  }
}

export async function updateCommitteeRole(
  roleId: string,
  input: Partial<CommitteeRoleInput>
): Promise<CommitteeRoleDetail> {
  if (!roleId) throw ApiError.badRequest("Role id is required")

  const existing = await prisma.committeeRole.findUnique({ where: { id: roleId } })
  if (!existing) throw ApiError.notFound("Role not found")

  if (input.slug && input.slug !== existing.slug) {
    const slugOwner = await prisma.committeeRole.findUnique({
      where: { committeeId_slug: { committeeId: existing.committeeId, slug: input.slug } },
    })
    if (slugOwner) throw ApiError.badRequest("A role with this slug already exists in this committee")
  }

  const role = await prisma.committeeRole.update({
    where: { id: roleId },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
    },
    include: {
      _count: { select: { users: true } },
    },
  })

  return {
    id: role.id,
    committeeId: role.committeeId,
    name: role.name,
    slug: role.slug,
    description: role.description,
    usersCount: role._count.users,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  }
}

export async function deleteCommitteeRole(roleId: string): Promise<void> {
  if (!roleId) throw ApiError.badRequest("Role id is required")

  const existing = await prisma.committeeRole.findUnique({ where: { id: roleId } })
  if (!existing) throw ApiError.notFound("Role not found")

  await prisma.committeeRole.delete({ where: { id: roleId } })
}

export function parseUserCommitteeRoleInput(body: unknown): UserCommitteeRoleInput {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

  const userId = toText(body.userId, "User id", { max: 120 })
  const roleId = toText(body.roleId, "Role id", { max: 120 })
  const startDate = toDateTime(body.startDate, "Start date")
  const endDate = toDateTime(body.endDate, "End date")
  const isActive = typeof body.isActive === "boolean" ? body.isActive : toBoolean(body.isActive ?? true, "Is active")

  return { userId, roleId, startDate, endDate, isActive }
}

export async function assignUserCommitteeRole(
  input: UserCommitteeRoleInput
): Promise<CommitteeMemberDetail> {
  const user = await prisma.user.findUnique({ where: { id: input.userId } })
  if (!user) throw ApiError.notFound("User not found")

  const role = await prisma.committeeRole.findUnique({
    where: { id: input.roleId },
    include: { committee: true },
  })
  if (!role) throw ApiError.notFound("Role not found")

  const existing = await prisma.userCommitteeRole.findUnique({
    where: { userId_roleId: { userId: input.userId, roleId: input.roleId } },
  })

  let record
  if (existing) {
    record = await prisma.userCommitteeRole.update({
      where: { id: existing.id },
      data: {
        startDate: input.startDate,
        endDate: input.endDate,
        isActive: input.isActive,
      },
    })
  } else {
    record = await prisma.userCommitteeRole.create({
      data: {
        userId: input.userId,
        roleId: input.roleId,
        startDate: input.startDate,
        endDate: input.endDate,
        isActive: input.isActive,
      },
    })
  }

  const { avatar } = resolveUserImage(user.image, user.selactedImg)

  return {
    id: record.id,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userPhone: user.phone,
    userAvatar: avatar,
    roleId: role.id,
    roleName: role.name,
    roleSlug: role.slug,
    startDate: toIso(record.startDate),
    endDate: toIso(record.endDate),
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
  }
}

export async function updateUserCommitteeRole(
  id: string,
  input: { roleId?: string; startDate?: Date | null; endDate?: Date | null; isActive?: boolean }
): Promise<void> {
  if (!id) throw ApiError.badRequest("Assignment id is required")

  const existing = await prisma.userCommitteeRole.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Committee role assignment not found")

  await prisma.userCommitteeRole.update({
    where: { id },
    data: {
      roleId: input.roleId,
      startDate: input.startDate,
      endDate: input.endDate,
      isActive: input.isActive,
    },
  })
}

export async function removeUserCommitteeRole(id: string): Promise<void> {
  if (!id) throw ApiError.badRequest("Assignment id is required")

  const existing = await prisma.userCommitteeRole.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Committee role assignment not found")

  await prisma.userCommitteeRole.delete({ where: { id } })
}

export type CommitteeOption = {
  id: string
  name: string
  slug: string
  isActive: boolean
  roles: {
    id: string
    name: string
    slug: string
  }[]
}

export async function listCommitteeOptions(): Promise<CommitteeOption[]> {
  const committees = await prisma.committee.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      roles: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })

  return committees
}

export type AssignableUserSummary = {
  id: string
  name: string
  email: string
  phone: string | null
  avatar: string | null
}

export async function searchAssignableUsers(query?: string | null): Promise<AssignableUserSummary[]> {
  const q = query?.trim()
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {}

  const users = await prisma.user.findMany({
    where,
    orderBy: { name: "asc" },
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      selactedImg: true,
    },
  })

  return users.map((u) => {
    const { avatar } = resolveUserImage(u.image, u.selactedImg)
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      avatar,
    }
  })
}

export type AboutLeader = {
  id: string
  name: string
  role: string
  roleSlug: string
  avatar: string | null
  initials: string
}

export type AboutCommitteeData = {
  committeeName: string
  committeeDescription: string | null
  members: AboutLeader[]
}

export async function getActiveCommitteeForAbout(): Promise<AboutCommitteeData | null> {
  const committee = await prisma.committee.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      roles: {
        orderBy: { createdAt: "asc" },
        include: {
          users: {
            where: { isActive: true },
            orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  selactedImg: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!committee) return null

  const members: AboutLeader[] = []

  for (const role of committee.roles) {
    for (const userRole of role.users) {
      const { avatar } = resolveUserImage(userRole.user.image, userRole.user.selactedImg)
      const initials = (userRole.user.name || "U")
        .trim()
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()

      members.push({
        id: userRole.id,
        name: userRole.user.name,
        role: role.name,
        roleSlug: role.slug,
        avatar,
        initials: initials || "DP",
      })
    }
  }

  return {
    committeeName: committee.name,
    committeeDescription: committee.description,
    members,
  }
}

