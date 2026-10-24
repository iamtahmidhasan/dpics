import prisma from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"
import { CategoryType, PostStatus } from "@/generated/prisma/enums"
import {
  parseArrayField,
  parseBooleanField,
  parseDateField,
  parseJsonField,
  serializeArrayField,
} from "../csv-utils"
import type { ImportOptions, ImportResult } from "../types"

// ==========================================
// CATEGORIES
// ==========================================
export async function exportCategories(): Promise<Record<string, unknown>[]> {
  const categories = await prisma.category.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
  })

  return categories.map((c) => ({
    type: c.type,
    name: c.name,
    nameBn: c.nameBn || "",
    slug: c.slug,
    description: c.description || "",
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
  }))
}

export async function importCategories(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    entity: "category",
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

    const typeStr = String(row.type || "").trim().toUpperCase()
    const type = typeStr in CategoryType ? (typeStr as CategoryType) : CategoryType.POST
    const name = String(row.name || "").trim()
    const slug = String(row.slug || "").trim().toLowerCase()

    if (!name || !slug) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: slug || name || "unknown",
        message: "Category name and slug are required",
      })
      continue
    }

    const nameBn = row.nameBn ? String(row.nameBn).trim() : null
    const description = row.description ? String(row.description).trim() : null
    const isActive = parseBooleanField(row.isActive, true)

    if (options.dryRun) {
      const existing = await prisma.category.findUnique({
        where: { type_slug: { type, slug } },
      })
      if (existing) {
        if (options.mode === "upsert") result.updated++
        else result.skipped++
      } else {
        result.created++
      }
      continue
    }

    try {
      const existing = await prisma.category.findUnique({
        where: { type_slug: { type, slug } },
      })

      if (existing) {
        if (options.mode === "create_only") {
          result.skipped++
          continue
        }

        await prisma.category.update({
          where: { id: existing.id },
          data: { name, nameBn, description, isActive },
        })
        result.updated++
      } else {
        await prisma.category.create({
          data: { type, name, nameBn, slug, description, isActive },
        })
        result.created++
      }
    } catch (err: unknown) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: `${type}:${slug}`,
        message: err instanceof Error ? err.message : "Database error",
      })
    }
  }

  result.success = result.failed === 0
  return result
}

// ==========================================
// POSTS
// ==========================================
export async function exportPosts(): Promise<Record<string, unknown>[]> {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { slug: true } },
      author: { select: { email: true } },
    },
  })

  return posts.map((p) => ({
    title: p.title,
    titleBn: p.titleBn || "",
    slug: p.slug,
    excerpt: p.excerpt || "",
    excerptBn: p.excerptBn || "",
    content: p.content,
    contentBn: p.contentBn || "",
    coverImage: p.coverImage || "",
    ogImage: p.ogImage || "",
    seoTitle: p.seoTitle || "",
    seoDescription: p.seoDescription || "",
    massageForAuthor: p.massageForAuthor || "",
    categorySlug: p.category?.slug || "",
    tags: p.tags.join(","),
    isFeatured: p.isFeatured,
    status: p.status,
    authorEmail: p.author.email,
    readingMinutes: p.readingMinutes,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : "",
    createdAt: p.createdAt.toISOString(),
  }))
}

export async function importPosts(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    entity: "posts",
    format: "csv",
    totalRows: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    dryRun: !!options.dryRun,
    errors: [],
  }

  const categories = await prisma.category.findMany({
    where: { type: "POST" },
    select: { id: true, slug: true },
  })
  const categoryMap = new Map(categories.map((c) => [c.slug.toLowerCase().trim(), c.id]))

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1

    const title = String(row.title || "").trim()
    const slug = String(row.slug || "").trim().toLowerCase()
    const content = String(row.content || "").trim()

    if (!title || !slug || !content) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: slug || title || "unknown",
        message: "Title, slug, and content are required for posts",
      })
      continue
    }

    const categorySlug = String(row.categorySlug || "").trim().toLowerCase()
    const categoryId = categorySlug ? categoryMap.get(categorySlug) || null : null

    let authorId = options.actor?.id || null
    const authorEmail = String(row.authorEmail || "").trim().toLowerCase()
    if (authorEmail) {
      const author = await prisma.user.findUnique({
        where: { email: authorEmail },
        select: { id: true },
      })
      if (author) authorId = author.id
    }
    if (!authorId) {
      const fallbackAdmin = await prisma.user.findFirst({
        where: { roles: { has: "ADMIN" } },
        select: { id: true },
      })
      authorId = fallbackAdmin?.id || null
    }

    if (!authorId) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: slug,
        message: "Author not found",
      })
      continue
    }

    const statusStr = String(row.status || "").trim().toUpperCase()
    const status = statusStr in PostStatus ? (statusStr as PostStatus) : PostStatus.PUBLISHED
    const tags = parseArrayField(row.tags)
    const isFeatured = parseBooleanField(row.isFeatured, false)
    const readingMinutes = Number(row.readingMinutes) || Math.max(1, Math.ceil(content.split(/\s+/).length / 200))

    const coverImage = row.coverImage ? String(row.coverImage).trim() : null
    const ogImage = row.ogImage ? String(row.ogImage).trim() : null
    const seoTitle = row.seoTitle ? String(row.seoTitle).trim() : null
    const seoDescription = row.seoDescription ? String(row.seoDescription).trim() : null
    const massageForAuthor = row.massageForAuthor ? String(row.massageForAuthor).trim() : null
    const publishedAt = parseDateField(row.publishedAt)

    if (options.dryRun) {
      const existing = await prisma.post.findUnique({ where: { slug } })
      if (existing) {
        if (options.mode === "upsert") result.updated++
        else result.skipped++
      } else {
        result.created++
      }
      continue
    }

    try {
      const existing = await prisma.post.findUnique({ where: { slug } })

      if (existing) {
        if (options.mode === "create_only") {
          result.skipped++
          continue
        }

        await prisma.post.update({
          where: { id: existing.id },
          data: {
            title,
            titleBn: row.titleBn ? String(row.titleBn).trim() : existing.titleBn,
            excerpt: row.excerpt ? String(row.excerpt).trim() : existing.excerpt,
            excerptBn: row.excerptBn ? String(row.excerptBn).trim() : existing.excerptBn,
            content,
            contentBn: row.contentBn ? String(row.contentBn).trim() : existing.contentBn,
            coverImage: coverImage !== null ? coverImage : existing.coverImage,
            ogImage: ogImage !== null ? ogImage : existing.ogImage,
            seoTitle: seoTitle !== null ? seoTitle : existing.seoTitle,
            seoDescription: seoDescription !== null ? seoDescription : existing.seoDescription,
            massageForAuthor: massageForAuthor !== null ? massageForAuthor : existing.massageForAuthor,
            categoryId: categoryId || existing.categoryId,
            tags: tags.length > 0 ? tags : existing.tags,
            isFeatured,
            status,
            readingMinutes,
            publishedAt: status === PostStatus.PUBLISHED ? publishedAt || existing.publishedAt || new Date() : null,
          },
        })
        result.updated++
      } else {
        await prisma.post.create({
          data: {
            title,
            titleBn: row.titleBn ? String(row.titleBn).trim() : null,
            slug,
            excerpt: row.excerpt ? String(row.excerpt).trim() : null,
            excerptBn: row.excerptBn ? String(row.excerptBn).trim() : null,
            content,
            contentBn: row.contentBn ? String(row.contentBn).trim() : null,
            coverImage,
            ogImage,
            seoTitle,
            seoDescription,
            massageForAuthor,
            categoryId,
            tags,
            isFeatured,
            status,
            readingMinutes,
            authorId,
            publishedAt: status === PostStatus.PUBLISHED ? publishedAt || new Date() : null,
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

// ==========================================
// PROJECTS
// ==========================================
export async function exportProjects(): Promise<Record<string, unknown>[]> {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { slug: true } },
      author: { select: { email: true } },
    },
  })

  return projects.map((p) => ({
    title: p.title,
    titleBn: p.titleBn || "",
    slug: p.slug,
    excerpt: p.excerpt || "",
    excerptBn: p.excerptBn || "",
    description: p.description,
    descriptionBn: p.descriptionBn || "",
    coverImage: p.coverImage || "",
    images: serializeArrayField(p.images, true),
    liveUrl: p.liveUrl || "",
    githubUrl: p.githubUrl || "",
    youtubeUrl: p.youtubeUrl || "",
    techStack: serializeArrayField(p.techStack),
    tags: serializeArrayField(p.tags),
    teamMembers: p.teamMembers
      ? typeof p.teamMembers === "string"
        ? p.teamMembers
        : JSON.stringify(p.teamMembers)
      : "",
    isFeatured: p.isFeatured,
    categorySlug: p.category?.slug || "",
    status: p.status,
    authorEmail: p.author.email,
    createdAt: p.createdAt.toISOString(),
  }))
}

export async function importProjects(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    entity: "projects",
    format: "csv",
    totalRows: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    dryRun: !!options.dryRun,
    errors: [],
  }

  const categories = await prisma.category.findMany({
    where: { type: "PROJECT" },
    select: { id: true, slug: true },
  })
  const categoryMap = new Map(categories.map((c) => [c.slug.toLowerCase().trim(), c.id]))

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1

    const title = String(row.title || "").trim()
    const slug = String(row.slug || "").trim().toLowerCase()
    const description = String(row.description || "").trim()

    if (!title || !slug || !description) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: slug || title || "unknown",
        message: "Title, slug, and description are required for projects",
      })
      continue
    }

    const categorySlug = String(row.categorySlug || "").trim().toLowerCase()
    const categoryId = categorySlug ? categoryMap.get(categorySlug) || null : null

    let authorId = options.actor?.id || null
    const authorEmail = String(row.authorEmail || "").trim().toLowerCase()
    if (authorEmail) {
      const author = await prisma.user.findUnique({
        where: { email: authorEmail },
        select: { id: true },
      })
      if (author) authorId = author.id
    }
    if (!authorId) {
      const fallbackAdmin = await prisma.user.findFirst({
        where: { roles: { has: "ADMIN" } },
        select: { id: true },
      })
      authorId = fallbackAdmin?.id || null
    }

    if (!authorId) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: slug,
        message: "Author not found",
      })
      continue
    }

    const statusStr = String(row.status || "").trim().toUpperCase()
    const status = statusStr in PostStatus ? (statusStr as PostStatus) : PostStatus.PUBLISHED
    const techStack = parseArrayField(row.techStack)
    const tags = parseArrayField(row.tags)
    const isFeatured = parseBooleanField(row.isFeatured, false)

    // Image and Media fields
    const coverImage = row.coverImage ? String(row.coverImage).trim() : null
    const images = parseArrayField(row.images, true)
    const teamMembersRaw = parseJsonField<unknown>(row.teamMembers, null)
    const teamMembers = teamMembersRaw ? (teamMembersRaw as Prisma.InputJsonValue) : null

    if (options.dryRun) {
      const existing = await prisma.project.findUnique({ where: { slug } })
      if (existing) {
        if (options.mode === "upsert") result.updated++
        else result.skipped++
      } else {
        result.created++
      }
      continue
    }

    try {
      const existing = await prisma.project.findUnique({ where: { slug } })

      if (existing) {
        if (options.mode === "create_only") {
          result.skipped++
          continue
        }

        await prisma.project.update({
          where: { id: existing.id },
          data: {
            title,
            titleBn: row.titleBn ? String(row.titleBn).trim() : existing.titleBn,
            excerpt: row.excerpt ? String(row.excerpt).trim() : existing.excerpt,
            excerptBn: row.excerptBn ? String(row.excerptBn).trim() : existing.excerptBn,
            description,
            descriptionBn: row.descriptionBn ? String(row.descriptionBn).trim() : existing.descriptionBn,
            coverImage: coverImage !== null ? coverImage : existing.coverImage,
            images: images.length > 0 ? images : existing.images,
            liveUrl: row.liveUrl ? String(row.liveUrl).trim() : existing.liveUrl,
            githubUrl: row.githubUrl ? String(row.githubUrl).trim() : existing.githubUrl,
            youtubeUrl: row.youtubeUrl ? String(row.youtubeUrl).trim() : existing.youtubeUrl,
            techStack: techStack.length > 0 ? techStack : existing.techStack,
            tags: tags.length > 0 ? tags : existing.tags,
            teamMembers: teamMembers !== null ? teamMembers : existing.teamMembers ?? undefined,
            categoryId: categoryId || existing.categoryId,
            isFeatured,
            status,
          },
        })
        result.updated++
      } else {
        await prisma.project.create({
          data: {
            title,
            titleBn: row.titleBn ? String(row.titleBn).trim() : null,
            slug,
            excerpt: row.excerpt ? String(row.excerpt).trim() : null,
            excerptBn: row.excerptBn ? String(row.excerptBn).trim() : null,
            description,
            descriptionBn: row.descriptionBn ? String(row.descriptionBn).trim() : null,
            coverImage,
            images,
            liveUrl: row.liveUrl ? String(row.liveUrl).trim() : null,
            githubUrl: row.githubUrl ? String(row.githubUrl).trim() : null,
            youtubeUrl: row.youtubeUrl ? String(row.youtubeUrl).trim() : null,
            techStack,
            tags,
            teamMembers: teamMembers !== null ? teamMembers : undefined,
            categoryId,
            isFeatured,
            status,
            authorId,
            publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
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

// ==========================================
// ACHIEVEMENTS
// ==========================================
export async function exportAchievements(): Promise<Record<string, unknown>[]> {
  const achievements = await prisma.achievement.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { slug: true } },
      author: { select: { email: true } },
    },
  })

  return achievements.map((a) => ({
    title: a.title,
    titleBn: a.titleBn || "",
    slug: a.slug,
    excerpt: a.excerpt || "",
    excerptBn: a.excerptBn || "",
    content: a.content,
    contentBn: a.contentBn || "",
    coverImage: a.coverImage || "",
    images: serializeArrayField(a.images, true),
    eventDate: a.eventDate ? a.eventDate.toISOString().slice(0, 10) : "",
    organization: a.organization || "",
    organizationBn: a.organizationBn || "",
    certificateUrl: a.certificateUrl || "",
    categorySlug: a.category?.slug || "",
    tags: a.tags.join(","),
    isFeatured: a.isFeatured,
    status: a.status,
    authorEmail: a.author.email,
    createdAt: a.createdAt.toISOString(),
  }))
}

export async function importAchievements(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    entity: "achievements",
    format: "csv",
    totalRows: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    dryRun: !!options.dryRun,
    errors: [],
  }

  const categories = await prisma.category.findMany({
    where: { type: "ACHIEVEMENT" },
    select: { id: true, slug: true },
  })
  const categoryMap = new Map(categories.map((c) => [c.slug.toLowerCase().trim(), c.id]))

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1

    const title = String(row.title || "").trim()
    const slug = String(row.slug || "").trim().toLowerCase()
    const content = String(row.content || "").trim()

    if (!title || !slug || !content) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: slug || title || "unknown",
        message: "Title, slug, and content are required for achievements",
      })
      continue
    }

    const categorySlug = String(row.categorySlug || "").trim().toLowerCase()
    const categoryId = categorySlug ? categoryMap.get(categorySlug) || null : null

    let authorId = options.actor?.id || null
    const authorEmail = String(row.authorEmail || "").trim().toLowerCase()
    if (authorEmail) {
      const author = await prisma.user.findUnique({
        where: { email: authorEmail },
        select: { id: true },
      })
      if (author) authorId = author.id
    }
    if (!authorId) {
      const fallbackAdmin = await prisma.user.findFirst({
        where: { roles: { has: "ADMIN" } },
        select: { id: true },
      })
      authorId = fallbackAdmin?.id || null
    }

    if (!authorId) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: slug,
        message: "Author not found",
      })
      continue
    }

    const eventDate = parseDateField(row.eventDate)
    const statusStr = String(row.status || "").trim().toUpperCase()
    const status = statusStr in PostStatus ? (statusStr as PostStatus) : PostStatus.PUBLISHED
    const tags = parseArrayField(row.tags)
    const isFeatured = parseBooleanField(row.isFeatured, false)

    // Image fields
    const coverImage = row.coverImage ? String(row.coverImage).trim() : null
    const images = parseArrayField(row.images, true)
    const certificateUrl = row.certificateUrl ? String(row.certificateUrl).trim() : null

    if (options.dryRun) {
      const existing = await prisma.achievement.findUnique({ where: { slug } })
      if (existing) {
        if (options.mode === "upsert") result.updated++
        else result.skipped++
      } else {
        result.created++
      }
      continue
    }

    try {
      const existing = await prisma.achievement.findUnique({ where: { slug } })

      if (existing) {
        if (options.mode === "create_only") {
          result.skipped++
          continue
        }

        await prisma.achievement.update({
          where: { id: existing.id },
          data: {
            title,
            titleBn: row.titleBn ? String(row.titleBn).trim() : existing.titleBn,
            excerpt: row.excerpt ? String(row.excerpt).trim() : existing.excerpt,
            excerptBn: row.excerptBn ? String(row.excerptBn).trim() : existing.excerptBn,
            content,
            contentBn: row.contentBn ? String(row.contentBn).trim() : existing.contentBn,
            coverImage: coverImage !== null ? coverImage : existing.coverImage,
            images: images.length > 0 ? images : existing.images,
            eventDate: eventDate || existing.eventDate,
            organization: row.organization ? String(row.organization).trim() : existing.organization,
            organizationBn: row.organizationBn ? String(row.organizationBn).trim() : existing.organizationBn,
            certificateUrl: certificateUrl !== null ? certificateUrl : existing.certificateUrl,
            categoryId: categoryId || existing.categoryId,
            tags: tags.length > 0 ? tags : existing.tags,
            isFeatured,
            status,
          },
        })
        result.updated++
      } else {
        await prisma.achievement.create({
          data: {
            title,
            titleBn: row.titleBn ? String(row.titleBn).trim() : null,
            slug,
            excerpt: row.excerpt ? String(row.excerpt).trim() : null,
            excerptBn: row.excerptBn ? String(row.excerptBn).trim() : null,
            content,
            contentBn: row.contentBn ? String(row.contentBn).trim() : null,
            coverImage,
            images,
            eventDate,
            organization: row.organization ? String(row.organization).trim() : null,
            organizationBn: row.organizationBn ? String(row.organizationBn).trim() : null,
            certificateUrl,
            categoryId,
            tags,
            isFeatured,
            status,
            authorId,
            publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
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
