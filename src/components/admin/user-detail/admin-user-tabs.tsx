"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"
import { SECTION_CONFIG } from "./admin-user-nav-config"
import { useAdminUser } from "./admin-user-context"

export function AdminUserTabs() {
  const { t } = useLanguage()
  const pathname = usePathname()
  const { user } = useAdminUser()

  return (
    <nav aria-label={t("User sections", "ব্যবহারকারী বিভাগ")} className="hidden md:block border-b border-border">
      <ul className="-mb-px flex gap-1 overflow-x-auto scrollbar-none">
        {SECTION_CONFIG.map((item) => {
          const itemHref = `/admin/users/${user.id}/${item.slug}`
          const isOverviewMatch =
            item.id === "overview" &&
            (pathname === `/admin/users/${user.id}` || pathname === `/admin/users/${user.id}/overview`)
          const isActive = isOverviewMatch || pathname === itemHref
          const Icon = item.icon

          return (
            <li key={item.id} className="shrink-0">
              <Link
                href={itemHref}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs/relaxed font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "border-primary text-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                <span>{t(item.label)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
