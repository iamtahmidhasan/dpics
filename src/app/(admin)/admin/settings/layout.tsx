import type { Metadata } from "next"

import { AdminSettingsTabs } from "@/components/admin/settings/admin-settings-tabs"
import { AdminSettingsProvider } from "@/components/admin/settings/admin-settings-context"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { getBatchMemberStats } from "@/lib/services/member-id.service"
import { getInstructorStats } from "@/lib/services/instructor-id.service"
import { getSettings } from "@/lib/services/settings.service"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Settings",
}

export default async function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  const [lang, settings, batchStats, instructorStats] = await Promise.all([
    getLang(),
    getSettings(),
    getBatchMemberStats(),
    getInstructorStats(),
  ])
  const t = makeT(lang)

  return (
    <AdminSettingsProvider
      initialSettings={settings}
      initialStats={batchStats}
      initialInstructorStats={instructorStats}
    >
      <div className="space-y-4">
        {/* Desktop Header (>= md) */}
        <div className="hidden md:block space-y-1">
          <h1 className="font-heading text-lg font-semibold">{t("Settings", "সেটিংস")}</h1>
          <p className="text-xs/relaxed text-muted-foreground">
            {t(
              "Configure signup availability, member & instructor ID sequences, and reusable payments.",
              "নিবন্ধন প্রাপ্যতা, সদস্য ও শিক্ষক আইডি ক্রম এবং পুনঃব্যবহারযোগ্য পেমেন্ট নির্ধারণ করুন।"
            )}
          </p>
        </div>

        {/* Desktop Horizontal Tabs (>= md) */}
        <AdminSettingsTabs />

        {/* Subpage or mobile index content */}
        <div>{children}</div>
      </div>
    </AdminSettingsProvider>
  )
}
