import { type NextRequest, NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { EnrollmentService } from "@/lib/services/enrollment.service"
import { requireUserApi } from "@/lib/session"

export async function POST(
  request: NextRequest,
  _context: RouteContext<"/api/courses/[id]/progress">
) {
  try {
    const session = await requireUserApi()
    const { lessonId, completed } = await request.json()

    if (!lessonId) {
      return NextResponse.json({ error: { message: "lessonId is required" } }, { status: 400 })
    }

    const progress = await EnrollmentService.toggleLessonProgress(
      lessonId,
      session.user.id,
      Boolean(completed)
    )

    return NextResponse.json({ progress })
  } catch (error) {
    return toErrorResponse(error)
  }
}
