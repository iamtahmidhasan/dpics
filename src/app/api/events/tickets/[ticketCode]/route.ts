import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { getEventTicket } from "@/lib/services/event.service"

type RouteContext = {
  params: Promise<{ ticketCode: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { ticketCode } = await context.params
    const ticket = await getEventTicket(ticketCode)

    return NextResponse.json(ticket)
  } catch (error) {
    return toErrorResponse(error)
  }
}
