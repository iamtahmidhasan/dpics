"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"
import {
  getFilteredAdminNavItems,
  isAdminNavItemActive,
} from "./admin-nav-config"

export function AdminSidebar({ isSuperAdmin }: { isSuperAdmin?: boolean }) {
  const pathname = usePathname()
  const { t } = useLanguage()

  const items = getFilteredAdminNavItems(isSuperAdmin)

  return (
    <nav
      aria-label={t("Admin navigation", "অ্যাডমিন নেভিগেশন")}
      className="hidden md:block md:w-56 md:shrink-0"
    >
      <div className="sticky top-20 space-y-1">
        <p className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {t("Admin Modules", "অ্যাডমিন মডিউল")}
        </p>

        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = isAdminNavItemActive(item, pathname)

            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs/relaxed font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    )}
                  />
                  <span className="truncate">{t(item.label)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
