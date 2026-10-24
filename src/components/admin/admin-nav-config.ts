import {
  Award,
  Calendar,
  CreditCard,
  FileText,
  FolderGit2,
  FolderTree,
  GraduationCap,
  History,
  Image as ImageIcon,
  Mail,
  QrCode,
  Settings,
  Shield,
  Ticket,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react"

export type AdminNavCategory = "management" | "organization" | "content" | "system"

export type AdminNavItem = {
  key: string
  href: string // Desktop sidebar href
  mobileHref: string // Mobile navigation href
  label: { en: string; bn: string }
  description: { en: string; bn: string }
  icon: LucideIcon
  superAdminOnly?: boolean
  badgeColor: {
    bg: string
    text: string
  }
  category: AdminNavCategory
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    key: "overview",
    href: "/admin",
    mobileHref: "/admin/overview",
    label: { en: "Overview", bn: "ওভারভিউ" },
    description: {
      en: "Platform statistics, metrics & system summary",
      bn: "প্ল্যাটফর্ম পরিসংখ্যান, মেট্রিক্স ও সিস্টেম সারসংক্ষেপ",
    },
    icon: Shield,
    badgeColor: {
      bg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
      text: "text-blue-600 dark:text-blue-400",
    },
    category: "management",
  },
  {
    key: "users",
    href: "/admin/users",
    mobileHref: "/admin/users",
    label: { en: "Users", bn: "ব্যবহারকারী" },
    description: {
      en: "Search, verify & manage user accounts",
      bn: "অ্যাকাউন্ট অনুসন্ধান, ভেরিফিকেশন ও ব্যবস্থাপনা",
    },
    icon: Users,
    badgeColor: {
      bg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    category: "management",
  },
  {
    key: "events",
    href: "/admin/events",
    mobileHref: "/admin/events",
    label: { en: "Events", bn: "ইভেন্টসমূহ" },
    description: {
      en: "Workshops, seminars & contests",
      bn: "ওয়ার্কশপ, সেমিনার ও প্রতিযোগিতা",
    },
    icon: Calendar,
    badgeColor: {
      bg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
      text: "text-purple-600 dark:text-purple-400",
    },
    category: "management",
  },
  {
    key: "tickets",
    href: "/admin/tickets",
    mobileHref: "/admin/tickets",
    label: { en: "Tickets", bn: "টিকেটসমূহ" },
    description: {
      en: "Event passes, check-in status & attendance verification",
      bn: "ইভেন্ট পাস, চেক-ইন স্ট্যাটাস ও উপস্থিতি যাচাই",
    },
    icon: Ticket,
    badgeColor: {
      bg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    category: "management",
  },
  {
    key: "scanner",
    href: "/scanner",
    mobileHref: "/scanner",
    label: { en: "Live Scanner", bn: "লাইভ স্ক্যানার" },
    description: {
      en: "Gatekeeper high-speed QR ticket scanner & attendee check-in",
      bn: "গেটকিপার দ্রুত কিউআর টিকেট স্ক্যানার ও উপস্থিতি চেক-ইন",
    },
    icon: QrCode,
    badgeColor: {
      bg: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400",
      text: "text-teal-600 dark:text-teal-400",
    },
    category: "management",
  },
  {
    key: "courses",
    href: "/admin/courses",
    mobileHref: "/admin/courses",
    label: { en: "Courses", bn: "কোর্সসমূহ" },
    description: {
      en: "Curriculum, lessons & syllabus",
      bn: "পাঠ্যক্রম, লেসন ও সিলেবাস",
    },
    icon: GraduationCap,
    badgeColor: {
      bg: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
      text: "text-indigo-600 dark:text-indigo-400",
    },
    category: "management",
  },
  {
    key: "enrollments",
    href: "/admin/courses/enrollments",
    mobileHref: "/admin/courses/enrollments",
    label: { en: "Enrollments", bn: "এনরোলমেন্ট" },
    description: {
      en: "Student course enrollments & payments",
      bn: "শিক্ষার্থীদের কোর্স ভর্তি ও পেমেন্ট",
    },
    icon: CreditCard,
    badgeColor: {
      bg: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400",
      text: "text-teal-600 dark:text-teal-400",
    },
    category: "management",
  },
  {
    key: "committees",
    href: "/admin/committees",
    mobileHref: "/admin/committees",
    label: { en: "Committees", bn: "কমিটিসমূহ" },
    description: {
      en: "Executive bodies, panels & designations",
      bn: "কার্যনির্বাহী কমিটি, প্যানেল ও পদবি",
    },
    icon: Award,
    badgeColor: {
      bg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
      text: "text-amber-600 dark:text-amber-400",
    },
    category: "organization",
  },
  {
    key: "achievements",
    href: "/admin/achievements",
    mobileHref: "/admin/achievements",
    label: { en: "Achievements", bn: "অর্জনসমূহ" },
    description: {
      en: "Awards, hackathons & recognition review",
      bn: "পুরস্কার, হ্যাকাথন ও অর্জন পর্যালোচনা",
    },
    icon: Trophy,
    badgeColor: {
      bg: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400",
      text: "text-yellow-600 dark:text-yellow-400",
    },
    category: "organization",
  },
  {
    key: "posts",
    href: "/admin/posts",
    mobileHref: "/admin/posts",
    label: { en: "Posts", bn: "পোস্ট" },
    description: {
      en: "Review, approve & publish articles",
      bn: "আর্টিকেল পর্যালোচনা ও প্রকাশনা",
    },
    icon: FileText,
    badgeColor: {
      bg: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
      text: "text-sky-600 dark:text-sky-400",
    },
    category: "content",
  },
  {
    key: "projects",
    href: "/admin/projects",
    mobileHref: "/admin/projects",
    label: { en: "Projects", bn: "প্রজেক্টসমূহ" },
    description: {
      en: "Review & curate student project portfolios",
      bn: "শিক্ষার্থীদের প্রজেক্ট পর্যালোচনা ও প্রদর্শন",
    },
    icon: FolderGit2,
    badgeColor: {
      bg: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400",
      text: "text-teal-600 dark:text-teal-400",
    },
    category: "content",
  },
  {
    key: "category",
    href: "/admin/category",
    mobileHref: "/admin/category",
    label: { en: "Categories", bn: "ক্যাটাগরি" },
    description: {
      en: "Content taxonomy & classification tags",
      bn: "কন্টেন্ট শ্রেণীবিন্যাস ও ট্যাগ",
    },
    icon: FolderTree,
    badgeColor: {
      bg: "bg-pink-500/10 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400",
      text: "text-pink-600 dark:text-pink-400",
    },
    category: "content",
  },
  {
    key: "media",
    href: "/admin/media",
    mobileHref: "/admin/media",
    label: { en: "Media", bn: "মিডিয়া" },
    description: {
      en: "Image library & media assets",
      bn: "ছবি গ্যালারি ও মিডিয়া সম্পদ",
    },
    icon: ImageIcon,
    badgeColor: {
      bg: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
      text: "text-violet-600 dark:text-violet-400",
    },
    category: "content",
  },
  {
    key: "templates",
    href: "/admin/templates",
    mobileHref: "/admin/templates",
    label: { en: "Templates", bn: "টেমপ্লেট" },
    description: {
      en: "Member ID cards & certificates designer",
      bn: "সদস্য আইডি কার্ড ও সনদপত্র ডিজাইন",
    },
    icon: FolderTree,
    badgeColor: {
      bg: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
      text: "text-rose-600 dark:text-rose-400",
    },
    category: "content",
  },
  {
    key: "emails",
    href: "/admin/emails",
    mobileHref: "/admin/emails",
    label: { en: "Emails", bn: "ইমেইল" },
    description: {
      en: "Campaign broadcasts, logs & email templates",
      bn: "ইমেইল ক্যাম্পেইন, লগ ও টেমপ্লেট",
    },
    icon: Mail,
    badgeColor: {
      bg: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400",
      text: "text-cyan-600 dark:text-cyan-400",
    },
    category: "system",
  },
  {
    key: "settings",
    href: "/admin/settings",
    mobileHref: "/admin/settings",
    label: { en: "Settings", bn: "সেটিংস" },
    description: {
      en: "Society platform configuration & options",
      bn: "প্ল্যাটফর্ম সেটিংস ও কনফিগারেশন",
    },
    icon: Settings,
    badgeColor: {
      bg: "bg-slate-500/10 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
      text: "text-slate-600 dark:text-slate-400",
    },
    category: "system",
  },
  {
    key: "activity-logs",
    href: "/admin/activity-logs",
    mobileHref: "/admin/activity-logs",
    label: { en: "Activity Logs", bn: "অ্যাক্টিভিটি লগ" },
    description: {
      en: "Audit trail, security events & user actions",
      bn: "অডিট ট্রেইল, নিরাপত্তা ইভেন্ট ও অ্যাকশন",
    },
    icon: History,
    superAdminOnly: true,
    badgeColor: {
      bg: "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400",
      text: "text-red-600 dark:text-red-400",
    },
    category: "system",
  },
]

export function getFilteredAdminNavItems(isSuperAdmin?: boolean): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => !item.superAdminOnly || isSuperAdmin)
}

export function isAdminNavItemActive(item: AdminNavItem, pathname: string): boolean {
  if (item.href === "/admin") {
    return pathname === "/admin" || pathname === "/admin/overview"
  }
  if (item.href === "/admin/courses") {
    return (
      pathname === "/admin/courses" ||
      (pathname.startsWith("/admin/courses/") &&
        !pathname.startsWith("/admin/courses/enrollments"))
    )
  }
  return pathname.startsWith(item.href)
}

export function getActiveAdminNavItem(
  pathname: string,
  isSuperAdmin?: boolean
): AdminNavItem | undefined {
  if (pathname === "/admin" || pathname === "/admin/overview") {
    return ADMIN_NAV_ITEMS.find((item) => item.key === "overview")
  }
  const items = getFilteredAdminNavItems(isSuperAdmin)
  // Sort descending by href length so /admin/courses/enrollments matches before /admin/courses
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length)
  return sorted.find((item) => item.href !== "/admin" && pathname.startsWith(item.href))
}
