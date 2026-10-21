import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { requireAdmin } from "@/lib/session"
import { ProjectService } from "@/lib/services/project.service"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAdmin()
    const { id } = await context.params

    const isFeatured = await ProjectService.toggleFeatured(id, session.user.id)
    return NextResponse.json({ success: true, isFeatured })
  } catch (error) {
    return toErrorResponse(error)
  }
}
