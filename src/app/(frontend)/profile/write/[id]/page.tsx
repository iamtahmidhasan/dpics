import { MessageSquare } from "lucide-react"
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

  // Admins may always edit; authors are only locked out of archived posts.
  const locked = !actor.isAdmin && post.status === PostStatus.ARCHIVED

  const heading = locked
    ? t("Post archived", "পোস্ট আর্কাইভ করা")
    : post.status === PostStatus.PUBLISHED
      ? t("Update post", "পোস্ট হালনাগাদ করুন")
      : post.status === PostStatus.UPDATE
        ? t("Update in review", "আপডেট পর্যালোচনায়")
        : t("Edit post", "পোস্ট সম্পাদনা")

  const subtitle = locked
    ? t(
        "This post is archived and can no longer be edited.",
        "এই পোস্টটি আর্কাইভ করা হয়েছে এবং আর সম্পাদনা করা যাবে না।"
      )
    : post.status === PostStatus.PUBLISHED
      ? t(
          "Edit your published post. Submitting changes will send the update for admin approval.",
          "আপনার প্রকাশিত পোস্ট সম্পাদনা করুন। পরিবর্তন জমা দিলে আপডেটটি অ্যাডমিন পর্যালোচনার জন্য পাঠানো হবে।"
        )
      : post.status === PostStatus.UPDATE
        ? t(
            "Your update is currently waiting for admin review.",
            "আপনার আপডেটটি বর্তমানে অ্যাডমিন পর্যালোচনার অপেক্ষায় রয়েছে।"
          )
        : t(
            "Update the post, then send it for review.",
            "পোস্টটি হালনাগাদ করে পর্যালোচনায় পাঠান।"
          )

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">{heading}</h1>
        <p className="text-xs/relaxed text-muted-foreground">{subtitle}</p>
      </div>

      <PostComposer
        scope="author"
        postId={post.id}
        status={post.status}
        massageForAuthor={post.massageForAuthor}
        locked={locked}
        backHref="/profile/posts"
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
        }}
      />
    </div>
  )
}
