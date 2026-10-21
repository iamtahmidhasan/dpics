"use client"

import { ChevronRight } from "lucide-react"
import Link from "next/link"

import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"
import { EMAIL_NAV_ITEMS } from "./admin-emails-nav-config"

export function AdminEmailsMobileNav() {
  const { t } = useLanguage()

  return (
    <div className="space-y-2.5 md:hidden pb-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 px-1 pt-1">
        {t("Email Modules & Tools", "ইমেইল মডিউল ও টুলস")}
      </h2>

      <div className="space-y-1.5">
        {EMAIL_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.id}
              href={item.href}
              className="w-full text-left group flex items-center justify-between gap-3.5 p-3 rounded-xl border border-border/60 bg-card hover:bg-accent/40 active:bg-accent/70 active:scale-[0.99] transition-all duration-150 shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                    item.colorClass.bg
                  )}
                >
                  <Icon className="size-4.5" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {t(item.label.en, item.label.bn)}
                  </p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {t(item.description.en, item.description.bn)}
                  </p>
                </div>
              </div>

              <ChevronRight className="size-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
