import type { Metadata } from "next"

import { AdminCourseList } from "@/components/admin/courses/admin-course-list"
import { CourseService } from "@/lib/services/course.service"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Course Management",
}

export default async function AdminCoursesPage() {
  await requireAdmin()

  // Admin gets all courses (published and draft)
  const courses = await CourseService.listCourses()

  return <AdminCourseList initialCourses={courses} />
}
