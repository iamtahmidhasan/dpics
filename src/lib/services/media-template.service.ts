import "server-only"

import prisma from "@/lib/prisma"
import { ApiError } from "@/lib/api-error"
import type { Prisma } from "@/generated/prisma/client"
import type { MediaTemplateSummary, TemplateDesign, TemplateType } from "@/lib/template-engine/types"

function serializeTemplate(item: {
  id: string
  name: string
  description: string | null
  type: TemplateType
  width: number
  height: number
  design: Prisma.JsonValue
  isActive: boolean
  mediaId: string
  media: {
    id: string
    name: string
    url: string
    thumbnailUrl: string | null
    width: number | null
    height: number | null
  }
  createdById: string | null
  createdBy?: {
    id: string
    name: string
    email: string
  } | null
  createdAt: Date
  updatedAt: Date
}): MediaTemplateSummary {
  let designObj: TemplateDesign = {
    version: 1,
    width: item.width,
    height: item.height,
    elements: [],
  }

  if (item.design && typeof item.design === "object" && !Array.isArray(item.design)) {
    designObj = item.design as unknown as TemplateDesign
  }

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    type: item.type,
    width: item.width,
    height: item.height,
    design: designObj,
    isActive: item.isActive,
    mediaId: item.mediaId,
    media: {
      id: item.media.id,
      name: item.media.name,
      url: item.media.url,
      thumbnailUrl: item.media.thumbnailUrl,
      width: item.media.width,
      height: item.media.height,
    },
    createdById: item.createdById,
    createdBy: item.createdBy
      ? {
          id: item.createdBy.id,
          name: item.createdBy.name,
          email: item.createdBy.email,
        }
      : null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

export async function listMediaTemplates({
  type,
  search,
  isActiveOnly = false,
}: {
  type?: TemplateType
  search?: string
  isActiveOnly?: boolean
} = {}): Promise<MediaTemplateSummary[]> {
  const andConditions: Prisma.MediaTemplateWhereInput[] = []

  if (type) {
    andConditions.push({ type })
  }

  if (isActiveOnly) {
    andConditions.push({ isActive: true })
  }

  if (search?.trim()) {
    const query = search.trim()
    andConditions.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    })
  }

  const items = await prisma.mediaTemplate.findMany({
    where: andConditions.length > 0 ? { AND: andConditions } : undefined,
    orderBy: { updatedAt: "desc" },
    include: {
      media: {
        select: {
          id: true,
          name: true,
          url: true,
          thumbnailUrl: true,
          width: true,
          height: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return items.map(serializeTemplate)
}

export async function getMediaTemplateById(id: string): Promise<MediaTemplateSummary | null> {
  const item = await prisma.mediaTemplate.findUnique({
    where: { id },
    include: {
      media: {
        select: {
          id: true,
          name: true,
          url: true,
          thumbnailUrl: true,
          width: true,
          height: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return item ? serializeTemplate(item) : null
}

export async function createMediaTemplate({
  name,
  description,
  type = "MEMBER_CARD",
  mediaId,
  width,
  height,
  design,
  userId,
}: {
  name: string
  description?: string | null
  type?: TemplateType
  mediaId: string
  width?: number
  height?: number
  design?: TemplateDesign
  userId?: string
}): Promise<MediaTemplateSummary> {
  if (!name?.trim()) {
    throw ApiError.badRequest("Template name is required")
  }
  if (!mediaId) {
    throw ApiError.badRequest("Background Media ID is required")
  }

  const media = await prisma.media.findUnique({
    where: { id: mediaId },
  })
  if (!media) {
    throw ApiError.notFound("Selected background media not found")
  }

  const finalWidth = width || media.width || 1080
  const finalHeight = height || media.height || 680

  const defaultDesign: TemplateDesign = design || {
    version: 1,
    width: finalWidth,
    height: finalHeight,
    backgroundMediaId: media.id,
    backgroundMediaUrl: media.url,
    elements: [],
  }

  const created = await prisma.mediaTemplate.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      type,
      mediaId,
      width: finalWidth,
      height: finalHeight,
      design: defaultDesign as unknown as Prisma.InputJsonValue,
      createdById: userId ?? null,
    },
    include: {
      media: {
        select: {
          id: true,
          name: true,
          url: true,
          thumbnailUrl: true,
          width: true,
          height: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return serializeTemplate(created)
}

export async function updateMediaTemplate(
  id: string,
  data: {
    name?: string
    description?: string | null
    type?: TemplateType
    mediaId?: string
    width?: number
    height?: number
    design?: TemplateDesign
    isActive?: boolean
  }
): Promise<MediaTemplateSummary> {
  const existing = await prisma.mediaTemplate.findUnique({
    where: { id },
  })
  if (!existing) {
    throw ApiError.notFound("Template not found")
  }

  const updateData: Prisma.MediaTemplateUpdateInput = {}

  if (data.name !== undefined) updateData.name = data.name.trim()
  if (data.description !== undefined) updateData.description = data.description?.trim() || null
  if (data.type !== undefined) updateData.type = data.type
  if (data.isActive !== undefined) updateData.isActive = data.isActive
  if (data.width !== undefined) updateData.width = data.width
  if (data.height !== undefined) updateData.height = data.height
  if (data.design !== undefined) updateData.design = data.design as unknown as Prisma.InputJsonValue

  if (data.mediaId && data.mediaId !== existing.mediaId) {
    const media = await prisma.media.findUnique({ where: { id: data.mediaId } })
    if (!media) throw ApiError.notFound("Background media not found")
    updateData.media = { connect: { id: data.mediaId } }
  }

  const updated = await prisma.mediaTemplate.update({
    where: { id },
    data: updateData,
    include: {
      media: {
        select: {
          id: true,
          name: true,
          url: true,
          thumbnailUrl: true,
          width: true,
          height: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return serializeTemplate(updated)
}

export async function deleteMediaTemplate(id: string): Promise<void> {
  const existing = await prisma.mediaTemplate.findUnique({
    where: { id },
  })
  if (!existing) {
    throw ApiError.notFound("Template not found")
  }

  await prisma.mediaTemplate.delete({
    where: { id },
  })
}
