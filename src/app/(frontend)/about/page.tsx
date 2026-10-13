import type { Metadata } from "next"

import { AboutView } from "@/components/about/about-view"
import prisma from "@/lib/prisma"
import { getActiveCommitteeForAbout } from "@/lib/services/committee.service"
import { EventStatus, PostStatus } from "@/generated/prisma/enums"
import { websiteMetadata } from "@/lib/seo"

const DESCRIPTION =
  "Discover the mission, history, technical wings, executive leadership, and student membership of Dhaka Polytechnic Institute Computing Society (DPICS)."

export const metadata: Metadata = websiteMetadata({
  title: "About Us | DPI Computing Society",
  description: DESCRIPTION,
  path: "/about",
})

export default async function AboutPage() {
  const [
    totalUsers,
    activeMembers,
    sessionsGroup,
    eventsCount,
    postsCount,
    coursesCount,
    achievementsCount,
    departmentsGroup,
    committeeData,
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.member.groupBy({
      by: ["session"],
      where: { session: { not: "" } },
    }),
    prisma.event.count({
      where: { status: { in: ["UPCOMING", "ONGOING", "COMPLETED"] } },
    }),
    prisma.post.count({
      where: { status: "PUBLISHED" },
    }),
    prisma.course.count({
      where: { isPublished: true },
    }),
    prisma.achievement.count({
      where: { status: "PUBLISHED" },
    }),
    prisma.member.groupBy({
      by: ["department"],
    }),
    getActiveCommitteeForAbout(),
  ])

  const sessions = sessionsGroup
    .map((s) => s.session)
    .filter((s): s is string => Boolean(s && s.trim()))

  const departments = departmentsGroup
    .map((d) => d.department)
    .filter(Boolean)

  return (
    <div className="w-full">
      <AboutView
        stats={{
          membersCount: totalUsers,
          verifiedMembersCount: activeMembers,
          batchesCount: sessions.length,
          batches: sessions,
          eventsCount,
          postsCount,
          coursesCount,
          achievementsCount,
          departmentsCount: departments.length,
        }}
        committee={committeeData}
      />
    </div>
  )
}
