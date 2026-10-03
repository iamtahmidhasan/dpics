import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { getInstructorStats } from "@/lib/services/instructor-id.service"
import { requireAdminApi } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()

    const { searchParams } = new URL(request.url)
    const prefix = searchParams.get("prefix") || undefined

    const stats = await getInstructorStats(prefix)

    return NextResponse.json(stats)
  } catch (error) {
    return toErrorResponse(error)
  }
}
