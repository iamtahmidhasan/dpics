import "server-only"

import { Prisma } from "@/generated/prisma/client"
import { PostCategory, PostStatus } from "@/generated/prisma/enums"
import { ApiError } from "@/lib/api-error"
import { deriveExcerpt, estimateReadingMinutes, stripMarkdown } from "@/lib/markdown"
import prisma from "@/lib/prisma"
import { resolveUserImage } from "@/lib/user-image"
import {
  isRecord,
  toBoolean,
  toEnum,
  toOptionalEnum,
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
export const POST_CATEGORIES = Object.values(PostCategory) as PostCategory[]

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

export type PostSummary = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  category: PostCategory | null
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
  category?: PostCategory | null
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
  slug: string
  excerpt: string | null
  content: string
  coverImage: string | null
  ogImage: string | null
  category: PostCategory | null
  tags: string[]
  isFeatured: boolean
  seoTitle: string | null
  seoDescription: string | null
}

// ============================================================================
// Row shapes — hand written so the mappers stay typed without importing the
// generated payload types into every call site.
// ============================================================================

type AuthorRow = {
  id: string
  name: string
  email: string
  image: string[]
  selactedImg: string | null
}

type PostRow = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverImage: string | null
  ogImage: string | null
  category: PostCategory | null
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

// ============================================================================
// Small helpers
// ============================================================================

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

/**
 * Tags are lowercased, hyphenated, de-duplicated and bounded so `?tag=` filters
 * stay predictable. The form already normalises as you type, but the API has to
 * be safe on its own: a hand written `POST` body must not be able to smuggle in
 * a tag with spaces or a `#` prefix.
 */
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
    slug: row.slug,
    excerpt: row.excerpt,
    coverImage: row.coverImage,
    category: row.category,
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
    slug: row.slug,
    excerpt: row.excerpt,
    coverImage: row.coverImage,
    category: row.category,
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
    ogImage: row.ogImage,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    rejectionReason: row.rejectionReason,
    reviewedAt: toIso(row.reviewedAt),
  }
}

// ============================================================================
// Parsers — every untrusted value goes through src/lib/validation.ts
// ============================================================================

export function parsePostInput(body: unknown): PostInput {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

  const title = toText(body.title, "Title", { max: MAX_POST_TITLE_LENGTH })
  const content = toText(body.content, "Content", { max: MAX_POST_CONTENT_LENGTH })
  const rawSlug = toOptionalText(body.slug, "Slug", MAX_POST_SLUG_LENGTH)
  const slug = rawSlug ? toPostSlug(rawSlug) : toPostSlug(title)

  if (!slug) throw ApiError.badRequest("Slug is required")

  return {
    title,
    slug,
    excerpt: toOptionalText(body.excerpt, "Excerpt", MAX_POST_EXCERPT_LENGTH),
    content,
    coverImage: toUrl(body.coverImage, "Cover image"),
    ogImage: toUrl(body.ogImage, "OG image"),
    category: toOptionalEnum(body.category, "Category", POST_CATEGORIES),
    tags: toTags(body.tags),
    // Authors never flag their own post as featured; that is an admin decision.
    isFeatured: false,
    seoTitle: toOptionalText(body.seoTitle, "SEO title", MAX_POST_TITLE_LENGTH),
    seoDescription: toOptionalText(
      body.seoDescription,
      "SEO description",
      MAX_POST_SEO_DESCRIPTION_LENGTH
    ),
  }
}

/**
 * Partial update. Absent keys stay `undefined` so Prisma leaves the stored value
 * alone. There is deliberately no `status` here: the workflow is only ever
 * moved through `submitPost`, `withdrawPost` and `reviewPost`.
 */
export function parsePostUpdateInput(body: unknown): Partial<PostInput> {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

  const update: Partial<PostInput> = {}

  if (body.title !== undefined) {
    update.title = toText(body.title, "Title", { max: MAX_POST_TITLE_LENGTH })
  }

  if (body.slug !== undefined) {
    const slug = toPostSlug(toOptionalText(body.slug, "Slug", MAX_POST_SLUG_LENGTH) ?? "")

    if (!slug) throw ApiError.badRequest("Slug is required")

    update.slug = slug
  }

  if (body.excerpt !== undefined) {
    update.excerpt = toOptionalText(body.excerpt, "Excerpt", MAX_POST_EXCERPT_LENGTH)
  }

  if (body.content !== undefined) {
    update.content = toText(body.content, "Content", { max: MAX_POST_CONTENT_LENGTH })
  }

  if (body.coverImage !== undefined) {
    update.coverImage = toUrl(body.coverImage, "Cover image")
  }

  if (body.ogImage !== undefined) {
    update.ogImage = toUrl(body.ogImage, "OG image")
  }

  if (body.category !== undefined) {
    update.category = toOptionalEnum(body.category, "Category", POST_CATEGORIES)
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

/** Admin payloads may additionally set `status` and `isFeatured`. */
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

/**
 * The core rule: once a post has been approved it is frozen for its author.
 * Members and instructors may only edit or delete while the post is still inside
 * the review loop (DRAFT / PENDING / REJECTED) — archiving a live post is an
 * admin action. Admins bypass the gate entirely.
 */
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

  const post = await prisma.post.findUnique({ where: { id } })

  if (!post) throw ApiError.notFound("Post not found")

  return post
}

async function findPostRowWithAuthor(id: string): Promise<PostRowWithAuthor> {
  if (!id) throw ApiError.badRequest("Post id is required")

  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: { select: AUTHOR_SELECT } },
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

/** `publishedAt` only ever holds a value while the post is actually live. */
function publishedAtFor(status: PostStatus, current: Date | null): Date | null {
  return status === PostStatus.PUBLISHED ? (current ?? new Date()) : null
}

/** Keeps the derived excerpt and reading time in step with the body. */
function derivedFields(
  input: Partial<PostInput>
): { excerpt?: string | null; readingMinutes?: number } {
  if (input.content === undefined) return {}

  return {
    // Only re-derive when the author did not supply their own excerpt.
    ...(input.excerpt === undefined
      ? { excerpt: deriveExcerpt(input.content, null, MAX_POST_EXCERPT_LENGTH) }
      : {}),
    readingMinutes: estimateReadingMinutes(input.content),
  }
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

  const where: Prisma.PostWhereInput = {
    status: PostStatus.PUBLISHED,
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.tag ? { tags: { has: filters.tag.toLowerCase() } } : {}),
    ...(term
      ? {
          OR: [
            { title: { contains: term, mode: "insensitive" as const } },
            { excerpt: { contains: term, mode: "insensitive" as const } },
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
      include: { author: { select: AUTHOR_SELECT } },
    }),
    prisma.post.count({ where }),
  ])

  return buildPage(rows.map(mapSummary), total, page, pageSize)
}

export async function getPublishedPostBySlug(slug: string): Promise<PublicPostDetail> {
  if (!slug) throw ApiError.badRequest("Slug is required")

  const post = await prisma.post.findFirst({
    where: { slug, status: PostStatus.PUBLISHED },
    include: { author: { select: AUTHOR_SELECT } },
  })

  if (!post) throw ApiError.notFound("Post not found")

  return {
    ...mapMyDetail(post),
    author: mapAuthor(post.author),
  }
}

/** Category and tag facets for the `/posts` filter chips. */
export async function listPostFacets(): Promise<{
  categories: { category: PostCategory; count: number }[]
  tags: { tag: string; count: number }[]
}> {
  // One narrow query beats two aggregations here: the published set is small,
  // and counting in JS keeps the nullable enum and the array column in one pass.
  const rows = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    select: { category: true, tags: true },
  })

  const categoryCounts = new Map<PostCategory, number>()
  const tagCounts = new Map<string, number>()

  for (const row of rows) {
    if (row.category) {
      categoryCounts.set(row.category, (categoryCounts.get(row.category) ?? 0) + 1)
    }

    for (const tag of row.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }

  return {
    categories: [...categoryCounts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
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

  const where: Prisma.PostWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.tag ? { tags: { has: filters.tag.toLowerCase() } } : {}),
    ...(term
      ? {
          OR: [
            { title: { contains: term, mode: "insensitive" as const } },
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
      include: { author: { select: AUTHOR_SELECT } },
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

  const where: Prisma.PostWhereInput = {
    authorId: userId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(term
      ? {
          OR: [
            { title: { contains: term, mode: "insensitive" as const } },
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

/** Per status totals for the "my posts" and admin metric cards. */
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
    const created = await prisma.post.create({
      data: {
        title: input.title,
        slug: input.slug,
        excerpt: deriveExcerpt(input.content, input.excerpt, MAX_POST_EXCERPT_LENGTH),
        content: input.content,
        coverImage: input.coverImage,
        ogImage: input.ogImage,
        category: input.category,
        tags: input.tags,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        readingMinutes: estimateReadingMinutes(input.content),
        authorId: actor.userId,
        // Authors always start from DRAFT; publishing is an admin decision.
        status: PostStatus.DRAFT,
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

  await prisma.post.update({ where: { id }, data: { ...input, ...derivedFields(input) } })

  return getMyPost(id, actor)
}

export async function deletePost(id: string, actor: PostActor): Promise<void> {
  const existing = await findPostRow(id)

  assertOwnership(existing.authorId, actor)
  assertCanModifyOwnPost(existing.status, actor)

  await prisma.post.delete({ where: { id } })
}

/** DRAFT / REJECTED -> PENDING. */
export async function submitPost(id: string, actor: PostActor): Promise<MyPostDetail> {
  const existing = await findPostRow(id)

  assertOwnership(existing.authorId, actor)
  assertCanModifyOwnPost(existing.status, actor)

  if (existing.status !== PostStatus.DRAFT && existing.status !== PostStatus.REJECTED) {
    throw ApiError.badRequest("Only a draft or a rejected post can be sent for review")
  }

  if (!stripMarkdown(existing.content)) {
    throw ApiError.badRequest("Add some content before sending this post for review")
  }

  await prisma.post.update({
    where: { id },
    data: {
      status: PostStatus.PENDING,
      submittedAt: new Date(),
      // The rejection is resolved by the resubmission, not erased for good.
      rejectionReason: null,
    },
  })

  return getMyPost(id, actor)
}

/** PENDING -> DRAFT, pulling the post back out of the review queue. */
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

  try {
    const created = await prisma.post.create({
      data: {
        title: input.title,
        slug: input.slug,
        excerpt: deriveExcerpt(input.content, input.excerpt, MAX_POST_EXCERPT_LENGTH),
        content: input.content,
        coverImage: input.coverImage,
        ogImage: input.ogImage,
        category: input.category,
        tags: input.tags,
        isFeatured: input.isFeatured,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        readingMinutes: estimateReadingMinutes(input.content),
        authorId: actor.userId,
        publishedAt: publishedAtFor(status, null),
        // An admin writing on the society's behalf skips the queue, so the
        // review stamps are filled in to match.
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
            // Publishing resolves an earlier rejection; other moves keep it.
            ...(status === PostStatus.PUBLISHED
              ? { rejectionReason: null, reviewedAt: new Date(), reviewedById: actor.userId }
              : {}),
          }),
    },
  })

  return getPostDetailForAdmin(id)
}

/** The moderation decision: PENDING -> PUBLISHED, or PENDING -> REJECTED. */
export async function reviewPost(
  id: string,
  input: PostReviewInput,
  actor: PostActor
): Promise<PostDetail> {
  // The route handlers already require an admin session, but the service is the
  // real boundary: without this, an author could approve their own submission
  // through any caller that reaches it.
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