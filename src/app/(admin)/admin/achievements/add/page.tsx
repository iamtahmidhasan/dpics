import type { Metadata } from "next"

import { AchievementComposer } from "@/components/achievements/achievement-composer"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "New achievement",
}

export default async function AdminNewAchievementPage() {
  const [lang] = await Promise.all([getLang(), requireAdmin()])
  const t = makeT(lang)

  const categories = await prisma.category.findMany({
    where: { type: "ACHIEVEMENT", isActive: true },
    select: { id: true, name: true, nameBn: true, slug: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">
          {t("Add Achievement", "অর্জন যোগ করুন")}
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Admin achievements can be published immediately or saved as drafts.",
            "অ্যাডমিনদের যুক্ত করা অর্জনসমূহ সরাসরি প্রকাশ করা যায় অথবা খসড়া হিসেবে রাখা যায়।"
          )}
        </p>
      </div>

      <AchievementComposer
        scope="admin"
        initialCategories={categories}
        backHref="/admin/achievements"
      />
    </div>
  )
}
