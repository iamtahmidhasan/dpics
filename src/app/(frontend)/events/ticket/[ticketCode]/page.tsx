import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { EventTicketCard } from "@/components/events/event-ticket-card"
import { getEventTicket } from "@/lib/services/event.service"
import { getSession, isAdmin } from "@/lib/session"
import { NOINDEX } from "@/lib/seo"

type Props = {
  params: Promise<{ ticketCode: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticketCode } = await params
  return {
    title: `Ticket ${ticketCode}`,
    description: "Official event entry pass and registration confirmation.",
    // Private entry passes must never appear in search results.
    robots: NOINDEX,
  }
}

export default async function EventTicketPage({ params }: Props) {
  const { ticketCode } = await params

  let data
  let isAdminUser = false

  try {
    const [ticketData, session] = await Promise.all([
      getEventTicket(ticketCode),
      getSession(),
    ])
    data = ticketData
    isAdminUser = session?.user ? isAdmin(session.user) : false
  } catch {
    notFound()
  }

  if (!data) {
    notFound()
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 md:py-16">
      <EventTicketCard
        registration={data.registration}
        event={data.event}
        ticketTemplateId={data.ticketTemplateId}
        isAdminUser={isAdminUser}
      />
    </div>
  )
}
