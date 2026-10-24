import { NextResponse, type NextRequest } from "next/server"

import { ApiError, toErrorResponse } from "@/lib/api-error"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/session"
import {
  getPublishedEventBySlug,
  parseEventRegistrationInput,
  registerForEvent,
} from "@/lib/services/event.service"

type RouteContext = {
  params: Promise<{ slug: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params
    const event = await getPublishedEventBySlug(slug)

    // Login is strictly required for registering or buying tickets
    const session = await getSession()
    if (!session?.user) {
      throw ApiError.unauthorized(
        "Please sign in to your DPICS account to register or purchase tickets for this event"
      )
    }

    // Strict rule: 1 user can buy only 1 ticket per event
    const existingTicket = await prisma.eventRegistration.findFirst({
      where: {
        eventId: event.id,
        OR: [
          { userId: session.user.id },
          { email: { equals: session.user.email, mode: "insensitive" } },
        ],
        status: { notIn: ["CANCELLED", "REJECTED"] },
      },
      select: { id: true, ticketCode: true },
    })

    if (existingTicket) {
      throw ApiError.conflict(
        "You already have a ticket for this event. Each user can purchase only one ticket."
      )
    }

    // Fetch user details from database to take default information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { member: true },
    })

    const body = await request.json()
    const input = parseEventRegistrationInput(body)

    // Populate from User and Member models by default if not explicitly provided
    const effectiveInput = {
      ...input,
      name: input.name?.trim() || user?.name || session.user.name || "Attendee",
      email: user?.email || session.user.email || input.email,
      phone: input.phone || user?.phone || user?.whatsappNumber || "",
      studentId:
        input.studentId ||
        user?.member?.studentId ||
        user?.member?.boardOrClassRoll ||
        null,
      department: input.department || user?.member?.department || null,
      semester: input.semester || user?.member?.semester || null,
      shift: input.shift || user?.member?.shift || null,
      institution:
        input.institution ||
        (user?.member ? "Dhaka Polytechnic Institute" : "Dhaka Polytechnic Institute"),
    }

    const registration = await registerForEvent(
      event.id,
      effectiveInput,
      { id: session.user.id }
    )

    return NextResponse.json(registration, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
