import type { Metadata } from "next"

import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { NotFoundContent } from "@/components/not-found-content"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"

export async function generateMetadata(): Promise<Metadata> {
  const t = makeT(await getLang())

  return {
    title: t("Page not found", "পৃষ্ঠাটি পাওয়া যায়নি"),
  }
}

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <NotFoundContent />
      </main>
      <Footer />
    </>
  )
}
