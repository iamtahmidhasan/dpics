"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock, Lock, Sparkles } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { EnrollmentModal } from "@/components/courses/enrollment-modal"
import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"

interface CourseEnrollCtaProps {
  course: {
    id: string
    title: string
    slug: string
    isFree: boolean
    price: number
    discountPrice?: number | null
  }
  enrollment?: {
    id: string
    status: string
  } | null
  isAuthenticated: boolean
  paymentSettings?: any
}

export function CourseEnrollCta({
  course,
  enrollment,
  isAuthenticated,
  paymentSettings,
}: CourseEnrollCtaProps) {
  const { t } = useLanguage()
  const [modalOpen, setModalOpen] = React.useState(false)

  // 1. If actively enrolled
  if (enrollment?.status === "ACTIVE") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{t("You are enrolled in this course!", "আপনি এই কোর্সে এনরোল করেছেন!")}</span>
        </div>
        <Link
          href={`/courses/${course.slug}/learn`}
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full bg-primary font-bold shadow-md hover:shadow-lg transition-all gap-2 text-sm"
          )}
        >
          <span>{t("Go to Classroom", "ক্লাসরুমে যান")}</span>
          <ArrowRight className="size-4" />
        </Link>
      </div>
    )
  }

  // 2. If payment is pending verification
  if (enrollment?.status === "PENDING") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-600 dark:text-amber-400">
          <Clock className="size-4 shrink-0" />
          <span>
            {t(
              "Your enrollment request is pending verification. Access will be unlocked once approved.",
              "আপনার এনরোলমেন্ট রিকোয়েস্ট যাচাই করা হচ্ছে। অনুমোদন পেলেই অ্যাক্সেস চালু হবে।"
            )}
          </span>
        </div>
        <Button
          variant="outline"
          size="lg"
          className="w-full text-xs"
          onClick={() => setModalOpen(true)}
        >
          {t("Re-submit / Check Info", "তথ্য পুনরায় পাঠান / চেক করুন")}
        </Button>

        <EnrollmentModal
          course={course}
          paymentSettings={paymentSettings}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      </div>
    )
  }

  // 3. If guest / unauthenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-2.5">
        <Link
          href={`/join?redirect=/courses/${course.slug}`}
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full bg-primary font-bold shadow-md hover:shadow-lg transition-all gap-2 text-sm"
          )}
        >
          {course.isFree ? (
            <>
              <Sparkles className="size-4" />
              <span>{t("Sign in to Enroll Free", "সাইন ইন করে ফ্রিতে যুক্ত হন")}</span>
            </>
          ) : (
            <>
              <Lock className="size-4" />
              <span>
                {t("Sign in to Enroll", "এনরোল করতে সাইন ইন করুন")} (৳{" "}
                {course.discountPrice ? course.discountPrice.toLocaleString() : course.price.toLocaleString()}
                )
              </span>
            </>
          )}
        </Link>
        <p className="text-[11px] text-center text-muted-foreground">
          {t("Free registration required to track course progress", "কোর্স প্রগ্রেস ট্র্যাক করতে লগইন আবশ্যক")}
        </p>
      </div>
    )
  }

  // 4. Logged in and can enroll
  return (
    <>
      <Button
        size="lg"
        onClick={() => setModalOpen(true)}
        className={cn(
          "w-full font-bold shadow-md hover:shadow-lg transition-all gap-2 text-sm",
          course.isFree ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-primary"
        )}
      >
        {course.isFree ? (
          <>
            <Sparkles className="size-4" />
            <span>{t("Enroll for Free (Instant Access)", "ফ্রিতে এনরোল করুন (তাৎক্ষণিক অ্যাক্সেস)")}</span>
          </>
        ) : (
          <>
            <Lock className="size-4" />
            <span>
              {t("Enroll Now", "এখনই এনরোল করুন")} - ৳{" "}
              {course.discountPrice ? course.discountPrice.toLocaleString() : course.price.toLocaleString()}
            </span>
          </>
        )}
      </Button>

      <EnrollmentModal
        course={course}
        paymentSettings={paymentSettings}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  )
}
