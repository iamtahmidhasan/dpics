import type { Metadata } from "next"

import { AdminAchievementsTable } from "@/components/admin/admin-achievements-table"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { achievementFiltersFromParams } from "@/lib/achievement-params"
import { requireAdmin } from "@/lib/session"
import {
  getAchievementCounts,
  listAchievementsForAdmin,
} from "@/lib/services/achievement.service"

export const metadata: Metadata = {
  title: "Achievements",
}

export default async function AdminAchievementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const [lang] = await Promise.all([getLang(), requireAdmin()])
  const t = makeT(lang)

  const filters = achievementFiltersFromParams(params)
  const [page, counts] = await Promise.all([
    listAchievementsForAdmin(filters),
    getAchievementCounts(),
  ])

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">
          {t("Achievements", "অর্জনসমূহ")}
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Review submissions from members and instructors, approve awards, or publish society milestones.",
            "সদস্য ও শিক্ষকদের জমাদান পর্যালোচনা করুন, পুরস্কার অনুমোদন করুন অথবা নতুন মাইলফলক প্রকাশ করুন।"
          )}
        </p>
      </div>

      <AdminAchievementsTable initialData={{ ...page, counts }} />
    </div>
  )
}
