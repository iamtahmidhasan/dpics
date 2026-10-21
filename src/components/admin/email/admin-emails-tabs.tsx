"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"
import { EMAIL_NAV_ITEMS } from "./admin-emails-nav-config"

export function AdminEmailsTabs() {
  const { t } = useLanguage()
  const pathname = usePathname()

  return (
    <div className="hidden md:flex border-b border-border gap-1 overflow-x-auto pb-px scrollbar-none">
      {EMAIL_NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive =
          pathname === item.href || (pathname === "/admin/emails" && item.id === "templates")

        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap",
              isActive
                ? "border-primary text-primary bg-primary/5 rounded-t-lg"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-t-lg"
            )}
          >
            <Icon className="size-4" />
            <span>{t(item.label.en, item.label.bn)}</span>
          </Link>
        )
      })}
    </div>
  )
}
