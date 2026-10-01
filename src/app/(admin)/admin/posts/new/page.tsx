import type { Metadata } from "next"

import { PostComposer } from "@/components/posts/post-composer"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "New post",
}

export default async function NewAdminPostPage() {
  const [lang] = await Promise.all([getLang()])
  const t = makeT(lang)

  await requireAdmin()

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">{t("New post", "নতুন পোস্ট")}</h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Admin posts are published straight away and do not go through review.",
            "অ্যাডমিনের পোস্ট সরাসরি প্রকাশিত হয়, পর্যালোচনার প্রয়োজন নেই।"
          )}
        </p>
      </div>

      <PostComposer scope="admin" backHref="/admin/posts" />
    </div>
  )
}
