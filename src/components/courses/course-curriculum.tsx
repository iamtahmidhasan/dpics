"use client"

import * as React from "react"
import Link from "next/link"
import {
  ChevronDown,
  Clock,
  Code2,
  FileText,
  HelpCircle,
  Lock,
  Play,
  PlayCircle,
  Radio,
  Sparkles,
} from "lucide-react"

import { VideoPlayer } from "@/components/courses/video-player"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"

export interface LessonItem {
  id: string
  title: string
  type?: string
  videoDuration?: string | null
  videoUrl?: string | null
  description?: string | null
  isPreview?: boolean
  orderIndex?: number
  [key: string]: any
}

export interface SectionItem {
  id: string
  title: string
  orderIndex?: number
  lessons: LessonItem[]
  [key: string]: any
}

interface CourseCurriculumProps {
  courseTitle?: string
  courseSlug?: string
  sections: SectionItem[]
  totalLessons: number
  totalDuration?: string | null
  isFree?: boolean
  price?: number
  discountPrice?: number | null
  hasAccess?: boolean
  className?: string
}

function getLessonIcon(type?: string) {
  switch (type) {
    case "LIVE_CLASS":
      return <Radio className="size-3.5 text-rose-500 shrink-0" />
    case "DOCUMENT":
    case "PDF":
      return <FileText className="size-3.5 text-blue-500 shrink-0" />
    case "QUIZ":
      return <HelpCircle className="size-3.5 text-amber-500 shrink-0" />
    case "CODE":
    case "RESOURCE":
      return <Code2 className="size-3.5 text-emerald-500 shrink-0" />
    case "VIDEO":
    default:
      return <PlayCircle className="size-3.5 text-primary shrink-0" />
  }
}

export function CourseCurriculum({
  courseTitle,
  courseSlug,
  sections,
  totalLessons,
  totalDuration,
  isFree = false,
  price = 0,
  discountPrice = null,
  hasAccess = false,
  className,
}: CourseCurriculumProps) {
  const { t } = useLanguage()

  // Track expanded state for each section (default first 2 expanded)
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    sections.forEach((s, idx) => {
      initial[s.id] = idx < 2 // First 2 expanded by default
    })
    return initial
  })

  // Gather all preview lessons across all sections
  const allPreviewLessons = React.useMemo(() => {
    const list: {
      lesson: LessonItem
      sectionTitle: string
      sectionIndex: number
      lessonIndex: number
    }[] = []

    sections.forEach((sec, sIdx) => {
      sec.lessons.forEach((les, lIdx) => {
        if (les.isPreview) {
          list.push({
            lesson: les,
            sectionTitle: sec.title,
            sectionIndex: sIdx + 1,
            lessonIndex: lIdx + 1,
          })
        }
      })
    })
    return list
  }, [sections])

  // Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = React.useState(false)
  const [activePreview, setActivePreview] = React.useState<{
    lesson: LessonItem
    sectionTitle: string
    sectionIndex: number
    lessonIndex: number
  } | null>(null)

  // Open a specific preview lesson
  const openPreview = (
    lesson: LessonItem,
    sectionTitle: string,
    sectionIndex: number,
    lessonIndex: number
  ) => {
    setActivePreview({
      lesson,
      sectionTitle,
      sectionIndex,
      lessonIndex,
    })
    setPreviewModalOpen(true)
  }

  // Listen to custom event for preview requests (e.g. from sidebar thumbnail)
  React.useEffect(() => {
    const handleOpenPreview = (e: any) => {
      const requestedId = e.detail?.lessonId
      if (requestedId) {
        const found = allPreviewLessons.find((p) => p.lesson.id === requestedId)
        if (found) {
          setActivePreview(found)
          setPreviewModalOpen(true)
          return
        }
      }
      if (allPreviewLessons.length > 0) {
        setActivePreview(allPreviewLessons[0])
        setPreviewModalOpen(true)
      }
    }

    window.addEventListener("open-course-preview", handleOpenPreview)
    return () => window.removeEventListener("open-course-preview", handleOpenPreview)
  }, [allPreviewLessons])

  // Check URL query param ?preview=1 or ?preview=lesson-id
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const previewParam = params.get("preview")
      if (previewParam && allPreviewLessons.length > 0) {
        const matched =
          allPreviewLessons.find((p) => p.lesson.id === previewParam) || allPreviewLessons[0]
        setActivePreview(matched)
        setPreviewModalOpen(true)
      }
    }
  }, [allPreviewLessons])

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const allExpanded = sections.every((s) => expandedSections[s.id])

  const toggleAll = () => {
    const nextState = !allExpanded
    const updated: Record<string, boolean> = {}
    sections.forEach((s) => {
      updated[s.id] = nextState
    })
    setExpandedSections(updated)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with stats and expand/collapse all */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">
            {t("Course Curriculum", "কোর্স সিলেবাস ও পাঠসূচি")}
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {sections.length} {t("modules", "মডিউল")} • {totalLessons} {t("lessons", "টি পাঠ")}
            {totalDuration ? ` • ${totalDuration}` : ""}
            {allPreviewLessons.length > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-2">
                ({allPreviewLessons.length} {t("free preview lessons", "টি ফ্রি প্রিভিউ পাঠ")})
              </span>
            ) : null}
          </p>
        </div>

        <Button
          variant="ghost"
          size="xs"
          onClick={toggleAll}
          className="text-xs text-primary hover:text-primary font-medium"
        >
          {allExpanded
            ? t("Collapse all sections", "সব বন্ধ করুন")
            : t("Expand all sections", "সব প্রসারিত করুন")}
        </Button>
      </div>

      {/* Accordion List */}
      <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        {sections.map((section, sIdx) => {
          const isExpanded = Boolean(expandedSections[section.id])
          const lessonCount = section.lessons.length

          return (
            <div key={section.id} className="transition-colors">
              {/* Section Header Accordion Trigger */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform duration-200 shrink-0",
                      isExpanded && "rotate-180"
                    )}
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] font-mono text-primary font-bold uppercase tracking-wider block">
                      {t("Section", "সেকশন")} {sIdx + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {section.title}
                    </h3>
                  </div>
                </div>

                <Badge variant="outline" className="text-[10px] font-mono shrink-0 bg-background/80">
                  {lessonCount} {t("lessons", "টি পাঠ")}
                </Badge>
              </button>

              {/* Lessons List in this Section */}
              {isExpanded && (
                <div className="divide-y divide-border/40 bg-card">
                  {section.lessons.map((lesson, lIdx) => {
                    const isPreviewable = Boolean(lesson.isPreview)

                    // Case 1: Active Enrolled User can click any lesson directly to classroom
                    if (hasAccess && courseSlug) {
                      return (
                        <Link
                          key={lesson.id}
                          href={`/courses/${courseSlug}/learn?lesson=${lesson.id}`}
                          className="px-4 py-3 flex items-center justify-between text-xs transition-colors hover:bg-muted/40 cursor-pointer gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-[11px] font-mono text-muted-foreground/70 w-5 shrink-0">
                              {sIdx + 1}.{lIdx + 1}
                            </span>
                            {getLessonIcon(lesson.type)}
                            <span className="text-foreground font-medium truncate hover:text-primary transition-colors">
                              {lesson.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 text-muted-foreground">
                            {lesson.videoDuration ? (
                              <span className="text-[10px] font-mono flex items-center gap-1">
                                <Clock className="size-2.5" />
                                {lesson.videoDuration}
                              </span>
                            ) : null}
                          </div>
                        </Link>
                      )
                    }

                    // Case 2: Free Preview Lesson for Visitors / Unenrolled
                    if (isPreviewable) {
                      return (
                        <div
                          key={lesson.id}
                          onClick={() =>
                            openPreview(lesson, section.title, sIdx + 1, lIdx + 1)
                          }
                          className="px-4 py-3 flex items-center justify-between text-xs transition-colors hover:bg-primary/5 cursor-pointer group gap-3"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              openPreview(lesson, section.title, sIdx + 1, lIdx + 1)
                            }
                          }}
                          aria-label={`${t("Preview lesson:", "প্রিভিউ পাঠ:")} ${lesson.title}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-[11px] font-mono text-muted-foreground/70 w-5 shrink-0">
                              {sIdx + 1}.{lIdx + 1}
                            </span>
                            <div className="text-primary group-hover:scale-110 transition-transform">
                              <PlayCircle className="size-3.5 fill-primary/10" />
                            </div>
                            <span className="text-foreground font-medium truncate group-hover:text-primary transition-colors">
                              {lesson.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {lesson.videoDuration ? (
                              <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                                <Clock className="size-2.5" />
                                {lesson.videoDuration}
                              </span>
                            ) : null}

                            <Badge
                              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold text-[10px] px-2 py-0.5 gap-1 group-hover:bg-emerald-500/20 transition-colors shadow-xs"
                            >
                              <Play className="size-2.5 fill-current" />
                              <span>{t("Free Preview", "ফ্রি প্রিভিউ")}</span>
                            </Badge>
                          </div>
                        </div>
                      )
                    }

                    // Case 3: Locked Lesson for unenrolled visitors
                    return (
                      <div
                        key={lesson.id}
                        className="px-4 py-3 flex items-center justify-between text-xs text-muted-foreground/80 gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="text-[11px] font-mono text-muted-foreground/50 w-5 shrink-0">
                            {sIdx + 1}.{lIdx + 1}
                          </span>
                          {getLessonIcon(lesson.type)}
                          <span className="text-muted-foreground font-medium truncate">
                            {lesson.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 text-muted-foreground/70">
                          {lesson.videoDuration ? (
                            <span className="text-[10px] font-mono flex items-center gap-1">
                              <Clock className="size-2.5" />
                              {lesson.videoDuration}
                            </span>
                          ) : null}
                          <Lock className="size-3 text-muted-foreground/50" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Free Preview Video Dialog Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-border bg-card">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-col gap-1 pr-12">
            <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
              <span className="text-primary font-bold uppercase tracking-wider">
                {courseTitle || t("Course Preview", "কোর্স প্রিভিউ")}
              </span>
              <span>•</span>
              <span className="truncate">{activePreview?.sectionTitle}</span>
              
            </div>
            <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
              {activePreview?.lesson.title}
            </DialogTitle>
          </div>

          {/* Embedded Video Player */}
          <div className="bg-black aspect-video w-full">
            {activePreview ? (
              <VideoPlayer
                key={activePreview.lesson.id}
                videoUrl={activePreview.lesson.videoUrl}
                title={activePreview.lesson.title}
              />
            ) : null}
          </div>

          {/* Playlist selector if course has multiple preview lectures */}
          {allPreviewLessons.length > 1 && (
            <div className="p-3 border-b border-border bg-muted/10 flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-mono text-muted-foreground shrink-0 pl-1">
                {t("Preview Lectures:", "অন্যান্য প্রিভিউ পাঠ:")}
              </span>
              <div className="flex items-center gap-1.5 min-w-0">
                {allPreviewLessons.map((item) => {
                  const isSelected = activePreview?.lesson.id === item.lesson.id
                  return (
                    <button
                      key={item.lesson.id}
                      type="button"
                      onClick={() => setActivePreview(item)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer",
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      )}
                    >
                      <Play className="size-2.5 fill-current" />
                      <span className="truncate max-w-[180px]">
                        {item.lessonIndex}. {item.lesson.title}
                      </span>
                      {item.lesson.videoDuration ? (
                        <span className="opacity-75 text-[10px] font-mono">
                          ({item.lesson.videoDuration})
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Description & Enrollment Prompt */}
          <div className="p-4 sm:p-5 space-y-4">
            {activePreview?.lesson.description ? (
              <div className="text-xs text-muted-foreground leading-relaxed">
                {activePreview.lesson.description}
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-primary/20 bg-primary/5">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-foreground">
                  {t("Ready to unlock the full course?", "সম্পূর্ণ কোর্সে এনরোল করতে চান?")}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    `Enroll now to get full access to all ${totalLessons} lessons, assignments, quizzes, and certificate.`,
                    `এখনই এনরোল করে সকল ${totalLessons}টি লেকচার, কুইজ, রিসোর্স ও ভেরিফায়েড সার্টিফিকেট পান।`
                  )}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {courseSlug ? (
                  <Link
                    href={`/courses/${courseSlug}#enroll`}
                    onClick={() => setPreviewModalOpen(false)}
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      "font-bold text-xs gap-1.5",
                      isFree ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-primary"
                    )}
                  >
                    <span>
                      {isFree
                        ? t("Enroll for Free", "ফ্রিতে যুক্ত হন")
                        : `${t("Enroll Now", "এনরোল করুন")} - ৳ ${discountPrice || price}`}
                    </span>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
