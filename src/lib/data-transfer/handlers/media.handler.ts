import prisma from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"
import { TemplateType } from "@/generated/prisma/enums"
import { parseBooleanField } from "../csv-utils"
import type { ImportOptions, ImportResult } from "../types"

// ==========================================
// MEDIA
// ==========================================
export async function exportMedia(): Promise<Record<string, unknown>[]> {
  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
  })

  return media.map((m) => ({
    fileId: m.fileId,
    name: m.name,
    url: m.url,
    thumbnailUrl: m.thumbnailUrl || "",
    filePath: m.filePath || "",
    fileType: m.fileType || "image",
    mimeType: m.mimeType || "",
    size: m.size,
    width: m.width || "",
    height: m.height || "",
    alt: m.alt || "",
    folder: m.folder || "general",
    createdAt: m.createdAt.toISOString(),
  }))
}

export async function importMedia(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    entity: "media",
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

    const fileId = String(row.fileId || "").trim()
    const name = String(row.name || "").trim()
    const url = String(row.url || "").trim()

    if (!fileId || !name || !url) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: fileId || name || "unknown",
        message: "fileId, name, and url are required for media assets",
      })
      continue
    }

    const thumbnailUrl = row.thumbnailUrl ? String(row.thumbnailUrl).trim() : null
    const filePath = row.filePath ? String(row.filePath).trim() : null
    const fileType = row.fileType ? String(row.fileType).trim() : "image"
    const mimeType = row.mimeType ? String(row.mimeType).trim() : null
    const size = Number(row.size) || 0
    const width = row.width ? Number(row.width) || null : null
    const height = row.height ? Number(row.height) || null : null
    const alt = row.alt ? String(row.alt).trim() : null
    const folder = row.folder ? String(row.folder).trim() : "general"
    const uploadedById = options.actor?.id || null

    if (options.dryRun) {
      const existing = await prisma.media.findUnique({ where: { fileId } })
      if (existing) {
        if (options.mode === "upsert") result.updated++
        else result.skipped++
      } else {
        result.created++
      }
      continue
    }

    try {
      const existing = await prisma.media.findUnique({ where: { fileId } })

      if (existing) {
        if (options.mode === "create_only") {
          result.skipped++
          continue
        }

        await prisma.media.update({
          where: { id: existing.id },
          data: {
            name,
            url,
            thumbnailUrl,
            filePath,
            fileType,
            mimeType,
            size,
            width,
            height,
            alt,
            folder,
          },
        })
        result.updated++
      } else {
        await prisma.media.create({
          data: {
            fileId,
            name,
            url,
            thumbnailUrl,
            filePath,
            fileType,
            mimeType,
            size,
            width,
            height,
            alt,
            folder,
            uploadedById,
          },
        })
        result.created++
      }
    } catch (err: unknown) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: fileId,
        message: err instanceof Error ? err.message : "Database error",
      })
    }
  }

  result.success = result.failed === 0
  return result
}

// ==========================================
// TEMPLATES (MediaTemplate)
// ==========================================
export async function exportTemplates(): Promise<Record<string, unknown>[]> {
  const templates = await prisma.mediaTemplate.findMany({
    orderBy: { createdAt: "desc" },
    include: { media: { select: { fileId: true, url: true } } },
  })

  return templates.map((t) => ({
    name: t.name,
    type: t.type,
    description: t.description || "",
    mediaId: t.mediaId,
    mediaFileId: t.media?.fileId || "",
    width: t.width,
    height: t.height,
    design: typeof t.design === "string" ? t.design : JSON.stringify(t.design),
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
  }))
}

export async function importTemplates(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    entity: "templates",
    format: "csv",
    totalRows: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    dryRun: !!options.dryRun,
    errors: [],
  }

  // Pre-fetch media assets for fallback/lookup
  const fallbackMedia = await prisma.media.findFirst({ select: { id: true, fileId: true } })

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1

    const name = String(row.name || "").trim()
    if (!name) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: "unknown",
        message: "Template name is required",
      })
      continue
    }

    const typeStr = String(row.type || "").trim().toUpperCase()
    const type = typeStr in TemplateType ? (typeStr as TemplateType) : TemplateType.MEMBER_CARD

    const description = row.description ? String(row.description).trim() : null
    const width = Number(row.width) || 1080
    const height = Number(row.height) || 680
    const isActive = parseBooleanField(row.isActive, true)

    // Parse design JSON
    let design: Prisma.InputJsonValue = { elements: [] }
    if (row.design) {
      if (typeof row.design === "object" && row.design !== null) {
        design = row.design as Prisma.InputJsonValue
      } else {
        try {
          design = JSON.parse(String(row.design))
        } catch {
          design = { raw: String(row.design), elements: [] }
        }
      }
    }

    // Media resolution
    let mediaId = row.mediaId ? String(row.mediaId).trim() : null
    if (!mediaId && row.mediaFileId) {
      const matchedMedia = await prisma.media.findUnique({
        where: { fileId: String(row.mediaFileId).trim() },
        select: { id: true },
      })
      if (matchedMedia) mediaId = matchedMedia.id
    }
    if (!mediaId) {
      mediaId = fallbackMedia?.id || null
    }

    if (!mediaId) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: name,
        message: "Valid mediaId or background media asset is required",
      })
      continue
    }

    const createdById = options.actor?.id || null

    if (options.dryRun) {
      const existing = await prisma.mediaTemplate.findFirst({ where: { name } })
      if (existing) {
        if (options.mode === "upsert") result.updated++
        else result.skipped++
      } else {
        result.created++
      }
      continue
    }

    try {
      const existing = await prisma.mediaTemplate.findFirst({ where: { name } })

      if (existing) {
        if (options.mode === "create_only") {
          result.skipped++
          continue
        }

        await prisma.mediaTemplate.update({
          where: { id: existing.id },
          data: {
            type,
            description,
            mediaId,
            width,
            height,
            design,
            isActive,
          },
        })
        result.updated++
      } else {
        await prisma.mediaTemplate.create({
          data: {
            name,
            type,
            description,
            mediaId,
            width,
            height,
            design,
            isActive,
            createdById,
          },
        })
        result.created++
      }
    } catch (err: unknown) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: name,
        message: err instanceof Error ? err.message : "Database error",
      })
    }
  }

  result.success = result.failed === 0
  return result
}
