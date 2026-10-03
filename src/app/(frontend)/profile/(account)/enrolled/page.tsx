import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  PlayCircle,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import prisma from "@/lib/prisma"
import { EnrollmentService } from "@/lib/services/enrollment.service"
import { requireUser } from "@/lib/session"
import { cn } from "cn"

export const metadata: Metadata = {
  title: "Enrolled Courses",
}

export default async function ProfileEnrolledPage() {
  const [session, lang] = await Promise.all([requireUser(), getLang()])
  const t = makeT(lang)

  const [enrollments, userProgress] = await Promise.all([
    EnrollmentService.listUserEnrollments(session.user.id),
    prisma.lessonProgress.findMany({
      where: { userId: session.user.id, completed: true },
      select: { lessonId: true },
    }),
  ])

  const completedLessonIds = new Set(userProgress.map((p) => p.lessonId))

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
          <GraduationCap className="size-5 text-primary" />
          <span>{t("Enrolled Courses", "ভর্তি হওয়া কোর্সসমূহ")}</span>
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Access your active classrooms, track learning progress, and view verification statuses.",
            "আপনার চলমান কোর্সসমূহ দেখুন, অগ্রগতি ট্র্যাক করুন এবং ক্লাসরুমে প্রবেশ করুন।"
          )}
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
          <BookOpen className="size-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-sm text-foreground">
            {t("No courses enrolled yet", "এখনও কোনো কোর্সে যুক্ত হননি")}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {t(
              "Browse our catalog of free workshops and comprehensive premium courses to start learning.",
              "আমাদের ফ্রি ওয়ার্কশপ এবং প্রিমিয়াম কোর্সসমূহ ঘুরে দেখুন এবং শেখা শুরু করুন।"
            )}
          </p>
          <Link
            href="/courses"
            className={cn(buttonVariants({ size: "sm" }), "mt-4 text-xs font-semibold gap-1.5")}
          >
            <GraduationCap className="size-4" />
            <span>{t("Browse Courses", "কোর্স ব্রাউজ করুন")}</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {enrollments.map((en) => {
            const course = en.course
            const isActive = en.status === "ACTIVE"
            const isPending = en.status === "PENDING"
            const isRejected = en.status === "REJECTED"

            const totalLessons = course.sections?.reduce(
              (acc: number, s: any) => acc + (s.lessons?.length || 0),
              0
            ) || 0

            const completedCount = course.sections?.reduce(
              (acc: number, s: any) =>
                acc + (s.lessons?.filter((l: any) => completedLessonIds.has(l.id)).length || 0),
              0
            ) || 0

            const progressPercent =
              totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

            return (
              <div
                key={en.id}
                className="flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all hover:border-primary/50"
              >
                {/* Header info */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    {isActive ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] gap-1">
                        <CheckCircle2 className="size-3" />
                        <span>{t("Active Access", "চালু আছে")}</span>
                      </Badge>
                    ) : isPending ? (
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-[10px]"
                      >
                        <Clock className="size-3" />
                        <span>{t("Verification Pending", "ভেরিফিকেশন পেন্ডিং")}</span>
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1 text-[10px]">
                        <XCircle className="size-3" />
                        <span>{t("Rejected", "প্রত্যাখ্যাত")}</span>
                      </Badge>
                    )}

                    <span className="text-[11px] text-muted-foreground font-mono">
                      {course.isFree ? t("Free", "ফ্রি") : `৳ ${en.amountPaid}`}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-sm text-foreground line-clamp-1">
                    <Link href={`/courses/${course.slug}`} className="hover:text-primary transition-colors">
                      {course.title}
                    </Link>
                  </h3>

                  {/* Progress Bar (Only shown for Active access) */}
                  {isActive && (
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{t("Progress", "অগ্রগতি")}</span>
                        <span className="font-bold text-foreground">
                          {progressPercent}% ({completedCount}/{totalLessons} {t("lessons", "টি পাঠ")})
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Pending information banner */}
                  {isPending && (
                    <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-600 dark:text-amber-400">
                      <p>
                        {t(
                          "Your payment submission is waiting for admin verification. Access will unlock once verified.",
                          "আপনার পেমেন্ট ভেরিফাই করা হচ্ছে। অনুমোদন পেলেই কোর্সটি চালু হবে।"
                        )}
                      </p>
                      {en.transactionId && (
                        <p className="mt-1 font-mono font-bold">
                          TrxID: {en.transactionId}
                        </p>
                      )}
                    </div>
                  )}

                  {isRejected && (
                    <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-[11px] text-destructive">
                      <p>
                        {en.adminNote ||
                          t(
                            "This enrollment could not be verified. Please check with an admin.",
                            "এই এনরোলমেন্টটি ভেরিফাই করা সম্ভব হয়নি।"
                          )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer button */}
                <div className="border-t border-border bg-muted/20 px-5 py-3 flex items-center justify-between">
                  <Link
                    href={`/courses/${course.slug}`}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                  >
                    <span>{t("Details", "বিবরণ")}</span>
                    <ExternalLink className="size-3" />
                  </Link>

                  {isActive ? (
                    <Link
                      href={`/courses/${course.slug}/learn`}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "text-xs font-semibold gap-1.5 h-8 px-3.5"
                      )}
                    >
                      <PlayCircle className="size-3.5" />
                      <span>{t("Enter Classroom", "ক্লাসরুম")}</span>
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
  )
}
