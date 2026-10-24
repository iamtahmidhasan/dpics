import prisma from "@/lib/prisma"
import { CourseLevel } from "@/generated/prisma/enums"
import { parseArrayField, parseBooleanField } from "../csv-utils"
import type { ImportOptions, ImportResult } from "../types"

export async function exportCourses(): Promise<Record<string, unknown>[]> {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          sections: true,
          enrollments: true,
        },
      },
    },
  })

  return courses.map((c) => ({
    title: c.title,
    titleBn: c.titleBn || "",
    slug: c.slug,
    excerpt: c.excerpt || "",
    excerptBn: c.excerptBn || "",
    description: c.description || "",
    descriptionBn: c.descriptionBn || "",
    thumbnail: c.thumbnail || "",
    level: c.level,
    isFree: c.isFree,
    price: c.price,
    discountPrice: c.discountPrice || "",
    isPublished: c.isPublished,
    featured: c.featured,
    tags: c.tags.join(","),
    sectionsCount: c._count.sections,
    enrollmentsCount: c._count.enrollments,
    createdAt: c.createdAt.toISOString(),
  }))
}

export async function importCourses(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    entity: "courses",
    format: "csv",
    totalRows: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    dryRun: !!options.dryRun,
    errors: [],
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1

    const title = String(row.title || "").trim()
    const slug = String(row.slug || "").trim().toLowerCase()

    if (!title || !slug) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: slug || title || "unknown",
        message: "Title and slug are required",
      })
      continue
    }

    const levelStr = String(row.level || "").trim().toUpperCase()
    const level = levelStr in CourseLevel ? (levelStr as CourseLevel) : CourseLevel.ALL_LEVELS

    const isFree = parseBooleanField(row.isFree, true)
    const price = Number(row.price) || 0
    const discountPrice = row.discountPrice ? Number(row.discountPrice) || null : null
    const isPublished = parseBooleanField(row.isPublished, false)
    const featured = parseBooleanField(row.featured, false)
    const tags = parseArrayField(row.tags)

    const createdById = options.actor?.id || null

    if (options.dryRun) {
      const existing = await prisma.course.findUnique({ where: { slug } })
      if (existing) {
        if (options.mode === "upsert") {
          result.updated++
        } else {
          result.skipped++
        }
      } else {
        result.created++
      }
      continue
    }

    try {
      const existing = await prisma.course.findUnique({ where: { slug } })

      if (existing) {
        if (options.mode === "create_only") {
          result.skipped++
          continue
        }

        await prisma.course.update({
          where: { id: existing.id },
          data: {
            title,
            titleBn: row.titleBn ? String(row.titleBn).trim() : existing.titleBn,
            excerpt: row.excerpt ? String(row.excerpt).trim() : existing.excerpt,
            excerptBn: row.excerptBn ? String(row.excerptBn).trim() : existing.excerptBn,
            description: row.description ? String(row.description).trim() : existing.description,
            descriptionBn: row.descriptionBn ? String(row.descriptionBn).trim() : existing.descriptionBn,
            thumbnail: row.thumbnail ? String(row.thumbnail).trim() : existing.thumbnail,
            level,
            isFree,
            price,
            discountPrice,
            isPublished,
            featured,
            tags: tags.length > 0 ? tags : existing.tags,
          },
        })
        result.updated++
      } else {
        await prisma.course.create({
          data: {
            title,
            titleBn: row.titleBn ? String(row.titleBn).trim() : null,
            slug,
            excerpt: row.excerpt ? String(row.excerpt).trim() : null,
            excerptBn: row.excerptBn ? String(row.excerptBn).trim() : null,
            description: row.description ? String(row.description).trim() : null,
            descriptionBn: row.descriptionBn ? String(row.descriptionBn).trim() : null,
            thumbnail: row.thumbnail ? String(row.thumbnail).trim() : null,
            level,
            isFree,
            price,
            discountPrice,
            isPublished,
            featured,
            tags,
            createdById,
          },
        })
        result.created++
      }
    } catch (err: unknown) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: slug,
        message: err instanceof Error ? err.message : "Database error",
      })
    }
  }

  result.success = result.failed === 0
  return result
}
