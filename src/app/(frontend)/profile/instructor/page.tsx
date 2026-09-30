import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { ProfileView } from "@/components/profile/profile-view"
import { Role } from "@/generated/prisma/enums"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { getProfile } from "@/lib/services/profile.service"
import { hasRole, requireUser } from "@/lib/session"

export const metadata: Metadata = { title: "Instructor details" }

export default async function ProfileInstructorPage() {
  const [session, lang] = await Promise.all([requireUser(), getLang()])

  if (!hasRole(session.user, Role.INSTRUCTOR)) redirect("/profile")

  const profile = await getProfile(session.user.id)
  const t = makeT(lang)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">
          {t("Instructor details", "শিক্ষকের বিবরণ")}
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "How the society lists you as an instructor.",
            "সমিতি আপনাকে শিক্ষক হিসেবে যেভাবে তালিকাভুক্ত করে।"
          )}
        </p>
      </div>

      <ProfileView initialData={profile} section="instructor" />
    </div>
  )
}
