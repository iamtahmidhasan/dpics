import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { achievementFiltersFromSearch } from "@/lib/achievement-params"
import { isAdmin } from "@/lib/roles"
import { requireAdminApi } from "@/lib/session"
import {
  createAchievementAsAdmin,
  getAchievementCounts,
  listAchievementsForAdmin,
  parseAchievementInput,
} from "@/lib/services/achievement.service"

export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()

    const filters = achievementFiltersFromSearch(request.nextUrl.searchParams)
    const [page, counts] = await Promise.all([
      listAchievementsForAdmin(filters),
      getAchievementCounts(),
    ])

    return NextResponse.json({ ...page, counts })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminApi()
    const body = await request.json()
    const input = parseAchievementInput(body)
    const status = body.status ?? "PUBLISHED"

    return NextResponse.json(
      await createAchievementAsAdmin(input, status, {
        userId: session.user.id,
        isAdmin: isAdmin(session.user),
      }),
      { status: 201 }
    )
  } catch (error) {
    return toErrorResponse(error)
  }
}
