import { FilePlus2 } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { EmptyState } from "@/components/posts/empty-state"
import { PostCard } from "@/components/posts/post-card"
import { PostPagination } from "@/components/posts/post-pagination"
import { buttonVariants } from "@/components/ui/button"
import { PostStatus } from "@/generated/prisma/enums"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { postFiltersFromParams } from "@/lib/post-params"
import { requirePostWriter } from "@/lib/session"
import { getMyPosts } from "@/lib/services/post.service"
import { normalizeImageList, resolveUserImage } from "@/lib/user-image"
import { cn } from "cn"

export const metadata: Metadata = {
  title: "My posts",
}

export default async function MyPostsPage({ searchParams }: PageProps<"/profile/posts">) {
  const params = await searchParams
  const [session, lang] = await Promise.all([requirePostWriter(), getLang()])
  const t = makeT(lang)
  const filters = postFiltersFromParams(params)
  const page = await getMyPosts(session.user.id, filters)

  // A saved draft has no author relation, so the card needs the current user.
  const rows = page.posts.map((post) => ({
    ...post,
    author: {
      id: session.user.id,
      name: session.user.name,
      // Better Auth hands back a single url, while the schema stores a list.
      avatar: resolveUserImage(
        normalizeImageList(session.user.image),
        session.user.selactedImg ?? null
      ).avatar,
    },
  }))

  const buildHref = (nextPage: number) => {
    const query = new URLSearchParams()

    if (filters.status) query.set("status", filters.status)
    if (filters.category) query.set("category", filters.category)
    if (filters.q) query.set("q", filters.q)
    if (nextPage > 1) query.set("page", String(nextPage))

    const search = query.toString()

    return search ? `/profile/posts?${search}` : "/profile/posts"
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h1 className="font-heading text-lg font-semibold">{t("My posts", "আমার পোস্ট")}</h1>
          <p className="text-xs/relaxed text-muted-foreground">
            {t(
              "Drafts, submissions and anything already published.",
              "খসড়া, জমাদান এবং প্রকাশিত পোস্ট।"
            )}
          </p>
        </div>

        <Link href="/profile/write" className={buttonVariants({ size: "sm" })}>
          <FilePlus2 className="size-3.5" />
          {t("Write post", "পোস্ট লিখুন")}
        </Link>
      </div>

      {rows.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              lang={lang}
              href={`/profile/write/${post.id}`}
              showStatus
              className={cn(post.status === PostStatus.ARCHIVED && "opacity-60")}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t("No posts yet", "এখনও কোনো পোস্ট নেই")}
          description={t(
            "Start a draft, then send it for review when it is ready.",
            "একটি খসড়া শুরু করুন, তারপর প্রস্তুত হলে পর্যালোচনায় পাঠান।"
          )}
          actionHref="/profile/write"
          actionLabel={t("Write your first post", "প্রথম পোস্ট লিখুন")}
        />
      )}

      <PostPagination
        page={page.page}
        totalPages={page.totalPages}
        buildHref={buildHref}
        labels={{
          previous: t("Previous", "আগের"),
          next: t("Next", "পরের"),
          page: (current, total) => t(`Page ${current} of ${total}`, `পৃষ্ঠা ${current} / ${total}`),
        }}
      />
    </div>
  )
}
