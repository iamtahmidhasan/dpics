import "server-only"

import { Prisma } from "@/generated/prisma/client"
import { Role } from "@/generated/prisma/enums"
import { ApiError } from "@/lib/api-error"
import prisma from "@/lib/prisma"
import { resolveUserImage } from "@/lib/user-image"

export const DEFAULT_USER_PAGE_SIZE = 20
export const MAX_USER_PAGE_SIZE = 100
const MAX_SEARCH_LENGTH = 120

export type UserListQuery = {
  search: string | null
  role: Role | null
  page: number
  pageSize: number
}

export type AdminUser = {
  id: string
  name: string
  email: string
  phone: string | null
  roles: Role[]
  isActive: boolean
  emailVerified: boolean
  memberStatus: string | null
  avatar: string | null
  imageCount: number
  selectedImageIndex: number | null
  createdAt: string
}

export type UserListResult = {
  users: AdminUser[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type UserCounts = {
  total: number
  admins: number
  members: number
  instructors: number
  inactive: number
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  roles: true,
  isActive: true,
  emailVerified: true,
  createdAt: true,
  image: true,
  selactedImg: true,
  member: {
    select: {
      status: true,
    },
  },
} as const

function toPositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : Number(value)

  if (!Number.isFinite(parsed) || parsed < 1) return fallback

  return Math.min(parsed, max)
}

function toSearch(value: unknown): string | null {
  const search = typeof value === "string" ? value.trim() : ""

  if (!search) return null

  return search.slice(0, MAX_SEARCH_LENGTH)
}

function toRole(value: unknown): Role | null {
  const role = typeof value === "string" ? value.toUpperCase() : ""

  return (Object.values(Role) as string[]).includes(role) ? (role as Role) : null
}

/** Validates and normalises untrusted query string input. */
export function parseUserListQuery(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): UserListQuery {
  const read = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) return params.get(key) ?? undefined

    const value = params[key]

    return Array.isArray(value) ? value[0] : value
  }

  const pageSize = toPositiveInt(read("pageSize"), DEFAULT_USER_PAGE_SIZE, MAX_USER_PAGE_SIZE)

  return {
    search: toSearch(read("search")),
    role: toRole(read("role")),
    page: toPositiveInt(read("page"), 1, Number.MAX_SAFE_INTEGER),
    pageSize,
  }
}

function buildUserWhere({ search, role }: Pick<UserListQuery, "search" | "role">) {
  const where: Prisma.UserWhereInput = {}

  if (role) where.roles = { has: role }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ]
  }

  return where
}

export async function listUsers(query: UserListQuery): Promise<UserListResult> {
  const where = buildUserWhere(query)

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.user.count({ where }),
  ])

  return {
    users: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      roles: row.roles,
      isActive: row.isActive,
      emailVerified: row.emailVerified,
      memberStatus: row.member?.status ?? null,
      ...resolveUserImage(row.image, row.selactedImg),
      imageCount: row.image.length,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  }
}

export async function getUserById(id: string) {
  if (!id) throw ApiError.badRequest("User id is required")

  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  })

  if (!user) throw ApiError.notFound("User not found")

  return user
}

export async function getUserCounts(): Promise<UserCounts> {
  const [total, admins, members, instructors, inactive] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { roles: { has: Role.ADMIN } } }),
    prisma.user.count({ where: { roles: { has: Role.MEMBER } } }),
    prisma.user.count({ where: { roles: { has: Role.INSTRUCTOR } } }),
    prisma.user.count({ where: { isActive: false } }),
  ])

  return { total, admins, members, instructors, inactive }
}
