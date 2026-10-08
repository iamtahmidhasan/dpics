import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/lib/api-error"
import { requireSuperAdminApi } from "@/lib/session"
import { ActivityAction, ActivityLogService } from "@/lib/services/activity-log.service"

export async function GET(request: NextRequest) {
  try {
    // Requires Super Admin access, throws ApiError if unauthorized
    await requireSuperAdminApi()

    const { searchParams } = new URL(request.url)

    // Option to get dropdown options
    if (searchParams.get("options") === "true") {
      const options = await ActivityLogService.getFilterOptions()
      return NextResponse.json(options)
    }

    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const search = searchParams.get("search") || undefined
    const action = (searchParams.get("action") as ActivityAction | "ALL") || undefined
    const entity = searchParams.get("entity") || undefined
    const userId = searchParams.get("userId") || undefined
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined

    const data = await ActivityLogService.getLogs({
      page,
      limit,
      search,
      action,
      entity,
      userId,
      startDate,
      endDate,
    })

    return NextResponse.json(data)
  } catch (error) {
    return toErrorResponse(error)
  }
}
