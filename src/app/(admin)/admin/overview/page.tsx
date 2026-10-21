import type { Metadata } from "next"

import { AdminOverviewContent } from "@/components/admin/admin-overview-content"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { getUserCounts } from "@/lib/services/user.service"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Overview",
}

export default async function AdminOverviewSubpage() {
  const [, counts, lang] = await Promise.all([
    requireAdmin(),
    getUserCounts(),
    getLang(),
  ])
  const t = makeT(lang)

  return <AdminOverviewContent counts={counts} t={t} />
}
