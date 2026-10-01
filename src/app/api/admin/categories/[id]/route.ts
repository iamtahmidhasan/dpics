import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import {
  deleteCategory,
  getCategoryById,
  parseCategoryUpdateInput,
  updateCategory,
} from "@/lib/services/category.service"
import { requireAdminApi } from "@/lib/session"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminApi()
    const { id } = await params

    return NextResponse.json(await getCategoryById(id))
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminApi()
    const { id } = await params
    const input = parseCategoryUpdateInput(await request.json())

    return NextResponse.json(await updateCategory(id, input))
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
    await deleteCategory(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return toErrorResponse(error)
  }
}
