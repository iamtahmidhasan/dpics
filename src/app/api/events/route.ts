import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { eventFiltersFromSearch } from "@/lib/event-params"
import { listPublishedEvents } from "@/lib/services/event.service"

export async function GET(request: NextRequest) {
  try {
    const filters = eventFiltersFromSearch(request.nextUrl.searchParams)
    const page = await listPublishedEvents(filters)

    return NextResponse.json(page)
  } catch (error) {
    return toErrorResponse(error)
  }
}
