import type { Metadata } from "next"

import { AboutView } from "@/components/about/about-view"
import prisma from "@/lib/prisma"
import { getActiveCommitteeForAbout } from "@/lib/services/committee.service"
import { EventStatus, PostStatus } from "@/generated/prisma/enums"
import { SITE_NAME, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: `About Us | ${SITE_NAME}`,
  description:
    "Discover the mission, history, technical wings, executive leadership, and student membership of Dhaka Polytechnic Institute Computing Society (DPICS).",
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: `About Us | ${SITE_NAME}`,
    description:
      "Discover the mission, history, technical wings, executive leadership, and student membership of Dhaka Polytechnic Institute Computing Society (DPICS).",
    url: `${SITE_URL}/about`,
    type: "website",
  },
}

export default async function AboutPage() {
  const [membersCount, eventsCount, coursesCount, achievementsCount, committeeData] = await Promise.all([
    prisma.user.count(),
    prisma.event.count({ where: { status: { not: EventStatus.DRAFT } } }),
    prisma.course.count({ where: { isPublished: true } }),
    prisma.achievement.count({ where: { status: PostStatus.PUBLISHED } }),
    getActiveCommitteeForAbout(),
  ])

  return (
    <div className="w-full">
      <AboutView
        stats={{
          membersCount,
          eventsCount,
          coursesCount,
          achievementsCount,
        }}
        committee={committeeData}
      />
    </div>
  )
}
