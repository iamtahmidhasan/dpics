import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import {
  deleteEventAsAdmin,
  getEventById,
  parseEventUpdateInput,
  updateEventAsAdmin,
} from "@/lib/services/event.service"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdminApi()
    const { id } = await context.params

    return NextResponse.json(await getEventById(id))
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdminApi()
    const { id } = await context.params
    const body = await request.json()
    const input = parseEventUpdateInput(body)

    return NextResponse.json(await updateEventAsAdmin(id, input))
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdminApi()
    const { id } = await context.params

    return NextResponse.json(await deleteEventAsAdmin(id))
  } catch (error) {
    return toErrorResponse(error)
  }
}
