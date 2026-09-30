import type { Metadata } from "next"

import { AdminCommitteeList } from "@/components/admin/admin-committee-list"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { listCommittees } from "@/lib/services/committee.service"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Committees",
}

export default async function AdminCommitteesPage() {
  await requireAdmin()

  const [lang, committees] = await Promise.all([getLang(), listCommittees()])
  const t = makeT(lang)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">{t("Committees", "কমিটিসমূহ")}</h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Manage society committees, executive boards, and member roles.",
            "সমিতির কমিটি, কার্যনির্বাহী পর্ষদ এবং সদস্য পদবি পরিচালনা করুন।"
          )}
        </p>
      </div>

      <AdminCommitteeList initialCommittees={committees} />
    </div>
  )
}
