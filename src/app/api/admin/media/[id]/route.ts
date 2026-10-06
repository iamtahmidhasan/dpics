import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { deleteMedia, updateMediaAlt } from "@/lib/services/media.service"
import { requireAdminApi } from "@/lib/session"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminApi()
    const { id } = await params
    const body = await request.json()
    const alt = typeof body.alt === "string" ? body.alt : null

    const updated = await updateMediaAlt(id, alt)
    return NextResponse.json(updated)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminApi()
    const { id } = await params
    const result = await deleteMedia(id)

    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}
