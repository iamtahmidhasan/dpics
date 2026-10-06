import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
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

    const session = await getSession()
    const body = await request.json()
    const input = parseEventRegistrationInput(body)

    const registration = await registerForEvent(
      event.id,
      input,
      session?.user ? { id: session.user.id } : null
    )

    return NextResponse.json(registration, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
