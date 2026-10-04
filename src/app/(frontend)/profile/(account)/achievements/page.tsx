import { Plus, Trophy } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { achievementFiltersFromParams } from "@/lib/achievement-params"
import { requireAchievementCreator } from "@/lib/session"
import { getAchievementCounts, getMyAchievements } from "@/lib/services/achievement.service"
import { ProfileAchievementsList } from "./profile-achievements-list"

export const metadata: Metadata = {
  title: "My achievements",
}

export default async function MyAchievementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const [session, lang] = await Promise.all([requireAchievementCreator(), getLang()])
  const t = makeT(lang)
  const filters = achievementFiltersFromParams(params)

  const [page, counts] = await Promise.all([
    getMyAchievements(session.user.id, filters),
    getAchievementCounts(session.user.id),
  ])

  // Attach logged-in author metadata
  const rows = page.achievements.map((item) => ({
    ...item,
    author: {
      id: session.user.id,
      name: session.user.name,
      avatar: Array.isArray(session.user.image) ? session.user.image[0] ?? null : (session.user.image as string) ?? null,
    },
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-primary" />
            <h1 className="font-heading text-xl font-bold tracking-tight">
              {t("My Achievements", "আমার অর্জনসমূহ")}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              "Showcase your awards, hackathons, certifications, and contest rankings.",
              "আপনার পুরস্কার, হ্যাকাথন, সার্টিফিকেশন এবং প্রতিযোগিতার র‍্যাংকিং প্রদর্শন করুন।"
            )}
          </p>
        </div>

        <Link
          href="/profile/achievements/add"
          className={buttonVariants({ size: "sm" })}
        >
          <Plus className="size-3.5" />
          {t("Add achievement", "অর্জন যোগ করুন")}
        </Link>
      </div>

      <ProfileAchievementsList
        initialData={{ ...page, achievements: rows }}
        counts={counts}
        filters={filters}
        lang={lang}
      />
    </div>
  )
}
