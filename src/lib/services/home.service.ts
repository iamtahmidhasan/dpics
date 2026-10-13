import "server-only"

import prisma from "@/lib/prisma"
import { resolveUserImage, normalizeImageList } from "@/lib/user-image"
import { getPublicProfileSlug } from "@/lib/services/public-profile.service"
import { MembershipStatus } from "@/generated/prisma/enums"

export type HeroStats = {
  activeMembers: number
  totalCommunity: number
  batchesCount: number
  batches: string[]
  eventsCount: number
  postsCount: number
  achievementsCount: number
}

export type HeroRecentMember = {
  id: string
  name: string
  avatar: string | null
  slug: string
  session: string | null
  department: string | null
}

export type HeroHighlight = {
  type: "EVENT" | "POST"
  title: string
  slug: string
  categoryName: string | null
  publishedAt: string | null
  href: string
}

export type HomeHeroData = {
  stats: HeroStats
  recentMembers: HeroRecentMember[]
  highlight: HeroHighlight | null
  activeDepartments: string[]
}

export async function getHomeHeroData(): Promise<HomeHeroData> {
  try {
    const [
      activeMembersCount,
      totalCommunityCount,
      sessionsGroup,
      eventsCount,
      postsCount,
      achievementsCount,
      recentUsers,
      upcomingEvent,
      latestPost,
      departmentsGroup,
    ] = await Promise.all([
      prisma.member.count({
        where: { status: MembershipStatus.ACTIVE },
      }),
      prisma.user.count({
        where: { isActive: true },
      }),
      prisma.member.groupBy({
        by: ["session"],
        where: {
          session: { not: "" },
        },
      }),
      prisma.event.count({
        where: {
          status: { in: ["UPCOMING", "ONGOING", "COMPLETED"] },
        },
      }),
      prisma.post.count({
        where: { status: "PUBLISHED" },
      }),
      prisma.achievement.count({
        where: { status: "PUBLISHED" },
      }),
      prisma.user.findMany({
        where: {
          isActive: true,
          member: { is: { status: MembershipStatus.ACTIVE } },
        },
        orderBy: [
          { member: { joinedAt: "desc" } },
          { createdAt: "desc" },
        ],
        take: 6,
        select: {
          id: true,
          name: true,
          image: true,
          selactedImg: true,
          member: {
            select: {
              id: true,
              studentId: true,
              session: true,
              department: true,
            },
          },
          instructor: {
            select: {
              instructorId: true,
            },
          },
        },
      }),
      prisma.event.findFirst({
        where: {
          status: { in: ["UPCOMING", "ONGOING"] },
        },
        orderBy: { startDate: "asc" },
        select: {
          title: true,
          slug: true,
          category: { select: { name: true } },
          startDate: true,
        },
      }),
      prisma.post.findFirst({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        select: {
          title: true,
          slug: true,
          category: { select: { name: true } },
          publishedAt: true,
        },
      }),
      prisma.member.groupBy({
        by: ["department"],
      }),
    ])

    const recentMembers: HeroRecentMember[] = recentUsers.map((u) => {
      const { avatar } = resolveUserImage(
        normalizeImageList(u.image),
        u.selactedImg
      )

      const slug = getPublicProfileSlug({
        studentId: u.member?.studentId,
        instructorId: u.instructor?.instructorId,
        userId: u.id,
      })

      return {
        id: u.id,
        name: u.name,
        avatar,
        slug,
        session: u.member?.session ?? null,
        department: u.member?.department ?? null,
      }
    })

    const sessions = sessionsGroup
      .map((s) => s.session)
      .filter((s): s is string => Boolean(s && s.trim()))

    const activeDepartments = departmentsGroup
      .map((d) => d.department)
      .filter(Boolean)

    let highlight: HeroHighlight | null = null
    if (upcomingEvent) {
      highlight = {
        type: "EVENT",
        title: upcomingEvent.title,
        slug: upcomingEvent.slug,
        categoryName: upcomingEvent.category?.name ?? null,
        publishedAt: upcomingEvent.startDate?.toISOString() ?? null,
        href: `/events/${upcomingEvent.slug}`,
      }
    } else if (latestPost) {
      highlight = {
        type: "POST",
        title: latestPost.title,
        slug: latestPost.slug,
        categoryName: latestPost.category?.name ?? null,
        publishedAt: latestPost.publishedAt?.toISOString() ?? null,
        href: `/posts/${latestPost.slug}`,
      }
    }

    return {
      stats: {
        activeMembers: activeMembersCount,
        totalCommunity: totalCommunityCount,
        batchesCount: sessions.length,
        batches: sessions,
        eventsCount,
        postsCount,
        achievementsCount,
      },
      recentMembers,
      highlight,
      activeDepartments,
    }
  } catch (err) {
    console.error("Failed to fetch home hero data:", err)
    return {
      stats: {
        activeMembers: 0,
        totalCommunity: 0,
        batchesCount: 0,
        batches: [],
        eventsCount: 0,
        postsCount: 0,
        achievementsCount: 0,
      },
      recentMembers: [],
      highlight: null,
      activeDepartments: [],
    }
  }
}
