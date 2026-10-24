import type { Metadata } from "next"

import { AdminTicketsTable } from "@/components/admin/admin-tickets-table"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import prisma from "@/lib/prisma"
import { listAllEventRegistrations } from "@/lib/services/event.service"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Tickets Management",
}

export default async function AdminTicketsPage() {
  const [lang] = await Promise.all([getLang(), requireAdmin()])
  const t = makeT(lang)

  // Fetch initial registrations and events
  const [initialData, events] = await Promise.all([
    listAllEventRegistrations({
      page: 1,
      pageSize: 25,
    }),
    prisma.event.findMany({
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        startDate: "desc",
      },
    }),
  ])

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">
          {t("All Event Tickets & Check-in", "সকল ইভেন্ট টিকেট ও চেক-ইন")}
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Manage registration passes across all society events, update attendance states, and verify check-ins.",
            "সকল ইভেন্টের রেজিস্ট্রেশন পাস পরিচালনা করুন, উপস্থিতি স্ট্যাটাস পরিবর্তন করুন ও টিকেট যাচাই করুন।"
          )}
        </p>
      </div>

      <AdminTicketsTable initialData={initialData} events={events} />
    </div>
  )
}
