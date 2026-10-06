"use client"

import {
  CalendarDays,
  Clock,
  Globe,
  MapPin,
  Tag,
  Users,
  Video,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { makeT, type Lang } from "@/lib/i18n"
import {
  eventStatusBadgeVariant,
  eventStatusLabel,
  eventTypeLabel,
} from "@/lib/event-labels"
import { EventStatus, EventType } from "@/generated/prisma/enums"
import type { EventSummary } from "@/lib/services/event.service"
import { cn } from "cn"

export type EventCardProps = {
  event: EventSummary
  lang: Lang
  href?: string
  className?: string
}

export function EventCard({
  event,
  lang,
  href,
  className,
}: EventCardProps) {
  const t = makeT(lang)
  const isBn = lang === "bn"

  const target = href ?? `/events/${event.slug}`
  const displayTitle = isBn && event.titleBn ? event.titleBn : event.title
  const displayExcerpt = isBn && event.excerptBn ? event.excerptBn : event.excerpt
  const displayVenue = isBn && event.venueBn ? event.venueBn : event.venue
  const categoryName = event.category
    ? isBn && event.category.nameBn
      ? event.category.nameBn
      : event.category.name
    : null

  const startDate = new Date(event.startDate)
  const formattedDate = new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(startDate)

  const formattedTime = new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(startDate)

  const percentFilled =
    event.maxParticipants && event.maxParticipants > 0
      ? Math.min(
          100,
          Math.round(
            (event.confirmedRegistrationsCount / event.maxParticipants) * 100
          )
        )
      : null

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        className
      )}
    >
      {/* Cover Image / Thumbnail */}
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-muted/60">
        {event.coverImage ? (
          <Image
            src={event.coverImage}
            alt={displayTitle}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-muted/80">
            <CalendarDays className="size-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
          <Badge
            variant={eventStatusBadgeVariant(event.status)}
            className="rounded-full px-2.5 py-0.5 text-[11px] font-medium shadow-sm backdrop-blur-md"
          >
            {t(eventStatusLabel(event.status))}
          </Badge>

          <Badge
            variant="secondary"
            className="flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm backdrop-blur-md"
          >
            {event.eventType === EventType.ONLINE ? (
              <Video className="size-3 text-sky-500" />
            ) : event.eventType === EventType.HYBRID ? (
              <Globe className="size-3 text-purple-500" />
            ) : (
              <MapPin className="size-3 text-emerald-500" />
            )}
            {t(eventTypeLabel(event.eventType))}
          </Badge>
        </div>

        {/* Free / Paid Chip */}
        <div className="absolute bottom-2.5 right-2.5">
          <span className="inline-block rounded-md bg-background/90 px-2 py-0.5 text-xs font-semibold text-primary shadow-xs backdrop-blur-md">
            {event.isFree
              ? t({ en: "Free", bn: "ফ্রি" })
              : `৳ ${event.registrationFee}`}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Category & Date */}
        <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          {categoryName ? (
            <span className="flex items-center gap-1 font-medium text-primary/90">
              <Tag className="size-3" />
              {categoryName}
            </span>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-base font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors sm:text-lg">
          <Link href={target} className="focus:outline-hidden">
            {displayTitle}
          </Link>
        </h3>

        {/* Excerpt */}
        {displayExcerpt && (
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
            {displayExcerpt}
          </p>
        )}

        {/* Details & Capacity */}
        <div className="mt-auto pt-4 space-y-2 border-t border-border/40">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0 text-primary" />
            <span>{formattedDate}</span>
          </div>

          {displayVenue && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0 text-primary" />
              <span className="truncate">{displayVenue}</span>
            </div>
          )}

          {percentFilled !== null && (
            <div className="pt-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span className="flex items-center gap-1">
                  <Users className="size-3 text-primary" />
                  {event.confirmedRegistrationsCount} / {event.maxParticipants}{" "}
                  {t({ en: "seats", bn: "সিট" })}
                </span>
                <span className="font-medium text-[11px]">
                  {event.isFull
                    ? t({ en: "Full", bn: "পূর্ণ" })
                    : `${percentFilled}%`}
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
        </div>

        {/* Bottom CTA Button */}
        <div className="pt-4">
          <Button
            nativeButton={false}
            render={<Link href={target} />}
            variant={event.isFull ? "outline" : "default"}
            size="sm"
            className="w-full font-medium"
          >
            {event.status === EventStatus.COMPLETED
              ? t({ en: "View Recap", bn: "বিবরণ দেখুন" })
              : event.isFull
              ? t({ en: "View Details (Full)", bn: "বিস্তারিত (পূর্ণ)" })
              : t({ en: "View & Register", bn: "বিস্তারিত ও নিবন্ধন" })}
          </Button>
        </div>
      </div>
    </article>
  )
}
