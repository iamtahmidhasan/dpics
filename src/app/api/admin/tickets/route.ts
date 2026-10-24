import { NextResponse, type NextRequest } from "next/server"
import { EventRegistrationStatus } from "@/generated/prisma/enums"
import { toErrorResponse } from "@/lib/api-error"
import { listAllEventRegistrations } from "@/lib/services/event.service"
import { requireAdminApi } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId") || undefined
    const rawStatus = searchParams.get("status")
    const status =
      rawStatus && rawStatus !== "ALL" && Object.values(EventRegistrationStatus).includes(rawStatus as EventRegistrationStatus)
        ? (rawStatus as EventRegistrationStatus)
        : undefined
    const q = searchParams.get("q") || undefined
    const page = Math.max(1, Number(searchParams.get("page")) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 25))

    const data = await listAllEventRegistrations({
      eventId,
      status,
      q,
      page,
      pageSize,
    })

    return NextResponse.json(data)
  } catch (error) {
    return toErrorResponse(error)
  }
}
