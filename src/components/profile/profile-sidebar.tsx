"use client"

import { Award, BadgeCheck, FileText, GraduationCap, PenSquare, UserCog, Wrench } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useLanguage } from "@/components/language-provider"
import { ACHIEVEMENT_CREATOR_ROLES, POST_WRITER_ROLES } from "@/lib/roles"
import { cn } from "cn"

import { Role, type Role as RoleType } from "@/generated/prisma/enums"

const NAV_ITEMS: {
  href: string
  label: { en: string; bn: string }
  icon: typeof UserCog
  roles: RoleType[] | null
}[] = [
  {
    href: "/profile",
    label: { en: "General", bn: "সাধারণ" },
    icon: UserCog,
    roles: null,
  },
  {
    href: "/profile/enrolled",
    label: { en: "Enrolled courses", bn: "ভর্তি হওয়া কোর্স" },
    icon: GraduationCap,
    roles: null,
  },
  {
    href: "/profile/member",
    label: { en: "Member details", bn: "সদস্যের বিবরণ" },
    icon: BadgeCheck,
    roles: [Role.MEMBER],
  },
  {
    href: "/profile/instructor",
    label: { en: "Instructor details", bn: "শিক্ষকের বিবরণ" },
    icon: Wrench,
    roles: [Role.INSTRUCTOR],
  },
  {
    href: "/profile/achievements",
    label: { en: "Achievements", bn: "অর্জনসমূহ" },
    icon: Award,
    roles: [...ACHIEVEMENT_CREATOR_ROLES],
  },
  {
    href: "/profile/posts",
    label: { en: "My posts", bn: "আমার পোস্ট" },
    icon: FileText,
    roles: [...POST_WRITER_ROLES],
  },
  {
    href: "/profile/write",
    label: { en: "Write post", bn: "পোস্ট লিখুন" },
    icon: PenSquare,
    roles: [...POST_WRITER_ROLES],
  },
]

export function ProfileSidebar({ roles }: { roles: RoleType[] }) {
  const pathname = usePathname()
  const { t } = useLanguage()

  const items = NAV_ITEMS.filter(
    (item) => item.roles === null || item.roles.some((role) => roles.includes(role))
  )

  return (
    <nav aria-label={t("Profile navigation", "প্রোফাইল নেভিগেশন")} className="md:w-52 md:shrink-0">
      <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible md:sticky md:top-20">
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
