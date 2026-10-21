import { FileCode, History, Settings, Users, type LucideIcon } from "lucide-react"

export type EmailTabKey = "templates" | "bulk" | "logs" | "settings"

export type EmailNavItem = {
  id: EmailTabKey
  href: string
  label: { en: string; bn: string }
  description: { en: string; bn: string }
  icon: LucideIcon
  colorClass: {
    bg: string
    text: string
  }
}

export const EMAIL_NAV_ITEMS: EmailNavItem[] = [
  {
    id: "templates",
    href: "/admin/emails/templates",
    label: { en: "Email Templates", bn: "ইমেইল টেমপ্লেট" },
    description: {
      en: "Manage and edit dynamic notification triggers",
      bn: "নোটিফিকেশন ও অটোমেটেড ইমেইল টেমপ্লেট সম্পাদনা",
    },
    icon: FileCode,
    colorClass: {
      bg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
      text: "text-blue-600 dark:text-blue-400",
    },
  },
  {
    id: "bulk",
    href: "/admin/emails/bulk",
    label: { en: "Bulk Mailer", bn: "বাল্ক মেইলার" },
    description: {
      en: "Send filtered campaigns to targeted audiences",
      bn: "টার্গেটেড মেম্বারদের কাছে বাল্ক ইমেইল পাঠান",
    },
    icon: Users,
    colorClass: {
      bg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
      text: "text-purple-600 dark:text-purple-400",
    },
  },
  {
    id: "logs",
    href: "/admin/emails/logs",
    label: { en: "Delivery Logs", bn: "ডেলিভারি লগ" },
    description: {
      en: "Audit trail of all sent and failed messages",
      bn: "সকল প্রেরিত ও ব্যর্থ বার্তার অডিট হিস্টোরি",
    },
    icon: History,
    colorClass: {
      bg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
      text: "text-emerald-600 dark:text-emerald-400",
    },
  },
  {
    id: "settings",
    href: "/admin/emails/settings",
    label: { en: "SMTP Settings", bn: "এসএমটিপি সেটিংস" },
    description: {
      en: "Configure Gmail credentials and verify connection",
      bn: "ইমেইল ক্রেডেনশিয়াল ও সংযোগ যাচাইকরণ",
    },
    icon: Settings,
    colorClass: {
      bg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
      text: "text-amber-600 dark:text-amber-400",
    },
  },
]
