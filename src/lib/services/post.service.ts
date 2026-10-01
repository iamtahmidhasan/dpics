import "server-only"

import { Prisma } from "@/generated/prisma/client"
import { PostStatus } from "@/generated/prisma/enums"
import { ApiError } from "@/lib/api-error"
import { deriveExcerpt, estimateReadingMinutes, stripMarkdown } from "@/lib/markdown"
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
  DEFAULT_POST_PAGE_SIZE,
  MAX_POST_CONTENT_LENGTH,
  MAX_POST_EXCERPT_LENGTH,
  MAX_POST_PAGE_SIZE,
  MAX_POST_SLUG_LENGTH,
  MAX_POST_SEO_DESCRIPTION_LENGTH,
  MAX_POST_TAGS,
  MAX_POST_TAG_LENGTH,
  MAX_POST_TITLE_LENGTH,
  MAX_REJECTION_REASON_LENGTH,
} from "@/lib/post-constants"
import { toPostSlug } from "@/lib/post-slug"

export const POST_STATUSES = Object.values(PostStatus) as PostStatus[]

export {
  DEFAULT_POST_PAGE_SIZE,
  MAX_POST_CONTENT_LENGTH,
  MAX_POST_EXCERPT_LENGTH,
  MAX_POST_PAGE_SIZE,
  MAX_POST_SLUG_LENGTH,
  MAX_POST_SEO_DESCRIPTION_LENGTH,
  MAX_POST_TAGS,
  MAX_POST_TAG_LENGTH,
  MAX_POST_TITLE_LENGTH,
  MAX_REJECTION_REASON_LENGTH,
} from "@/lib/post-constants"

// ============================================================================
// DTOs
// ============================================================================

export type PostAuthor = {
  id: string
  name: string
  avatar: string | null
}

export type PostCategoryInfo = {
  id: string
  name: string
  nameBn: string | null
  slug: string
}

export type PostSummary = {
  id: string
  title: string
  titleBn: string | null
  slug: string
  excerpt: string | null
  excerptBn: string | null
  coverImage: string | null
  categoryId: string | null
  category: PostCategoryInfo | null
  tags: string[]
  status: PostStatus
  isFeatured: boolean
  readingMinutes: number
  publishedAt: string | null
  submittedAt: string | null
  author: PostAuthor
  createdAt: string
  updatedAt: string
}

export type MyPostSummary = Omit<PostSummary, "author">

export type MyPostDetail = MyPostSummary & {
  content: string
  contentBn: string | null
  ogImage: string | null
  seoTitle: string | null
  seoDescription: string | null
  rejectionReason: string | null
  reviewedAt: string | null
}

export type AdminPostSummary = MyPostSummary & {
  author: PostAuthor & { email: string }
}

export type PostDetail = MyPostDetail & {
  reviewedById: string | null
  author: PostAuthor & { email: string }
}

/** Public detail omits the reviewer id and the author email on purpose. */
export type PublicPostDetail = Omit<PostDetail, "reviewedById" | "author"> & {
  author: PostAuthor
}

export type PostPage<T> = {
  posts: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** The identity the service authorises against, resolved from the session. */
export type PostActor = {
  userId: string
  isAdmin: boolean
}

export type PostListFilters = {
  page?: number
  pageSize?: number
  category?: string | null
  tag?: string | null
  q?: string | null
  status?: PostStatus | null
}

export type PostReviewInput = {
  decision: "APPROVE" | "REJECT"
  reason?: string | null
}

export type PostAdminUpdateInput = Partial<PostInput> & {
  status?: PostStatus
}

export type PostInput = {
  title: string
  titleBn: string | null
  slug: string
  excerpt: string | null
  excerptBn: string | null
  content: string
  contentBn: string | null
  coverImage: string | null
  ogImage: string | null
  categoryId: string | null
  tags: string[]
  isFeatured: boolean
  seoTitle: string | null
  seoDescription: string | null
}

// ============================================================================
// Row shapes
// ============================================================================

type AuthorRow = {
  id: string
  name: string
  email: string
  image: string[]
  selactedImg: string | null
}

type CategoryRow = {
  id: string
  name: string
  nameBn: string | null
  slug: string
}

type PostRow = {
  id: string
  title: string
  titleBn: string | null
  slug: string
  excerpt: string | null
  excerptBn: string | null
  content: string
  contentBn: string | null
  coverImage: string | null
  ogImage: string | null
  categoryId: string | null
  category?: CategoryRow | null
  tags: string[]
  isFeatured: boolean
  status: PostStatus
  rejectionReason: string | null
  submittedAt: Date | null
  reviewedAt: Date | null
  reviewedById: string | null
  publishedAt: Date | null
  seoTitle: string | null
  seoDescription: string | null
  readingMinutes: number
  authorId: string
  createdAt: Date
  updatedAt: Date
}

type PostRowWithAuthor = PostRow & { author: AuthorRow }

const AUTHOR_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  selactedImg: true,
} satisfies Prisma.UserSelect

const CATEGORY_SELECT = {
  id: true,
  name: true,
  nameBn: true,
  slug: true,
} satisfies Prisma.CategorySelect

// ============================================================================
// Small helpers
// ============================================================================

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

function toTags(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  const tags: string[] = []

  for (const entry of value) {
    if (typeof entry !== "string") continue

    const tag = toPostSlug(entry.replace(/^#+/, "")).slice(0, MAX_POST_TAG_LENGTH)

    if (!tag || tags.includes(tag)) continue

    tags.push(tag)

    if (tags.length === MAX_POST_TAGS) break
  }

  return tags
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

function clampPage(value: unknown): number {
  const page = Number.parseInt(String(value ?? "1"), 10)

  return Number.isFinite(page) && page > 0 ? page : 1
}

function clampPageSize(value: unknown, fallback = DEFAULT_POST_PAGE_SIZE): number {
  const size = Number.parseInt(String(value ?? fallback), 10)

  if (!Number.isFinite(size) || size <= 0) return fallback

  return Math.min(size, MAX_POST_PAGE_SIZE)
}

function buildPage<T>(rows: T[], total: number, page: number, pageSize: number): PostPage<T> {
  return {
    posts: rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

function mapAuthor(user: AuthorRow): PostAuthor {
  const { avatar } = resolveUserImage(user.image, user.selactedImg)

  return { id: user.id, name: user.name, avatar }
}

function mapSummary(row: PostRowWithAuthor): PostSummary {
  return {
    id: row.id,
    title: row.title,
    titleBn: row.titleBn,
    slug: row.slug,
    excerpt: row.excerpt,
    excerptBn: row.excerptBn,
    coverImage: row.coverImage,
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
    readingMinutes: row.readingMinutes,
    publishedAt: toIso(row.publishedAt),
    submittedAt: toIso(row.submittedAt),
    author: mapAuthor(row.author),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function mapMySummary(row: PostRow): MyPostSummary {
  return {
    id: row.id,
    title: row.title,
    titleBn: row.titleBn,
    slug: row.slug,
    excerpt: row.excerpt,
    excerptBn: row.excerptBn,
    coverImage: row.coverImage,
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
    readingMinutes: row.readingMinutes,
    publishedAt: toIso(row.publishedAt),
    submittedAt: toIso(row.submittedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function mapMyDetail(row: PostRow): MyPostDetail {
  return {
    ...mapMySummary(row),
    content: row.content,
    contentBn: row.contentBn,
    ogImage: row.ogImage,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    rejectionReason: row.rejectionReason,
    reviewedAt: toIso(row.reviewedAt),
  }
}

// ============================================================================
// Parsers
// ============================================================================

export function parsePostInput(body: unknown): PostInput {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

  const title = toText(body.title, "Title", { max: MAX_POST_TITLE_LENGTH })
  const titleBn = toOptionalText(body.titleBn, "Title (Bangla)", MAX_POST_TITLE_LENGTH)
  const content = toText(body.content, "Content", { max: MAX_POST_CONTENT_LENGTH })
  const contentBn = toOptionalText(body.contentBn, "Content (Bangla)", MAX_POST_CONTENT_LENGTH)
  const rawSlug = toOptionalText(body.slug, "Slug", MAX_POST_SLUG_LENGTH)
  const slug = rawSlug ? toPostSlug(rawSlug) : toPostSlug(title)

  if (!slug) throw ApiError.badRequest("Slug is required")

  const rawCat = body.categoryId !== undefined ? body.categoryId : body.category
  const categoryId = rawCat && rawCat !== "none" ? toOptionalText(rawCat, "Category", 50) : null

  return {
    title,
    titleBn,
    slug,
    excerpt: toOptionalText(body.excerpt, "Excerpt", MAX_POST_EXCERPT_LENGTH),
    excerptBn: toOptionalText(body.excerptBn, "Excerpt (Bangla)", MAX_POST_EXCERPT_LENGTH),
    content,
    contentBn,
    coverImage: toUrl(body.coverImage, "Cover image"),
    ogImage: toUrl(body.ogImage, "OG image"),
    categoryId,
    tags: toTags(body.tags),
    isFeatured: false,
    seoTitle: toOptionalText(body.seoTitle, "SEO title", MAX_POST_TITLE_LENGTH),
    seoDescription: toOptionalText(
      body.seoDescription,
      "SEO description",
      MAX_POST_SEO_DESCRIPTION_LENGTH
    ),
  }
}

export function parsePostUpdateInput(body: unknown): Partial<PostInput> {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

  const update: Partial<PostInput> = {}

  if (body.title !== undefined) {
    update.title = toText(body.title, "Title", { max: MAX_POST_TITLE_LENGTH })
  }

  if (body.titleBn !== undefined) {
    update.titleBn = toOptionalText(body.titleBn, "Title (Bangla)", MAX_POST_TITLE_LENGTH)
  }

  if (body.slug !== undefined) {
    const slug = toPostSlug(toOptionalText(body.slug, "Slug", MAX_POST_SLUG_LENGTH) ?? "")
    if (!slug) throw ApiError.badRequest("Slug is required")
    update.slug = slug
  }

  if (body.excerpt !== undefined) {
    update.excerpt = toOptionalText(body.excerpt, "Excerpt", MAX_POST_EXCERPT_LENGTH)
  }

  if (body.excerptBn !== undefined) {
    update.excerptBn = toOptionalText(body.excerptBn, "Excerpt (Bangla)", MAX_POST_EXCERPT_LENGTH)
  }

  if (body.content !== undefined) {
    update.content = toText(body.content, "Content", { max: MAX_POST_CONTENT_LENGTH })
  }

  if (body.contentBn !== undefined) {
    update.contentBn = toOptionalText(body.contentBn, "Content (Bangla)", MAX_POST_CONTENT_LENGTH)
  }

  if (body.coverImage !== undefined) {
    update.coverImage = toUrl(body.coverImage, "Cover image")
  }

  if (body.ogImage !== undefined) {
    update.ogImage = toUrl(body.ogImage, "OG image")
  }

  if (body.categoryId !== undefined || body.category !== undefined) {
    const rawCat = body.categoryId !== undefined ? body.categoryId : body.category
    update.categoryId = rawCat && rawCat !== "none" ? toOptionalText(rawCat, "Category", 50) : null
  }

  if (body.tags !== undefined) {
    update.tags = toTags(body.tags)
  }

  if (body.seoTitle !== undefined) {
    update.seoTitle = toOptionalText(body.seoTitle, "SEO title", MAX_POST_TITLE_LENGTH)
  }

  if (body.seoDescription !== undefined) {
    update.seoDescription = toOptionalText(
      body.seoDescription,
      "SEO description",
      MAX_POST_SEO_DESCRIPTION_LENGTH
    )
  }

  return update
}

export function parsePostAdminInput(body: unknown): PostAdminUpdateInput {
  const update = parsePostUpdateInput(body) as PostAdminUpdateInput
  const fields = body as Record<string, unknown>

  if (fields.status !== undefined) {
    update.status = toEnum(fields.status, "Status", POST_STATUSES)
  }

  if (fields.isFeatured !== undefined) {
    update.isFeatured = toBoolean(fields.isFeatured, "Is featured")
  }

  return update
}

export function parseReviewInput(body: unknown): PostReviewInput {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

  const decision = toEnum(body.decision, "Decision", ["APPROVE", "REJECT"] as const)

  return {
    decision,
    reason: toOptionalText(body.reason, "Reason", MAX_REJECTION_REASON_LENGTH),
  }
}

// ============================================================================
// Workflow guards
// ============================================================================

function assertCanModifyOwnPost(status: PostStatus, actor: PostActor): void {
  if (actor.isAdmin) return

  if (status === PostStatus.PUBLISHED || status === PostStatus.ARCHIVED) {
    throw ApiError.badRequest(
      "This post has already been approved, so it can no longer be changed or deleted. Ask an admin to archive it first."
    )
  }
}

function assertOwnership(authorId: string, actor: PostActor): void {
  if (actor.isAdmin) return

  if (authorId !== actor.userId) {
    throw ApiError.forbidden("You can only change your own posts")
  }
}

async function findPostRow(id: string): Promise<PostRow> {
  if (!id) throw ApiError.badRequest("Post id is required")

  const post = await prisma.post.findUnique({
    where: { id },
    include: { category: { select: CATEGORY_SELECT } },
  })

  if (!post) throw ApiError.notFound("Post not found")

  return post
}

async function findPostRowWithAuthor(id: string): Promise<PostRowWithAuthor> {
  if (!id) throw ApiError.badRequest("Post id is required")

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: AUTHOR_SELECT },
      category: { select: CATEGORY_SELECT },
    },
  })

  if (!post) throw ApiError.notFound("Post not found")

  return post
}

async function assertSlugAvailable(slug: string, ownId?: string): Promise<void> {
  const owner = await prisma.post.findUnique({ where: { slug } })

  if (owner && owner.id !== ownId) {
    throw ApiError.badRequest("A post with this slug already exists")
  }
}

function publishedAtFor(status: PostStatus, current: Date | null): Date | null {
  return status === PostStatus.PUBLISHED ? (current ?? new Date()) : null
}

function derivedFields(
  input: Partial<PostInput>
): { excerpt?: string | null; excerptBn?: string | null; readingMinutes?: number } {
  const result: { excerpt?: string | null; excerptBn?: string | null; readingMinutes?: number } = {}

  if (input.content !== undefined) {
    if (input.excerpt === undefined) {
      result.excerpt = deriveExcerpt(input.content, null, MAX_POST_EXCERPT_LENGTH)
    }
    const combinedContent = `${input.content}\n\n${input.contentBn ?? ""}`
    result.readingMinutes = estimateReadingMinutes(combinedContent)
  }

  if (input.contentBn && input.excerptBn === undefined) {
    result.excerptBn = deriveExcerpt(input.contentBn, null, MAX_POST_EXCERPT_LENGTH)
  }

  return result
}

// ============================================================================
// Reads
// ============================================================================

export async function listPublishedPosts(
  filters: PostListFilters = {}
): Promise<PostPage<PostSummary>> {
  const page = clampPage(filters.page)
  const pageSize = clampPageSize(filters.pageSize)
  const term = filters.q?.trim()

  const categoryWhere: Prisma.PostWhereInput = filters.category
    ? {
        OR: [
          { categoryId: filters.category },
          { category: { slug: filters.category } },
        ],
      }
    : {}

  const where: Prisma.PostWhereInput = {
    status: PostStatus.PUBLISHED,
    ...categoryWhere,
    ...(filters.tag ? { tags: { has: filters.tag.toLowerCase() } } : {}),
    ...(term
      ? {
          OR: [
            { title: { contains: term, mode: "insensitive" as const } },
            { titleBn: { contains: term, mode: "insensitive" as const } },
            { excerpt: { contains: term, mode: "insensitive" as const } },
            { excerptBn: { contains: term, mode: "insensitive" as const } },
            { tags: { has: term.toLowerCase() } },
          ],
        }
      : {}),
  }

  const [rows, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        author: { select: AUTHOR_SELECT },
        category: { select: CATEGORY_SELECT },
      },
    }),
    prisma.post.count({ where }),
  ])

  return buildPage(rows.map(mapSummary), total, page, pageSize)
}

export async function getPublishedPostBySlug(slug: string): Promise<PublicPostDetail> {
  if (!slug) throw ApiError.badRequest("Slug is required")

  const post = await prisma.post.findFirst({
    where: { slug, status: PostStatus.PUBLISHED },
    include: {
      author: { select: AUTHOR_SELECT },
      category: { select: CATEGORY_SELECT },
    },
  })

  if (!post) throw ApiError.notFound("Post not found")

  return {
    ...mapMyDetail(post),
    author: mapAuthor(post.author),
  }
}

/** Category and tag facets for the `/posts` filter chips. */
export async function listPostFacets(): Promise<{
  categories: { id: string; name: string; nameBn: string | null; slug: string; count: number }[]
  tags: { tag: string; count: number }[]
}> {
  const rows = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    select: {
      category: { select: CATEGORY_SELECT },
      tags: true,
    },
  })

  const categoryMap = new Map<
    string,
    { id: string; name: string; nameBn: string | null; slug: string; count: number }
  >()
  const tagCounts = new Map<string, number>()

  for (const row of rows) {
    if (row.category) {
      const existing = categoryMap.get(row.category.id)
      if (existing) {
        existing.count += 1
      } else {
        categoryMap.set(row.category.id, {
          id: row.category.id,
          name: row.category.name,
          nameBn: row.category.nameBn,
          slug: row.category.slug,
          count: 1,
        })
      }
    }

    for (const tag of row.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }

  return {
    categories: [...categoryMap.values()].sort((a, b) => b.count - a.count),
    tags: [...tagCounts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .slice(0, 20),
  }
}

export async function listPostsForAdmin(
  filters: PostListFilters = {}
): Promise<PostPage<AdminPostSummary>> {
  const page = clampPage(filters.page)
  const pageSize = clampPageSize(filters.pageSize)
  const term = filters.q?.trim()

  const categoryWhere: Prisma.PostWhereInput = filters.category
    ? {
        OR: [
          { categoryId: filters.category },
          { category: { slug: filters.category } },
        ],
      }
    : {}

  const where: Prisma.PostWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...categoryWhere,
    ...(filters.tag ? { tags: { has: filters.tag.toLowerCase() } } : {}),
    ...(term
      ? {
          OR: [
            { title: { contains: term, mode: "insensitive" as const } },
            { titleBn: { contains: term, mode: "insensitive" as const } },
            { slug: { contains: term, mode: "insensitive" as const } },
            { tags: { has: term.toLowerCase() } },
            { author: { name: { contains: term, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  }

  const [rows, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        author: { select: AUTHOR_SELECT },
        category: { select: CATEGORY_SELECT },
      },
    }),
    prisma.post.count({ where }),
  ])

  return buildPage(
    rows.map((row) => ({
      ...mapMySummary(row),
      author: { ...mapAuthor(row.author), email: row.author.email },
    })),
    total,
    page,
    pageSize
  )
}

export async function getPostDetailForAdmin(id: string): Promise<PostDetail> {
  const row = await findPostRowWithAuthor(id)

  return {
    ...mapMyDetail(row),
    reviewedById: row.reviewedById,
    author: { ...mapAuthor(row.author), email: row.author.email },
  }
}

export async function getMyPosts(
  userId: string,
  filters: PostListFilters = {}
): Promise<PostPage<MyPostSummary>> {
  const page = clampPage(filters.page)
  const pageSize = clampPageSize(filters.pageSize)
  const term = filters.q?.trim()

  const categoryWhere: Prisma.PostWhereInput = filters.category
    ? {
        OR: [
          { categoryId: filters.category },
          { category: { slug: filters.category } },
        ],
      }
    : {}

  const where: Prisma.PostWhereInput = {
    authorId: userId,
    ...(filters.status ? { status: filters.status } : {}),
    ...categoryWhere,
    ...(term
      ? {
          OR: [
            { title: { contains: term, mode: "insensitive" as const } },
            { titleBn: { contains: term, mode: "insensitive" as const } },
            { tags: { has: term.toLowerCase() } },
          ],
        }
      : {}),
  }

  const [rows, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: CATEGORY_SELECT },
      },
    }),
    prisma.post.count({ where }),
  ])

  return buildPage(rows.map(mapMySummary), total, page, pageSize)
}

export async function getMyPost(id: string, actor: PostActor): Promise<MyPostDetail> {
  const row = await findPostRow(id)

  assertOwnership(row.authorId, actor)

  return mapMyDetail(row)
}

export async function getPostCounts(
  userId?: string
): Promise<Record<PostStatus, number> & { total: number }> {
  const grouped = await prisma.post.groupBy({
    by: ["status"],
    where: userId ? { authorId: userId } : {},
    _count: { _all: true },
  })

  const counts: Record<PostStatus, number> & { total: number } = {
    total: 0,
    DRAFT: 0,
    PENDING: 0,
    PUBLISHED: 0,
    REJECTED: 0,
    ARCHIVED: 0,
  }

  for (const row of grouped) {
    counts[row.status] = row._count._all
    counts.total += row._count._all
  }

  return counts
}

// ============================================================================
// Author mutations
// ============================================================================

export async function createPost(
  input: PostInput,
  actor: PostActor
): Promise<MyPostDetail> {
  await assertSlugAvailable(input.slug)

  try {
    const combinedContent = `${input.content}\n\n${input.contentBn ?? ""}`
    const created = await prisma.post.create({
      data: {
        title: input.title,
        titleBn: input.titleBn,
        slug: input.slug,
        excerpt: deriveExcerpt(input.content, input.excerpt, MAX_POST_EXCERPT_LENGTH),
        excerptBn: input.contentBn
          ? deriveExcerpt(input.contentBn, input.excerptBn, MAX_POST_EXCERPT_LENGTH)
          : input.excerptBn,
        content: input.content,
        contentBn: input.contentBn,
        coverImage: input.coverImage,
        ogImage: input.ogImage,
        categoryId: input.categoryId,
        tags: input.tags,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        readingMinutes: estimateReadingMinutes(combinedContent),
        authorId: actor.userId,
        status: PostStatus.DRAFT,
      },
      include: {
        category: { select: CATEGORY_SELECT },
      },
    })

    return mapMyDetail(created)
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw ApiError.badRequest("A post with this slug already exists")
    }

    throw error
  }
}

export async function updatePost(
  id: string,
  input: Partial<PostInput>,
  actor: PostActor
): Promise<MyPostDetail> {
  const existing = await findPostRow(id)

  assertOwnership(existing.authorId, actor)
  assertCanModifyOwnPost(existing.status, actor)

  if (input.slug && input.slug !== existing.slug) {
    await assertSlugAvailable(input.slug, existing.id)
  }

  await prisma.post.update({
    where: { id },
    data: { ...input, ...derivedFields(input) },
  })

  return getMyPost(id, actor)
}

export async function deletePost(id: string, actor: PostActor): Promise<void> {
  const existing = await findPostRow(id)

  assertOwnership(existing.authorId, actor)
  assertCanModifyOwnPost(existing.status, actor)

  await prisma.post.delete({ where: { id } })
}

export async function submitPost(id: string, actor: PostActor): Promise<MyPostDetail> {
  const existing = await findPostRow(id)

  assertOwnership(existing.authorId, actor)
  assertCanModifyOwnPost(existing.status, actor)

  if (existing.status !== PostStatus.DRAFT && existing.status !== PostStatus.REJECTED) {
    throw ApiError.badRequest("Only a draft or a rejected post can be sent for review")
  }

  if (!stripMarkdown(existing.content) && (!existing.contentBn || !stripMarkdown(existing.contentBn))) {
    throw ApiError.badRequest("Add some content before sending this post for review")
  }

  await prisma.post.update({
    where: { id },
    data: {
      status: PostStatus.PENDING,
      submittedAt: new Date(),
      rejectionReason: null,
    },
  })

  return getMyPost(id, actor)
}

export async function withdrawPost(id: string, actor: PostActor): Promise<MyPostDetail> {
  const existing = await findPostRow(id)

  assertOwnership(existing.authorId, actor)
  assertCanModifyOwnPost(existing.status, actor)

  if (existing.status !== PostStatus.PENDING) {
    throw ApiError.badRequest("Only a post that is waiting for review can be withdrawn")
  }

  await prisma.post.update({ where: { id }, data: { status: PostStatus.DRAFT } })

  return getMyPost(id, actor)
}

// ============================================================================
// Admin mutations
// ============================================================================

export async function createPostAsAdmin(
  input: PostInput,
  status: PostStatus,
  actor: PostActor
): Promise<PostDetail> {
  if (!actor.isAdmin) {
    throw ApiError.forbidden("Only an admin can publish directly")
  }

  await assertSlugAvailable(input.slug)

  const now = new Date()
  const combinedContent = `${input.content}\n\n${input.contentBn ?? ""}`

  try {
    const created = await prisma.post.create({
      data: {
        title: input.title,
        titleBn: input.titleBn,
        slug: input.slug,
        excerpt: deriveExcerpt(input.content, input.excerpt, MAX_POST_EXCERPT_LENGTH),
        excerptBn: input.contentBn
          ? deriveExcerpt(input.contentBn, input.excerptBn, MAX_POST_EXCERPT_LENGTH)
          : input.excerptBn,
        content: input.content,
        contentBn: input.contentBn,
        coverImage: input.coverImage,
        ogImage: input.ogImage,
        categoryId: input.categoryId,
        tags: input.tags,
        isFeatured: input.isFeatured,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        readingMinutes: estimateReadingMinutes(combinedContent),
        authorId: actor.userId,
        publishedAt: publishedAtFor(status, null),
        submittedAt: status === PostStatus.PENDING ? now : null,
        reviewedAt: status === PostStatus.PUBLISHED ? now : null,
        reviewedById: status === PostStatus.PUBLISHED ? actor.userId : null,
        status,
      },
    })

    return getPostDetailForAdmin(created.id)
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw ApiError.badRequest("A post with this slug already exists")
    }

    throw error
  }
}

export async function updatePostAsAdmin(
  id: string,
  input: PostAdminUpdateInput,
  actor: PostActor
): Promise<PostDetail> {
  if (!actor.isAdmin) {
    throw ApiError.forbidden("Only an admin can change the workflow state of a post")
  }

  const existing = await findPostRow(id)

  if (input.slug && input.slug !== existing.slug) {
    await assertSlugAvailable(input.slug, existing.id)
  }

  const { status, ...content } = input

  await prisma.post.update({
    where: { id },
    data: {
      ...content,
      ...derivedFields(input),
      ...(status === undefined
        ? {}
        : {
            status,
            publishedAt: publishedAtFor(status, existing.publishedAt),
            ...(status === PostStatus.PUBLISHED
              ? { rejectionReason: null, reviewedAt: new Date(), reviewedById: actor.userId }
              : {}),
          }),
    },
  })

  return getPostDetailForAdmin(id)
}

export async function reviewPost(
  id: string,
  input: PostReviewInput,
  actor: PostActor
): Promise<PostDetail> {
  if (!actor.isAdmin) {
    throw ApiError.forbidden("Only an admin can review a post")
  }

  const existing = await findPostRow(id)

  if (existing.status !== PostStatus.PENDING) {
    throw ApiError.badRequest("Only a post that is waiting for review can be reviewed")
  }

  const now = new Date()

  if (input.decision === "APPROVE") {
    await prisma.post.update({
      where: { id },
      data: {
        status: PostStatus.PUBLISHED,
        publishedAt: existing.publishedAt ?? now,
        reviewedAt: now,
        reviewedById: actor.userId,
        rejectionReason: null,
      },
    })

    return getPostDetailForAdmin(id)
  }

  const reason = input.reason?.trim()

  if (!reason) {
    throw ApiError.badRequest("Tell the author what needs to change")
  }

  await prisma.post.update({
    where: { id },
    data: {
      status: PostStatus.REJECTED,
      rejectionReason: reason,
      reviewedAt: now,
      reviewedById: actor.userId,
      publishedAt: null,
    },
  })

  return getPostDetailForAdmin(id)
}

export async function deletePostAsAdmin(id: string): Promise<void> {
  await findPostRow(id)
  await prisma.post.delete({ where: { id } })
}