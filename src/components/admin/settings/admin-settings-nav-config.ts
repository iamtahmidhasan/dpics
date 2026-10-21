import { Award, CreditCard, GraduationCap, Users, type LucideIcon } from "lucide-react"

export type SettingsTabKey = "signups" | "member-id" | "instructor-id" | "payments"

export type SettingsNavItem = {
  id: SettingsTabKey
  slug: string
  href: string
  label: { en: string; bn: string }
  description: { en: string; bn: string }
  icon: LucideIcon
  colorClass: {
    bg: string
    text: string
  }
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    id: "signups",
    slug: "signups",
    href: "/admin/settings/signups",
    label: { en: "Signups & Access", bn: "নিবন্ধন ও অ্যাক্সেস" },
    description: {
      en: "Toggle user, member, and instructor signup availability",
      bn: "ব্যবহারকারী, সদস্য এবং শিক্ষক নিবন্ধন সক্রিয় বা নিষ্ক্রিয় করুন",
    },
    icon: Users,
    colorClass: {
      bg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
      text: "text-blue-600 dark:text-blue-400",
    },
  },
  {
    id: "member-id",
    slug: "member-id",
    href: "/admin/settings/member-id",
    label: { en: "Student ID & Batch", bn: "স্টুডেন্ট আইডি ও ব্যাচ" },
    description: {
      en: "Configure prefixes, batch years, and sequence counters",
      bn: "প্রিফিক্স, ব্যাচ বছর এবং ক্রমিক নম্বর কনফিগার করুন",
    },
    icon: GraduationCap,
    colorClass: {
      bg: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400",
      text: "text-teal-600 dark:text-teal-400",
    },
  },
  {
    id: "instructor-id",
    slug: "instructor-id",
    href: "/admin/settings/instructor-id",
    label: { en: "Instructor ID", bn: "শিক্ষক আইডি" },
    description: {
      en: "Instructor identifier numbering and automated generation",
      bn: "শিক্ষক পরিচিতি নম্বর এবং স্বয়ংক্রিয় তৈরি সেটিংস",
    },
    icon: Award,
    colorClass: {
      bg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
      text: "text-purple-600 dark:text-purple-400",
    },
  },
  {
    id: "payments",
    slug: "payments",
    href: "/admin/settings/payments",
    label: { en: "Payments (Reusable)", bn: "পেমেন্টস (পুনঃব্যবহারযোগ্য)" },
    description: {
      en: "Registration fees & society bKash, Nagad, Rocket accounts",
      bn: "নিবন্ধন ফি এবং সমিতির বিকাশ, নগদ ও রকেট অ্যাকাউন্ট",
    },
    icon: CreditCard,
    colorClass: {
      bg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
      text: "text-amber-600 dark:text-amber-400",
    },
  },
]
