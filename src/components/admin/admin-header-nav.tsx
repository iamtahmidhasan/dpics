"use client"

import {
  Award,
  Calendar,
  ChevronLeft,
  FileCode,
  GraduationCap,
  History,
  IdCard,
  Mail,
  Settings,
  Shield,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useLanguage } from "@/components/language-provider"
import { EMAIL_NAV_ITEMS } from "@/components/admin/email/admin-emails-nav-config"
import { SETTINGS_NAV_ITEMS } from "@/components/admin/settings/admin-settings-nav-config"
import { SECTION_CONFIG } from "@/components/admin/user-detail/admin-user-nav-config"
import { getActiveAdminNavItem } from "./admin-nav-config"

export function AdminHeaderNav({ isSuperAdmin }: { isSuperAdmin?: boolean }) {
  const pathname = usePathname()
  const { t } = useLanguage()

  // Desktop Brand Component (Always shown on md and larger)
  const desktopBrand = (
    <div className="hidden md:flex items-center gap-3">
      <Link
        href="/admin"
        className="flex flex-col leading-tight hover:opacity-85 transition-opacity"
      >
        <span className="text-sm font-bold tracking-tight">
          {t("Admin Panel", "অ্যাডমিন প্যানেল")}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {t("DPI Computing Society", "ডিপিআই কম্পিউটিং সোসাইটি")}
        </span>
      </Link>
    </div>
  )

  // Mobile Brand (When on the root /admin page)
  if (pathname === "/admin") {
    return (
      <>
        {desktopBrand}
        <div className="flex md:hidden items-center gap-3">
          <Link
            href="/admin"
            className="flex flex-col leading-tight hover:opacity-85 transition-opacity"
          >
            <span className="text-sm font-bold tracking-tight">
              {t("Admin Panel", "অ্যাডমিন প্যানেল")}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {t("DPI Computing Society", "ডিপিআই কম্পিউটিং সোসাইটি")}
            </span>
          </Link>
        </div>
      </>
    )
  }

  // Determine back navigation for mobile screens
  const segments = pathname.split("/").filter(Boolean) // e.g. ['admin', 'users', '123', 'account']
  let backHref = "/admin"
  let backLabel = t("Admin Hub", "অ্যাডমিন হাব")
  let currentTitle = t("Admin", "অ্যাডমিন")
  let Icon: LucideIcon = Shield

  // 1. Email Center & subpages
  if (pathname.startsWith("/admin/emails")) {
    if (pathname === "/admin/emails") {
      backHref = "/admin"
      backLabel = t("Admin Hub", "অ্যাডমিন হাব")
      currentTitle = t("Emails", "ইমেইল")
      Icon = Mail
    } else {
      const emailItem = EMAIL_NAV_ITEMS.find((item) => item.href === pathname)
      backHref = "/admin/emails"
      backLabel = t("Emails", "ইমেইল")
      currentTitle = emailItem ? t(emailItem.label.en, emailItem.label.bn) : t("Email Tool", "ইমেইল টুল")
      Icon = emailItem?.icon || Mail
    }
  }
  // 2. Users & user detail subpages
  else if (segments[0] === "admin" && segments[1] === "users") {
    if (segments.length === 2) {
      // /admin/users
      backHref = "/admin"
      backLabel = t("Admin Hub", "অ্যাডমিন হাব")
      currentTitle = t("Users", "ব্যবহারকারী")
      Icon = Users
    } else if (segments.length === 3) {
      // /admin/users/[id] (user detail hub)
      backHref = "/admin/users"
      backLabel = t("Users", "ব্যবহারকারী")
      currentTitle = t("User Details", "ব্যবহারকারীর বিবরণ")
      Icon = UserCog
    } else if (segments.length >= 4) {
      // /admin/users/[id]/[section]
      const userId = segments[2]
      const sectionSlug = segments[3]
      const meta = SECTION_CONFIG.find((s) => s.slug === sectionSlug)
      backHref = `/admin/users/${userId}`
      backLabel = t("User Details", "ব্যবহারকারীর বিবরণ")
      currentTitle = meta ? t(meta.label) : t("Details", "বিবরণ")
      Icon = meta?.icon || UserCog
    }
  }
  // 3. Courses & curriculum
  else if (pathname.startsWith("/admin/courses")) {
    if (pathname === "/admin/courses" || pathname.startsWith("/admin/courses/enrollments")) {
      backHref = "/admin"
      backLabel = t("Admin Hub", "অ্যাডমিন হাব")
      currentTitle = pathname.includes("enrollments")
        ? t("Enrollments", "ভর্তি")
        : t("Courses", "কোর্সসমূহ")
      Icon = GraduationCap
    } else if (pathname.endsWith("/curriculum")) {
      const courseId = segments[2]
      backHref = `/admin/courses/${courseId}`
      backLabel = t("Course Details", "কোর্সের বিবরণ")
      currentTitle = t("Curriculum", "সিলেবাস")
      Icon = GraduationCap
    } else {
      backHref = "/admin/courses"
      backLabel = t("Courses", "কোর্সসমূহ")
      currentTitle = t("Course Details", "কোর্সের বিবরণ")
      Icon = GraduationCap
    }
  }
  // 4. Events
  else if (pathname.startsWith("/admin/events")) {
    if (pathname === "/admin/events") {
      backHref = "/admin"
      backLabel = t("Admin Hub", "অ্যাডমিন হাব")
      currentTitle = t("Events", "ইভেন্টসমূহ")
      Icon = Calendar
    } else {
      backHref = "/admin/events"
      backLabel = t("Events", "ইভেন্টসমূহ")
      currentTitle = t("Event Details", "ইভেন্ট বিবরণ")
      Icon = Calendar
    }
  }
  // 5. Templates
  else if (pathname.startsWith("/admin/templates")) {
    if (pathname === "/admin/templates") {
      backHref = "/admin"
      backLabel = t("Admin Hub", "অ্যাডমিন হাব")
      currentTitle = t("Templates", "টেমপ্লেট")
      Icon = IdCard
    } else {
      backHref = "/admin/templates"
      backLabel = t("Templates", "টেমপ্লেট")
      currentTitle = t("Template Editor", "টেমপ্লেট এডিটর")
      Icon = IdCard
    }
  }
  // 6. Committees
  else if (pathname.startsWith("/admin/committees")) {
    if (pathname === "/admin/committees") {
      backHref = "/admin"
      backLabel = t("Admin Hub", "অ্যাডমিন হাব")
      currentTitle = t("Committees", "কমিটিসমূহ")
      Icon = Award
    } else {
      backHref = "/admin/committees"
      backLabel = t("Committees", "কমিটিসমূহ")
      currentTitle = t("Committee Details", "কমিটি বিবরণ")
      Icon = Award
    }
  }
  // 7. Settings & category subpages
  else if (pathname.startsWith("/admin/settings")) {
    if (pathname === "/admin/settings") {
      backHref = "/admin"
      backLabel = t("Admin Hub", "অ্যাডমিন হাব")
      currentTitle = t("Settings", "সেটিংস")
      Icon = Settings
    } else {
      const settingItem = SETTINGS_NAV_ITEMS.find((item) => item.href === pathname)
      backHref = "/admin/settings"
      backLabel = t("Settings", "সেটিংস")
      currentTitle = settingItem ? t(settingItem.label.en, settingItem.label.bn) : t("Settings", "সেটিংস")
      Icon = settingItem?.icon || Settings
    }
  }
  // 8. General top-level admin modules (overview, activity-logs, etc.)
  else {
    const activeItem = getActiveAdminNavItem(pathname, isSuperAdmin)
    backHref = "/admin"
    backLabel = t("Admin Hub", "অ্যাডমিন হাব")
    currentTitle = activeItem ? t(activeItem.label) : t("Admin", "অ্যাডমিন")
    Icon = activeItem?.icon || Shield
  }

  return (
    <>
      {desktopBrand}

      {/* Mobile App-Style Header Navigation Bar (< md) */}
      <div className="flex md:hidden items-center gap-2 min-w-0 flex-1">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 -ml-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 active:scale-95 transition-all shrink-0"
        >
          <ChevronLeft className="size-4" />
          <span className="truncate max-w-[100px] sm:max-w-[140px]">{backLabel}</span>
        </Link>
      </div>
    </>
  )
}
