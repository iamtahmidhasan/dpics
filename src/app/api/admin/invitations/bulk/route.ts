import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { getUserRoles } from "@/lib/roles"
import {
  InvitationService,
  type CreateBulkInvitationsInput,
} from "@/lib/services/invitation.service"
import { requireAdminApi } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminApi()
    const body = (await request.json()) as CreateBulkInvitationsInput

    const actor = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      roles: getUserRoles(session.user),
    }

    const result = await InvitationService.createBulkInvitations(body, actor)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
