import {
  ArrowLeft,
  CalendarDays,
  Clock,
  ExternalLink,
  Globe,
  MapPin,
  Share2,
  Sparkles,
  Tag,
  UserCheck,
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
      `Join ${event.title} organized by DPI Computing Society on ${new Date(event.startDate).toDateString()}.`

    // websiteMetadata emits an absolute title, canonical and complete
    // OG/Twitter blocks — no double site name, no root-metadata leakage.
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
  const [lang] = await Promise.all([getLang()])
  const t = makeT(lang)
  const isBn = lang === "bn"

  let event
  try {
    event = await getPublishedEventBySlug(slug)
  } catch {
    notFound()
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

  // Rich-result eligible Event schema: dates, cancelled state, attendance
  // mode, venue and organizer.
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
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navigation breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/events" />}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {t({ en: "Back to Events", bn: "সকল ইভেন্টে ফিরে যান" })}
        </Button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Media, Description, Speakers, Gallery */}
        <div className="space-y-8 lg:col-span-2">
          {/* Header & Badges */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={eventStatusBadgeVariant(event.status)}
                className="rounded-full px-3 py-0.5 text-xs font-medium"
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

            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
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
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 bg-muted shadow-md">
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

          {/* Markdown Content */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 shadow-xs space-y-4">
            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {t({ en: "About this Event", bn: "ইভেন্ট সম্পর্কে" })}
            </h2>

            <MarkdownContent>{displayContent}</MarkdownContent>
          </div>

          {/* Guest Speakers Section */}
          {event.guestSpeakers && event.guestSpeakers.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {t({ en: "Featured Speakers & Mentors", bn: "বক্তা ও মেন্টরবৃন্দ" })}
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {event.guestSpeakers.map((speaker, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <Avatar className="size-14 rounded-xl border border-border shrink-0">
                      <AvatarImage src={speaker.avatar || undefined} alt={speaker.name} />
                      <AvatarFallback className="rounded-xl text-base font-bold bg-primary/10 text-primary">
                        {speaker.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1 min-w-0">
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
                      {speaker.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-2 pt-1">
                          {speaker.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo Gallery if any */}
          {event.images && event.images.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {t({ en: "Event Gallery", bn: "ইভেন্ট গ্যালারি" })}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {event.images.map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    <Image
                      src={img}
                      alt={`Event photo ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Sidebar Card */}
        <div className="space-y-6">
          <div className="sticky top-20 rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-6">
            {/* Price & Registration CTA */}
            <div className="border-b border-border/50 pb-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                  {t({ en: "Registration Fee", bn: "রেজিস্ট্রেশন ফি" })}
                </span>
                <span className="text-2xl font-black text-primary">
                  {event.isFree
                    ? t({ en: "Free", bn: "ফ্রি" })
                    : `৳ ${event.registrationFee}`}
                </span>
              </div>

              <EventRegistrationDialog
                event={event}
                disabled={isRegistrationClosed}
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
            <div className="space-y-4 text-xs">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
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
                <div className="flex items-start gap-3">
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
                        {t({ en: "View on Google Maps", bn: "গুগল ম্যাপে দেখুন" })}
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Online Link if any */}
              {event.onlineJoinUrl && (
                <div className="flex items-start gap-3">
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
                      {t({ en: "Join Meeting / Stream", bn: "মিটিং এ যোগ দিন" })}
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

                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
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

            {/* Organizer Card */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 flex items-center gap-3">
              <Avatar className="size-10 rounded-full shrink-0">
                <AvatarImage src={event.author.avatar || undefined} alt={event.author.name} />
                <AvatarFallback>{event.author.name.charAt(0)}</AvatarFallback>
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
