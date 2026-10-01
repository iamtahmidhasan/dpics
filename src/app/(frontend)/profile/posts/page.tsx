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
import { getMyPosts, getPostCounts } from "@/lib/services/post.service"
import { normalizeImageList, resolveUserImage } from "@/lib/user-image"
import { cn } from "cn"

export const metadata: Metadata = {
  title: "My posts",
}

const STATUS_TABS: { value: string; label: { en: string; bn: string } }[] = [
  { value: "ALL", label: { en: "All", bn: "সব" } },
  { value: PostStatus.PUBLISHED, label: { en: "Published", bn: "প্রকাশিত" } },
  { value: PostStatus.PENDING, label: { en: "In review", bn: "পর্যালোচনায়" } },
  { value: PostStatus.DRAFT, label: { en: "Drafts", bn: "খসড়া" } },
  { value: PostStatus.REJECTED, label: { en: "Rejected", bn: "ফেরত" } },
  { value: PostStatus.ARCHIVED, label: { en: "Archived", bn: "আর্কাইভ" } },
]

export default async function MyPostsPage({ searchParams }: PageProps<"/profile/posts">) {
  const params = await searchParams
  const [session, lang] = await Promise.all([requirePostWriter(), getLang()])
  const t = makeT(lang)
  const filters = postFiltersFromParams(params)
  const [page, counts] = await Promise.all([
    getMyPosts(session.user.id, filters),
    getPostCounts(session.user.id),
  ])

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

  const buildHref = (nextPage: number, overrides?: { status?: string | null }) => {
    const query = new URLSearchParams()
    const activeStatus = overrides && overrides.status !== undefined ? overrides.status : filters.status

    if (activeStatus && activeStatus !== "ALL") query.set("status", activeStatus)
    if (filters.category) query.set("category", filters.category)
    if (filters.q) query.set("q", filters.q)
    if (nextPage > 1) query.set("page", String(nextPage))

    const search = query.toString()

    return search ? `/profile/posts?${search}` : "/profile/posts"
  }

  const countFor = (val: string) => {
    if (val === "ALL") return counts.total
    return counts[val as PostStatus] ?? 0
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

      <div className="flex flex-wrap items-center gap-1.5 border-b pb-2">
        {STATUS_TABS.map((tab) => {
          const isActive = (!filters.status && tab.value === "ALL") || filters.status === tab.value
          const href = tab.value === "ALL" ? buildHref(1, { status: null }) : buildHref(1, { status: tab.value })

          return (
            <Link
              key={tab.value}
              href={href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>{t(tab.label)}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.625rem] text-muted-foreground font-normal">
                {countFor(tab.value)}
              </span>
            </Link>
          )
        })}
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
