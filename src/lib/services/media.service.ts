import "server-only"

import { ApiError } from "@/lib/api-error"
import { deleteFromImageKit, uploadToImageKit } from "@/lib/imagekit"
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_ALT_TEXT_LENGTH,
  MAX_MEDIA_FILE_SIZE,
  type MediaItemSummary,
  type MediaStats,
} from "@/lib/media-constants"
import prisma from "@/lib/prisma"

function serializeMedia(item: {
  id: string
  fileId: string
  name: string
  url: string
  thumbnailUrl: string | null
  filePath: string | null
  fileType: string | null
  mimeType: string | null
  size: number
  width: number | null
  height: number | null
  alt: string | null
  folder?: string | null
  uploadedById: string | null
  uploadedBy?: { id: string; name: string; email: string } | null
  createdAt: Date
  updatedAt: Date
}): MediaItemSummary {
  return {
    id: item.id,
    fileId: item.fileId,
    name: item.name,
    url: item.url,
    thumbnailUrl: item.thumbnailUrl,
    filePath: item.filePath,
    fileType: item.fileType,
    mimeType: item.mimeType,
    size: item.size,
    width: item.width,
    height: item.height,
    alt: item.alt,
    folder: item.folder ?? null,
    uploadedById: item.uploadedById,
    uploadedBy: item.uploadedBy
      ? {
          id: item.uploadedBy.id,
          name: item.uploadedBy.name,
          email: item.uploadedBy.email,
        }
      : null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

export async function listMedia({
  search,
  folder,
  userId,
  sort = "newest",
  limit = 100,
}: {
  search?: string
  folder?: string
  userId?: string
  sort?: "newest" | "oldest" | "size-desc" | "size-asc" | "name"
  limit?: number
} = {}): Promise<MediaItemSummary[]> {
  const andConditions: Record<string, unknown>[] = []

  if (userId) {
    andConditions.push({ uploadedById: userId })
  }

  if (folder && folder !== "all") {
    andConditions.push({
      OR: [
        { folder: { equals: folder, mode: "insensitive" } },
        { filePath: { contains: folder, mode: "insensitive" } },
      ],
    })
  }

  if (search?.trim()) {
    const term = search.trim()
    andConditions.push({
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { alt: { contains: term, mode: "insensitive" } },
      ],
    })
  }

  const where: Record<string, unknown> = {}
  if (andConditions.length > 0) {
    where.AND = andConditions
  }

  let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" }
  if (sort === "oldest") {
    orderBy = { createdAt: "asc" }
  } else if (sort === "size-desc") {
    orderBy = { size: "desc" }
  } else if (sort === "size-asc") {
    orderBy = { size: "asc" }
  } else if (sort === "name") {
    orderBy = { name: "asc" }
  }

  const items = await prisma.media.findMany({
    where,
    orderBy,
    take: limit,
    include: {
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return items.map(serializeMedia)
}

export async function getMediaStats(userId?: string): Promise<MediaStats> {
  const where = userId ? { uploadedById: userId } : undefined

  const [totalCount, aggregate, items] = await Promise.all([
    prisma.media.count({ where }),
    prisma.media.aggregate({
      where,
      _sum: {
        size: true,
      },
    }),
    prisma.media.findMany({
      where,
      select: {
        folder: true,
        filePath: true,
      },
    }),
  ])

  const folderCounts: Record<string, number> = {}
  for (const item of items) {
    let f = item.folder?.toLowerCase()
    if (!f && item.filePath) {
      const match = item.filePath.match(/\/dpics\/([^/]+)/)
      if (match) {
        f = match[1].toLowerCase()
      }
    }
    if (!f) f = "general"
    folderCounts[f] = (folderCounts[f] || 0) + 1
  }

  return {
    totalCount,
    totalSize: aggregate._sum.size ?? 0,
    folderCounts,
  }
}

export async function uploadMedia({
  file,
  alt,
  userId,
  folder = "general",
  tags = ["dpics"],
}: {
  file: File
  alt?: string | null
  userId?: string
  folder?: string
  tags?: string[]
}): Promise<MediaItemSummary> {
  if (!file) {
    throw ApiError.badRequest("No file provided")
  }

  if (file.size > MAX_MEDIA_FILE_SIZE) {
    throw ApiError.badRequest("File size exceeds 10MB limit")
  }

  // Normalize folder name and ImageKit folder path
  let normalizedFolder = folder.toLowerCase().trim()
  if (normalizedFolder.startsWith("/dpics/")) {
    normalizedFolder = normalizedFolder.replace(/^\/dpics\/?/, "") || "general"
  } else if (normalizedFolder.startsWith("/")) {
    normalizedFolder = normalizedFolder.replace(/^\/+/, "") || "general"
  }
  if (!normalizedFolder) normalizedFolder = "general"

  const ikFolder = `/dpics/${normalizedFolder === "general" ? "media" : normalizedFolder}`

  // Validate MIME type - allow PDFs when folder is documents
  const isPdf = file.type === "application/pdf"
  const isAllowedMime = ALLOWED_IMAGE_MIME_TYPES.some((mime) =>
    file.type.toLowerCase().startsWith(mime)
  )

  if (normalizedFolder === "documents") {
    if (!isPdf && !isAllowedMime && !file.type.startsWith("image/")) {
      throw ApiError.badRequest("Only images and PDF documents are allowed for documents")
    }
  } else {
    if (!isAllowedMime && !file.type.startsWith("image/")) {
      throw ApiError.badRequest("Only image files are supported (JPEG, PNG, WebP, GIF, SVG, AVIF)")
    }
  }

  const cleanAlt = alt?.trim() ? alt.trim().slice(0, MAX_ALT_TEXT_LENGTH) : null
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const uploadTags = [...new Set([...tags, normalizedFolder, "dpics"])]

  // Upload to ImageKit
  const ikResult = await uploadToImageKit({
    file: buffer,
    fileName: file.name,
    folder: ikFolder,
    tags: uploadTags,
  })

  // Save to database
  const media = await prisma.media.create({
    data: {
      fileId: ikResult.fileId,
      name: ikResult.name || file.name,
      url: ikResult.url,
      thumbnailUrl: ikResult.thumbnailUrl || null,
      filePath: ikResult.filePath || null,
      fileType: isPdf ? "document" : ikResult.fileType || "image",
      mimeType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
      size: ikResult.size || file.size,
      width: ikResult.width ?? null,
      height: ikResult.height ?? null,
      alt: cleanAlt,
      folder: normalizedFolder,
      uploadedById: userId ?? null,
    },
    include: {
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return serializeMedia(media)
}

export async function updateMediaAlt(id: string, alt: string | null): Promise<MediaItemSummary> {
  const existing = await prisma.media.findUnique({
    where: { id },
  })

  if (!existing) {
    throw ApiError.notFound("Media item not found")
  }

  const cleanAlt = alt?.trim() ? alt.trim().slice(0, MAX_ALT_TEXT_LENGTH) : null

  const updated = await prisma.media.update({
    where: { id },
    data: { alt: cleanAlt },
    include: {
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return serializeMedia(updated)
}

export async function deleteMedia(id: string): Promise<{ success: boolean; id: string }> {
  const existing = await prisma.media.findUnique({
    where: { id },
  })

  if (!existing) {
    throw ApiError.notFound("Media item not found")
  }

  // Delete from ImageKit
  if (existing.fileId) {
    await deleteFromImageKit(existing.fileId)
  }

  // Delete from Database
  await prisma.media.delete({
    where: { id },
  })

  return { success: true, id }
}
