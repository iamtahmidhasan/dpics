import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { listCategories } from "@/lib/services/category.service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "POST"
    const search = searchParams.get("search") || undefined

    const categories = await listCategories({
      type,
      search,
      activeOnly: true,
    })

    return NextResponse.json(categories)
  } catch (error) {
    return toErrorResponse(error)
  }
}
