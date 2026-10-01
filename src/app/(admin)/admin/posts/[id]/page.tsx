import { ExternalLink } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PostComposer } from "@/components/posts/post-composer"
import { PostReviewActions } from "@/components/posts/post-review-actions"
import { Badge } from "@/components/ui/badge"
import { PostStatus } from "@/generated/prisma/enums"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { postStatusBadgeVariant, postStatusLabel } from "@/lib/post-labels"
import { requireAdmin } from "@/lib/session"
import { getPostDetailForAdmin } from "@/lib/services/post.service"

export const metadata: Metadata = {
  title: "Edit post",
}

export default async function AdminPostEditPage({ params }: PageProps<"/admin/posts/[id]">) {
  const { id } = await params
  const [lang] = await Promise.all([getLang()])
  const t = makeT(lang)

  await requireAdmin()

  let post: Awaited<ReturnType<typeof getPostDetailForAdmin>>

  try {
    post = await getPostDetailForAdmin(id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h1 className="font-heading text-lg font-semibold">{post.title}</h1>
          <p className="text-muted-foreground text-xs/relaxed">
            {t("By", "লেখক")}{" "}
            <span className="text-foreground font-medium">{post.author.name}</span>
            <span className="mx-1">·</span>
            {post.author.email}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant={postStatusBadgeVariant(post.status)}>
            {postStatusLabel(t)(post.status)}
          </Badge>

          {post.status === PostStatus.PUBLISHED ? (
            <a
              href={`/posts/${post.slug}`}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
            >
              {t("View live", "লাইভ দেখুন")}
              <ExternalLink className="size-3" />
            </a>
          ) : null}
        </div>
      </div>

      <PostReviewActions postId={post.id} status={post.status} />

      {post.rejectionReason && post.status === PostStatus.REJECTED ? (
        <p className="text-muted-foreground text-xs">
          {t("Last rejection reason", "সর্বশেষ ফেরত দেওয়ার কারণ")}: {post.rejectionReason}
        </p>
      ) : null}

      <PostComposer
        scope="admin"
        postId={post.id}
        status={post.status}
        backHref="/admin/posts"
        initialValues={{
          title: post.title,
          titleBn: post.titleBn ?? "",
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          excerptBn: post.excerptBn ?? "",
          content: post.content,
          contentBn: post.contentBn ?? "",
          coverImage: post.coverImage ?? "",
          ogImage: post.ogImage ?? "",
          category: post.category,
          categoryId: post.categoryId ?? post.category?.id ?? null,
          tags: post.tags,
          seoTitle: post.seoTitle ?? "",
          seoDescription: post.seoDescription ?? "",
          isFeatured: post.isFeatured,
        }}
      />
    </div>
  )
}
