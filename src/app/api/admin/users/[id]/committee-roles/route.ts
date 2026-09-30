import { NextResponse, type NextRequest } from "next/server"

import { ApiError, toErrorResponse } from "@/lib/api-error"
import { getAdminUserDetail } from "@/lib/services/admin-user.service"
import { assignUserCommitteeRole } from "@/lib/services/committee.service"
import { requireAdminApi } from "@/lib/session"
import { isRecord, toBoolean, toDateTime, toText } from "@/lib/validation"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminApi()
    const { id: userId } = await context.params
    const body = await request.json()

    if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

    const roleId = toText(body.roleId, "Role id", { max: 120 })
    const startDate = toDateTime(body.startDate, "Start date")
    const endDate = toDateTime(body.endDate, "End date")
    const isActive =
      typeof body.isActive === "boolean"
        ? body.isActive
        : toBoolean(body.isActive ?? true, "Is active")

    await assignUserCommitteeRole({
      userId,
      roleId,
      startDate,
      endDate,
      isActive,
    })

    const updatedUser = await getAdminUserDetail(userId)

    return NextResponse.json(updatedUser)
  } catch (error) {
    return toErrorResponse(error)
  }
}
