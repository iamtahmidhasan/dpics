"use client"

import { Compass } from "lucide-react"
import Link from "next/link"

import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"

const CONTACT_EMAIL = "info@dgpics.org"

export function NotFoundContent() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Compass className="size-6" />
      </span>

      <p className="mt-6 font-mono text-6xl font-bold tracking-tight text-muted-foreground/40 sm:text-7xl">
        404
      </p>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {t("Page not found", "পৃষ্ঠাটি পাওয়া যায়নি")}
      </h1>

      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        {t(
          "The page you are looking for may have been moved, renamed, or never existed.",
          "আপনি যে পৃষ্ঠাটি খুঁজছেন সেটি হয়তো সরানো হয়েছে, নাম পরিবর্তন করা হয়েছে, অথবা কখনও ছিল না।"
        )}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          size="lg"
          nativeButton={false}
          className="h-10 px-5 text-sm"
          render={<Link href="/" />}
        >
          {t("Back to home", "হোমে ফিরে যান")}
        </Button>
        <Button
          variant="outline"
          size="lg"
          nativeButton={false}
          className="h-10 px-5 text-sm"
          render={<Link href="/join" />}
        >
          {t("Join / Sign in", "যোগ দিন / সাইন ইন")}
        </Button>
      </div>

      <p className="mt-12 text-xs text-muted-foreground">
        {t("Think this is a mistake? Email us at", "এটি ভুল মনে হচ্ছে? আমাদের ইমেইল করুন")}{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="font-medium text-foreground underline underline-offset-4"
        >
          {CONTACT_EMAIL}
        </a>
      </p>
    </div>
  )
}
