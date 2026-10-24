import { NextResponse, type NextRequest } from "next/server"
import { EventRegistrationStatus } from "@/generated/prisma/enums"
import { ApiError, toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { updateEventRegistrationStatus } from "@/lib/services/event.service"
import { ActivityAction, ActivityLogService } from "@/lib/services/activity-log.service"
import prisma from "@/lib/prisma"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAdminApi()
    const { id } = await context.params

    const body = await request.json().catch(() => ({}))
    const status = body.status as EventRegistrationStatus

    if (!status || !Object.values(EventRegistrationStatus).includes(status)) {
      throw ApiError.badRequest("Invalid registration status")
    }

    const previous = await prisma.eventRegistration.findUnique({
      where: { id },
      include: { event: { select: { title: true } } },
    })

    if (!previous) {
      throw ApiError.notFound("Registration record not found")
    }

    const updated = await updateEventRegistrationStatus(id, status, session.user.id)

    // Audit log
    await ActivityLogService.log({
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        roles: session.user.roles,
      },
      action: ActivityAction.STATUS_CHANGE,
      actionName: "EVENT_TICKET_STATUS_UPDATED",
      entity: "EventRegistration",
      entityId: id,
      description: `Updated status for ticket "${previous.ticketCode}" (${previous.name}) from ${previous.status} to ${status} on event "${previous.event.title}"`,
      oldData: { status: previous.status },
      newData: { status },
      metadata: { ticketCode: previous.ticketCode, eventId: previous.eventId },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return toErrorResponse(error)
  }
}
