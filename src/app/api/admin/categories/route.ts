import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import {
  createCategory,
  listCategories,
  parseCategoryInput,
} from "@/lib/services/category.service"
import { requireAdminApi } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || undefined
    const search = searchParams.get("search") || undefined
    const activeOnly = searchParams.get("activeOnly") === "true"

    const categories = await listCategories({
      type,
      search,
      activeOnly,
    })

    return NextResponse.json(categories)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminApi()
    const input = parseCategoryInput(await request.json())

    return NextResponse.json(await createCategory(input), { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
