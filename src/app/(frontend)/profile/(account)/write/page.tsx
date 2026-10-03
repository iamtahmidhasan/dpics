import type { Metadata } from "next"

import { PostComposer } from "@/components/posts/post-composer"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { requirePostWriter } from "@/lib/session"

export const metadata: Metadata = {
  title: "Write post",
}

export default async function WritePostPage() {
  const [, lang] = await Promise.all([requirePostWriter(), getLang()])
  const t = makeT(lang)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">{t("Write post", "পোস্ট লিখুন")}</h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Saved as a draft first. Nothing goes live until a reviewer approves it.",
            "প্রথমে খসড়া হিসেবে সংরক্ষিত হবে। পর্যালোচক অনুমোদন না দেওয়া পর্যন্ত কিছুই প্রকাশিত হবে না।"
          )}
        </p>
      </div>

      <PostComposer scope="author" backHref="/profile/posts" />
    </div>
  )
}
