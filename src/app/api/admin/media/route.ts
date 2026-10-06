import { NextResponse, type NextRequest } from "next/server"

import { ApiError, toErrorResponse } from "@/lib/api-error"
import {
  getMediaStats,
  listMedia,
  uploadMedia,
} from "@/lib/services/media.service"
import { requireAdminApi } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || undefined
    const folder = searchParams.get("folder") || undefined
    const userId = searchParams.get("userId") || undefined
    const sort = (searchParams.get("sort") as "newest" | "oldest" | "size-desc" | "size-asc" | "name") || "newest"
    const limit = Number(searchParams.get("limit")) || 100

    const [items, stats] = await Promise.all([
      listMedia({ search, folder, userId, sort, limit }),
      getMediaStats(userId),
    ])

    return NextResponse.json({ items, stats })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminApi()

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const alt = formData.get("alt") as string | null
    const folder = (formData.get("folder") as string) || "general"

    if (!file) {
      throw ApiError.badRequest("No image file provided in upload request")
    }

    const uploaded = await uploadMedia({
      file,
      alt,
      userId: session.user.id,
      folder,
    })

    return NextResponse.json(uploaded, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
