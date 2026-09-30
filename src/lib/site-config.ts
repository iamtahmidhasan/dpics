export type NavLink = {
  label: string
  href: string
  description?: string
  image?: string
}

export type NavColumn = {
  title?: string
  links: NavLink[]
}

export type NavItem = {
  label: string
  href: string
  columns: NavColumn[]
}

export type MobileNavItem = {
  label: string
  href: string
  children: { label: string; href: string }[]
}

export type SocialLink = {
  platform: string
  url: string
}

export const SITE = {
  title: "DPI Computing Society",
  tagline: "Learn, build, and grow together",
  description:
    "A student-led computing community where we learn, build, and grow together through workshops, events, and collaboration.",
  logo: "/dpicslogo.png",
}

export const CONTACT = {
  email: "info@dpics.org",
  address: "Dhaka Government Polytechnic Institute",
}

export const BANNER = {
  text: "Registration is starting now!",
  href: "/about",
  links: [
    { label: "Events", href: "/events" },
    { label: "Join", href: "/sign-up" },
  ],
}

export const SOCIAL_LINKS: SocialLink[] = []

export const INVOLVE_LINKS: NavLink[] = [
  { label: "Join the Society", href: "/sign-up" },
  { label: "Membership", href: "/about#membership" },
  { label: "Member Sign in", href: "/sign-in" },
  { label: "Dashboard", href: "/dashboard" },
]

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", columns: [] },
  {
    label: "About",
    href: "/about",
    columns: [
      {
        title: "The Society",
        links: [
          {
            label: "Who We Are",
            href: "/about",
            description: "Our mission, vision and story",
          },
          {
            label: "Our Team",
            href: "/about#team",
            description: "Meet the executive panel",
          },
          {
            label: "Membership",
            href: "/about#membership",
            description: "How to join the society",
          },
        ],
      },
      {
        title: "Get Involved",
        links: [
          {
            label: "Join Us",
            href: "/sign-up",
            description: "Create your member account",
          },
          {
            label: "Contact",
            href: "/contact",
            description: "Reach the society",
          },
        ],
      },
    ],
  },
  {
    label: "Events",
    href: "/events",
    columns: [
      {
        title: "What We Run",
        links: [
          {
            label: "Upcoming Events",
            href: "/events",
            description: "Workshops, sessions and contests",
          },
          {
            label: "Past Events",
            href: "/events#past",
            description: "Recap of what we have hosted",
          },
          {
            label: "Competitions",
            href: "/events#competitions",
            description: "Inter-department programming contests",
          },
        ],
      },
    ],
  },
  {
    label: "Committee",
    href: "/committee",
    columns: [
      {
        title: "Committees",
        links: [
          {
            label: "Executive",
            href: "/committee#executive",
            description: "Leadership and coordination",
          },
          {
            label: "Technical",
            href: "/committee#technical",
            description: "Workshops and technical sessions",
          },
          {
            label: "Events",
            href: "/committee#events",
            description: "Event planning and logistics",
          },
          {
            label: "Outreach",
            href: "/committee#outreach",
            description: "Campus and community engagement",
          },
        ],
      },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    columns: [
      {
        title: "Learning",
        links: [
          {
            label: "Roadmaps",
            href: "/resources#roadmaps",
            description: "Curated learning paths",
          },
          {
            label: "Notes & Slides",
            href: "/resources#notes",
            description: "Materials from past sessions",
          },
          {
            label: "Problem Sets",
            href: "/resources#problems",
            description: "Practice and contests archive",
          },
        ],
      },
    ],
  },
  { label: "Contact", href: "/contact", columns: [] },
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
