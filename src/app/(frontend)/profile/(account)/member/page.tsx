import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { ProfileView } from "@/components/profile/profile-view"
import { Role } from "@/generated/prisma/enums"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { getProfile } from "@/lib/services/profile.service"
import { hasRole, requireUser } from "@/lib/session"

export const metadata: Metadata = { title: "Member details" }

export default async function ProfileMemberPage() {
  const [session, lang] = await Promise.all([requireUser(), getLang()])

  if (!hasRole(session.user, Role.MEMBER)) redirect("/profile")

  const profile = await getProfile(session.user.id)
  const t = makeT(lang)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">
          {t("Member details", "সদস্যের বিবরণ")}
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "The information the society keeps about your membership.",
            "আপনার সদস্যপদ সম্পর্কে সমিতি যে তথ্য রাখে।"
          )}
        </p>
      </div>

      <ProfileView initialData={profile} section="member" />
    </div>
  )
}
