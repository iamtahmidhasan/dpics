import type { Metadata } from "next"
import Link from "next/link"
import { Compass } from "lucide-react"

import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { CONTACT } from "@/lib/site-config"

export async function generateMetadata(): Promise<Metadata> {
  const t = makeT(await getLang())

  return {
    title: t("Page not found", "পৃষ্ঠাটি পাওয়া যায়নি"),
  }
}

export default async function NotFound() {
  const t = makeT(await getLang())

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
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
              render={<Link href="/sign-in" />}
            >
              {t("Sign in", "সাইন ইন")}
            </Button>
          </div>

          <p className="mt-12 text-xs text-muted-foreground">
            {t(
              "Think this is a mistake? Email us at",
              "এটি ভুল মনে হচ্ছে? আমাদের ইমেইল করুন"
            )}{" "}
            <a
              href={`mailto:${CONTACT.email}`}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {CONTACT.email}
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
