import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { PostComposer } from "@/components/posts/post-composer"
import { PostStatus } from "@/generated/prisma/enums"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { isAdmin } from "@/lib/roles"
import { requirePostWriter } from "@/lib/session"
import { getMyPost } from "@/lib/services/post.service"

export const metadata: Metadata = {
  title: "Edit post",
}

export default async function EditPostPage({ params }: PageProps<"/profile/write/[id]">) {
  const { id } = await params
  const [session, lang] = await Promise.all([requirePostWriter(), getLang()])
  const t = makeT(lang)
  const actor = { userId: session.user.id, isAdmin: isAdmin(session.user) }

  let post: Awaited<ReturnType<typeof getMyPost>>

  try {
    post = await getMyPost(id, actor)
  } catch {
    notFound()
  }

  // Admins may always edit; everybody else is locked out of approved posts.
  const locked = !actor.isAdmin && (post.status === PostStatus.PUBLISHED || post.status === PostStatus.ARCHIVED)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">
          {locked ? t("Post locked", "পোস্ট লক করা") : t("Edit post", "পোস্ট সম্পাদনা")}
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {locked
            ? t(
                "This post is already approved, so it is read-only.",
                "এই পোস্টটি ইতিমধ্যে অনুমোদিত, তাই এটি কেবল পড়ার জন্য।"
              )
            : t(
                "Update the post, then send it for review again.",
                "পোস্টটি হালনাগাদ করে আবার পর্যালোচনায় পাঠান।"
              )}
        </p>
      </div>

      <PostComposer
        scope="author"
        postId={post.id}
        status={post.status}
        rejectionReason={post.rejectionReason}
        locked={locked}
        backHref="/profile/posts"
        initialValues={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          content: post.content,
          coverImage: post.coverImage ?? "",
          ogImage: post.ogImage ?? "",
          category: post.category,
          tags: post.tags,
          seoTitle: post.seoTitle ?? "",
          seoDescription: post.seoDescription ?? "",
        }}
      />
    </div>
  )
}
