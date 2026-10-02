import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  ImageOff,
  Layers,
  Play,
  PlayCircle,
  Sparkles,
  Users,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { makeT, type Lang } from "@/lib/i18n"
import { cn } from "cn"

export type CourseCardProps = {
  course: any
  lang: Lang
  href?: string
  className?: string
}

export function CourseCard({ course, lang, href, className }: CourseCardProps) {
  const t = makeT(lang)
  const target = href ?? `/courses/${course.slug}`

  const modulesCount = course.sections?.length || 0
  const lessonsCount = (course.sections || []).reduce(
    (acc: number, s: any) => acc + (s.lessons?.length || 0),
    0
  )
  const enrolledCount = course._count?.enrollments || 0

  // Calculate discount percentage if applicable
  const hasDiscount = !course.isFree && course.discountPrice && course.price > course.discountPrice
  const discountPercent = hasDiscount
    ? Math.round(((course.price - course.discountPrice) / course.price) * 100)
    : 0

  const isBn = lang === "bn"
  const displayTitle = (isBn && course.titleBn) ? course.titleBn : course.title
  const displayExcerpt = (isBn && course.excerptBn) ? course.excerptBn : course.excerpt

  return (
    <article
      className={cn(
        "group bg-card relative flex flex-col overflow-hidden rounded-xl border border-border shadow-xs transition-all duration-300 hover:shadow-md hover:border-primary/50",
        className
      )}
    >
      {/* Course Thumbnail with Video / Academy Overlay */}
      <div className="bg-muted relative aspect-video overflow-hidden">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={displayTitle}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="text-muted-foreground/40 flex h-full items-center justify-center bg-primary/5">
            <GraduationCap className="size-10 text-primary/40" />
          </div>
        )}

        {/* Gradient overlay & Play Button Indicator on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          <Badge variant="outline" className="bg-background/90 backdrop-blur-xs text-[10px] font-mono uppercase border-border/80">
            {course.level?.replace("_", " ") || "ALL LEVELS"}
          </Badge>
          {course.featured ? (
            <Badge className="bg-amber-500 text-white hover:bg-amber-600 text-[10px] gap-1 shadow-xs">
              <Sparkles className="size-2.5" />
              <span>{t("Featured", "ফিচার্ড")}</span>
            </Badge>
          ) : null}
        </div>

        {/* Top Right Price Tag */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {course.isFree ? (
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-bold shadow-xs">
              {t("FREE", "ফ্রি")}
            </Badge>
          ) : (
            <Badge className="bg-background/95 backdrop-blur-xs text-foreground text-[11px] font-bold font-mono border-border shadow-xs">
              ৳ {course.discountPrice || course.price}
            </Badge>
          )}
        </div>
      </div>

      {/* Course Details Body */}
      <div className="flex flex-1 flex-col p-4 space-y-3">
        {/* Track / Tag & Discount pill */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-primary font-bold tracking-wider uppercase font-mono text-[10px]">
            {t("Course Track", "কোর্স ট্র্যাক")}
          </span>
          {hasDiscount ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
              {discountPercent}% OFF
            </span>
          ) : null}
        </div>

        {/* Course Title */}
        <h3 className="font-heading text-base font-bold leading-snug tracking-tight text-foreground line-clamp-2">
          <Link href={target} className="after:absolute after:inset-0 hover:text-primary transition-colors">
            {displayTitle}
          </Link>
        </h3>

        {/* Excerpt */}
        {displayExcerpt ? (
          <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
            {displayExcerpt}
          </p>
        ) : null}

        {/* Course Stats Metrics (Modules, Lessons, Students) */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
          <div className="flex items-center gap-1.5 font-mono">
            <Layers className="size-3.5 text-primary shrink-0" />
            <span>{modulesCount} {t("modules", "মডিউল")}</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <BookOpen className="size-3.5 text-primary shrink-0" />
            <span>{lessonsCount} {t("lessons", "টি পাঠ")}</span>
          </div>
        </div>

        {/* Footer: Tuition Price & Action Button */}
        <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between gap-2">
          {/* Tuition Fee */}
          <div className="flex flex-col">
            {course.isFree ? (
              <span className="font-heading text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {t("Free", "ফ্রি")}
              </span>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="font-heading text-base font-extrabold text-foreground">
                  ৳ {course.discountPrice || course.price}
                </span>
                {hasDiscount ? (
                  <span className="text-[11px] text-muted-foreground line-through font-mono">
                    ৳ {course.price}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {/* Action CTA Button */}
          <span
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "text-xs font-semibold gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-200"
            )}
          >
            <span>{course.isFree ? t("Enroll Free", "ফ্রি যুক্ত হন") : t("View Course", "কোর্স দেখুন")}</span>
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  )
}
