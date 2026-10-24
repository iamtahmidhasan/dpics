import { requireAdmin } from "@/lib/session"
import prisma from "@/lib/prisma"
import { listAllEventRegistrations } from "@/lib/services/event.service"
import { TicketScannerHub } from "@/components/scanner/ticket-scanner-hub"

export const dynamic = "force-dynamic"

export default async function ScannerPage() {
  await requireAdmin()

  const [events, initialData] = await Promise.all([
    prisma.event.findMany({
      select: {
        id: true,
        title: true,
        titleBn: true,
        startDate: true,
        venue: true,
      },
      orderBy: { startDate: "desc" },
    }),
    listAllEventRegistrations({
      page: 1,
      pageSize: 50,
    }),
  ])

  return (
    <TicketScannerHub
      events={events.map((e) => ({
        id: e.id,
        title: e.title,
        titleBn: e.titleBn,
        startDate: e.startDate.toISOString(),
        venue: e.venue,
      }))}
      initialData={initialData}
    />
  )
}
