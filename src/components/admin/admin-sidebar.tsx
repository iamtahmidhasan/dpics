"use client"

import { Award, CreditCard, FileText, FolderTree, GraduationCap, Settings, Shield, Trophy, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"

const NAV_ITEMS = [
  {
    href: "/admin" as const,
    label: { en: "Overview", bn: "ওভারভিউ" },
    icon: Shield,
  },
  {
    href: "/admin/courses" as const,
    label: { en: "Courses", bn: "কোর্সসমূহ" },
    icon: GraduationCap,
  },
  {
    href: "/admin/courses/enrollments" as const,
    label: { en: "Enrollments", bn: "এনরোলমেন্ট" },
    icon: CreditCard,
  },
  {
    href: "/admin/users" as const,
    label: { en: "Users", bn: "ব্যবহারকারী" },
    icon: Users,
  },
  {
    href: "/admin/committees" as const,
    label: { en: "Committees", bn: "কমিটিসমূহ" },
    icon: Award,
  },
  {
    href: "/admin/achievements" as const,
    label: { en: "Achievements", bn: "অর্জনসমূহ" },
    icon: Trophy,
  },
  {
    href: "/admin/posts" as const,
    label: { en: "Posts", bn: "পোস্ট" },
    icon: FileText,
  },
  {
    href: "/admin/category" as const,
    label: { en: "Categories", bn: "ক্যাটাগরি" },
    icon: FolderTree,
  },
  {
    href: "/admin/settings" as const,
    label: { en: "Settings", bn: "সেটিংস" },
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()

  return (
    <nav
      aria-label={t("Admin navigation", "অ্যাডমিন নেভিগেশন")}
      className="md:w-52 md:shrink-0"
    >
      <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/admin" ? pathname === href : pathname.startsWith(href)

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
