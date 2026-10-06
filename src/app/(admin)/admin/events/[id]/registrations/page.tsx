import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AdminEventRegistrationsTable } from "@/components/admin/admin-event-registrations-table"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { requireAdmin } from "@/lib/session"
import {
  getEventById,
  listEventRegistrations,
} from "@/lib/services/event.service"

type Props = {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: "Event Registrations",
}

export default async function AdminEventRegistrationsPage({ params }: Props) {
  const { id } = await params
  const [lang] = await Promise.all([getLang(), requireAdmin()])
  const t = makeT(lang)

  let event
  try {
    event = await getEventById(id)
  } catch {
    notFound()
  }

  const initialData = await listEventRegistrations(id, {
    page: 1,
    pageSize: 50,
  })

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">
          {t("Attendee Registrations", "অংশগ্রহণকারীদের নিবন্ধন")}
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {event.title} • {initialData.total} {t({ en: "registered", bn: "নিবন্ধিত" })}
        </p>
      </div>

      <AdminEventRegistrationsTable
        eventId={event.id}
        eventTitle={event.title}
        initialData={initialData}
      />
    </div>
  )
}
