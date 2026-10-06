import { NextResponse, type NextRequest } from "next/server"

import { EventRegistrationStatus } from "@/generated/prisma/enums"
import { ApiError, toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { updateEventRegistrationStatus } from "@/lib/services/event.service"

type RouteContext = {
  params: Promise<{ id: string; regId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAdminApi()
    const { regId } = await context.params

    const body = await request.json()
    const status = body.status as EventRegistrationStatus

    if (
      !status ||
      !Object.values(EventRegistrationStatus).includes(status)
    ) {
      throw ApiError.badRequest("Invalid registration status")
    }

    const updated = await updateEventRegistrationStatus(
      regId,
      status,
      session.user.id
    )

    return NextResponse.json(updated)
  } catch (error) {
    return toErrorResponse(error)
  }
}
