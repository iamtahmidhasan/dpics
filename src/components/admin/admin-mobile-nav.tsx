"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react"

import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import type { UserCounts } from "@/lib/services/user.service"
import { normalizeImageList, resolveUserImage } from "@/lib/user-image"
import {
  getFilteredAdminNavItems,
  type AdminNavCategory,
} from "./admin-nav-config"

const CATEGORY_TITLES: Record<AdminNavCategory, { en: string; bn: string }> = {
  management: { en: "Main Management", bn: "মূল ব্যবস্থাপনা" },
  organization: { en: "Society & Organization", bn: "সংগঠন ও পরিষদ" },
  content: { en: "Content & Media", bn: "কন্টেন্ট ও মিডিয়া" },
  system: { en: "System & Communications", bn: "সিস্টেম ও যোগাযোগ" },
}

export function AdminMobileNav({
  user,
  counts,
  isSuperAdmin,
}: {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
    selactedImg?: string | null
  }
  counts: UserCounts
  isSuperAdmin?: boolean
}) {
  const { t } = useLanguage()

  const items = getFilteredAdminNavItems(isSuperAdmin)

  const { avatar } = resolveUserImage(
    normalizeImageList(user.image),
    user.selactedImg ?? null
  )

  const initials = (user.name || user.email || "A")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const categories: AdminNavCategory[] = [
    "management",
    "organization",
    "content",
    "system",
  ]

  const groupedItems = categories
    .map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="space-y-6 pb-8">
      {/* Admin Profile & Summary Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card/95 to-muted/20 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          {/* Avatar with Ring */}
          <div className="relative size-14 shrink-0 rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-background overflow-hidden bg-muted">
            {avatar ? (
              <Image
                src={avatar}
                alt={user.name || user.email}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-primary text-base font-bold text-primary-foreground">
                {initials}
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="font-heading text-base font-bold text-foreground truncate">
                {user.name || t("Administrator", "অ্যাডমিনিস্ট্রেটর")}
              </h1>

              {isSuperAdmin ? (
                <ShieldAlert className="size-4 text-primary shrink-0" />
              ) : (
                <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
              )}
            </div>

            <p className="text-xs text-muted-foreground truncate">{user.email}</p>

            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {isSuperAdmin ? (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4.5">
                  {t("Super Admin", "সুপার অ্যাডমিন")}
                </Badge>
              ) : (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4.5">
                  {t("Admin", "অ্যাডমিন")}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4.5 text-muted-foreground">
                {t("Control Panel", "কন্ট্রোল প্যানেল")}
              </Badge>
            </div>
          </div>
        </div>

      </div>

      {/* Modules List Sections */}
      <div className="space-y-5">
        {groupedItems.map(({ category, items: groupItems }) => (
          <div key={category} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 px-1">
              {t(CATEGORY_TITLES[category])}
            </h2>

            <div className="space-y-1.5">
              {groupItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.key}
                    href={item.mobileHref}
                    className="group flex items-center justify-between gap-3.5 p-3 rounded-xl border border-border/60 bg-card hover:bg-accent/40 active:bg-accent/70 active:scale-[0.99] transition-all duration-150 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${item.badgeColor.bg}`}
                      >
                        <Icon className="size-4.5" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {t(item.label)}
                        </p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {t(item.description)}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="size-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
