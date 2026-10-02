import type { Metadata } from "next"

import { CourseForm } from "@/components/admin/courses/course-form"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Create Course | Admin",
}

export default async function NewAdminCoursePage() {
  const [lang] = await Promise.all([getLang()])
  const t = makeT(lang)

  await requireAdmin()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
          {t("Create New Course", "নতুন কোর্স তৈরি করুন")}
        </h1>
        <p className="text-xs text-muted-foreground">
          {t(
            "Add course details, pricing, metadata, and then proceed to build sections and lessons in the curriculum builder.",
            "কোর্সের বিস্তারিত তথ্য ও ফি নির্ধারণ করুন এবং এরপর সিলেবাস বিল্ডারে পাঠ যোগ করুন।"
          )}
        </p>
      </div>

      <CourseForm />
    </div>
  )
}
