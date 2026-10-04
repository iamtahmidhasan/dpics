import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { isAdmin } from "@/lib/roles"
import { achievementFiltersFromSearch } from "@/lib/achievement-params"
import { requireAchievementCreatorApi } from "@/lib/session"
import {
  createAchievement,
  getMyAchievements,
  parseAchievementInput,
} from "@/lib/services/achievement.service"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAchievementCreatorApi()
    const filters = achievementFiltersFromSearch(request.nextUrl.searchParams)

    return NextResponse.json(await getMyAchievements(session.user.id, filters))
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAchievementCreatorApi()
    const input = parseAchievementInput(await request.json())

    return NextResponse.json(
      await createAchievement(input, {
        userId: session.user.id,
        isAdmin: isAdmin(session.user),
      }),
      { status: 201 }
    )
  } catch (error) {
    return toErrorResponse(error)
  }
}
