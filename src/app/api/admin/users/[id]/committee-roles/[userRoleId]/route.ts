import { NextResponse, type NextRequest } from "next/server"

import { ApiError, toErrorResponse } from "@/lib/api-error"
import { getAdminUserDetail } from "@/lib/services/admin-user.service"
import {
  removeUserCommitteeRole,
  updateUserCommitteeRole,
} from "@/lib/services/committee.service"
import { requireAdminApi } from "@/lib/session"
import { isRecord, toBoolean, toDateTime } from "@/lib/validation"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; userRoleId: string }> }
) {
  try {
    await requireAdminApi()
    const { id: userId, userRoleId } = await context.params
    const body = await request.json()

    if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

    const updates: {
      roleId?: string
      startDate?: Date | null
      endDate?: Date | null
      isActive?: boolean
    } = {}

    if ("roleId" in body && typeof body.roleId === "string") {
      updates.roleId = body.roleId
    }

    if ("startDate" in body) {
      updates.startDate = toDateTime(body.startDate, "Start date")
    }

    if ("endDate" in body) {
      updates.endDate = toDateTime(body.endDate, "End date")
    }

    if ("isActive" in body) {
      updates.isActive =
        typeof body.isActive === "boolean"
          ? body.isActive
          : toBoolean(body.isActive, "Is active")
    }

    await updateUserCommitteeRole(userRoleId, updates)

    const updatedUser = await getAdminUserDetail(userId)

    return NextResponse.json(updatedUser)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; userRoleId: string }> }
) {
  try {
    await requireAdminApi()
    const { id: userId, userRoleId } = await context.params

    await removeUserCommitteeRole(userRoleId)

    const updatedUser = await getAdminUserDetail(userId)

    return NextResponse.json(updatedUser)
  } catch (error) {
    return toErrorResponse(error)
  }
}
