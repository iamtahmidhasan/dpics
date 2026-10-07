import { NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import prisma from "@/lib/prisma"
import { Department, EmailCategory, EnrollmentStatus, EventRegistrationStatus, MembershipStatus, Role, Semester, Shift, VerificationStatus } from "@/generated/prisma/enums"

export async function GET() {
  try {
    await requireAdminApi()

    const [courses, events] = await Promise.all([
      prisma.course.findMany({
        select: { id: true, title: true },
        orderBy: { title: "asc" },
      }),
      prisma.event.findMany({
        select: { id: true, title: true },
        orderBy: { startDate: "desc" },
      }),
    ])

    return NextResponse.json({
      courses,
      events,
      enums: {
        roles: Object.values(Role),
        departments: Object.values(Department),
        semesters: Object.values(Semester),
        shifts: Object.values(Shift),
        membershipStatuses: Object.values(MembershipStatus),
        verificationStatuses: Object.values(VerificationStatus),
        enrollmentStatuses: Object.values(EnrollmentStatus),
        eventRegistrationStatuses: Object.values(EventRegistrationStatus),
        categories: Object.values(EmailCategory),
      },
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
