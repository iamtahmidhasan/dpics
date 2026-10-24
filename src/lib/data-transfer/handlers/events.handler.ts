import prisma from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"
import { EventStatus, EventType } from "@/generated/prisma/enums"
import {
  parseArrayField,
  parseBooleanField,
  parseDateField,
  parseJsonField,
  serializeArrayField,
} from "../csv-utils"
import type { ImportOptions, ImportResult } from "../types"

export async function exportEvents(): Promise<Record<string, unknown>[]> {
  const events = await prisma.event.findMany({
    orderBy: { startDate: "desc" },
    include: {
      category: true,
      author: { select: { email: true, name: true } },
    },
  })

  return events.map((ev) => ({
    title: ev.title,
    titleBn: ev.titleBn || "",
    slug: ev.slug,
    excerpt: ev.excerpt || "",
    excerptBn: ev.excerptBn || "",
    content: ev.content,
    contentBn: ev.contentBn || "",
    coverImage: ev.coverImage || "",
    images: serializeArrayField(ev.images, true),
    eventType: ev.eventType,
    status: ev.status,
    startDate: ev.startDate.toISOString(),
    endDate: ev.endDate ? ev.endDate.toISOString() : "",
    registrationDeadline: ev.registrationDeadline ? ev.registrationDeadline.toISOString() : "",
    venue: ev.venue || "",
    venueBn: ev.venueBn || "",
    locationMapUrl: ev.locationMapUrl || "",
    onlineJoinUrl: ev.onlineJoinUrl || "",
    categorySlug: ev.category?.slug || "",
    tags: ev.tags.join(","),
    isFeatured: ev.isFeatured,
    isRegistrationOpen: ev.isRegistrationOpen,
    isFree: ev.isFree,
    registrationFee: ev.registrationFee,
    maxParticipants: ev.maxParticipants || "",
    guestSpeakers: ev.guestSpeakers
      ? typeof ev.guestSpeakers === "string"
        ? ev.guestSpeakers
        : JSON.stringify(ev.guestSpeakers)
      : "",
    ticketTemplateId: ev.ticketTemplateId || "",
    authorEmail: ev.author?.email || "",
  }))
}

export async function importEvents(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    entity: "events",
    format: "csv",
    totalRows: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    dryRun: !!options.dryRun,
    errors: [],
  }

  // Pre-fetch categories for fast lookup
  const categories = await prisma.category.findMany({
    where: { type: "EVENT" },
    select: { id: true, slug: true },
  })
  const categoryMap = new Map(categories.map((c) => [c.slug.toLowerCase().trim(), c.id]))

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1
    const title = String(row.title || "").trim()
    const slug = String(row.slug || "").trim().toLowerCase()
    const content = String(row.content || "").trim()

    if (!title || !slug) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: slug || title || "unknown",
        message: "Title and slug are required",
      })
      continue
    }

    if (!content) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: slug,
        message: "Content is required",
      })
      continue
    }

    const startDate = parseDateField(row.startDate)
    if (!startDate) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: slug,
        message: "Valid startDate is required (e.g. YYYY-MM-DD or ISO timestamp)",
      })
      continue
    }

    const endDate = parseDateField(row.endDate)
    const registrationDeadline = parseDateField(row.registrationDeadline)

    const eventTypeStr = String(row.eventType || "").trim().toUpperCase()
    const eventType = eventTypeStr in EventType ? (eventTypeStr as EventType) : EventType.IN_PERSON

    const statusStr = String(row.status || "").trim().toUpperCase()
    const status = statusStr in EventStatus ? (statusStr as EventStatus) : EventStatus.UPCOMING

    const categorySlug = String(row.categorySlug || "").trim().toLowerCase()
    const categoryId = categorySlug ? categoryMap.get(categorySlug) || null : null

    // Author resolution
    let authorId = options.actor?.id || null
    const authorEmail = String(row.authorEmail || "").trim().toLowerCase()
    if (authorEmail) {
      const authorUser = await prisma.user.findUnique({
        where: { email: authorEmail },
        select: { id: true },
      })
      if (authorUser) {
        authorId = authorUser.id
      }
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
        message: "Cannot associate event with an author user",
      })
      continue
    }

    // Media & Image fields
    const coverImage = row.coverImage ? String(row.coverImage).trim() : null
    const images = parseArrayField(row.images, true)
    const guestSpeakersRaw = parseJsonField<unknown>(row.guestSpeakers, null)
    const guestSpeakers = guestSpeakersRaw ? (guestSpeakersRaw as Prisma.InputJsonValue) : null

    const tags = parseArrayField(row.tags)
    const isFree = parseBooleanField(row.isFree, true)
    const registrationFee = Number(row.registrationFee) || 0
    const maxParticipants = row.maxParticipants ? Number(row.maxParticipants) || null : null
    const isRegistrationOpen = parseBooleanField(row.isRegistrationOpen, true)
    const isFeatured = parseBooleanField(row.isFeatured, false)
    const ticketTemplateId = row.ticketTemplateId ? String(row.ticketTemplateId).trim() : null

    if (options.dryRun) {
      const existing = await prisma.event.findUnique({ where: { slug } })
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
      const existing = await prisma.event.findUnique({ where: { slug } })
      if (existing) {
        if (options.mode === "create_only") {
          result.skipped++
          continue
        }

        await prisma.event.update({
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
            eventType,
            status,
            startDate,
            endDate,
            registrationDeadline,
            venue: row.venue ? String(row.venue).trim() : existing.venue,
            venueBn: row.venueBn ? String(row.venueBn).trim() : existing.venueBn,
            locationMapUrl: row.locationMapUrl ? String(row.locationMapUrl).trim() : existing.locationMapUrl,
            onlineJoinUrl: row.onlineJoinUrl ? String(row.onlineJoinUrl).trim() : existing.onlineJoinUrl,
            categoryId: categoryId || existing.categoryId,
            tags: tags.length > 0 ? tags : existing.tags,
            isFeatured,
            isRegistrationOpen,
            isFree,
            registrationFee,
            maxParticipants,
            guestSpeakers: guestSpeakers !== null ? guestSpeakers : existing.guestSpeakers ?? undefined,
            ticketTemplateId: ticketTemplateId || existing.ticketTemplateId,
          },
        })
        result.updated++
      } else {
        await prisma.event.create({
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
            eventType,
            status,
            startDate,
            endDate,
            registrationDeadline,
            venue: row.venue ? String(row.venue).trim() : null,
            venueBn: row.venueBn ? String(row.venueBn).trim() : null,
            locationMapUrl: row.locationMapUrl ? String(row.locationMapUrl).trim() : null,
            onlineJoinUrl: row.onlineJoinUrl ? String(row.onlineJoinUrl).trim() : null,
            categoryId,
            tags,
            isFeatured,
            isRegistrationOpen,
            isFree,
            registrationFee,
            maxParticipants,
            guestSpeakers: guestSpeakers !== null ? guestSpeakers : undefined,
            ticketTemplateId,
            authorId,
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
