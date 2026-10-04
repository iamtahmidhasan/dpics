import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse, ApiError } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { reviewAchievement } from "@/lib/services/achievement.service"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requireAdminApi()
    const { id } = await context.params
    const body = await request.json()

    const decision = body?.decision
    if (decision !== "APPROVE" && decision !== "REJECT") {
      throw ApiError.badRequest("Decision must be either APPROVE or REJECT")
    }

    const massageForAuthor = typeof body.reason === "string" ? body.reason : body.massageForAuthor ?? null

    return NextResponse.json(
      await reviewAchievement(id, decision, massageForAuthor, session.user.id)
    )
  } catch (error) {
    return toErrorResponse(error)
  }
}
