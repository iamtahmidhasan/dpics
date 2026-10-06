import type { Metadata } from "next"

import { ProfileView } from "@/components/profile/profile-view"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { getProfile } from "@/lib/services/profile.service"
import { requireUser } from "@/lib/session"

export const metadata: Metadata = { title: "Profile | DPI Computing Society" }

export default async function ProfilePage() {
  const [session, lang] = await Promise.all([requireUser(), getLang()])
  const profile = await getProfile(session.user.id)
  const t = makeT(lang)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">
          {t("General", "সাধারণ")}
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Update your details and check what the society has recorded for you.",
            "আপনার তথ্য হালনাগাদ করুন এবং সমিতি আপনার জন্য যা রেকর্ড করেছে তা দেখুন।"
          )}
        </p>
      </div>

      <ProfileView initialData={profile} section="general" />
    </div>
  )
}
