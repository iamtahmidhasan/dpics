import "server-only"

import { Prisma } from "@/generated/prisma/client"
import { CategoryType } from "@/generated/prisma/enums"
import { ApiError } from "@/lib/api-error"
import prisma from "@/lib/prisma"
import { isRecord, toBoolean, toEnum, toOptionalText, toText } from "@/lib/validation"

import {
  CATEGORY_TYPES,
  CATEGORY_TYPE_META,
  MAX_CATEGORY_DESCRIPTION_LENGTH,
  MAX_CATEGORY_NAME_LENGTH,
  MAX_CATEGORY_SLUG_LENGTH,
  toCategorySlug,
  type CategoryInput,
  type CategorySummary,
} from "@/lib/category-constants"

export {
  CATEGORY_TYPES,
  CATEGORY_TYPE_META,
  MAX_CATEGORY_DESCRIPTION_LENGTH,
  MAX_CATEGORY_NAME_LENGTH,
  MAX_CATEGORY_SLUG_LENGTH,
  toCategorySlug,
  type CategoryInput,
  type CategorySummary,
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

// ============================================================================
// Input Parsers
// ============================================================================

export function parseCategoryInput(body: unknown): CategoryInput {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

  const type = toEnum(
    String(body.type ?? "").toUpperCase(),
    "Category type",
    CATEGORY_TYPES
  )
  const name = toText(body.name, "Name", { max: MAX_CATEGORY_NAME_LENGTH })
  const nameBn = toOptionalText(body.nameBn, "Name (Bangla)", MAX_CATEGORY_NAME_LENGTH)
  const rawSlug = toOptionalText(body.slug, "Slug", MAX_CATEGORY_SLUG_LENGTH)
  const slug = toCategorySlug(rawSlug || name)

  if (!slug) throw ApiError.badRequest("Slug is required")

  return {
    type,
    name,
    nameBn,
    slug,
    description: toOptionalText(body.description, "Description", MAX_CATEGORY_DESCRIPTION_LENGTH),
    isActive: toBoolean(body.isActive ?? true, "Is active"),
  }
}

export function parseCategoryUpdateInput(body: unknown): Partial<CategoryInput> {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

  const update: Partial<CategoryInput> = {}

  if (body.type !== undefined) {
    update.type = toEnum(
      String(body.type).toUpperCase(),
      "Category type",
      CATEGORY_TYPES
    )
  }
  if (body.name !== undefined) {
    update.name = toText(body.name, "Name", { max: MAX_CATEGORY_NAME_LENGTH })
  }
  if (body.nameBn !== undefined) {
    update.nameBn = toOptionalText(body.nameBn, "Name (Bangla)", MAX_CATEGORY_NAME_LENGTH)
  }
  if (body.slug !== undefined) {
    const slug = toCategorySlug(toText(body.slug, "Slug", { max: MAX_CATEGORY_SLUG_LENGTH }))
    if (!slug) throw ApiError.badRequest("Slug is required")
    update.slug = slug
  }
  if (body.description !== undefined) {
    update.description = toOptionalText(body.description, "Description", MAX_CATEGORY_DESCRIPTION_LENGTH)
  }
  if (body.isActive !== undefined) {
    update.isActive = toBoolean(body.isActive, "Is active")
  }

  return update
}

// ============================================================================
// Category Operations
// ============================================================================

export async function listCategories(options?: {
  type?: CategoryType | string
  activeOnly?: boolean
  search?: string
}): Promise<CategorySummary[]> {
  let resolvedType: CategoryType | undefined = undefined
  if (options?.type) {
    const upper = options.type.toUpperCase()
    if (CATEGORY_TYPES.includes(upper as CategoryType)) {
      resolvedType = upper as CategoryType
    }
  }

  const where: Prisma.CategoryWhereInput = {
    ...(resolvedType ? { type: resolvedType } : {}),
    ...(options?.activeOnly ? { isActive: true } : {}),
    ...(options?.search
      ? {
          OR: [
            { name: { contains: options.search, mode: "insensitive" } },
            { nameBn: { contains: options.search, mode: "insensitive" } },
            { slug: { contains: options.search, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const rows = await prisma.category.findMany({
    where,
    orderBy: [{ type: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: { posts: true },
      },
    },
  })

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    name: row.name,
    nameBn: row.nameBn,
    slug: row.slug,
    description: row.description,
    isActive: row.isActive,
    postsCount: row._count.posts,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export async function getCategoryById(id: string): Promise<CategorySummary> {
  const row = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  })

  if (!row) throw ApiError.notFound("Category not found")

  return {
    id: row.id,
    type: row.type,
    name: row.name,
    nameBn: row.nameBn,
    slug: row.slug,
    description: row.description,
    isActive: row.isActive,
    postsCount: row._count.posts,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function createCategory(input: CategoryInput): Promise<CategorySummary> {
  try {
    const created = await prisma.category.create({
      data: {
        type: input.type,
        name: input.name,
        nameBn: input.nameBn,
        slug: input.slug,
        description: input.description,
        isActive: input.isActive,
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    return {
      id: created.id,
      type: created.type,
      name: created.name,
      nameBn: created.nameBn,
      slug: created.slug,
      description: created.description,
      isActive: created.isActive,
      postsCount: created._count.posts,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw ApiError.badRequest("A category with this slug already exists in this category type")
    }
    throw error
  }
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>
): Promise<CategorySummary> {
  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Category not found")

  try {
    const updated = await prisma.category.update({
      where: { id },
      data: input,
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    return {
      id: updated.id,
      type: updated.type,
      name: updated.name,
      nameBn: updated.nameBn,
      slug: updated.slug,
      description: updated.description,
      isActive: updated.isActive,
      postsCount: updated._count.posts,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw ApiError.badRequest("A category with this slug already exists in this category type")
    }
    throw error
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const existing = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  })

  if (!existing) throw ApiError.notFound("Category not found")

  if (existing._count.posts > 0) {
    throw ApiError.badRequest(
      `Cannot delete category '${existing.name}' because ${existing._count.posts} post(s) are assigned to it. Reassign or remove those posts first.`
    )
  }

  await prisma.category.delete({ where: { id } })
}
