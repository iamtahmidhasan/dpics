import type { Metadata } from "next"
import { AdminTemplatesManager } from "@/components/admin/admin-templates-manager"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { listMediaTemplates } from "@/lib/services/media-template.service"
import { listMedia } from "@/lib/services/media.service"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Media Templates",
}

export default async function AdminTemplatesPage() {
  await requireAdmin()

  const [lang, templates, media] = await Promise.all([
    getLang(),
    listMediaTemplates(),
    listMedia({ limit: 100 }),
  ])
  const t = makeT(lang)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">
          {t("Dynamic Media Templates", "ডায়নামিক মিডিয়া টেমপ্লেট")}
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Design reusable templates for Member ID Cards, Certificates, and Event Passes with Canva-style Fabric.js editor.",
            "ফ্যাব্রিক জেএস এডিটর ব্যবহার করে মেম্বার আইডি কার্ড, সার্টিফিকেট ও ইভেন্ট পাসের জন্য রিইউজেবল টেমপ্লেট তৈরি করুন।"
          )}
        </p>
      </div>

      <AdminTemplatesManager
        initialTemplates={templates}
        availableMedia={media}
      />
    </div>
  )
}
