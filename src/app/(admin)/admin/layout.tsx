import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { SignOutButton } from "@/components/admin/sign-out-button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
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

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight">
                {t("Admin Panel", "অ্যাডমিন প্যানেল")}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {t("DPI Computing Society", "ডিপিআই কম্পিউটিং সোসাইটি")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden max-w-40 truncate text-xs text-muted-foreground sm:inline">
              {user.name || user.email}
            </span>
            <ThemeSwitcher className="size-8" />
            {/* <LanguageSwitcher /> */}
            <Link
              href="/"
              className="rounded-md border border-border px-2 py-1 text-xs/relaxed transition-colors hover:bg-muted"
            >
              {t("View site", "সাইট দেখুন")}
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:px-8">
        <AdminSidebar isSuperAdmin={session.user.roles?.includes("SUPER_ADMIN")} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
