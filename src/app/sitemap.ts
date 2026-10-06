import type { MetadataRoute } from "next"

import { listPublishedAchievements } from "@/lib/services/achievement.service"
import { CourseService } from "@/lib/services/course.service"
import { listPublishedEvents } from "@/lib/services/event.service"
import { listPublishedPosts } from "@/lib/services/post.service"
import { postPath, SITE_URL } from "@/lib/site"

/**
 * Every indexable static route. The dynamic collections (posts, events,
 * achievements, courses) are appended below from their published listings so
 * detail pages actually appear in the sitemap.
 */
const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/posts", changeFrequency: "daily", priority: 0.9 },
  { path: "/events", changeFrequency: "daily", priority: 0.9 },
  { path: "/courses", changeFrequency: "weekly", priority: 0.9 },
  { path: "/achievements", changeFrequency: "weekly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/instructors", changeFrequency: "monthly", priority: 0.8 },
  { path: "/members", changeFrequency: "monthly", priority: 0.8 },
  { path: "/committee", changeFrequency: "monthly", priority: 0.7 },
  { path: "/resources", changeFrequency: "weekly", priority: 0.7 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.4 },
]

/** Upper bound per collection; services clamp to their own max page size. */
const COLLECTION_PAGE_SIZE = 200

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Each collection is fetched independently and tolerated on failure: one
  // failing service must not take the whole sitemap down.
  const [posts, events, achievements, courses] = await Promise.all([
    listPublishedPosts({ page: 1, pageSize: COLLECTION_PAGE_SIZE }).catch(() => null),
    listPublishedEvents({ page: 1, pageSize: COLLECTION_PAGE_SIZE }).catch(() => null),
    listPublishedAchievements({ page: 1, pageSize: COLLECTION_PAGE_SIZE }).catch(() => null),
    CourseService.listCourses({ isPublished: true }).catch(() => null),
  ])

  return [
    ...STATIC_PATHS.map((entry) => ({
      url: new URL(entry.path, SITE_URL).toString(),
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
    ...(posts?.posts ?? []).map((post) => ({
      url: new URL(postPath(post.slug), SITE_URL).toString(),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: post.isFeatured ? 0.8 : 0.6,
    })),
    ...(events?.events ?? []).map((event) => ({
      url: new URL(`/events/${encodeURIComponent(event.slug)}`, SITE_URL).toString(),
      lastModified: new Date(event.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...(achievements?.achievements ?? []).map((achievement) => ({
      url: new URL(`/achievements/${encodeURIComponent(achievement.slug)}`, SITE_URL).toString(),
      lastModified: new Date(achievement.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...(courses ?? []).map((course) => ({
      url: new URL(`/courses/${encodeURIComponent(course.slug)}`, SITE_URL).toString(),
      changeFrequency: "monthly" as const,
      priority: course.featured ? 0.8 : 0.6,
    })),
  ]
}
