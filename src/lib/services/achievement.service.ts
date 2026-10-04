import "server-only"

import { Prisma } from "@/generated/prisma/client"
import { PostStatus } from "@/generated/prisma/enums"
import { ApiError } from "@/lib/api-error"
import { deriveExcerpt, stripMarkdown } from "@/lib/markdown"
import prisma from "@/lib/prisma"
import { resolveUserImage } from "@/lib/user-image"
import {
  isRecord,
  toBoolean,
  toEnum,
  toOptionalText,
  toText,
  toUrl,
} from "@/lib/validation"
import {
  DEFAULT_ACHIEVEMENT_PAGE_SIZE,
  MAX_ACHIEVEMENT_CONTENT_LENGTH,
  MAX_ACHIEVEMENT_EXCERPT_LENGTH,
  MAX_ACHIEVEMENT_IMAGES,
  MAX_ACHIEVEMENT_ORGANIZATION_LENGTH,
  MAX_ACHIEVEMENT_PAGE_SIZE,
  MAX_ACHIEVEMENT_SLUG_LENGTH,
  MAX_ACHIEVEMENT_TAGS,
  MAX_ACHIEVEMENT_TAG_LENGTH,
  MAX_ACHIEVEMENT_TITLE_LENGTH,
} from "@/lib/achievement-constants"
import { toAchievementSlug } from "@/lib/achievement-slug"

export const ACHIEVEMENT_STATUSES = Object.values(PostStatus) as PostStatus[]

// ============================================================================
// DTOs
// ============================================================================

export type AchievementAuthor = {
  id: string
  name: string
  avatar: string | null
  studentId?: string | null
  instructorId?: string | null
}

export type AchievementCategoryInfo = {
  id: string
  name: string
  nameBn: string | null
  slug: string
}

export type AchievementSummary = {
  id: string
  title: string
  titleBn: string | null
  slug: string
  excerpt: string | null
  excerptBn: string | null
  coverImage: string | null
  images: string[]
  eventDate: string | null
  organization: string | null
  organizationBn: string | null
  certificateUrl: string | null
  categoryId: string | null
  category: AchievementCategoryInfo | null
  tags: string[]
  status: PostStatus
  isFeatured: boolean
  publishedAt: string | null
  submittedAt: string | null
  author: AchievementAuthor
  createdAt: string
  updatedAt: string
}

export type MyAchievementSummary = Omit<AchievementSummary, "author">

export type MyAchievementDetail = MyAchievementSummary & {
  content: string
  contentBn: string | null
  massageForAuthor: string | null
  reviewedAt: string | null
}

export type AdminAchievementSummary = MyAchievementSummary & {
  author: AchievementAuthor & { email: string }
}

export type AchievementDetail = MyAchievementDetail & {
  reviewedById: string | null
  author: AchievementAuthor & { email: string }
}

export type PublicAchievementDetail = Omit<AchievementDetail, "reviewedById" | "author"> & {
  author: AchievementAuthor
}

export type AchievementPage<T> = {
  achievements: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type AchievementActor = {
  userId: string
  isAdmin: boolean
}

export type AchievementListFilters = {
  page?: number
  pageSize?: number
  category?: string | null
  tag?: string | null
  q?: string | null
  status?: PostStatus | null
  authorId?: string | null
  isFeatured?: boolean
}

export type AchievementInput = {
  title: string
  titleBn: string | null
  slug: string
  excerpt: string | null
  excerptBn: string | null
  content: string
  contentBn: string | null
  coverImage: string | null
  images: string[]
  eventDate: Date | null
  organization: string | null
  organizationBn: string | null
  certificateUrl: string | null
  categoryId: string | null
  tags: string[]
  isFeatured: boolean
}

export type AchievementAdminUpdateInput = Partial<AchievementInput> & {
  status?: PostStatus
  massageForAuthor?: string | null
}

// ============================================================================
// Row helpers
// ============================================================================

type AuthorRow = {
  id: string
  name: string
  email: string
  image: string[]
  selactedImg: string | null
  member?: { studentId: string | null } | null
  instructor?: { instructorId: string | null } | null
}

type CategoryRow = {
  id: string
  name: string
  nameBn: string | null
  slug: string
}

type AchievementRow = {
  id: string
  title: string
  titleBn: string | null
  slug: string
  excerpt: string | null
  excerptBn: string | null
  content: string
  contentBn: string | null
  coverImage: string | null
  images: string[]
  eventDate: Date | null
  organization: string | null
  organizationBn: string | null
  certificateUrl: string | null
  categoryId: string | null
  category?: CategoryRow | null
  tags: string[]
  isFeatured: boolean
  status: PostStatus
  massageForAuthor: string | null
  submittedAt: Date | null
  reviewedAt: Date | null
  reviewedById: string | null
  publishedAt: Date | null
  authorId: string
  author?: AuthorRow | null
  createdAt: Date
  updatedAt: Date
}

const AUTHOR_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  selactedImg: true,
  member: { select: { studentId: true } },
  instructor: { select: { instructorId: true } },
} as const

const CATEGORY_SELECT = {
  id: true,
  name: true,
  nameBn: true,
  slug: true,
} as const

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null
}

function mapAuthor(row: AuthorRow): AchievementAuthor & { email: string } {
  const { avatar } = resolveUserImage(row.image, row.selactedImg)
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar,
    studentId: row.member?.studentId ?? null,
    instructorId: row.instructor?.instructorId ?? null,
  }
}

function mapSummary(row: AchievementRow): AchievementSummary {
  if (!row.author) {
    throw new Error("Achievement summary requires author to be included in query")
  }
  const author = mapAuthor(row.author)
  return {
    id: row.id,
    title: row.title,
    titleBn: row.titleBn,
    slug: row.slug,
    excerpt: row.excerpt,
    excerptBn: row.excerptBn,
    coverImage: row.coverImage,
    images: row.images,
    eventDate: toIso(row.eventDate),
    organization: row.organization,
    organizationBn: row.organizationBn,
    certificateUrl: row.certificateUrl,
    categoryId: row.categoryId,
    category: row.category
      ? {
          id: row.category.id,
          name: row.category.name,
          nameBn: row.category.nameBn,
          slug: row.category.slug,
        }
      : null,
    tags: row.tags,
    status: row.status,
    isFeatured: row.isFeatured,
    publishedAt: toIso(row.publishedAt),
    submittedAt: toIso(row.submittedAt),
    author: {
      id: author.id,
      name: author.name,
      avatar: author.avatar,
      studentId: author.studentId,
      instructorId: author.instructorId,
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function mapMySummary(row: AchievementRow): MyAchievementSummary {
  return {
    id: row.id,
    title: row.title,
    titleBn: row.titleBn,
    slug: row.slug,
    excerpt: row.excerpt,
    excerptBn: row.excerptBn,
    coverImage: row.coverImage,
    images: row.images,
    eventDate: toIso(row.eventDate),
    organization: row.organization,
    organizationBn: row.organizationBn,
    certificateUrl: row.certificateUrl,
    categoryId: row.categoryId,
    category: row.category
      ? {
          id: row.category.id,
          name: row.category.name,
          nameBn: row.category.nameBn,
          slug: row.category.slug,
        }
      : null,
    tags: row.tags,
    status: row.status,
    isFeatured: row.isFeatured,
    publishedAt: toIso(row.publishedAt),
    submittedAt: toIso(row.submittedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function mapDetail(row: AchievementRow): AchievementDetail {
  if (!row.author) {
    throw new Error("Achievement detail requires author to be included in query")
  }
  return {
    ...mapMySummary(row),
    content: row.content,
    contentBn: row.contentBn,
    massageForAuthor: row.massageForAuthor,
    reviewedAt: toIso(row.reviewedAt),
    reviewedById: row.reviewedById,
    author: mapAuthor(row.author),
  }
}

// ============================================================================
// Parsers
// ============================================================================

function toTags(val: unknown): string[] {
  if (!Array.isArray(val)) return []
  return val
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((tag) => tag.length > 0 && tag.length <= MAX_ACHIEVEMENT_TAG_LENGTH)
    .slice(0, MAX_ACHIEVEMENT_TAGS)
}

function toImages(val: unknown): string[] {
  if (!Array.isArray(val)) return []
  return val
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((url) => url.length > 0)
    .slice(0, MAX_ACHIEVEMENT_IMAGES)
}

function toDate(val: unknown): Date | null {
  if (!val) return null
  const d = new Date(val as string | number | Date)
  return Number.isNaN(d.getTime()) ? null : d
}

export function parseAchievementInput(body: unknown): AchievementInput {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

  const title = toText(body.title, "Title", { max: MAX_ACHIEVEMENT_TITLE_LENGTH })
  const titleBn = toOptionalText(body.titleBn, "Title (Bangla)", MAX_ACHIEVEMENT_TITLE_LENGTH)
  const content = toText(body.content, "Content", { max: MAX_ACHIEVEMENT_CONTENT_LENGTH })
  const contentBn = toOptionalText(body.contentBn, "Content (Bangla)", MAX_ACHIEVEMENT_CONTENT_LENGTH)
  const rawSlug = toOptionalText(body.slug, "Slug", MAX_ACHIEVEMENT_SLUG_LENGTH)
  const slug = rawSlug ? toAchievementSlug(rawSlug) : toAchievementSlug(title)

  if (!slug) throw ApiError.badRequest("Slug is required")

  const rawCat = body.categoryId !== undefined ? body.categoryId : body.category
  const categoryId = rawCat && rawCat !== "none" ? toOptionalText(rawCat, "Category", 50) : null

  return {
    title,
    titleBn,
    slug,
    excerpt: toOptionalText(body.excerpt, "Excerpt", MAX_ACHIEVEMENT_EXCERPT_LENGTH),
    excerptBn: toOptionalText(body.excerptBn, "Excerpt (Bangla)", MAX_ACHIEVEMENT_EXCERPT_LENGTH),
    content,
    contentBn,
    coverImage: toUrl(body.coverImage, "Cover image"),
    images: toImages(body.images),
    eventDate: toDate(body.eventDate),
    organization: toOptionalText(body.organization, "Organization", MAX_ACHIEVEMENT_ORGANIZATION_LENGTH),
    organizationBn: toOptionalText(body.organizationBn, "Organization (Bangla)", MAX_ACHIEVEMENT_ORGANIZATION_LENGTH),
    certificateUrl: toUrl(body.certificateUrl, "Certificate URL"),
    categoryId,
    tags: toTags(body.tags),
    isFeatured: toBoolean(body.isFeatured ?? false, "Is featured"),
  }
}

export function parseAchievementUpdateInput(body: unknown): Partial<AchievementInput> {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

  const update: Partial<AchievementInput> = {}

  if (body.title !== undefined) {
    update.title = toText(body.title, "Title", { max: MAX_ACHIEVEMENT_TITLE_LENGTH })
  }
  if (body.titleBn !== undefined) {
    update.titleBn = toOptionalText(body.titleBn, "Title (Bangla)", MAX_ACHIEVEMENT_TITLE_LENGTH)
  }
  if (body.slug !== undefined) {
    const slug = toAchievementSlug(toText(body.slug, "Slug", { max: MAX_ACHIEVEMENT_SLUG_LENGTH }))
    if (!slug) throw ApiError.badRequest("Slug cannot be empty")
    update.slug = slug
  }
  if (body.excerpt !== undefined) {
    update.excerpt = toOptionalText(body.excerpt, "Excerpt", MAX_ACHIEVEMENT_EXCERPT_LENGTH)
  }
  if (body.excerptBn !== undefined) {
    update.excerptBn = toOptionalText(body.excerptBn, "Excerpt (Bangla)", MAX_ACHIEVEMENT_EXCERPT_LENGTH)
  }
  if (body.content !== undefined) {
    update.content = toText(body.content, "Content", { max: MAX_ACHIEVEMENT_CONTENT_LENGTH })
  }
  if (body.contentBn !== undefined) {
    update.contentBn = toOptionalText(body.contentBn, "Content (Bangla)", MAX_ACHIEVEMENT_CONTENT_LENGTH)
  }
  if (body.coverImage !== undefined) {
    update.coverImage = toUrl(body.coverImage, "Cover image")
  }
  if (body.images !== undefined) {
    update.images = toImages(body.images)
  }
  if (body.eventDate !== undefined) {
    update.eventDate = toDate(body.eventDate)
  }
  if (body.organization !== undefined) {
    update.organization = toOptionalText(body.organization, "Organization", MAX_ACHIEVEMENT_ORGANIZATION_LENGTH)
  }
  if (body.organizationBn !== undefined) {
    update.organizationBn = toOptionalText(body.organizationBn, "Organization (Bangla)", MAX_ACHIEVEMENT_ORGANIZATION_LENGTH)
  }
  if (body.certificateUrl !== undefined) {
    update.certificateUrl = toUrl(body.certificateUrl, "Certificate URL")
  }
  if (body.categoryId !== undefined) {
    const val = body.categoryId
    update.categoryId = val && val !== "none" ? toOptionalText(val, "Category", 50) : null
  }
  if (body.tags !== undefined) {
    update.tags = toTags(body.tags)
  }
  if (body.isFeatured !== undefined) {
    update.isFeatured = toBoolean(body.isFeatured, "Is featured")
  }

  return update
}

export function parseAchievementAdminUpdateInput(body: unknown): AchievementAdminUpdateInput {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")
  const base = parseAchievementUpdateInput(body)

  const adminUpdate: AchievementAdminUpdateInput = {
    ...base,
  }

  if (body.status !== undefined) {
    adminUpdate.status = toEnum(body.status, "Status", ACHIEVEMENT_STATUSES)
  }

  if (body.massageForAuthor !== undefined) {
    adminUpdate.massageForAuthor = toOptionalText(body.massageForAuthor, "Message for author", 2000)
  }

  return adminUpdate
}

// ============================================================================
// Service Operations
// ============================================================================

export async function createAchievement(
  input: AchievementInput,
  actor: AchievementActor
): Promise<MyAchievementDetail> {
  const existing = await prisma.achievement.findUnique({ where: { slug: input.slug } })
  if (existing) {
    throw ApiError.conflict("An achievement with this slug already exists")
  }

  const excerpt = input.excerpt || deriveExcerpt(input.content, null, MAX_ACHIEVEMENT_EXCERPT_LENGTH)
  const excerptBn = input.excerptBn || (input.contentBn ? deriveExcerpt(input.contentBn, null, MAX_ACHIEVEMENT_EXCERPT_LENGTH) : null)

  const row = await prisma.achievement.create({
    data: {
      title: input.title,
      titleBn: input.titleBn,
      slug: input.slug,
      excerpt,
      excerptBn,
      content: input.content,
      contentBn: input.contentBn,
      coverImage: input.coverImage,
      images: input.images,
      eventDate: input.eventDate,
      organization: input.organization,
      organizationBn: input.organizationBn,
      certificateUrl: input.certificateUrl,
      categoryId: input.categoryId,
      tags: input.tags,
      isFeatured: false,
      status: PostStatus.DRAFT,
      authorId: actor.userId,
    },
    include: {
      category: { select: CATEGORY_SELECT },
      author: { select: AUTHOR_SELECT },
    },
  })

  return mapDetail(row as AchievementRow)
}

export async function createAchievementAsAdmin(
  input: AchievementInput,
  initialStatus: PostStatus = PostStatus.PUBLISHED,
  actor: AchievementActor
): Promise<AchievementDetail> {
  const existing = await prisma.achievement.findUnique({ where: { slug: input.slug } })
  if (existing) {
    throw ApiError.conflict("An achievement with this slug already exists")
  }

  const now = new Date()
  const excerpt = input.excerpt || deriveExcerpt(input.content, null, MAX_ACHIEVEMENT_EXCERPT_LENGTH)
  const excerptBn = input.excerptBn || (input.contentBn ? deriveExcerpt(input.contentBn, null, MAX_ACHIEVEMENT_EXCERPT_LENGTH) : null)

  const row = await prisma.achievement.create({
    data: {
      title: input.title,
      titleBn: input.titleBn,
      slug: input.slug,
      excerpt,
      excerptBn,
      content: input.content,
      contentBn: input.contentBn,
      coverImage: input.coverImage,
      images: input.images,
      eventDate: input.eventDate,
      organization: input.organization,
      organizationBn: input.organizationBn,
      certificateUrl: input.certificateUrl,
      categoryId: input.categoryId,
      tags: input.tags,
      isFeatured: input.isFeatured,
      status: initialStatus,
      publishedAt: initialStatus === PostStatus.PUBLISHED ? now : null,
      reviewedAt: initialStatus === PostStatus.PUBLISHED ? now : null,
      reviewedById: actor.userId,
      authorId: actor.userId,
    },
    include: {
      category: { select: CATEGORY_SELECT },
      author: { select: AUTHOR_SELECT },
    },
  })

  return mapDetail(row as AchievementRow)
}

export async function updateAchievement(
  id: string,
  input: AchievementAdminUpdateInput,
  actor: AchievementActor
): Promise<AchievementDetail> {
  const current = await prisma.achievement.findUnique({ where: { id } })
  if (!current) throw ApiError.notFound("Achievement not found")

  if (!actor.isAdmin && current.authorId !== actor.userId) {
    throw ApiError.forbidden("You do not own this achievement")
  }

  // Non-admins can only edit DRAFT or REJECTED achievements
  if (!actor.isAdmin && current.status !== PostStatus.DRAFT && current.status !== PostStatus.REJECTED) {
    throw ApiError.badRequest("Only drafts or rejected achievements can be modified directly")
  }

  if (input.slug && input.slug !== current.slug) {
    const clash = await prisma.achievement.findUnique({ where: { slug: input.slug } })
    if (clash) throw ApiError.conflict("An achievement with this slug already exists")
  }

  const content = input.content ?? current.content
  const contentBn = input.contentBn ?? current.contentBn
  const excerpt =
    input.excerpt !== undefined
      ? input.excerpt
      : input.content !== undefined
      ? deriveExcerpt(content, null, MAX_ACHIEVEMENT_EXCERPT_LENGTH)
      : current.excerpt

  const excerptBn =
    input.excerptBn !== undefined
      ? input.excerptBn
      : input.contentBn !== undefined
      ? (contentBn ? deriveExcerpt(contentBn, null, MAX_ACHIEVEMENT_EXCERPT_LENGTH) : null)
      : current.excerptBn

  let nextStatus: PostStatus | undefined = undefined
  let nextPublishedAt: Date | null = current.publishedAt
  let nextReviewedAt: Date | null = current.reviewedAt
  let nextReviewedById: string | null = current.reviewedById

  if (actor.isAdmin) {
    if (input.status !== undefined) {
      nextStatus = input.status
      if (input.status === PostStatus.PUBLISHED) {
        nextPublishedAt = current.publishedAt ?? new Date()
        nextReviewedAt = new Date()
        nextReviewedById = actor.userId
      }
    }
  } else {
    // If it was rejected, editing resets it to DRAFT until author submits again
    if (current.status === PostStatus.REJECTED) {
      nextStatus = PostStatus.DRAFT
    }
  }

  const { status: _ignoreStatus, massageForAuthor, ...contentFields } = input

  const row = await prisma.achievement.update({
    where: { id },
    data: {
      ...contentFields,
      excerpt,
      excerptBn,
      ...(nextStatus !== undefined ? { status: nextStatus } : {}),
      ...(actor.isAdmin && input.status === PostStatus.PUBLISHED
        ? {
            publishedAt: nextPublishedAt,
            reviewedAt: nextReviewedAt,
            reviewedById: nextReviewedById,
          }
        : {}),
      ...(actor.isAdmin && massageForAuthor !== undefined ? { massageForAuthor } : {}),
    },
    include: {
      category: { select: CATEGORY_SELECT },
      author: { select: AUTHOR_SELECT },
    },
  })

  return mapDetail(row as AchievementRow)
}

export async function submitAchievementForReview(
  id: string,
  actor: AchievementActor
): Promise<MyAchievementDetail> {
  const current = await prisma.achievement.findUnique({ where: { id } })
  if (!current) throw ApiError.notFound("Achievement not found")

  if (!actor.isAdmin && current.authorId !== actor.userId) {
    throw ApiError.forbidden("You do not own this achievement")
  }

  if (current.status !== PostStatus.DRAFT && current.status !== PostStatus.REJECTED) {
    throw ApiError.badRequest("Only drafts or rejected achievements can be submitted for review")
  }

  const row = await prisma.achievement.update({
    where: { id },
    data: {
      status: PostStatus.PENDING,
      submittedAt: new Date(),
      massageForAuthor: null,
    },
    include: {
      category: { select: CATEGORY_SELECT },
      author: { select: AUTHOR_SELECT },
    },
  })

  return mapDetail(row as AchievementRow)
}

export async function reviewAchievement(
  id: string,
  decision: "APPROVE" | "REJECT",
  massageForAuthor: string | null,
  reviewerId: string
): Promise<AchievementDetail> {
  const current = await prisma.achievement.findUnique({ where: { id } })
  if (!current) throw ApiError.notFound("Achievement not found")

  const now = new Date()
  const status = decision === "APPROVE" ? PostStatus.PUBLISHED : PostStatus.REJECTED

  const row = await prisma.achievement.update({
    where: { id },
    data: {
      status,
      massageForAuthor: massageForAuthor || null,
      reviewedAt: now,
      reviewedById: reviewerId,
      publishedAt: decision === "APPROVE" ? (current.publishedAt ?? now) : current.publishedAt,
    },
    include: {
      category: { select: CATEGORY_SELECT },
      author: { select: AUTHOR_SELECT },
    },
  })

  return mapDetail(row as AchievementRow)
}

export async function deleteAchievement(
  id: string,
  actor: AchievementActor
): Promise<{ success: true }> {
  const current = await prisma.achievement.findUnique({ where: { id } })
  if (!current) throw ApiError.notFound("Achievement not found")

  if (!actor.isAdmin && current.authorId !== actor.userId) {
    throw ApiError.forbidden("You do not own this achievement")
  }

  if (!actor.isAdmin && current.status === PostStatus.PUBLISHED) {
    throw ApiError.badRequest("Published achievements cannot be deleted by authors. Contact an administrator.")
  }

  await prisma.achievement.delete({ where: { id } })
  return { success: true }
}

export async function getAchievementById(id: string): Promise<AchievementDetail> {
  const row = await prisma.achievement.findUnique({
    where: { id },
    include: {
      category: { select: CATEGORY_SELECT },
      author: { select: AUTHOR_SELECT },
    },
  })
  if (!row) throw ApiError.notFound("Achievement not found")
  return mapDetail(row as AchievementRow)
}

export async function getPublishedAchievementBySlug(
  slug: string
): Promise<PublicAchievementDetail> {
  const row = await prisma.achievement.findUnique({
    where: { slug },
    include: {
      category: { select: CATEGORY_SELECT },
      author: { select: AUTHOR_SELECT },
    },
  })

  if (!row || row.status !== PostStatus.PUBLISHED) {
    throw ApiError.notFound("Achievement not found")
  }

  const detail = mapDetail(row as AchievementRow)
  const { reviewedById, ...publicDetail } = detail
  return publicDetail
}

export async function getMyAchievements(
  userId: string,
  filters: AchievementListFilters
): Promise<AchievementPage<MyAchievementSummary>> {
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(
    MAX_ACHIEVEMENT_PAGE_SIZE,
    Math.max(1, filters.pageSize ?? DEFAULT_ACHIEVEMENT_PAGE_SIZE)
  )

  const where: Prisma.AchievementWhereInput = {
    authorId: userId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { titleBn: { contains: filters.q, mode: "insensitive" } },
            { organization: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const [total, rows] = await Promise.all([
    prisma.achievement.count({ where }),
    prisma.achievement.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: { select: CATEGORY_SELECT } },
    }),
  ])

  return {
    achievements: rows.map(mapMySummary),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  }
}

export async function listAchievementsForAdmin(
  filters: AchievementListFilters
): Promise<AchievementPage<AdminAchievementSummary>> {
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(
    MAX_ACHIEVEMENT_PAGE_SIZE,
    Math.max(1, filters.pageSize ?? DEFAULT_ACHIEVEMENT_PAGE_SIZE)
  )

  const where: Prisma.AchievementWhereInput = {
    ...(filters.authorId ? { authorId: filters.authorId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.category
      ? {
          category: {
            OR: [{ id: filters.category }, { slug: filters.category }],
          },
        }
      : {}),
    ...(filters.tag ? { tags: { has: filters.tag } } : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { titleBn: { contains: filters.q, mode: "insensitive" } },
            { organization: { contains: filters.q, mode: "insensitive" } },
            { author: { name: { contains: filters.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  }

  const [total, rows] = await Promise.all([
    prisma.achievement.count({ where }),
    prisma.achievement.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: CATEGORY_SELECT },
        author: { select: AUTHOR_SELECT },
      },
    }),
  ])

  return {
    achievements: rows.map((r) => {
      const summary = mapSummary(r as AchievementRow)
      const author = mapAuthor(r.author as AuthorRow)
      return {
        ...summary,
        author,
      }
    }),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  }
}

export async function listPublishedAchievements(
  filters: AchievementListFilters
): Promise<AchievementPage<AchievementSummary>> {
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(
    MAX_ACHIEVEMENT_PAGE_SIZE,
    Math.max(1, filters.pageSize ?? DEFAULT_ACHIEVEMENT_PAGE_SIZE)
  )

  const where: Prisma.AchievementWhereInput = {
    status: PostStatus.PUBLISHED,
    ...(filters.isFeatured !== undefined ? { isFeatured: filters.isFeatured } : {}),
    ...(filters.authorId ? { authorId: filters.authorId } : {}),
    ...(filters.category
      ? {
          category: {
            OR: [{ id: filters.category }, { slug: filters.category }],
          },
        }
      : {}),
    ...(filters.tag ? { tags: { has: filters.tag } } : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { titleBn: { contains: filters.q, mode: "insensitive" } },
            { organization: { contains: filters.q, mode: "insensitive" } },
            { excerpt: { contains: filters.q, mode: "insensitive" } },
            { excerptBn: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const [total, rows] = await Promise.all([
    prisma.achievement.count({ where }),
    prisma.achievement.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { eventDate: "desc" }, { publishedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: CATEGORY_SELECT },
        author: { select: AUTHOR_SELECT },
      },
    }),
  ])

  return {
    achievements: rows.map((r) => mapSummary(r as AchievementRow)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  }
}

export async function getAchievementCounts(
  authorId?: string
): Promise<Record<PostStatus, number> & { total: number }> {
  const where: Prisma.AchievementWhereInput = authorId ? { authorId } : {}

  const counts = await prisma.achievement.groupBy({
    by: ["status"],
    where,
    _count: { status: true },
  })

  const result: Record<PostStatus, number> & { total: number } = {
    [PostStatus.DRAFT]: 0,
    [PostStatus.PENDING]: 0,
    [PostStatus.PUBLISHED]: 0,
    [PostStatus.REJECTED]: 0,
    [PostStatus.ARCHIVED]: 0,
    [PostStatus.UPDATE]: 0,
    total: 0,
  }

  for (const c of counts) {
    result[c.status] = c._count.status
    result.total += c._count.status
  }

  return result
}

export async function listAchievementFacets(): Promise<{
  categories: { id: string; name: string; nameBn: string | null; slug: string; count: number }[]
  tags: { name: string; count: number }[]
}> {
  const categories = await prisma.category.findMany({
    where: {
      type: "ACHIEVEMENT",
      isActive: true,
      achievements: { some: { status: PostStatus.PUBLISHED } },
    },
    select: {
      id: true,
      name: true,
      nameBn: true,
      slug: true,
      _count: {
        select: {
          achievements: { where: { status: PostStatus.PUBLISHED } },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const rows = await prisma.achievement.findMany({
    where: { status: PostStatus.PUBLISHED },
    select: { tags: true },
  })

  const tagCounts = new Map<string, number>()
  for (const row of rows) {
    for (const tag of row.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }

  const tags = Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return {
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      nameBn: c.nameBn,
      slug: c.slug,
      count: c._count.achievements,
    })),
    tags,
  }
}
