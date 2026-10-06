import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EventTicketCard } from "@/components/events/event-ticket-card"
import { getEventTicket } from "@/lib/services/event.service"
import { SITE_NAME } from "@/lib/site"

type Props = {
  params: Promise<{ ticketCode: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticketCode } = await params
  return {
    title: `Ticket ${ticketCode} | ${SITE_NAME}`,
    description: "Official event entry pass and registration confirmation.",
  }
}

export default async function EventTicketPage({ params }: Props) {
  const { ticketCode } = await params

  try {
    const data = await getEventTicket(ticketCode)

    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12 md:py-16">
        <div className="mb-6 print:hidden">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={`/events/${data.event.slug}`} />}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to Event
          </Button>
        </div>

        <EventTicketCard registration={data.registration} event={data.event} />
      </div>
    )
  } catch {
    notFound()
  }
}
