import { NextRequest, NextResponse } from "next/server"
import { ApiError, toErrorResponse } from "@/lib/api-error"
import { getSession } from "@/lib/session"
import prisma from "@/lib/prisma"
import { ActivityAction, ActivityLogService } from "@/lib/services/activity-log.service"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw ApiError.unauthorized("Authentication required")
    }

    const body = await request.json()
    const { selectedImageIndex } = body

    if (typeof selectedImageIndex !== "number" || selectedImageIndex < 0) {
      throw ApiError.badRequest("Invalid selectedImageIndex")
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, roles: true, image: true, selactedImg: true },
    })

    if (!user) {
      throw ApiError.notFound("User not found")
    }

    if (selectedImageIndex >= user.image.length) {
      throw ApiError.badRequest("Selected image index out of range")
    }

    const previousIndex = user.selactedImg ?? "0"

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        selactedImg: String(selectedImageIndex),
      },
      select: {
        id: true,
        image: true,
        selactedImg: true,
      },
    })

    // Log user photo selection change
    await ActivityLogService.log({
      actor: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
      action: ActivityAction.UPDATE,
      actionName: "USER_PHOTO_SELECTED",
      entity: "User",
      entityId: user.id,
      description: `User "${user.name}" selected photo #${selectedImageIndex + 1} for templates & profile`,
      oldData: {
        selactedImg: previousIndex,
      },
      newData: {
        selactedImg: String(selectedImageIndex),
        imageUrl: user.image[selectedImageIndex] || null,
      },
      metadata: {
        selectedImageIndex,
        totalPhotos: user.image.length,
      },
    })

    return NextResponse.json({
      success: true,
      selectedImageIndex,
      user: updated,
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
