"use client"

import { Globe } from "lucide-react"
import { useState } from "react"

import { MarkdownContent } from "@/components/posts/markdown-content"
import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"

export function BilingualPostContent({
  content,
  contentBn,
  initialLang,
}: {
  content: string
  contentBn: string | null
  initialLang: string
}) {
  const { t } = useLanguage()
  const hasBoth = Boolean(content && contentBn)

  const [activeLang, setActiveLang] = useState<"en" | "bn">(
    initialLang === "bn" && contentBn ? "bn" : "en"
  )

  const currentContent = activeLang === "bn" && contentBn ? contentBn : content

  return (
    <div>
      {hasBoth ? (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="size-3.5" />
            <span>{t("Read this article in:", "এই লেখাটি পড়ুন:")}</span>
          </div>

          <div className="flex items-center gap-1 rounded-md bg-muted p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveLang("en")}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                activeLang === "en"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setActiveLang("bn")}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                activeLang === "bn"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              বাংলা (Bangla)
            </button>
          </div>
        </div>
      ) : null}

      <MarkdownContent className="mt-8">{currentContent}</MarkdownContent>
    </div>
  )
}
