"use client"

import { AdminUserCourses } from "@/components/admin/admin-user-courses"
import { useAdminUser } from "./admin-user-context"

export function AdminUserCoursesTab() {
  const { user, enrollments, availableCourses } = useAdminUser()

  return (
    <AdminUserCourses
      userId={user.id}
      userName={user.name || user.email}
      initialEnrollments={enrollments as any}
      availableCourses={availableCourses as any}
    />
  )
}
