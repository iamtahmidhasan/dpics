import { type NextRequest, NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { EnrollmentService } from "@/lib/services/enrollment.service"
import { requireUserApi } from "@/lib/session"

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/courses/[id]/enroll">
) {
  try {
    const session = await requireUserApi()
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))

    const result = await EnrollmentService.enroll({
      courseId: id,
      userId: session.user.id,
      paymentMethod: body.paymentMethod,
      senderNumber: body.senderNumber,
      transactionId: body.transactionId,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    if (error instanceof Error) {
      return NextResponse.json({ error: { message: error.message } }, { status: 400 })
    }
    return toErrorResponse(error)
  }
}
