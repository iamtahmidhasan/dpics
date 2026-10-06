import type { Metadata } from "next"

import { AdminEventsTable } from "@/components/admin/admin-events-table"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { eventFiltersFromParams } from "@/lib/event-params"
import { requireAdmin } from "@/lib/session"
import {
  getEventCounts,
  listEventsForAdmin,
} from "@/lib/services/event.service"

export const metadata: Metadata = {
  title: "Events Management",
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const [lang] = await Promise.all([getLang(), requireAdmin()])
  const t = makeT(lang)

  const filters = eventFiltersFromParams(params)
  const [page, counts] = await Promise.all([
    listEventsForAdmin(filters),
    getEventCounts(),
  ])

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">
          {t("Events Management", "ইভেন্ট ব্যবস্থাপনা")}
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Create workshops, seminars, and programming contests, manage schedule and track attendee registrations.",
            "ওয়ার্কশপ, সেমিনার ও প্রোগ্রামিং প্রতিযোগিতা তৈরি করুন, সময়সূচি নির্ধারণ করুন ও অংশগ্রহণকারীদের তালিকা পরিচালনা করুন।"
          )}
        </p>
      </div>

      <AdminEventsTable initialData={{ ...page, counts }} />
    </div>
  )
}
