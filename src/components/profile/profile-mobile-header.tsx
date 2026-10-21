"use client"

import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useLanguage } from "@/components/language-provider"
import { getActiveNavItem } from "./profile-nav-config"
import type { Role as RoleType } from "@/generated/prisma/enums"

export function ProfileMobileHeader({ roles: _roles }: { roles: RoleType[] }) {
  const pathname = usePathname()
  const { t } = useLanguage()

  // On the root /profile page, the mobile list of tabs is already shown
  if (pathname === "/profile") {
    return null
  }

  const activeItem = getActiveNavItem(pathname)

  // Determine back destination
  let backHref = "/profile"
  let backLabel = t("Profile", "প্রোফাইল")

  if (pathname.startsWith("/profile/achievements/") && pathname !== "/profile/achievements") {
    backHref = "/profile/achievements"
    backLabel = t("Achievements", "অর্জনসমূহ")
  } else if (pathname.startsWith("/profile/write/") && pathname !== "/profile/write") {
    backHref = "/profile/posts"
    backLabel = t("My Posts", "আমার পোস্ট")
  }

  const Icon = activeItem?.icon

  return (
    <div className="md:hidden mb-4 pb-3 border-b border-border/60">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 -ml-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 active:scale-95 transition-all"
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
