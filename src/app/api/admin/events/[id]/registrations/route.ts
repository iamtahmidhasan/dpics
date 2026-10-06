import { NextResponse, type NextRequest } from "next/server"

import { EventRegistrationStatus } from "@/generated/prisma/enums"
import { toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { listEventRegistrations } from "@/lib/services/event.service"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdminApi()
    const { id } = await context.params

    const searchParams = request.nextUrl.searchParams
    const statusParam = searchParams.get("status")
    const status =
      statusParam &&
      Object.values(EventRegistrationStatus).includes(
        statusParam as EventRegistrationStatus
      )
        ? (statusParam as EventRegistrationStatus)
        : null

    const q = searchParams.get("q") || null
    const page = Number(searchParams.get("page")) || 1
    const pageSize = Number(searchParams.get("pageSize")) || 20

    const data = await listEventRegistrations(id, {
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
