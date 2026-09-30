"use client"

import { Languages } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"
import type { Lang } from "@/lib/i18n"

const CURRENT_LABEL: Record<Lang, string> = {
  en: "EN",
  bn: "বাং",
}

const LANGUAGE_NAME: Record<Lang, string> = {
  en: "English",
  bn: "Bangla",
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage()
  const next: Lang = lang === "en" ? "bn" : "en"
  const action = `Switch to ${LANGUAGE_NAME[next]}`

  return (
    <Button
      variant="ghost"
      className={cn("h-8 gap-1.5 px-2 dark:hover:bg-muted", className)}
      onClick={() => setLang(next)}
      aria-label={action}
      title={action}
    >
      <Languages className="size-5" />
      <span className="text-xs font-semibold text-muted-foreground">
        {CURRENT_LABEL[lang]}
      </span>
    </Button>
  )
}
