"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, BookOpen, Clock, GraduationCap, PlayCircle, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { useSession, signOut } from "@/lib/auth-client"
import { cn } from "cn"

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const { t } = useLanguage()

  const [enrollments, setEnrollments] = React.useState<any[]>([])
  const [loadingCourses, setLoadingCourses] = React.useState(true)

  React.useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/join")
    }
  }, [isPending, session, router])

  React.useEffect(() => {
    if (session?.user) {
      fetch("/api/my/courses")
        .then((res) => (res.ok ? res.json() : { enrollments: [] }))
        .then((data) => setEnrollments(data.enrollments || []))
        .catch(() => setEnrollments([]))
        .finally(() => setLoadingCourses(false))
    }
  }, [session?.user])

  if (isPending)
    return <p className="mt-8 text-center text-muted-foreground">{t("Loading...", "লোড হচ্ছে...")}</p>
  if (!session?.user)
    return <p className="mt-8 text-center text-muted-foreground">{t("Redirecting...", "রিডাইরেক্ট হচ্ছে...")}</p>

  const { user } = session

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-8 space-y-8">
      {/* Header Profile Summary */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-black text-xl">
            {user.name?.charAt(0) || "U"}
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
              {t("Welcome,", "স্বাগতম,")} {user.name || "Student"}!
            </h1>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/courses"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs gap-1.5")}
          >
            <BookOpen className="size-3.5" />
            <span>{t("Browse Courses", "কোর্স ব্রাউজ করুন")}</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut().then(() => router.push("/"))}
            className="text-xs text-destructive hover:bg-destructive/10"
          >
            {t("Sign Out", "সাইন আউট")}
          </Button>
        </div>
      </div>

      {/* Enrolled Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-5 text-primary" />
            <h2 className="font-heading text-lg font-bold text-foreground">
              {t("My Enrolled Courses", "আমার কোর্সসমূহ")}
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {enrollments.length} {t("courses", "টি কোর্স")}
          </span>
        </div>

        {loadingCourses ? (
          <div className="rounded-xl border border-border p-8 text-center text-xs text-muted-foreground">
            {t("Loading your courses...", "কোর্স লোড হচ্ছে...")}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-3">
            <BookOpen className="mx-auto size-10 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              {t("You haven't enrolled in any courses yet.", "আপনি এখনও কোনো কোর্সে যুক্ত হননি।")}
            </p>
            <Link
              href="/courses"
              className={cn(buttonVariants({ size: "sm" }), "text-xs font-semibold")}
            >
              {t("Explore Free & Premium Courses", "কোর্সসমূহ দেখুন")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {enrollments.map((en) => {
              const course = en.course
              const isActive = en.status === "ACTIVE"
              const isPending = en.status === "PENDING"
              const totalLessons = course.sections?.reduce(
                (acc: number, s: any) => acc + (s.lessons?.length || 0),
                0
              )

              return (
                <div
                  key={en.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/50"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      {isActive ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px]">
                          {t("Enrolled", "এনরোলড")}
                        </Badge>
                      ) : isPending ? (
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-[10px]"
                        >
                          <Clock className="size-3" />
                          <span>{t("Verification Pending", "পেন্ডিং")}</span>
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">
                          {en.status}
                        </Badge>
                      )}

                      <span className="text-[11px] text-muted-foreground">
                        {totalLessons} {t("lessons", "টি পাঠ")}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-sm text-foreground line-clamp-1">
                      {course.title}
                    </h3>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {course.isFree ? t("Free Course", "ফ্রি কোর্স") : `৳ ${en.amountPaid}`}
                    </span>

                    {isActive ? (
                      <Link
                        href={`/courses/${course.slug}/learn`}
                        className={cn(
                          buttonVariants({ size: "sm" }),
                          "text-xs font-semibold gap-1.5 h-8 px-3"
                        )}
                      >
                        <PlayCircle className="size-3.5" />
                        <span>{t("Continue Learning", "ক্লাসরুম")}</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/courses/${course.slug}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "text-xs h-8 px-3"
                        )}
                      >
                        <span>{t("View Status", "স্ট্যাটাস দেখুন")}</span>
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
