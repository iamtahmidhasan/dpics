import { NextResponse, type NextRequest } from "next/server"

import { ApiError, toErrorResponse } from "@/lib/api-error"
import { EventRegistrationStatus } from "@/generated/prisma/enums"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { ActivityAction, ActivityLogService } from "@/lib/services/activity-log.service"
import { updateEventRegistrationStatus } from "@/lib/services/event.service"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAdmin()
    const { id: eventId } = await context.params

    const body = await request.json().catch(() => ({}))
    const rawCode = typeof body.ticketCode === "string" ? body.ticketCode.trim() : ""
    const forceConfirm = Boolean(body.forceConfirm)

    if (!rawCode) {
      throw ApiError.badRequest("Ticket code is required")
    }

    // Extract raw code if scanned as a full URL (e.g. https://.../events/tickets/TKT-123 or https://.../verify/.../TKT-123)
    let ticketCode = rawCode
    const urlMatch = rawCode.match(/(?:tickets?|verify|ticket)\/([A-Za-z0-9_-]+)/i)
    if (urlMatch && urlMatch[1]) {
      ticketCode = urlMatch[1]
    }

    // Fetch registration with event
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        ticketCode: { equals: ticketCode, mode: "insensitive" },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            venue: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            selactedImg: true,
          },
        },
      },
    })

    if (!registration) {
      throw ApiError.notFound(`No registration found matching ticket code "${ticketCode}"`)
    }

    // Check if ticket belongs to this specific event
    if (registration.eventId !== eventId) {
      return NextResponse.json(
        {
          error: "EVENT_MISMATCH",
          message: `Ticket belongs to a different event: "${registration.event.title}"`,
          registration: {
            id: registration.id,
            name: registration.name,
            email: registration.email,
            ticketCode: registration.ticketCode,
            eventTitle: registration.event.title,
            status: registration.status,
          },
        },
        { status: 400 }
      )
    }

    // Check current status
    const previousStatus = registration.status

    if (previousStatus === EventRegistrationStatus.ATTENDED) {
      return NextResponse.json({
        success: false,
        alreadyAttended: true,
        message: "Attendee already checked in",
        registration: {
          id: registration.id,
          name: registration.name,
          email: registration.email,
          phone: registration.phone,
          studentId: registration.studentId,
          department: registration.department,
          semester: registration.semester,
          shift: registration.shift,
          institution: registration.institution,
          ticketCode: registration.ticketCode,
          status: registration.status,
          confirmedAt: registration.confirmedAt?.toISOString() ?? null,
          user: registration.user,
        },
      })
    }

    if (
      previousStatus === EventRegistrationStatus.REJECTED ||
      previousStatus === EventRegistrationStatus.CANCELLED
    ) {
      return NextResponse.json(
        {
          success: false,
          invalidStatus: true,
          message: `Cannot check in: Registration is currently ${previousStatus}`,
          registration: {
            id: registration.id,
            name: registration.name,
            email: registration.email,
            ticketCode: registration.ticketCode,
            status: registration.status,
          },
        },
        { status: 400 }
      )
    }

    if (previousStatus === EventRegistrationStatus.PENDING && !forceConfirm) {
      return NextResponse.json({
        success: false,
        isPending: true,
        message: "Registration is PENDING (Payment verification required)",
        registration: {
          id: registration.id,
          name: registration.name,
          email: registration.email,
          phone: registration.phone,
          studentId: registration.studentId,
          paymentMethod: registration.paymentMethod,
          senderNumber: registration.senderNumber,
          transactionId: registration.transactionId,
          amountPaid: registration.amountPaid,
          ticketCode: registration.ticketCode,
          status: registration.status,
        },
      })
    }

    // Mark as ATTENDED
    const updated = await updateEventRegistrationStatus(
      registration.id,
      EventRegistrationStatus.ATTENDED,
      session.user.id
    )

    // Audit log
    await ActivityLogService.log({
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        roles: session.user.roles,
      },
      action: ActivityAction.STATUS_CHANGE,
      actionName: "EVENT_TICKET_CHECKED_IN",
      entity: "EventRegistration",
      entityId: registration.id,
      description: `Checked in attendee "${registration.name}" for event "${registration.event.title}" via QR Scanner`,
      oldData: { status: previousStatus },
      newData: { status: EventRegistrationStatus.ATTENDED },
      metadata: { ticketCode: registration.ticketCode, eventId },
    })

    // Get updated counts for live stats
    const [total, confirmed, attended] = await Promise.all([
      prisma.eventRegistration.count({ where: { eventId } }),
      prisma.eventRegistration.count({
        where: { eventId, status: EventRegistrationStatus.CONFIRMED },
      }),
      prisma.eventRegistration.count({
        where: { eventId, status: EventRegistrationStatus.ATTENDED },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: "Check-in successful",
      registration: {
        ...updated,
        user: registration.user,
      },
      stats: {
        total,
        confirmed,
        attended,
        remaining: Math.max(0, total - attended),
      },
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
