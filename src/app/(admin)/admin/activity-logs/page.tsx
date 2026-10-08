import type { Metadata } from "next"

import { ActivityLogsTable } from "@/components/admin/activity-logs/activity-logs-table"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { requireSuperAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Activity Logs & Audit Trail",
}

export default async function AdminActivityLogsPage() {
  // Enforce server-side guard: Only Super Admins can access this page
  await requireSuperAdmin()

  const lang = await getLang()
  const t = makeT(lang)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">
          {t("Audit Trail & Activity Logs", "অডিট ট্রেল ও অ্যাক্টিভিটি লগ")}
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Centralized forensic audit trail tracking system mutations, role updates, status changes, enrollments, and admin activities.",
            "সিস্টেমের সকল ডেটা পরিবর্তন, ভূমিকা আপডেট, স্ট্যাটাস পরিবর্তন, এনরোলমেন্ট এবং প্রশাসনিক কর্মকাণ্ডের কেন্দ্রীয় অডিট ট্রেল।"
          )}
        </p>
      </div>

      <ActivityLogsTable />
    </div>
  )
}
