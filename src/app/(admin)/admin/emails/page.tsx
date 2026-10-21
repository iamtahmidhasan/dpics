import { Suspense } from "react"

import { AdminEmailsMobileNav } from "@/components/admin/email/admin-emails-mobile-nav"
import { AdminEmailTemplates } from "@/components/admin/email/admin-email-templates"
import { Spinner } from "@/components/ui/spinner"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"

export default async function AdminEmailsPage() {
  const lang = await getLang()
  const t = makeT(lang)

  return (
    <>
      {/* Mobile view (< md): Show the email tools as an app-style list */}
      <div className="block md:hidden space-y-4">
        <div className="space-y-1">
          <h1 className="font-heading text-lg font-semibold">
            {t("Email Notification Center", "ইমেইল নোটিফিকেশন সেন্টার")}
          </h1>
          <p className="text-xs/relaxed text-muted-foreground">
            {t(
              "Configure templates, send bulk campaigns, and monitor message delivery logs.",
              "টেমপ্লেট কনফিগার করুন, বাল্ক ক্যাম্পেইন পাঠান এবং লগ মনিটর করুন।"
            )}
          </p>
        </div>

        <AdminEmailsMobileNav />
      </div>

      {/* Desktop view (>= md): Render the first tab (Email Templates) directly */}
      <div className="hidden md:block">
        <Suspense
          fallback={
            <div className="flex h-48 items-center justify-center">
              <Spinner className="size-6 text-primary" />
            </div>
          }
        >
          <AdminEmailTemplates />
        </Suspense>
      </div>
    </>
  )
}
