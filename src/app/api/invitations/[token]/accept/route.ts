import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { InvitationService } from "@/lib/services/invitation.service"
import { requireUserApi } from "@/lib/session"

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const session = await requireUserApi()
    const { token } = await context.params

    const result = await InvitationService.acceptInvitation(token, session.user)

    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}
