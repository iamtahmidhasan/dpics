import type { Metadata } from "next"
import Link from "next/link"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeaderNav } from "@/components/admin/admin-header-nav"
import { AdminUserMenu } from "@/components/admin/admin-user-menu"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const [session, lang] = await Promise.all([requireAdmin(), getLang()])
  const t = makeT(lang)
  const user = session.user
  const isSuperAdmin = session.user.roles?.includes("SUPER_ADMIN")

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <AdminHeaderNav isSuperAdmin={isSuperAdmin} />

          <div className="flex items-center gap-2 shrink-0">
            <AdminUserMenu user={user} isSuperAdmin={isSuperAdmin} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-8 md:py-6 md:flex-row">
        <AdminSidebar isSuperAdmin={isSuperAdmin} />
        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
