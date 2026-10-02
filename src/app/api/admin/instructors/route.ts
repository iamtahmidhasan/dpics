import { NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { CourseService } from "@/lib/services/course.service"
import { requireAdminApi } from "@/lib/session"

export async function GET() {
  try {
    await requireAdminApi()
    const instructors = await CourseService.getAvailableInstructors()
    return NextResponse.json({ instructors })
  } catch (error) {
    return toErrorResponse(error)
  }
}
