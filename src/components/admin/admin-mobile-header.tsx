"use client"

import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useLanguage } from "@/components/language-provider"
import { getActiveAdminNavItem } from "./admin-nav-config"

export function AdminMobileHeader({ isSuperAdmin }: { isSuperAdmin?: boolean }) {
  const pathname = usePathname()
  const { t } = useLanguage()

  // On the root /admin page, the mobile list of modules is already shown
  if (pathname === "/admin") {
    return null
  }

  const activeItem = getActiveAdminNavItem(pathname, isSuperAdmin)

  // Determine back destination
  let backHref = "/admin"
  let backLabel = t("Admin Hub", "অ্যাডমিন হাব")

  if (pathname.startsWith("/admin/templates/") && pathname !== "/admin/templates") {
    backHref = "/admin/templates"
    backLabel = t("Templates", "টেমপ্লেট")
  } else if (
    pathname.startsWith("/admin/courses/") &&
    pathname !== "/admin/courses" &&
    !pathname.startsWith("/admin/courses/enrollments")
  ) {
    backHref = "/admin/courses"
    backLabel = t("Courses", "কোর্সসমূহ")
  } else if (pathname.startsWith("/admin/events/") && pathname !== "/admin/events") {
    backHref = "/admin/events"
    backLabel = t("Events", "ইভেন্টসমূহ")
  } else if (pathname.startsWith("/admin/emails/") && pathname !== "/admin/emails") {
    backHref = "/admin/emails"
    backLabel = t("Emails", "ইমেইল")
  }

  const Icon = activeItem?.icon

  return (
    <div className="md:hidden mb-4 pb-3 border-b border-border/60">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={backHref}
          className="inline-flex items-center !pl-0 gap-1.5 -ml-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 active:scale-95 transition-all"
        >
          <ChevronLeft className="size-4" />
          <span>{backLabel}</span>
        </Link>

        {activeItem && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/90">
            {Icon && <Icon className="size-3.5 text-primary" />}
            <span className="truncate max-w-[180px]">{t(activeItem.label)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
