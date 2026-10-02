import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CourseForm } from "@/components/admin/courses/course-form"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { CourseService } from "@/lib/services/course.service"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Edit Course | Admin",
}

export default async function AdminEditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [lang] = await Promise.all([getLang()])
  const t = makeT(lang)

  await requireAdmin()

  const course = await CourseService.getCourseAdminById(id)

  if (!course) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
          {t("Edit Course", "কোর্স সম্পাদনা")}
        </h1>
        <p className="text-xs text-muted-foreground">
          {t(
            "Update course parameters, fees, status, or manage modules in the syllabus builder.",
            "কোর্সের তথ্য ও সেটিংস আপডেট করুন অথবা সিলেবাস বিল্ডার থেকে পাঠ পরিচালনা করুন।"
          )}
        </p>
      </div>

      <CourseForm initialCourse={course} isEditing />
    </div>
  )
}
