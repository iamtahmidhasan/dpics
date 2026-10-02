import { type NextRequest, NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { CourseService } from "@/lib/services/course.service"
import { requireAdminApi } from "@/lib/session"

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/courses/[id]/curriculum">
) {
  try {
    await requireAdminApi()
    const { id } = await context.params
    const { sections } = await request.json()

    if (!Array.isArray(sections)) {
      return NextResponse.json({ error: { message: "Invalid curriculum data" } }, { status: 400 })
    }

    await CourseService.saveCurriculum(id, sections)

    const updatedCourse = await CourseService.getCourseAdminById(id)
    return NextResponse.json({ success: true, course: updatedCourse })
  } catch (error) {
    return toErrorResponse(error)
  }
}
