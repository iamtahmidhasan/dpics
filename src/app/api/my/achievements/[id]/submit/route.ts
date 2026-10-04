import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { isAdmin } from "@/lib/roles"
import { requireAchievementCreatorApi } from "@/lib/session"
import { submitAchievementForReview } from "@/lib/services/achievement.service"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requireAchievementCreatorApi()
    const { id } = await context.params

    return NextResponse.json(
      await submitAchievementForReview(id, {
        userId: session.user.id,
        isAdmin: isAdmin(session.user),
      })
    )
  } catch (error) {
    return toErrorResponse(error)
  }
}
