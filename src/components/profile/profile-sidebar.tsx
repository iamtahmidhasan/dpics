"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"
import type { Role as RoleType } from "@/generated/prisma/enums"
import { getFilteredNavItems, isNavItemActive } from "./profile-nav-config"

export function ProfileSidebar({ roles }: { roles: RoleType[] }) {
  const pathname = usePathname()
  const { t } = useLanguage()

  const items = getFilteredNavItems(roles)

  return (
    <nav
      aria-label={t("Profile navigation", "প্রোফাইল নেভিগেশন")}
      className="hidden md:block md:w-56 md:shrink-0"
    >
      <div className="sticky top-20 space-y-1">
        <p className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {t("Profile & Settings", "প্রোফাইল ও সেটিংস")}
        </p>

        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = isNavItemActive(item, pathname)

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
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
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
