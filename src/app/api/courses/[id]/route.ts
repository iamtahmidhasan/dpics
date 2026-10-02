import { type NextRequest, NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { CourseService } from "@/lib/services/course.service"
import { requireAdminApi } from "@/lib/session"

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/courses/[id]">
) {
  try {
    const { id } = await context.params
    const course = await CourseService.getCourseAdminById(id)

    if (!course) {
      return NextResponse.json({ error: { message: "Course not found" } }, { status: 404 })
    }

    return NextResponse.json({ course })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/courses/[id]">
) {
  try {
    await requireAdminApi()
    const { id } = await context.params
    const body = await request.json()

    const course = await CourseService.updateCourse(id, body)
    return NextResponse.json({ course })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/courses/[id]">
) {
  try {
    await requireAdminApi()
    const { id } = await context.params

    await CourseService.deleteCourse(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return toErrorResponse(error)
  }
}
