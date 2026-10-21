import {
  Award,
  BadgeCheck,
  FileText,
  FolderGit2,
  GraduationCap,
  IdCard,
  Images,
  PenSquare,
  UserCog,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import { Role, type Role as RoleType } from "@/generated/prisma/enums"
import {
  ACHIEVEMENT_CREATOR_ROLES,
  MEDIA_ACCESS_ROLES,
  POST_WRITER_ROLES,
  PROJECT_CREATOR_ROLES,
} from "@/lib/roles"

export type ProfileNavCategory = "account" | "society" | "content"

export type ProfileNavItem = {
  key: string
  href: string // Desktop sidebar href
  mobileHref: string // Mobile destination
  label: { en: string; bn: string }
  description: { en: string; bn: string }
  icon: LucideIcon
  roles: RoleType[] | null
  badgeColor: {
    bg: string
    text: string
  }
  category: ProfileNavCategory
}

export const PROFILE_NAV_ITEMS: ProfileNavItem[] = [
  {
    key: "general",
    href: "/profile",
    mobileHref: "/profile/general",
    label: { en: "General", bn: "সাধারণ" },
    description: {
      en: "Personal details, contact & society records",
      bn: "ব্যক্তিগত তথ্য, যোগাযোগ ও সমিতির রেকর্ড",
    },
    icon: UserCog,
    roles: null,
    badgeColor: {
      bg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
      text: "text-blue-600 dark:text-blue-400",
    },
    category: "account",
  },
  {
    key: "templates",
    href: "/profile/templates",
    mobileHref: "/profile/templates",
    label: { en: "Cards & Certificates", bn: "কার্ড ও সনদ" },
    description: {
      en: "Digital ID cards, credentials & certificates",
      bn: "ডিজিটাল আইডি কার্ড ও ভেরিফাইড সনদপত্র",
    },
    icon: IdCard,
    roles: null,
    badgeColor: {
      bg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
      text: "text-purple-600 dark:text-purple-400",
    },
    category: "account",
  },
  {
    key: "enrolled",
    href: "/profile/enrolled",
    mobileHref: "/profile/enrolled",
    label: { en: "Enrolled Courses", bn: "ভর্তি হওয়া কোর্স" },
    description: {
      en: "Active classes, lessons & course progress",
      bn: "চলমান কোর্সসমূহ ও শেখার অগ্রগতি",
    },
    icon: GraduationCap,
    roles: null,
    badgeColor: {
      bg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    category: "account",
  },
  {
    key: "member",
    href: "/profile/member",
    mobileHref: "/profile/member",
    label: { en: "Member Details", bn: "সদস্যের বিবরণ" },
    description: {
      en: "Board roll, session, semester & member status",
      bn: "বোর্ড রোল, সেশন, পর্ব ও সদস্যপদ স্ট্যাটাস",
    },
    icon: BadgeCheck,
    roles: [Role.MEMBER],
    badgeColor: {
      bg: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400",
      text: "text-teal-600 dark:text-teal-400",
    },
    category: "society",
  },
  {
    key: "instructor",
    href: "/profile/instructor",
    mobileHref: "/profile/instructor",
    label: { en: "Instructor Details", bn: "শিক্ষকের বিবরণ" },
    description: {
      en: "Teaching profile, designation & credentials",
      bn: "শিক্ষক পরিচিতি, পদবি ও সনদ",
    },
    icon: Wrench,
    roles: [Role.INSTRUCTOR],
    badgeColor: {
      bg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
      text: "text-amber-600 dark:text-amber-400",
    },
    category: "society",
  },
  {
    key: "achievements",
    href: "/profile/achievements",
    mobileHref: "/profile/achievements",
    label: { en: "Achievements", bn: "অর্জনসমূহ" },
    description: {
      en: "Showcase awards, hackathons & honors",
      bn: "পুরস্কার ও সম্মাননা পরিচালনা",
    },
    icon: Award,
    roles: [...ACHIEVEMENT_CREATOR_ROLES],
    badgeColor: {
      bg: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400",
      text: "text-yellow-600 dark:text-yellow-400",
    },
    category: "content",
  },
  {
    key: "projects",
    href: "/profile/projects",
    mobileHref: "/profile/projects",
    label: { en: "My Projects", bn: "আমার প্রজেক্ট" },
    description: {
      en: "Showcase student software & hardware projects",
      bn: "শিক্ষার্থীদের তৈরি প্রজেক্ট পোর্টফোলিও",
    },
    icon: FolderGit2,
    roles: [...PROJECT_CREATOR_ROLES],
    badgeColor: {
      bg: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400",
      text: "text-teal-600 dark:text-teal-400",
    },
    category: "content",
  },
  {
    key: "posts",
    href: "/profile/posts",
    mobileHref: "/profile/posts",
    label: { en: "My Posts", bn: "আমার পোস্ট" },
    description: {
      en: "Manage published articles & drafts",
      bn: "প্রকাশিত আর্টিকেল ও ড্রাফটসমূহ",
    },
    icon: FileText,
    roles: [...POST_WRITER_ROLES],
    badgeColor: {
      bg: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
      text: "text-sky-600 dark:text-sky-400",
    },
    category: "content",
  },
  {
    key: "media",
    href: "/profile/media",
    mobileHref: "/profile/media",
    label: { en: "My Uploaded Media", bn: "আপলোডকৃত মিডিয়া" },
    description: {
      en: "View, copy and manage your uploaded images",
      bn: "আপনার আপলোডকৃত ছবি ও মিডিয়া ফাইলসমূহ",
    },
    icon: Images,
    roles: [...MEDIA_ACCESS_ROLES],
    badgeColor: {
      bg: "bg-pink-500/10 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400",
      text: "text-pink-600 dark:text-pink-400",
    },
    category: "content",
  },
]

export function getFilteredNavItems(roles: RoleType[]): ProfileNavItem[] {
  return PROFILE_NAV_ITEMS.filter(
    (item) => item.roles === null || item.roles.some((role) => roles.includes(role))
  )
}

export function isNavItemActive(item: ProfileNavItem, pathname: string): boolean {
  if (item.href === "/profile") {
    return pathname === "/profile" || pathname === "/profile/general"
  }
  return pathname.startsWith(item.href)
}

export function getActiveNavItem(pathname: string): ProfileNavItem | undefined {
  if (pathname === "/profile" || pathname === "/profile/general") {
    return PROFILE_NAV_ITEMS.find((item) => item.key === "general")
  }
  return PROFILE_NAV_ITEMS.find(
    (item) => item.href !== "/profile" && pathname.startsWith(item.href)
  )
}
