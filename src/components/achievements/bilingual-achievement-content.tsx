"use client"

import { MarkdownContent } from "@/components/posts/markdown-content"
import { useLanguage } from "@/components/language-provider"

export function BilingualAchievementTitle({
  title,
  titleBn,
}: {
  title: string
  titleBn: string | null
}) {
  const { lang } = useLanguage()
  const displayTitle = lang === "bn" && titleBn ? titleBn : title

  return (
    <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-balance">
      {displayTitle}
    </h1>
  )
}

export function BilingualAchievementExcerpt({
  excerpt,
  excerptBn,
}: {
  excerpt: string | null
  excerptBn: string | null
}) {
  const { lang } = useLanguage()
  const displayExcerpt = lang === "bn" && excerptBn ? excerptBn : excerpt

  if (!displayExcerpt) return null

  return (
    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{displayExcerpt}</p>
  )
}

export function BilingualAchievementContent({
  content,
  contentBn,
}: {
  content: string
  contentBn: string | null
}) {
  const { lang } = useLanguage()
  const isBn = lang === "bn"
  const currentContent = isBn && contentBn ? contentBn : (content || contentBn || "")

  return <MarkdownContent className="mt-6">{currentContent}</MarkdownContent>
}
