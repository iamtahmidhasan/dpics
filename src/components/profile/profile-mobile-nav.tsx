"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronRight, ExternalLink, ShieldCheck, Sparkles, UserCheck } from "lucide-react"

import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Role, type Role as RoleType } from "@/generated/prisma/enums"
import { departmentLabel, semesterLabel } from "@/lib/profile-labels"
import type { Profile } from "@/lib/services/profile.service"
import { getFilteredNavItems, type ProfileNavCategory, type ProfileNavItem } from "./profile-nav-config"

const CATEGORY_TITLES: Record<ProfileNavCategory, { en: string; bn: string }> = {
  account: { en: "Account & Profile", bn: "অ্যাকাউন্ট ও প্রোফাইল" },
  society: { en: "Society & Membership", bn: "সমিতি ও সদস্যপদ" },
  content: { en: "Contributions & Posts", bn: "কন্টেন্ট ও অবদান" },
}

export function ProfileMobileNav({
  profile,
  roles,
}: {
  profile: Profile
  roles: RoleType[]
}) {
  const { t } = useLanguage()

  const items = getFilteredNavItems(roles)

  const initials = (profile.name || profile.email || "U")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const isMember = roles.includes(Role.MEMBER) && profile.member
  const isInstructor = roles.includes(Role.INSTRUCTOR)
  const isAdmin = roles.includes(Role.ADMIN) || roles.includes(Role.SUPER_ADMIN)
  const isSuperAdmin = roles.includes(Role.SUPER_ADMIN)

  // Group items by category
  const categories: ProfileNavCategory[] = ["account", "society", "content"]
  const groupedItems = categories
    .map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="space-y-6 pb-8">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card/95 to-muted/20 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          {/* Avatar with Ring */}
          <div className="relative size-14 shrink-0 rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-background overflow-hidden bg-muted">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt={profile.name || profile.email}
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

          {/* User Basic Info */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="font-heading text-base font-bold text-foreground truncate">
                {profile.name || t("Anonymous User", "নামবিহীন ব্যবহারকারী")}
              </h1>

              {isMember && profile.member?.verificationStatus === "VERIFIED" && (
                <span title={t("Verified Member", "ভেরিফাইড সদস্য")}>
                  <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>

            {/* Badges row */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {isSuperAdmin && (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4.5">
                  {t("Super Admin", "সুপার অ্যাডমিন")}
                </Badge>
              )}
              {!isSuperAdmin && isAdmin && (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4.5">
                  {t("Admin", "অ্যাডমিন")}
                </Badge>
              )}
              {isMember && (
                <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4.5">
                  {t("Member", "সদস্য")}
                </Badge>
              )}
              {isInstructor && (
                <Badge variant="warning" className="text-[10px] px-1.5 py-0 h-4.5">
                  {t("Instructor", "শিক্ষক")}
                </Badge>
              )}
            </div>

            {/* Academic pill for members */}
            {isMember && profile.member && (
              <p className="text-[11px] text-muted-foreground/90 pt-0.5 truncate">
                {departmentLabel(t)(profile.member.department)}
              </p>
            )}
          </div>
        </div>

        {/* Action Row */}
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
          <Link
            href={`/profile/${profile.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-full transition-colors"
          >
            <UserCheck className="size-3.5" />
            <span>{t("View Public Profile", "পাবলিক প্রোফাইল দেখুন")}</span>
            <ExternalLink className="size-3 opacity-70" />
          </Link>

          <span className="text-[11px] text-muted-foreground font-mono">
            {profile.committeeRoles.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Sparkles className="size-3 text-amber-500" />
                {profile.committeeRoles[0].roleName}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Tabs List Sections */}
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
