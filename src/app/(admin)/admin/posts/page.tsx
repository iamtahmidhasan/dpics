import type { Metadata } from "next"

import { AdminPostsTable } from "@/components/admin/admin-posts-table"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { postFiltersFromParams } from "@/lib/post-params"
import { requireAdmin } from "@/lib/session"
import { getPostCounts, listPostsForAdmin } from "@/lib/services/post.service"

export const metadata: Metadata = {
  title: "Posts",
}

export default async function AdminPostsPage({ searchParams }: PageProps<"/admin/posts">) {
  const params = await searchParams
  const [lang] = await Promise.all([getLang()])
  const t = makeT(lang)

  await requireAdmin()

  const [page, counts] = await Promise.all([
    listPostsForAdmin(postFiltersFromParams(params)),
    getPostCounts(),
  ])

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">{t("Posts", "পোস্ট")}</h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Review submissions, publish drafts, and archive old posts.",
            "জমাদান পর্যালোচনা করুন, খসড়া প্রকাশ করুন এবং পুরোনো পোস্ট আর্কাইভ করুন।"
          )}
        </p>
      </div>

      <AdminPostsTable initialData={{ ...page, counts }} />
    </div>
  )
}
