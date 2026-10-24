import {
  ArrowLeft,
  CalendarDays,
  Clock,
  ExternalLink,
  Globe,
  MapPin,
  Tag,
  Users,
  Video,
} from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MarkdownContent } from "@/components/posts/markdown-content"
import { EventRegistrationDialog } from "@/components/events/event-registration-dialog"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import {
  eventStatusBadgeVariant,
  eventStatusLabel,
  eventTypeLabel,
} from "@/lib/event-labels"
import { EventStatus, EventType } from "@/generated/prisma/enums"
import { getPublishedEventBySlug } from "@/lib/services/event.service"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { absoluteUrl, NOINDEX, websiteMetadata } from "@/lib/seo"
import { SITE_NAME, SITE_URL } from "@/lib/site"
import { cn } from "cn"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const event = await getPublishedEventBySlug(slug)
    const description =
      event.excerpt ||
      `Join ${event.title} organized by DPI Computing Society. View event dates, venue and registration info.`

    return websiteMetadata({
      title: event.title,
      description,
      path: `/events/${slug}`,
      image: event.coverImage ?? undefined,
    })
  } catch {
    return { title: "Event Not Found", robots: NOINDEX }
  }
}

export default async function PublicEventDetailPage({ params }: Props) {
  const { slug } = await params
  const [lang, session] = await Promise.all([getLang(), getSession()])
  const t = makeT(lang)
  const isBn = lang === "bn"

  let event
  try {
    event = await getPublishedEventBySlug(slug)
  } catch {
    notFound()
  }

  // Check if current logged-in user already bought a ticket for this event (1-ticket limit)
  let userTicket = null
  if (session?.user) {
    userTicket = await prisma.eventRegistration.findFirst({
      where: {
        eventId: event.id,
        OR: [
          { userId: session.user.id },
          { email: { equals: session.user.email, mode: "insensitive" } },
        ],
        status: { notIn: ["CANCELLED", "REJECTED"] },
      },
      select: {
        id: true,
        ticketCode: true,
        status: true,
      },
    })
  }

  const startDate = new Date(event.startDate)
  const formattedDate = new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(startDate)

  const formattedTime = new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(startDate)

  const displayTitle = isBn && event.titleBn ? event.titleBn : event.title
  const displayExcerpt = isBn && event.excerptBn ? event.excerptBn : event.excerpt
  const displayContent = isBn && event.contentBn ? event.contentBn : event.content
  const displayVenue = isBn && event.venueBn ? event.venueBn : event.venue

  const isRegistrationClosed =
    event.status === EventStatus.COMPLETED ||
    event.status === EventStatus.CANCELLED ||
    !event.isRegistrationOpen ||
    event.isFull

  const percentFilled =
    event.maxParticipants && event.maxParticipants > 0
      ? Math.min(
          100,
          Math.round(
            (event.confirmedRegistrationsCount / event.maxParticipants) * 100
          )
        )
      : null

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: displayTitle,
    description: displayExcerpt || undefined,
    startDate: event.startDate,
    endDate: event.endDate ?? undefined,
    eventStatus:
      event.status === EventStatus.CANCELLED
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode:
      event.eventType === EventType.ONLINE
        ? "https://schema.org/OnlineEventAttendanceMode"
        : event.eventType === EventType.HYBRID
          ? "https://schema.org/MixedEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
    image: event.coverImage ?? undefined,
    url: absoluteUrl(`/events/${slug}`),
    ...(displayVenue ? { location: { "@type": "Place", name: displayVenue } } : {}),
    organizer: { "@type": "Organization", name: SITE_NAME, url: SITE_URL.toString() },
  }

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8 space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/events" />}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 px-2"
        >
          <ArrowLeft className="size-3.5" />
          {t({ en: "Back to Events", bn: "সকল ইভেন্টে ফিরে যান" })}
        </Button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Media & Information */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header & Badges */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={eventStatusBadgeVariant(event.status)}
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              >
                {t(eventStatusLabel(event.status))}
              </Badge>

              <Badge variant="secondary" className="gap-1 rounded-full px-2.5 py-0.5 text-xs">
                {event.eventType === EventType.ONLINE ? (
                  <Video className="size-3 text-sky-500" />
                ) : event.eventType === EventType.HYBRID ? (
                  <Globe className="size-3 text-purple-500" />
                ) : (
                  <MapPin className="size-3 text-emerald-500" />
                )}
                {t(eventTypeLabel(event.eventType))}
              </Badge>

              {event.category && (
                <Badge variant="outline" className="gap-1 rounded-full px-2.5 py-0.5 text-xs">
                  <Tag className="size-3" />
                  {isBn && event.category.nameBn ? event.category.nameBn : event.category.name}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              {displayTitle}
            </h1>

            {displayExcerpt && (
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {displayExcerpt}
              </p>
            )}
          </div>

          {/* Cover Media */}
          {event.coverImage && (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
              <Image
                src={event.coverImage}
                alt={displayTitle}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
            </div>
          )}

          {/* Description Section */}
          <div className="space-y-3 pt-2">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {t({ en: "About this Event", bn: "ইভেন্ট সম্পর্কে" })}
            </h2>
            <div className="rounded-xl border border-border bg-card p-5 sm:p-7 shadow-xs">
              <MarkdownContent>{displayContent}</MarkdownContent>
            </div>
          </div>

          {/* Guest Speakers Section */}
          {event.guestSpeakers && event.guestSpeakers.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {t({ en: "Featured Speakers & Mentors", bn: "বক্তা ও মেন্টরবৃন্দ" })}
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {event.guestSpeakers.map((speaker, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 shadow-xs"
                  >
                    <Avatar className="size-12 rounded-xl border border-border shrink-0">
                      <AvatarImage src={speaker.avatar || undefined} alt={speaker.name} />
                      <AvatarFallback className="rounded-xl text-sm font-bold bg-primary/10 text-primary">
                        {speaker.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-0.5 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm truncate">
                        {isBn && speaker.nameBn ? speaker.nameBn : speaker.name}
                      </h4>
                      <p className="text-xs font-medium text-primary truncate">
                        {isBn && speaker.roleBn ? speaker.roleBn : speaker.role}
                      </p>
                      {speaker.company && (
                        <p className="text-xs text-muted-foreground truncate">
                          {speaker.company}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Registration & Details Card */}
        <div>
          <div className="sticky top-20 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-5">
            {/* Price & Action */}
            <div className="border-b border-border/60 pb-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                  {t({ en: "Registration Fee", bn: "রেজিস্ট্রেশন ফি" })}
                </span>
                <span className="text-2xl font-black text-primary">
                  {event.isFree
                    ? t({ en: "Free", bn: "ফ্রি" })
                    : `৳ ${event.registrationFee}`}
                </span>
              </div>

              {/* 1 USER = 1 TICKET ENFORCEMENT */}
              <EventRegistrationDialog
                event={event}
                disabled={isRegistrationClosed}
                userTicketCode={userTicket?.ticketCode}
                triggerText={
                  event.isFull
                    ? t({ en: "Seats Full", bn: "সিট পূর্ণ" })
                    : isRegistrationClosed
                    ? t({ en: "Registration Closed", bn: "নিবন্ধন বন্ধ" })
                    : t({ en: "Register for Event", bn: "ইভেন্টে নিবন্ধন করুন" })
                }
              />
            </div>

            {/* Quick Details List */}
            <div className="space-y-3.5 text-xs">
              {/* Date & Time */}
              <div className="flex items-start gap-2.5">
                <CalendarDays className="size-4 shrink-0 text-primary mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">
                    {formattedDate}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="size-3" />
                    {formattedTime}
                  </span>
                </div>
              </div>

              {/* Venue */}
              {displayVenue && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="size-4 shrink-0 text-primary mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">
                      {displayVenue}
                    </span>
                    {event.locationMapUrl && (
                      <Link
                        href={event.locationMapUrl}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-0.5"
                      >
                        <ExternalLink className="size-3" />
                        {t({ en: "View Map", bn: "ম্যাপ দেখুন" })}
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Online Stream Link */}
              {event.onlineJoinUrl && (
                <div className="flex items-start gap-2.5">
                  <Video className="size-4 shrink-0 text-sky-500 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">
                      {t({ en: "Online Stream", bn: "অনলাইন স্ট্রিম" })}
                    </span>
                    <Link
                      href={event.onlineJoinUrl}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[11px] text-sky-500 hover:underline mt-0.5"
                    >
                      <ExternalLink className="size-3" />
                      {t({ en: "Join Stream", bn: "স্ট্রিম লিংক" })}
                    </Link>
                  </div>
                </div>
              )}

              {/* Seats Progress */}
              {percentFilled !== null && (
                <div className="pt-2 border-t border-border/40 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="size-3.5 text-primary" />
                      {t({ en: "Seat Availability", bn: "সিট সংখ্যা" })}
                    </span>
                    <span className="font-bold text-foreground">
                      {event.confirmedRegistrationsCount} / {event.maxParticipants}
                    </span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        event.isFull ? "bg-destructive" : "bg-primary"
                      )}
                      style={{ width: `${percentFilled}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Registration Deadline */}
              {event.registrationDeadline && (
                <div className="pt-2 text-xs text-muted-foreground border-t border-border/40">
                  <span className="block font-medium text-foreground">
                    {t({ en: "Registration Deadline:", bn: "নিবন্ধনের শেষ সময়:" })}
                  </span>
                  <span>
                    {new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    }).format(new Date(event.registrationDeadline))}
                  </span>
                </div>
              )}
            </div>

            {/* Organizer Footer */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 flex items-center gap-3">
              <Avatar className="size-9 rounded-full shrink-0">
                <AvatarImage src={event.author.avatar || undefined} alt={event.author.name} />
                <AvatarFallback className="text-xs font-bold">{event.author.name.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                  {t({ en: "Organized by", bn: "আয়োজক" })}
                </span>
                <span className="font-semibold text-xs text-foreground truncate block">
                  {event.author.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
