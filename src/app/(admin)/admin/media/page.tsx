import type { Metadata } from "next"

import { AdminMediaManager } from "@/components/admin/admin-media-manager"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { getMediaStats, listMedia } from "@/lib/services/media.service"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Media Library",
}

export default async function AdminMediaPage() {
  await requireAdmin()

  const [lang, media, stats] = await Promise.all([
    getLang(),
    listMedia(),
    getMediaStats(),
  ])
  const t = makeT(lang)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">
          {t("Media Library", "মিডিয়া লাইব্রেরি")}
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Manage images hosted on ImageKit. Upload assets, copy direct CDN URLs and markdown snippets.",
            "ইমেজকিটে সংরক্ষিত ছবি পরিচালনা করুন। নতুন ছবি আপলোড করুন এবং সিডিএন বা মার্কডাউন লিংক কপি করুন।"
          )}
        </p>
      </div>

      <AdminMediaManager initialMedia={media} initialStats={stats} />
    </div>
  )
}
