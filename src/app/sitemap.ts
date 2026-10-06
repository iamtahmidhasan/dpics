import type { MetadataRoute } from "next"

import { listPublishedPosts } from "@/lib/services/post.service"
import { postPath, SITE_URL } from "@/lib/site"

/**
 * Only the top published page is walked: the list endpoint is paginated and
 * pulling every slug at build time would make a busy blog slow to render.
 */
const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/posts", changeFrequency: "daily", priority: 0.9 },
  { path: "/events", changeFrequency: "daily", priority: 0.9 },
  { path: "/achievements", changeFrequency: "weekly", priority: 0.8 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await listPublishedPosts({ page: 1, pageSize: 200 })

  return [
    ...STATIC_PATHS.map((entry) => ({
      url: new URL(entry.path, SITE_URL).toString(),
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
    ...posts.posts.map((post) => ({
      url: new URL(postPath(post.slug), SITE_URL).toString(),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: post.isFeatured ? 0.8 : 0.6,
    })),
  ]
}
