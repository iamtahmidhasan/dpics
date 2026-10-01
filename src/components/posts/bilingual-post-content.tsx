"use client"

import { MarkdownContent } from "@/components/posts/markdown-content"
import { useLanguage } from "@/components/language-provider"

export function BilingualPostTitle({
  title,
  titleBn,
}: {
  title: string
  titleBn: string | null
}) {
  const { lang } = useLanguage()
  const displayTitle = lang === "bn" && titleBn ? titleBn : title

  return (
    <h1 className="font-heading text-3xl leading-tight font-semibold text-balance">
      {displayTitle}
    </h1>
  )
}

export function BilingualPostDescription({
  description,
  descriptionBn,
}: {
  description: string | null
  descriptionBn: string | null
}) {
  const { lang } = useLanguage()
  const displayDescription = lang === "bn" && descriptionBn ? descriptionBn : description

  if (!displayDescription) return null

  return (
    <p className="text-muted-foreground text-base/relaxed">{displayDescription}</p>
  )
}

export function BilingualPostContent({
  content,
  contentBn,
  initialLang: _initialLang,
}: {
  content: string
  contentBn: string | null
  initialLang?: string
}) {
  const { lang } = useLanguage()
  const isBn = lang === "bn"
  const currentContent = isBn && contentBn ? contentBn : (content || contentBn || "")

  return <MarkdownContent className="mt-8">{currentContent}</MarkdownContent>
}
