import { type NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"
import { toErrorResponse } from "@/lib/api-error"
import { EnrollmentService } from "@/lib/services/enrollment.service"
import { requireAdminApi } from "@/lib/session"
import type { EnrollmentStatus, PaymentMethod } from "@/generated/prisma/enums"

export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()
    const { searchParams } = new URL(request.url)
    const status = (searchParams.get("status") as EnrollmentStatus) || undefined
    const courseId = searchParams.get("courseId") || undefined
    const search = searchParams.get("search") || undefined

    const enrollments = await EnrollmentService.listAdminEnrollments({
      status,
      courseId,
      search,
    })

    return NextResponse.json({ enrollments })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminApi()
    const { userId, courseId, status, paymentMethod, amountPaid, adminNote } = await request.json()

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: { message: "userId and courseId are required" } },
        { status: 400 }
      )
    }

    const enrollmentStatus: EnrollmentStatus = (status as EnrollmentStatus) || "ACTIVE"

    const enrollment = await prisma.courseEnrollment.upsert({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
      create: {
        courseId,
        userId,
        status: enrollmentStatus,
        paymentMethod: (paymentMethod as PaymentMethod) || "CASH",
        amountPaid: Number(amountPaid) || 0,
        adminNote: adminNote || null,
        approvedAt: enrollmentStatus === "ACTIVE" ? new Date() : null,
        approvedById: enrollmentStatus === "ACTIVE" ? session.user.id : null,
      },
      update: {
        status: enrollmentStatus,
        paymentMethod: (paymentMethod as PaymentMethod) || "CASH",
        amountPaid: Number(amountPaid) || 0,
        adminNote: adminNote || null,
        approvedAt: enrollmentStatus === "ACTIVE" ? new Date() : null,
        approvedById: enrollmentStatus === "ACTIVE" ? session.user.id : null,
      },
    })

    return NextResponse.json({ enrollment }, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminApi()
    const { enrollmentId, status, adminNote } = await request.json()

    if (!enrollmentId || !status) {
      return NextResponse.json(
        { error: { message: "enrollmentId and status are required" } },
        { status: 400 }
      )
    }

    const updated = await EnrollmentService.updateEnrollmentStatus(
      enrollmentId,
      status as EnrollmentStatus,
      session.user.id,
      adminNote
    )

    return NextResponse.json({ enrollment: updated })
  } catch (error) {
    return toErrorResponse(error)
  }
}
