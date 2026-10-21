import { NextResponse, type NextRequest } from "next/server"

import { ApiError, toErrorResponse } from "@/lib/api-error"
import prisma from "@/lib/prisma"
import { deleteMedia, updateMediaAlt } from "@/lib/services/media.service"
import { isAdmin, requireMediaAccessApi } from "@/lib/session"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireMediaAccessApi()
    const { id } = await context.params

    const existing = await prisma.media.findUnique({
      where: { id },
    })

    if (!existing) {
      throw ApiError.notFound("Media item not found")
    }

    const isAdminUser = isAdmin(session.user)
    if (!isAdminUser) {
      throw ApiError.forbidden("Only administrators and super administrators can delete images")
    }

    await deleteMedia(id)

    return NextResponse.json({ success: true, message: "Media deleted successfully" })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireMediaAccessApi()
    const { id } = await context.params
    const body = await request.json()

    const existing = await prisma.media.findUnique({
      where: { id },
    })

    if (!existing) {
      throw ApiError.notFound("Media item not found")
    }

    const isAdminUser = isAdmin(session.user)
    if (!isAdminUser && existing.uploadedById !== session.user.id) {
      throw ApiError.forbidden("You do not have permission to edit this media item")
    }

    const updated = await updateMediaAlt(id, body.alt ?? null)

    return NextResponse.json({ success: true, item: updated })
  } catch (error) {
    return toErrorResponse(error)
  }
}
