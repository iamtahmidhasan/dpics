import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { isAdmin } from "@/lib/roles"
import { requireAchievementCreatorApi } from "@/lib/session"
import {
  deleteAchievement,
  getAchievementById,
  parseAchievementUpdateInput,
  updateAchievement,
} from "@/lib/services/achievement.service"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requireAchievementCreatorApi()
    const { id } = await context.params
    const detail = await getAchievementById(id)

    if (!isAdmin(session.user) && detail.author.id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(detail)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requireAchievementCreatorApi()
    const { id } = await context.params
    const input = parseAchievementUpdateInput(await request.json())

    return NextResponse.json(
      await updateAchievement(id, input, {
        userId: session.user.id,
        isAdmin: isAdmin(session.user),
      })
    )
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requireAchievementCreatorApi()
    const { id } = await context.params

    return NextResponse.json(
      await deleteAchievement(id, {
        userId: session.user.id,
        isAdmin: isAdmin(session.user),
      })
    )
  } catch (error) {
    return toErrorResponse(error)
  }
}
