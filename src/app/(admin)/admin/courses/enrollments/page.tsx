import type { Metadata } from "next"

import { EnrollmentManager } from "@/components/admin/courses/enrollment-manager"
import { EnrollmentService } from "@/lib/services/enrollment.service"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Course Enrollments",
}

export default async function AdminEnrollmentsPage() {
  await requireAdmin()

  const enrollments = await EnrollmentService.listAdminEnrollments()

  return <EnrollmentManager initialEnrollments={enrollments} />
}
