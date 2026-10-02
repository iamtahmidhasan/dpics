import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Clock, Lock } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClassroomView } from "@/components/courses/classroom-view"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { CourseService } from "@/lib/services/course.service"
import { getSession } from "@/lib/session"
import { isAdmin as checkAdmin } from "@/lib/roles"
import { cn } from "cn"

export const metadata: Metadata = {
  title: "Classroom",
  robots: { index: false, follow: false },
}

export default async function CourseLearnPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [lang, session] = await Promise.all([getLang(), getSession()])
  const t = makeT(lang)

  if (!session?.user) {
    redirect(`/join?redirect=/courses/${slug}/learn`)
  }

  const isAdmin = checkAdmin(session.user)
  const course = await CourseService.getCourseBySlug(slug, session.user.id, isAdmin)

  if (!course) {
    notFound()
  }

  // If user does not have active access
  if (!course.hasAccess) {
    const isPending = course.enrollment?.status === "PENDING"

    return (
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 w-full flex items-center justify-center min-h-[60vh]">
        <Card size="sm" className="w-full max-w-md text-center p-2 border-border shadow-xs">
          <CardHeader>
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
              {isPending ? (
                <Clock className="size-5 text-amber-500" />
              ) : (
                <Lock className="size-5 text-muted-foreground" />
              )}
            </div>
            <CardTitle>
              {isPending
                ? t("Verification Pending", "ভেরিফিকেশন পেন্ডিং আছে")
                : t("Enrollment Required", "এনরোলমেন্ট আবশ্যক")}
            </CardTitle>
            <CardDescription className="pt-1">
              {isPending
                ? t(
                    "We have received your enrollment submission. Our admin team is verifying your payment. Once approved, the classroom will unlock immediately.",
                    "আমরা আপনার এনরোলমেন্ট রিকোয়েস্ট পেয়েছি। আমাদের অ্যাডমিন পেমেন্ট ভেরিফাই করছেন। অনুমোদন মিললেই ক্লাসরুম চালু হবে।"
                  )
                : t(
                    "You must enroll in this course to access the lectures, live classes, quizzes, and resources.",
                    "লেকচার, লাইভ ক্লাস, কুইজ এবং রিসোর্স অ্যাক্সেস করতে আপনাকে এই কোর্সে এনরোল করতে হবে।"
                  )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Link
              href={`/courses/${course.slug}`}
              className={cn(buttonVariants({ size: "sm" }), "w-full text-xs")}
            >
              {t("Back to Course Page", "কোর্স পেইজে ফিরে যান")}
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 w-full">
      <ClassroomView course={course} />
    </div>
  )
}
