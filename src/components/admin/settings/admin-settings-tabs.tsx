"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"
import { SETTINGS_NAV_ITEMS } from "./admin-settings-nav-config"
import { useAdminSettings } from "./admin-settings-context"

export function AdminSettingsTabs() {
  const { t } = useLanguage()
  const pathname = usePathname()
  const { memberPreviewPrefix, instructorPrefixPreview } = useAdminSettings()

  return (
    <div className="hidden md:block border-b border-border">
      <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-px scrollbar-none" aria-label="Settings Tabs">
        {SETTINGS_NAV_ITEMS.map((tab) => {
          const Icon = tab.icon
          const isActive =
            pathname === tab.href || (pathname === "/admin/settings" && tab.id === "signups")

          let badge = undefined
          if (tab.id === "member-id") badge = memberPreviewPrefix
          if (tab.id === "instructor-id") badge = instructorPrefixPreview
          if (tab.id === "payments") badge = t("Shared", "শেয়ার্ড")
          if (tab.id === "database-backup") badge = t("Backup", "ব্যাকআপ")

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap outline-none",
                isActive
                  ? "border-primary text-primary font-semibold bg-primary/5 rounded-t-md"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className={cn("size-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span>{t(tab.label.en, tab.label.bn)}</span>
              {badge ? (
                <span
                  className={cn(
                    "text-[10px] font-mono px-1.5 py-0.2 rounded font-normal",
                    isActive
                      ? "bg-primary/15 text-primary font-medium"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
