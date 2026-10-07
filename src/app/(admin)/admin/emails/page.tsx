import type { Metadata } from "next"

import { AdminEmailsContainer } from "@/components/admin/email/admin-emails-container"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"

export const metadata: Metadata = {
  title: "Emails & Notifications",
}

export default async function AdminEmailsPage() {
  const lang = await getLang()
  const t = makeT(lang)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">
          {t("Email Notification & Bulk Mail Center", "ইমেইল নোটিফিকেশন ও বাল্ক মেইল সেন্টার")}
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Configure dynamic status update templates, send filtered bulk campaigns via Gmail SMTP, and monitor delivery logs.",
            "ডায়নামিক স্ট্যাটাস আপডেট টেমপ্লেট কনফিগার করুন, জিমেইল এসএমটিপির মাধ্যমে ফিল্টার্ড বাল্ক ক্যাম্পেইন পাঠান এবং লগ মনিটর করুন।"
          )}
        </p>
      </div>

      <AdminEmailsContainer />
    </div>
  )
}
