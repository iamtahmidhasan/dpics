"use client"

import { BadgeCheck, UserCog, Wrench } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"

import { Role, type Role as RoleType } from "@/generated/prisma/enums"

const NAV_ITEMS = [
  {
    href: "/profile" as const,
    label: { en: "General", bn: "সাধারণ" },
    icon: UserCog,
    role: null,
  },
  {
    href: "/profile/member" as const,
    label: { en: "Member details", bn: "সদস্যের বিবরণ" },
    icon: BadgeCheck,
    role: Role.MEMBER,
  },
  {
    href: "/profile/instructor" as const,
    label: { en: "Instructor details", bn: "শিক্ষকের বিবরণ" },
    icon: Wrench,
    role: Role.INSTRUCTOR,
  },
]

export function ProfileSidebar({ roles }: { roles: RoleType[] }) {
  const pathname = usePathname()
  const { t } = useLanguage()

  const items = NAV_ITEMS.filter((item) => item.role === null || roles.includes(item.role))

  return (
    <nav aria-label={t("Profile navigation", "প্রোফাইল নেভিগেশন")} className="md:w-52 md:shrink-0">
      <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/profile" ? pathname === href : pathname.startsWith(href)

          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs/relaxed font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {t(label)}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
