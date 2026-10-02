import { NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { EnrollmentService } from "@/lib/services/enrollment.service"
import { requireUserApi } from "@/lib/session"

export async function GET() {
  try {
    const session = await requireUserApi()
    const enrollments = await EnrollmentService.listUserEnrollments(session.user.id)
    return NextResponse.json({ enrollments })
  } catch (error) {
    return toErrorResponse(error)
  }
}
