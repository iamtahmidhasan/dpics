"use client"

import * as React from "react"
import Image from "next/image"
import { GraduationCap, Play, Sparkles } from "lucide-react"

import { useLanguage } from "@/components/language-provider"

interface CoursePreviewTriggerProps {
  thumbnail?: string | null
  title: string
  duration?: string | null
  firstPreviewLessonId?: string | null
}

export function CoursePreviewTrigger({
  thumbnail,
  title,
  duration,
  firstPreviewLessonId,
}: CoursePreviewTriggerProps) {
  const { t } = useLanguage()

  const handleOpenPreview = () => {
    window.dispatchEvent(
      new CustomEvent("open-course-preview", {
        detail: { lessonId: firstPreviewLessonId },
      })
    )
  }

  return (
    <button
      type="button"
      onClick={handleOpenPreview}
      className="group relative aspect-video w-full bg-muted overflow-hidden border-b border-border text-left focus:outline-hidden focus:ring-2 focus:ring-primary block cursor-pointer"
      aria-label={t("Watch Course Preview", "কোর্স প্রিভিউ দেখুন")}
    >
      {thumbnail ? (
        <Image
          src={thumbnail}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 360px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-primary/10">
          <GraduationCap className="size-12 text-primary/40" />
        </div>
      )}

      {/* Play Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-center justify-center transition-colors group-hover:bg-black/40">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-all duration-300 group-hover:scale-115 group-hover:bg-primary/90">
          <Play className="size-6 fill-current ml-0.5" />
        </div>
      </div>

      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-white/90 font-medium pointer-events-none">
        <span className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
          <Sparkles className="size-3 text-amber-400" />
          {t("Course Preview", "কোর্স প্রিভিউ")}
        </span>
        <span className="font-mono bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
          {duration || "Self-Paced"}
        </span>
      </div>
    </button>
  )
}
