import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { getPublishedEventBySlug } from "@/lib/services/event.service"

type RouteContext = {
  params: Promise<{ slug: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params
    const event = await getPublishedEventBySlug(slug)

    return NextResponse.json(event)
  } catch (error) {
    return toErrorResponse(error)
  }
}
