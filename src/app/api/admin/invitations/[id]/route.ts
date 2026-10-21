import { NextResponse, type NextRequest } from "next/server"

import { ApiError, toErrorResponse } from "@/lib/api-error"
import { getUserRoles } from "@/lib/roles"
import { InvitationService } from "@/lib/services/invitation.service"
import { requireAdminApi } from "@/lib/session"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminApi()
    const { id } = await context.params
    const body = await request.json()

    const actor = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      roles: getUserRoles(session.user),
    }

    if (body.action === "revoke") {
      const result = await InvitationService.revokeInvitation(id, actor)
      return NextResponse.json(result)
    }

    if (body.action === "extend") {
      const days = Number(body.days) || 7
      const result = await InvitationService.extendInvitation(id, days, actor)
      return NextResponse.json(result)
    }

    throw ApiError.badRequest("Invalid action specified")
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminApi()
    const { id } = await context.params

    const actor = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      roles: getUserRoles(session.user),
    }

    const result = await InvitationService.deleteInvitation(id, actor)
    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}
