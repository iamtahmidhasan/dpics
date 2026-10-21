import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AdminEventScanner } from "@/components/admin/admin-event-scanner"
import { EventRegistrationStatus } from "@/generated/prisma/enums"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { getEventById } from "@/lib/services/event.service"

type Props = {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: "Ticket Scanner | Event Check-in",
}

export default async function AdminEventScannerPage({ params }: Props) {
  const { id } = await params
  await requireAdmin()

  let event
  try {
    event = await getEventById(id)
  } catch {
    notFound()
  }

  // Fetch initial stats
  const [total, confirmed, attended] = await Promise.all([
    prisma.eventRegistration.count({ where: { eventId: id } }),
    prisma.eventRegistration.count({
      where: { eventId: id, status: EventRegistrationStatus.CONFIRMED },
    }),
    prisma.eventRegistration.count({
      where: { eventId: id, status: EventRegistrationStatus.ATTENDED },
    }),
  ])

  return (
    <div className="mx-auto max-w-6xl">
      <AdminEventScanner
        event={{
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          venue: event.venue,
        }}
        initialStats={{
          total,
          confirmed,
          attended,
          remaining: Math.max(0, total - attended),
        }}
      />
    </div>
  )
}
