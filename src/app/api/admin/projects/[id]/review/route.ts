import { NextResponse, type NextRequest } from "next/server"

import { ApiError, toErrorResponse } from "@/lib/api-error"
import { PostStatus } from "@/generated/prisma/enums"
import { requireAdmin } from "@/lib/session"
import { ProjectService } from "@/lib/services/project.service"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAdmin()
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))

    const status = body.status as PostStatus
    if (!status) {
      throw ApiError.badRequest("Status is required")
    }

    const updated = await ProjectService.reviewProject(id, session.user.id, {
      status,
      massageForAuthor: typeof body.massageForAuthor === "string" ? body.massageForAuthor : null,
    })

    return NextResponse.json(updated)
  } catch (error) {
    return toErrorResponse(error)
  }
}
