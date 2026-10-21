import type { Metadata } from "next"

import { AdminMobileNav } from "@/components/admin/admin-mobile-nav"
import { AdminOverviewContent } from "@/components/admin/admin-overview-content"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { getUserCounts } from "@/lib/services/user.service"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Overview",
}

export default async function AdminOverviewPage() {
  const [session, counts, lang] = await Promise.all([
    requireAdmin(),
    getUserCounts(),
    getLang(),
  ])
  const t = makeT(lang)
  const isSuperAdmin = session.user.roles?.includes("SUPER_ADMIN")

  return (
    <>
      {/* Mobile view (< md): App-style modules list */}
      <div className="block md:hidden">
        <AdminMobileNav
          user={session.user}
          counts={counts}
          isSuperAdmin={isSuperAdmin}
        />
      </div>

      {/* Desktop view (>= md): Overview dashboard directly */}
      <div className="hidden md:block">
        <AdminOverviewContent counts={counts} t={t} />
      </div>
    </>
  )
}
