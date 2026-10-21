import { NextResponse, type NextRequest } from "next/server"

import { ApiError, toErrorResponse } from "@/lib/api-error"
import { InvitationService } from "@/lib/services/invitation.service"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params
    const invitation = await InvitationService.getInvitationByToken(token)

    if (!invitation) {
      throw ApiError.notFound("Invitation not found or link is invalid")
    }

    return NextResponse.json(invitation)
  } catch (error) {
    return toErrorResponse(error)
  }
}
