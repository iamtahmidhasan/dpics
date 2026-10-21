import type { Metadata } from "next"

import { AdminSettingsMobileNav } from "@/components/admin/settings/admin-settings-mobile-nav"
import { AdminSignupsTab } from "@/components/admin/settings/admin-signups-tab"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"

export const metadata: Metadata = {
  title: "Settings",
}

export default async function AdminSettingsPage() {
  const lang = await getLang()
  const t = makeT(lang)

  return (
    <div className="space-y-4">
      {/* Mobile Title & Description (< md) */}
      <div className="md:hidden space-y-1">
        <h1 className="font-heading text-lg font-semibold">{t("Settings", "সেটিংস")}</h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Configure signup availability, member & instructor ID sequences, and reusable payments.",
            "নিবন্ধন প্রাপ্যতা, সদস্য ও শিক্ষক আইডি ক্রম এবং পুনঃব্যবহারযোগ্য পেমেন্ট নির্ধারণ করুন।"
          )}
        </p>
      </div>

      {/* Mobile Categories Hub (< md) */}
      <AdminSettingsMobileNav />

      {/* Desktop Default View (>= md): Signups Tab */}
      <div className="hidden md:block">
        <AdminSignupsTab />
      </div>
    </div>
  )
}
