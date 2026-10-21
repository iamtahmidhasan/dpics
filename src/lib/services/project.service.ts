import "server-only"

import { Prisma } from "@/generated/prisma/client"
import { PostStatus } from "@/generated/prisma/enums"
import { ApiError } from "@/lib/api-error"
import { EmailService } from "@/lib/services/email.service"
import { SITE_URL } from "@/lib/site"
import prisma from "@/lib/prisma"
import { resolveUserImage } from "@/lib/user-image"
import {
  isRecord,
  toOptionalText,
  toText,
  toUrl,
} from "@/lib/validation"
import {
  DEFAULT_PROJECT_PAGE_SIZE,
  MAX_PROJECT_DESCRIPTION_LENGTH,
  MAX_PROJECT_EXCERPT_LENGTH,
  MAX_PROJECT_IMAGES,
  MAX_PROJECT_PAGE_SIZE,
  MAX_PROJECT_SLUG_LENGTH,
  MAX_PROJECT_TAGS,
  MAX_PROJECT_TECH_STACK,
  MAX_PROJECT_TITLE_LENGTH,
  PROJECT_STATUSES,
} from "@/lib/project-constants"
import { toProjectSlug } from "@/lib/project-slug"
import { ActivityAction, ActivityLogService } from "@/lib/services/activity-log.service"

// ============================================================================
// DTOs
// ============================================================================

export type ProjectAuthor = {
  id: string
  name: string
  avatar: string | null
  studentId?: string | null
  department?: string | null
}

export type ProjectCategoryInfo = {
  id: string
  name: string
  nameBn: string | null
  slug: string
}

export type TeamMember = {
  name: string
  role?: string
  studentId?: string
  githubUrl?: string
  profileUrl?: string
  userId?: string
  avatar?: string
  department?: string
}

export type ProjectSummary = {
  id: string
  title: string
  titleBn: string | null
  slug: string
  excerpt: string | null
  excerptBn: string | null
  coverImage: string | null
  images: string[]
  liveUrl: string | null
  githubUrl: string | null
  youtubeUrl: string | null
  techStack: string[]
  tags: string[]
  isFeatured: boolean
  status: PostStatus
  massageForAuthor?: string | null
  publishedAt: string | null
  submittedAt: string | null
  categoryId: string | null
  category: ProjectCategoryInfo | null
  author: ProjectAuthor
  createdAt: string
  updatedAt: string
}

export type ProjectDetail = ProjectSummary & {
  description: string
  descriptionBn: string | null
  teamMembers: TeamMember[]
  massageForAuthor: string | null
  reviewedAt: string | null
  reviewedById: string | null
  author: ProjectAuthor & { email?: string }
}

export type AdminProjectSummary = ProjectSummary & {
  author: ProjectAuthor & { email: string }
  massageForAuthor: string | null
  reviewedAt: string | null
}

export type ProjectListResult = {
  projects: ProjectSummary[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type AdminProjectListResult = {
  projects: AdminProjectSummary[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================================================
// Selection Objects
// ============================================================================

const AUTHOR_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  selactedImg: true,
  member: {
    select: {
      studentId: true,
      department: true,
    },
  },
} as const

const CATEGORY_SELECT = {
  id: true,
  name: true,
  nameBn: true,
  slug: true,
} as const

function formatAuthor(raw: {
  id: string
  name: string
  email?: string
  image: string[]
  selactedImg: string | null
  member?: { studentId: string | null; department: string | null } | null
}): ProjectAuthor & { email?: string } {
  const { avatar } = resolveUserImage(raw.image, raw.selactedImg)
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    avatar,
    studentId: raw.member?.studentId ?? null,
    department: raw.member?.department ?? null,
  }
}

// ============================================================================
// Service
// ============================================================================

export class ProjectService {
  /**
   * List published projects for public showcase
   */
  static async listProjects(params: {
    page?: number
    pageSize?: number
    search?: string
    category?: string
    techStack?: string
    featuredOnly?: boolean
  }): Promise<ProjectListResult> {
    const page = Math.max(1, params.page ?? 1)
    const pageSize = Math.min(
      MAX_PROJECT_PAGE_SIZE,
      Math.max(1, params.pageSize ?? DEFAULT_PROJECT_PAGE_SIZE)
    )

    const where: Prisma.ProjectWhereInput = {
      status: PostStatus.PUBLISHED,
    }

    if (params.featuredOnly) {
      where.isFeatured = true
    }

    if (params.category && params.category !== "ALL") {
      where.category = { slug: params.category }
    }

    if (params.techStack) {
      where.techStack = { has: params.techStack }
    }

    if (params.search?.trim()) {
      const q = params.search.trim()
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { titleBn: { contains: q, mode: "insensitive" } },
        { excerpt: { contains: q, mode: "insensitive" } },
        { techStack: { has: q } },
        { tags: { has: q } },
      ]
    }

    const [total, rows] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        select: {
          id: true,
          title: true,
          titleBn: true,
          slug: true,
          excerpt: true,
          excerptBn: true,
          coverImage: true,
          images: true,
          liveUrl: true,
          githubUrl: true,
          youtubeUrl: true,
          techStack: true,
          tags: true,
          isFeatured: true,
          status: true,
          publishedAt: true,
          submittedAt: true,
          categoryId: true,
          category: { select: CATEGORY_SELECT },
          author: { select: AUTHOR_SELECT },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    const projects: ProjectSummary[] = rows.map((r) => ({
      ...r,
      publishedAt: r.publishedAt?.toISOString() ?? null,
      submittedAt: r.submittedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      author: formatAuthor(r.author),
    }))

    return {
      projects,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    }
  }

  /**
   * Get public project detail by slug
   */
  static async getProjectBySlug(slug: string): Promise<ProjectDetail> {
    const row = await prisma.project.findUnique({
      where: { slug },
      include: {
        category: { select: CATEGORY_SELECT },
        author: { select: AUTHOR_SELECT },
      },
    })

    if (!row) {
      throw ApiError.notFound("Project not found")
    }

    return {
      id: row.id,
      title: row.title,
      titleBn: row.titleBn,
      slug: row.slug,
      excerpt: row.excerpt,
      excerptBn: row.excerptBn,
      description: row.description,
      descriptionBn: row.descriptionBn,
      coverImage: row.coverImage,
      images: row.images,
      liveUrl: row.liveUrl,
      githubUrl: row.githubUrl,
      youtubeUrl: row.youtubeUrl,
      techStack: row.techStack,
      tags: row.tags,
      isFeatured: row.isFeatured,
      status: row.status,
      teamMembers: Array.isArray(row.teamMembers) ? (row.teamMembers as unknown as TeamMember[]) : [],
      massageForAuthor: row.massageForAuthor,
      submittedAt: row.submittedAt?.toISOString() ?? null,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      reviewedById: row.reviewedById,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      categoryId: row.categoryId,
      category: row.category,
      author: formatAuthor(row.author),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  /**
   * Get project detail for admin moderation or editing (by ID or Slug)
   */
  static async getProjectForAdmin(idOrSlug: string): Promise<ProjectDetail> {
    const row = await prisma.project.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        category: { select: CATEGORY_SELECT },
        author: { select: AUTHOR_SELECT },
      },
    })

    if (!row) {
      throw ApiError.notFound("Project not found")
    }

    return {
      id: row.id,
      title: row.title,
      titleBn: row.titleBn,
      slug: row.slug,
      excerpt: row.excerpt,
      excerptBn: row.excerptBn,
      description: row.description,
      descriptionBn: row.descriptionBn,
      coverImage: row.coverImage,
      images: row.images,
      liveUrl: row.liveUrl,
      githubUrl: row.githubUrl,
      youtubeUrl: row.youtubeUrl,
      techStack: row.techStack,
      tags: row.tags,
      isFeatured: row.isFeatured,
      status: row.status,
      teamMembers: Array.isArray(row.teamMembers) ? (row.teamMembers as unknown as TeamMember[]) : [],
      massageForAuthor: row.massageForAuthor,
      submittedAt: row.submittedAt?.toISOString() ?? null,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      reviewedById: row.reviewedById,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      categoryId: row.categoryId,
      category: row.category,
      author: formatAuthor(row.author),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  /**
   * List projects for admin moderation
   */
  static async listAdminProjects(params: {
    page?: number
    pageSize?: number
    search?: string
    status?: string
    categoryId?: string
    authorId?: string
  }): Promise<AdminProjectListResult> {
    const page = Math.max(1, params.page ?? 1)
    const pageSize = Math.min(
      MAX_PROJECT_PAGE_SIZE,
      Math.max(1, params.pageSize ?? DEFAULT_PROJECT_PAGE_SIZE)
    )

    const where: Prisma.ProjectWhereInput = {}

    if (params.status && params.status !== "ALL" && PROJECT_STATUSES.includes(params.status as PostStatus)) {
      where.status = params.status as PostStatus
    }

    if (params.categoryId && params.categoryId !== "ALL") {
      where.categoryId = params.categoryId
    }

    if (params.authorId) {
      where.authorId = params.authorId
    }

    if (params.search?.trim()) {
      const q = params.search.trim()
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { titleBn: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { author: { name: { contains: q, mode: "insensitive" } } },
        { author: { email: { contains: q, mode: "insensitive" } } },
      ]
    }

    const [total, rows] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        include: {
          category: { select: CATEGORY_SELECT },
          author: { select: AUTHOR_SELECT },
        },
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    const projects: AdminProjectSummary[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      titleBn: r.titleBn,
      slug: r.slug,
      excerpt: r.excerpt,
      excerptBn: r.excerptBn,
      coverImage: r.coverImage,
      images: r.images,
      liveUrl: r.liveUrl,
      githubUrl: r.githubUrl,
      youtubeUrl: r.youtubeUrl,
      techStack: r.techStack,
      tags: r.tags,
      isFeatured: r.isFeatured,
      status: r.status,
      massageForAuthor: r.massageForAuthor,
      submittedAt: r.submittedAt?.toISOString() ?? null,
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
      publishedAt: r.publishedAt?.toISOString() ?? null,
      categoryId: r.categoryId,
      category: r.category,
      author: formatAuthor(r.author) as ProjectAuthor & { email: string },
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))

    return {
      projects,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    }
  }

  /**
   * Create a new project (Student or Admin)
   */
  static async createProject(
    userId: string,
    rawInput: unknown,
    isAdminUser = false
  ): Promise<ProjectDetail> {
    if (!isRecord(rawInput)) {
      throw ApiError.badRequest("Invalid input payload")
    }

    const title = toText(rawInput.title, "Title", { max: MAX_PROJECT_TITLE_LENGTH })
    const titleBn = toOptionalText(rawInput.titleBn, "Bangla Title", MAX_PROJECT_TITLE_LENGTH)

    const baseSlug = toProjectSlug(
      toOptionalText(rawInput.slug, "Slug", MAX_PROJECT_SLUG_LENGTH) || title
    )
    if (!baseSlug) {
      throw ApiError.badRequest("Could not generate valid project slug from title")
    }

    // Ensure slug uniqueness
    let slug = baseSlug
    let counter = 1
    while (await prisma.project.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`
    }

    const excerpt = toOptionalText(rawInput.excerpt, "Excerpt", MAX_PROJECT_EXCERPT_LENGTH)
    const excerptBn = toOptionalText(rawInput.excerptBn, "Bangla Excerpt", MAX_PROJECT_EXCERPT_LENGTH)

    const description = toText(rawInput.description, "Description", {
      max: MAX_PROJECT_DESCRIPTION_LENGTH,
    })
    const descriptionBn = toOptionalText(
      rawInput.descriptionBn,
      "Bangla Description",
      MAX_PROJECT_DESCRIPTION_LENGTH
    )

    const coverImage = toUrl(rawInput.coverImage, "Cover Image")
    const images: string[] = Array.isArray(rawInput.images)
      ? rawInput.images
          .map((img) => toUrl(img, "Gallery Image"))
          .filter((img): img is string => Boolean(img))
          .slice(0, MAX_PROJECT_IMAGES)
      : []

    const liveUrl = toUrl(rawInput.liveUrl, "Live Demo URL")
    const githubUrl = toUrl(rawInput.githubUrl, "GitHub Repository URL")
    const youtubeUrl = toUrl(rawInput.youtubeUrl, "Video Demo URL")

    const techStack: string[] = Array.isArray(rawInput.techStack)
      ? rawInput.techStack.map((s) => String(s).trim()).filter(Boolean).slice(0, MAX_PROJECT_TECH_STACK)
      : []

    const tags: string[] = Array.isArray(rawInput.tags)
      ? rawInput.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, MAX_PROJECT_TAGS)
      : []

    const categoryId = toOptionalText(rawInput.categoryId, "Category ID", 50)
    const teamMembers = Array.isArray(rawInput.teamMembers) ? rawInput.teamMembers : []

    const submitForReview = Boolean(rawInput.submitForReview)
    const initialStatus =
      isAdminUser && (Boolean(rawInput.publishImmediately) || rawInput.status === PostStatus.PUBLISHED)
        ? PostStatus.PUBLISHED
        : submitForReview
          ? PostStatus.PENDING
          : PostStatus.DRAFT

    const project = await prisma.project.create({
      data: {
        title,
        titleBn,
        slug,
        excerpt,
        excerptBn,
        description,
        descriptionBn,
        coverImage,
        images,
        liveUrl,
        githubUrl,
        youtubeUrl,
        techStack,
        tags,
        categoryId: categoryId || null,
        teamMembers: teamMembers as Prisma.InputJsonValue,
        status: initialStatus,
        submittedAt: submitForReview ? new Date() : null,
        publishedAt: initialStatus === PostStatus.PUBLISHED ? new Date() : null,
        authorId: userId,
      },
      include: {
        category: { select: CATEGORY_SELECT },
        author: { select: AUTHOR_SELECT },
      },
    })

    // Log activity
    await ActivityLogService.log({
      actor: { id: userId, name: project.author.name, email: project.author.email },
      action: ActivityAction.CREATE,
      actionName: "PROJECT_CREATED",
      entity: "Project",
      entityId: project.id,
      description: `Created project "${project.title}" (Status: ${project.status})`,
      metadata: { slug: project.slug },
    })

    return this.getProjectBySlug(project.slug)
  }

  /**
   * Update an existing project (Student or Admin)
   */
  static async updateProject(
    projectId: string,
    userId: string,
    rawInput: unknown,
    isAdminUser = false
  ): Promise<ProjectDetail> {
    if (!isRecord(rawInput)) {
      throw ApiError.badRequest("Invalid input payload")
    }

    const existing = await prisma.project.findUnique({
      where: { id: projectId },
      include: { author: true },
    })

    if (!existing) {
      throw ApiError.notFound("Project not found")
    }

    if (!isAdminUser && existing.authorId !== userId) {
      throw ApiError.forbidden("You do not have permission to update this project")
    }

    if (!isAdminUser && existing.status === PostStatus.PUBLISHED) {
      throw ApiError.forbidden(
        "Approved projects cannot be edited. Please contact an administrator to make changes."
      )
    }

    const title = toText(rawInput.title, "Title", { max: MAX_PROJECT_TITLE_LENGTH })
    const titleBn = toOptionalText(rawInput.titleBn, "Bangla Title", MAX_PROJECT_TITLE_LENGTH)

    const rawSlug = toOptionalText(rawInput.slug, "Slug", MAX_PROJECT_SLUG_LENGTH)
    let slug = existing.slug
    if (rawSlug && rawSlug !== existing.slug) {
      const baseSlug = toProjectSlug(rawSlug)
      if (!baseSlug) {
        throw ApiError.badRequest("Invalid project slug")
      }
      const conflict = await prisma.project.findFirst({
        where: {
          slug: baseSlug,
          NOT: { id: projectId },
        },
      })
      if (conflict) {
        let counter = 1
        let candidate = `${baseSlug}-${counter}`
        while (
          await prisma.project.findFirst({
            where: { slug: candidate, NOT: { id: projectId } },
          })
        ) {
          counter++
          candidate = `${baseSlug}-${counter}`
        }
        slug = candidate
      } else {
        slug = baseSlug
      }
    }

    const excerpt = toOptionalText(rawInput.excerpt, "Excerpt", MAX_PROJECT_EXCERPT_LENGTH)
    const excerptBn = toOptionalText(rawInput.excerptBn, "Bangla Excerpt", MAX_PROJECT_EXCERPT_LENGTH)

    const description = toText(rawInput.description, "Description", {
      max: MAX_PROJECT_DESCRIPTION_LENGTH,
    })
    const descriptionBn = toOptionalText(
      rawInput.descriptionBn,
      "Bangla Description",
      MAX_PROJECT_DESCRIPTION_LENGTH
    )

    const coverImage = toUrl(rawInput.coverImage, "Cover Image")
    const images: string[] = Array.isArray(rawInput.images)
      ? rawInput.images
          .map((img) => toUrl(img, "Gallery Image"))
          .filter((img): img is string => Boolean(img))
          .slice(0, MAX_PROJECT_IMAGES)
      : existing.images

    const liveUrl = toUrl(rawInput.liveUrl, "Live Demo URL")
    const githubUrl = toUrl(rawInput.githubUrl, "GitHub Repository URL")
    const youtubeUrl = toUrl(rawInput.youtubeUrl, "Video Demo URL")

    const techStack: string[] = Array.isArray(rawInput.techStack)
      ? rawInput.techStack.map((s) => String(s).trim()).filter(Boolean).slice(0, MAX_PROJECT_TECH_STACK)
      : existing.techStack

    const tags: string[] = Array.isArray(rawInput.tags)
      ? rawInput.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, MAX_PROJECT_TAGS)
      : existing.tags

    const categoryId = toOptionalText(rawInput.categoryId, "Category ID", 50)
    const teamMembers = Array.isArray(rawInput.teamMembers) ? rawInput.teamMembers : existing.teamMembers

    const submitForReview = Boolean(rawInput.submitForReview)

    let nextStatus = existing.status
    let publishedAt = existing.publishedAt
    let submittedAt = existing.submittedAt

    if (isAdminUser) {
      if (rawInput.status && PROJECT_STATUSES.includes(rawInput.status as PostStatus)) {
        nextStatus = rawInput.status as PostStatus
        if (nextStatus === PostStatus.PUBLISHED && !publishedAt) {
          publishedAt = new Date()
        }
      } else if (rawInput.publishImmediately) {
        nextStatus = PostStatus.PUBLISHED
        if (!publishedAt) publishedAt = new Date()
      }
    } else {
      if (submitForReview) {
        nextStatus = PostStatus.PENDING
        submittedAt = new Date()
      }
    }

    const isFeatured =
      isAdminUser && typeof rawInput.isFeatured === "boolean"
        ? rawInput.isFeatured
        : existing.isFeatured

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        title,
        titleBn,
        slug,
        excerpt,
        excerptBn,
        description,
        descriptionBn,
        coverImage,
        images,
        liveUrl,
        githubUrl,
        youtubeUrl,
        techStack,
        tags,
        categoryId: categoryId || null,
        teamMembers: teamMembers as Prisma.InputJsonValue,
        status: nextStatus,
        publishedAt,
        submittedAt,
        isFeatured,
      },
      include: {
        category: { select: CATEGORY_SELECT },
        author: { select: AUTHOR_SELECT },
      },
    })

    await ActivityLogService.log({
      actor: { id: userId },
      action: ActivityAction.UPDATE,
      actionName: "PROJECT_UPDATED",
      entity: "Project",
      entityId: updated.id,
      description: `Updated project "${updated.title}" (Status: ${updated.status})`,
      metadata: { slug: updated.slug },
    })

    return this.getProjectBySlug(updated.slug)
  }

  /**
   * Review project: Approve or Reject (Admin only)
   */
  static async reviewProject(
    projectId: string,
    adminId: string,
    input: {
      status: PostStatus
      massageForAuthor?: string | null
    }
  ): Promise<ProjectDetail> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { author: true },
    })

    if (!project) {
      throw ApiError.notFound("Project not found")
    }

    const newStatus = input.status
    if (newStatus !== PostStatus.PUBLISHED && newStatus !== PostStatus.REJECTED) {
      throw ApiError.badRequest("Invalid review status. Expected PUBLISHED or REJECTED.")
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedById: adminId,
        massageForAuthor: input.massageForAuthor || null,
        publishedAt: newStatus === PostStatus.PUBLISHED ? new Date() : project.publishedAt,
      },
      include: {
        author: { select: AUTHOR_SELECT },
      },
    })

    // Dispatch email notification to author
    if (project.author.email) {
      try {
        const recipient = {
          email: project.author.email,
          name: project.author.name,
          userId: project.author.id,
        }

        if (newStatus === PostStatus.PUBLISHED) {
          await EmailService.sendTemplatedEmail("PROJECT_PUBLISHED", recipient, {
            projectTitle: project.title,
            projectUrl: `${SITE_URL.origin}/projects/${project.slug}`,
          })
        } else if (newStatus === PostStatus.REJECTED) {
          await EmailService.sendTemplatedEmail("PROJECT_REJECTED", recipient, {
            projectTitle: project.title,
            massageForAuthor: input.massageForAuthor || "Please review technical requirements and links.",
          })
        }
      } catch (err) {
        console.error("[ProjectService] Failed to send review email:", err)
      }
    }

    // Activity log
    await ActivityLogService.log({
      actor: { id: adminId },
      action: ActivityAction.STATUS_CHANGE,
      actionName: "PROJECT_REVIEWED",
      entity: "Project",
      entityId: project.id,
      description: `Reviewed project "${project.title}": Status changed to ${newStatus}`,
      oldData: { status: project.status },
      newData: { status: newStatus, massageForAuthor: input.massageForAuthor },
    })

    return this.getProjectBySlug(updated.slug)
  }

  /**
   * Toggle featured status
   */
  static async toggleFeatured(projectId: string, adminId: string): Promise<boolean> {
    const current = await prisma.project.findUnique({ where: { id: projectId } })
    if (!current) throw ApiError.notFound("Project not found")

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { isFeatured: !current.isFeatured },
    })

    await ActivityLogService.log({
      actor: { id: adminId },
      action: ActivityAction.UPDATE,
      actionName: "PROJECT_FEATURED_TOGGLED",
      entity: "Project",
      entityId: projectId,
      description: `Project "${current.title}" featured: ${updated.isFeatured}`,
    })

    return updated.isFeatured
  }

  /**
   * Delete a project
   */
  static async deleteProject(projectId: string, userId: string, isAdminUser = false): Promise<void> {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) throw ApiError.notFound("Project not found")

    if (!isAdminUser && project.authorId !== userId) {
      throw ApiError.forbidden("You do not have permission to delete this project")
    }

    if (!isAdminUser && project.status === PostStatus.PUBLISHED) {
      throw ApiError.forbidden(
        "Approved projects cannot be deleted. Please contact an administrator."
      )
    }

    await prisma.project.delete({ where: { id: projectId } })

    await ActivityLogService.log({
      actor: { id: userId },
      action: ActivityAction.DELETE,
      actionName: "PROJECT_DELETED",
      entity: "Project",
      entityId: projectId,
      description: `Deleted project "${project.title}"`,
    })
  }

  /**
   * List projects authored by a specific user (for Dashboard)
   */
  static async listUserProjects(userId: string): Promise<ProjectSummary[]> {
    const rows = await prisma.project.findMany({
      where: { authorId: userId },
      include: {
        category: { select: CATEGORY_SELECT },
        author: { select: AUTHOR_SELECT },
      },
      orderBy: [{ createdAt: "desc" }],
    })

    return rows.map((r) => ({
      ...r,
      publishedAt: r.publishedAt?.toISOString() ?? null,
      submittedAt: r.submittedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      author: formatAuthor(r.author),
    }))
  }
}
