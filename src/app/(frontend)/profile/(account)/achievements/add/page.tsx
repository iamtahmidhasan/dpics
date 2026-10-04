import type { Metadata } from "next"

import { AchievementComposer } from "@/components/achievements/achievement-composer"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { requireAchievementCreator } from "@/lib/session"
import prisma from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Add achievement",
}

export default async function AddAchievementPage() {
  const [lang] = await Promise.all([getLang(), requireAchievementCreator()])
  const t = makeT(lang)

  // Pre-load achievement categories
  const categories = await prisma.category.findMany({
    where: { type: "ACHIEVEMENT", isActive: true },
    select: { id: true, name: true, nameBn: true, slug: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-bold tracking-tight">
          {t("Add Achievement", "অর্জন যোগ করুন")}
        </h1>
        <p className="text-xs text-muted-foreground">
          {t(
            "Share your competitions, hackathons, certifications, or awards. Submissions will be verified by society admins.",
            "আপনার প্রতিযোগিতা, হ্যাকাথন, সার্টিফিকেশন বা পুরষ্কার শেয়ার করুন। জমাদানের পর এটি অ্যাডমিনদের দ্বারা যাচাই করা হবে।"
          )}
        </p>
      </div>

      <AchievementComposer
        scope="author"
        initialCategories={categories}
        backHref="/profile/achievements"
      />
    </div>
  )
}
