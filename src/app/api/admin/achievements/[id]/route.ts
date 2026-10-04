import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { isAdmin } from "@/lib/roles"
import { requireAdminApi } from "@/lib/session"
import {
  deleteAchievement,
  getAchievementById,
  parseAchievementAdminUpdateInput,
  updateAchievement,
  type AchievementAdminUpdateInput,
} from "@/lib/services/achievement.service"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    await requireAdminApi()
    const { id } = await context.params

    return NextResponse.json(await getAchievementById(id))
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requireAdminApi()
    const { id } = await context.params
    const body = await request.json()
    const input: AchievementAdminUpdateInput = parseAchievementAdminUpdateInput(body)

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
    const session = await requireAdminApi()
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
