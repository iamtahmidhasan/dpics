import type { LocalizedText } from "@/lib/i18n"

export type NavLink = {
  label: LocalizedText
  href: string
  description?: LocalizedText
  image?: string
}

export type NavColumn = {
  title?: LocalizedText
  links: NavLink[]
}

export type NavItem = {
  label: LocalizedText
  href: string
  columns: NavColumn[]
}

export type MobileNavItem = {
  label: LocalizedText
  href: string
  children: { label: LocalizedText; href: string }[]
}

export type SocialLink = {
  platform: string
  url: string
}

export const SITE = {
  title: "DPI Computing Society",
  tagline: {
    en: "Learn, build, and grow together",
    bn: "শিখুন, তৈরি করুন, একসাথে এগিয়ে যান",
  } satisfies LocalizedText,
  description: {
    en: "A student-led computing community where we learn, build, and grow together through workshops, events, and collaboration.",
    bn: "একটি শিক্ষার্থী-পরিচালিত কম্পিউটিং কমিউনিটি, যেখানে ওয়ার্কশপ, ইভেন্ট ও সহযোগিতার মাধ্যমে আমরা শিখি, তৈরি করি এবং একসাথে এগিয়ে যাই।",
  } satisfies LocalizedText,
  logo: "/dpicslogo.png",
}

export const CONTACT = {
  email: "info@dpics.edu.bd",
  address: "Daffodil Polytechnic Institute, Dhanmondi, Dhaka",
}

export const BANNER = {
  text: {
    en: "Registration is starting now!",
    bn: "রেজিস্ট্রেশন শুরু হয়ে গেছে!",
  } satisfies LocalizedText,
  href: "/about",
  links: [
    { label: { en: "Events", bn: "ইভেন্ট" }, href: "/events" },
    { label: { en: "Join", bn: "যোগদান" }, href: "/sign-up" },
  ],
}

export const SOCIAL_LINKS: SocialLink[] = []

export const INVOLVE_LINKS: NavLink[] = [
  {
    label: { en: "Join the Society", bn: "সোসাইটিতে যোগ দিন" },
    href: "/sign-up",
  },
  {
    label: { en: "Membership", bn: "সদস্যপদ" },
    href: "/about#membership",
  },
  {
    label: { en: "Member Sign in", bn: "সদস্য লগইন" },
    href: "/sign-in",
  },
  {
    label: { en: "Dashboard", bn: "ড্যাশবোর্ড" },
    href: "/dashboard",
  },
]

export const NAV_ITEMS: NavItem[] = [
  {
    label: { en: "Home", bn: "হোম" },
    href: "/",
    columns: [],
  },
  {
    label: { en: "About", bn: "পরিচিতি" },
    href: "/about",
    columns: [
      {
        title: { en: "The Society", bn: "সংগঠন" },
        links: [
          {
            label: { en: "Who We Are", bn: "আমরা কারা" },
            href: "/about",
            description: {
              en: "Our mission, vision and story",
              bn: "আমাদের লক্ষ্য, দৃষ্টিভঙ্গি ও গল্প",
            },
          },
          {
            label: { en: "Our Team", bn: "আমাদের টিম" },
            href: "/about#team",
            description: {
              en: "Meet the executive panel",
              bn: "কার্যনির্বাহী কমিটির সাথে পরিচিত হন",
            },
          },
          {
            label: { en: "Membership", bn: "সদস্যপদ" },
            href: "/about#membership",
            description: {
              en: "How to join the society",
              bn: "সোসাইটিতে যোগদানের নিয়ম",
            },
          },
        ],
      },
      {
        title: { en: "Get Involved", bn: "যুক্ত হোন" },
        links: [
          {
            label: { en: "Join Us", bn: "যোগ দিন" },
            href: "/sign-up",
            description: {
              en: "Create your member account",
              bn: "আপনার সদস্য অ্যাকাউন্ট তৈরি করুন",
            },
          },
          {
            label: { en: "Contact", bn: "যোগাযোগ" },
            href: "/contact",
            description: {
              en: "Reach the society",
              bn: "সোসাইটির সাথে যোগাযোগ করুন",
            },
          },
        ],
      },
    ],
  },
  {
    label: { en: "Events", bn: "ইভেন্ট" },
    href: "/events",
    columns: [
      {
        title: { en: "What We Run", bn: "আমাদের আয়োজন" },
        links: [
          {
            label: { en: "Upcoming Events", bn: "আসন্ন ইভেন্ট" },
            href: "/events",
            description: {
              en: "Workshops, sessions and contests",
              bn: "ওয়ার্কশপ, সেশন ও প্রতিযোগিতা",
            },
          },
          {
            label: { en: "Past Events", bn: "অতীতের ইভেন্ট" },
            href: "/events#past",
            description: {
              en: "Recap of what we have hosted",
              bn: "আমাদের আয়োজিত কার্যক্রমের সারসংক্ষেপ",
            },
          },
          {
            label: { en: "Competitions", bn: "প্রতিযোগিতা" },
            href: "/events#competitions",
            description: {
              en: "Inter-department programming contests",
              bn: "বিভাগীয় প্রোগ্রামিং প্রতিযোগিতা",
            },
          },
        ],
      },
    ],
  },
  {
    label: { en: "Committee", bn: "কমিটি" },
    href: "/committee",
    columns: [
      {
        title: { en: "Committees", bn: "কমিটিসমূহ" },
        links: [
          {
            label: { en: "Executive", bn: "কার্যনির্বাহী" },
            href: "/committee#executive",
            description: {
              en: "Leadership and coordination",
              bn: "নেতৃত্ব ও সমন্বয়",
            },
          },
          {
            label: { en: "Technical", bn: "টেকনিক্যাল" },
            href: "/committee#technical",
            description: {
              en: "Workshops and technical sessions",
              bn: "ওয়ার্কশপ ও টেকনিক্যাল সেশন",
            },
          },
          {
            label: { en: "Events", bn: "ইভেন্ট" },
            href: "/committee#events",
            description: {
              en: "Event planning and logistics",
              bn: "ইভেন্ট পরিকল্পনা ও ব্যবস্থাপনা",
            },
          },
          {
            label: { en: "Outreach", bn: "প্রচার" },
            href: "/committee#outreach",
            description: {
              en: "Campus and community engagement",
              bn: "ক্যাম্পাস ও কমিউনিটি সংগঠন",
            },
          },
        ],
      },
    ],
  },
  {
    label: { en: "Resources", bn: "রিসোর্স" },
    href: "/resources",
    columns: [
      {
        title: { en: "Learning", bn: "শেখা" },
        links: [
          {
            label: { en: "Roadmaps", bn: "রোডম্যাপ" },
            href: "/resources#roadmaps",
            description: {
              en: "Curated learning paths",
              bn: "বাছাই করা শেখার পথ",
            },
          },
          {
            label: { en: "Notes & Slides", bn: "নোট ও স্লাইড" },
            href: "/resources#notes",
            description: {
              en: "Materials from past sessions",
              bn: "অতীতের সেশনের উপকরণ",
            },
          },
          {
            label: { en: "Problem Sets", bn: "প্রব্লেম সেট" },
            href: "/resources#problems",
            description: {
              en: "Practice and contests archive",
              bn: "অনুশীলনী ও প্রতিযোগিতার ভাণ্ডার",
            },
          },
        ],
      },
    ],
  },
  {
    label: { en: "Contact", bn: "যোগাযোগ" },
    href: "/contact",
    columns: [],
  },
]

export const MOBILE_ITEMS: MobileNavItem[] = NAV_ITEMS.map(
  ({ label, href, columns }) => ({
    label,
    href,
    children: columns.flatMap((col) =>
      col.links.map((link) => ({ label: link.label, href: link.href }))
    ),
  })
)

export const FOOTER = {
  exploreHeading: { en: "Explore", bn: "ঘুরে দেখুন" } satisfies LocalizedText,
  involveHeading: { en: "Get Involved", bn: "যুক্ত হোন" } satisfies LocalizedText,
  contactHeading: { en: "Contact", bn: "যোগাযোগ" } satisfies LocalizedText,
  rights: {
    en: "All rights reserved.",
    bn: "সর্বস্বত্ব সংরক্ষিত।",
  } satisfies LocalizedText,
  bottomLine: {
    en: "Learn, build, and grow together.",
    bn: "শিখুন, তৈরি করুন, একসাথে এগিয়ে যান।",
  } satisfies LocalizedText,
}
