import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CurriculumBuilder } from "@/components/admin/courses/curriculum-builder"
import { CourseService } from "@/lib/services/course.service"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Curriculum Builder",
}

export default async function AdminCurriculumPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const [course, instructors] = await Promise.all([
    CourseService.getCourseAdminById(id),
    CourseService.getAvailableInstructors(),
  ])

  if (!course) {
    notFound()
  }

  return (
    <CurriculumBuilder
      course={course}
      availableInstructors={instructors}
    />
  )
}
