import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { getUserRoles } from "@/lib/roles"
import { InvitationService } from "@/lib/services/invitation.service"
import { requireAdminApi } from "@/lib/session"

export async function POST(
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

    const result = await InvitationService.resendInvitation(id, actor)

    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}
