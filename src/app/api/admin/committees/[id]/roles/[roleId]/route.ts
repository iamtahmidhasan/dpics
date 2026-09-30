import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import {
  deleteCommitteeRole,
  parseCommitteeRoleInput,
  updateCommitteeRole,
} from "@/lib/services/committee.service"
import { requireAdminApi } from "@/lib/session"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; roleId: string }> }
) {
  try {
    await requireAdminApi()
    const { roleId } = await context.params
    const input = parseCommitteeRoleInput(await request.json())

    return NextResponse.json(await updateCommitteeRole(roleId, input))
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; roleId: string }> }
) {
  try {
    await requireAdminApi()
    const { roleId } = await context.params
    await deleteCommitteeRole(roleId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return toErrorResponse(error)
  }
}
