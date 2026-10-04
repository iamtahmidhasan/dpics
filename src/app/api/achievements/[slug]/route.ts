import { NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { getPublishedAchievementBySlug } from "@/lib/services/achievement.service"

type RouteContext = {
  params: Promise<{ slug: string }>
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { slug } = await context.params
    return NextResponse.json(await getPublishedAchievementBySlug(slug))
  } catch (error) {
    return toErrorResponse(error)
  }
}
