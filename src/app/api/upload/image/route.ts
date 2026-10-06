import { NextResponse, type NextRequest } from "next/server"

import { ApiError, toErrorResponse } from "@/lib/api-error"
import { uploadMedia } from "@/lib/services/media.service"
import { requireUserApi } from "@/lib/session"

const MAX_USER_AVATAR_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest) {
  try {
    const session = await requireUserApi()

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      throw ApiError.badRequest("No image file provided")
    }

    const targetFolder =
      ((formData.get("folder") as string) || request.nextUrl.searchParams.get("folder") || "avatars").toLowerCase()

    const isDocument = targetFolder === "documents"
    const maxLimit = isDocument ? 10 * 1024 * 1024 : MAX_USER_AVATAR_SIZE

    if (file.size > maxLimit) {
      throw ApiError.badRequest(
        isDocument ? "Document file must be under 10 MB" : "Image file must be under 5 MB"
      )
    }

    const uploaded = await uploadMedia({
      file,
      userId: session.user.id,
      folder: targetFolder,
      tags: [targetFolder, "user-upload"],
    })

    return NextResponse.json(uploaded, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
