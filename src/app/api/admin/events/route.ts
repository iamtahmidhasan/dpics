import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { eventFiltersFromSearch } from "@/lib/event-params"
import { requireAdminApi } from "@/lib/session"
import {
  createEventAsAdmin,
  getEventCounts,
  listEventsForAdmin,
  parseEventInput,
} from "@/lib/services/event.service"

export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()

    const filters = eventFiltersFromSearch(request.nextUrl.searchParams)
    const [page, counts] = await Promise.all([
      listEventsForAdmin(filters),
      getEventCounts(),
    ])

    return NextResponse.json({ ...page, counts })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminApi()
    const body = await request.json()
    const input = parseEventInput(body)

    const event = await createEventAsAdmin(input, {
      userId: session.user.id,
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
