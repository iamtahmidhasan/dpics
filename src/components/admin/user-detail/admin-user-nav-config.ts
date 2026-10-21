import {
  Award,
  BadgeCheck,
  FileText,
  FolderGit2,
  FolderTree,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  Trophy,
  UserCog,
  Wrench,
  type LucideIcon,
} from "lucide-react"

export const SECTIONS = [
  "overview",
  "account",
  "member",
  "instructor",
  "committee",
  "achievements",
  "projects",
  "posts",
  "courses",
  "templates",
  "media",
] as const

export type Section = (typeof SECTIONS)[number]

export type SectionMeta = {
  id: Section
  slug: string
  label: { en: string; bn: string }
  description: { en: string; bn: string }
  icon: LucideIcon
  colorClass: {
    bg: string
    text: string
  }
}

export const SECTION_CONFIG: SectionMeta[] = [
  {
    id: "overview",
    slug: "overview",
    label: { en: "Overview", bn: "ওভারভিউ" },
    description: {
      en: "Profile summary, roles, badges & account status",
      bn: "প্রোফাইল সারসংক্ষেপ, ভূমিকা, ব্যাজ ও অ্যাকাউন্টের অবস্থা",
    },
    icon: LayoutDashboard,
    colorClass: {
      bg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
      text: "text-blue-600 dark:text-blue-400",
    },
  },
  {
    id: "account",
    slug: "account",
    label: { en: "Account Details", bn: "অ্যাকাউন্ট বিবরণ" },
    description: {
      en: "Personal details, phone, bio, address & security",
      bn: "ব্যক্তিগত তথ্য, ফোন, পরিচিতি, ঠিকানা ও নিরাপত্তা",
    },
    icon: UserCog,
    colorClass: {
      bg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
      text: "text-purple-600 dark:text-purple-400",
    },
  },
  {
    id: "member",
    slug: "member",
    label: { en: "Membership", bn: "সদস্যপদ" },
    description: {
      en: "Department, session, semester & verification",
      bn: "বিভাগ, সেশন, পর্ব ও সদস্যপদ যাচাইকরণ",
    },
    icon: BadgeCheck,
    colorClass: {
      bg: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400",
      text: "text-teal-600 dark:text-teal-400",
    },
  },
  {
    id: "instructor",
    slug: "instructor",
    label: { en: "Instructor Profile", bn: "শিক্ষক প্রোফাইল" },
    description: {
      en: "Instructor ID, teaching status & credentials",
      bn: "শিক্ষক আইডি, স্ট্যাটাস ও তথ্য",
    },
    icon: Wrench,
    colorClass: {
      bg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
      text: "text-amber-600 dark:text-amber-400",
    },
  },
  {
    id: "committee",
    slug: "committee",
    label: { en: "Committee Roles", bn: "কমিটি ভূমিকা" },
    description: {
      en: "Designations & committee assignments",
      bn: "পদবি ও কার্যনির্বাহী কমিটি সংযুক্তি",
    },
    icon: Award,
    colorClass: {
      bg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
      text: "text-emerald-600 dark:text-emerald-400",
    },
  },
  {
    id: "achievements",
    slug: "achievements",
    label: { en: "Achievements", bn: "অর্জনসমূহ" },
    description: {
      en: "Awards, hackathons & contest ranking",
      bn: "পুরস্কার, হ্যাকাথন ও সম্মাননা",
    },
    icon: Trophy,
    colorClass: {
      bg: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400",
      text: "text-yellow-600 dark:text-yellow-400",
    },
  },
  {
    id: "projects",
    slug: "projects",
    label: { en: "Projects", bn: "প্রজেক্টসমূহ" },
    description: {
      en: "Student showcase projects, hardware & software repositories",
      bn: "প্রজেক্ট প্রদর্শনী, হার্ডওয়্যার ও সফটওয়্যার রিপোজিটরি",
    },
    icon: FolderGit2,
    colorClass: {
      bg: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400",
      text: "text-cyan-600 dark:text-cyan-400",
    },
  },
  {
    id: "posts",
    slug: "posts",
    label: { en: "Posts & Articles", bn: "পোস্ট ও আর্টিকেল" },
    description: {
      en: "Articles authored, drafts & publications",
      bn: "রচিত আর্টিকেল, ড্রাফট ও প্রকাশনা",
    },
    icon: FileText,
    colorClass: {
      bg: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
      text: "text-sky-600 dark:text-sky-400",
    },
  },
  {
    id: "courses",
    slug: "courses",
    label: { en: "Enrolled Courses", bn: "কোর্সসমূহ" },
    description: {
      en: "Course enrollments, payment & lesson progress",
      bn: "কোর্স ভর্তি, পেমেন্ট ও শেখার অগ্রগতি",
    },
    icon: GraduationCap,
    colorClass: {
      bg: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
      text: "text-indigo-600 dark:text-indigo-400",
    },
  },
  {
    id: "templates",
    slug: "templates",
    label: { en: "Cards & Templates", bn: "কার্ড ও টেমপ্লেট" },
    description: {
      en: "Assigned ID card & certificate templates",
      bn: "নির্ধারিত আইডি কার্ড ও সনদপত্র টেমপ্লেট",
    },
    icon: IdCard,
    colorClass: {
      bg: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
      text: "text-rose-600 dark:text-rose-400",
    },
  },
  {
    id: "media",
    slug: "media",
    label: { en: "Media & Documents", bn: "মিডিয়া ও ডকুমেন্টস" },
    description: {
      en: "Uploaded student ID card, NID & document assets",
      bn: "আপলোডকৃত স্টুডেন্ট আইডি, এনআইডি ও ডকুমেন্ট ফাইল",
    },
    icon: FolderTree,
    colorClass: {
      bg: "bg-pink-500/10 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400",
      text: "text-pink-600 dark:text-pink-400",
    },
  },
]
