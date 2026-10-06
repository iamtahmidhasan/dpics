"use client"

import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  MapPin,
  Printer,
  QrCode,
  ShieldCheck,
  Ticket,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { eventRegistrationBadgeVariant } from "@/lib/event-labels"
import type { EventRegistrationSummary, EventSummary } from "@/lib/services/event.service"

export function EventTicketCard({
  registration,
  event,
}: {
  registration: EventRegistrationSummary
  event: EventSummary
}) {
  const { t, lang } = useLanguage()
  const isBn = lang === "bn"

  const startDate = new Date(event.startDate)
  const formattedDate = new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(startDate)

  const formattedTime = new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(startDate)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Action buttons (hidden when printing) */}
      <div className="mb-4 flex items-center justify-end gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
          <Printer className="size-4" />
          {t({ en: "Print Pass", bn: "প্রিন্ট করুন" })}
        </Button>
      </div>

      {/* Ticket Pass Shell */}
      <div className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-card text-card-foreground shadow-xl">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-primary via-primary/90 to-emerald-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="size-5" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-90">
                DPI Computing Society
              </span>
            </div>
            <Badge
              variant={eventRegistrationBadgeVariant(registration.status)}
              className="bg-white/20 text-white font-semibold backdrop-blur-xs border-0"
            >
              {registration.status}
            </Badge>
          </div>

          <h2 className="mt-3 text-xl font-bold tracking-tight">
            {isBn && event.titleBn ? event.titleBn : event.title}
          </h2>
        </div>

        {/* Middle Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 border-b border-border/50 pb-4">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase">
                {t({ en: "Attendee", bn: "অংশগ্রহণকারী" })}
              </span>
              <p className="font-semibold text-foreground text-sm">{registration.name}</p>
              <p className="text-xs text-muted-foreground">{registration.email}</p>
            </div>

            <div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase">
                {t({ en: "Roll / Dept", bn: "রোল / বিভাগ" })}
              </span>
              <p className="font-semibold text-foreground text-sm">
                {registration.studentId || "N/A"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {registration.department || registration.institution || "DPI"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-border/50 pb-4">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase">
                {t({ en: "Date & Time", bn: "তারিখ ও সময়" })}
              </span>
              <p className="font-semibold text-foreground text-xs sm:text-sm flex items-center gap-1">
                <CalendarDays className="size-3 text-primary shrink-0" />
                {formattedDate}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="size-3 text-primary shrink-0" />
                {formattedTime}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase">
                {t({ en: "Venue / Platform", bn: "স্থান / প্ল্যাটফর্ম" })}
              </span>
              <p className="font-semibold text-foreground text-xs sm:text-sm flex items-center gap-1">
                <MapPin className="size-3 text-primary shrink-0" />
                <span className="truncate">{event.venue || "Online"}</span>
              </p>
            </div>
          </div>

          {/* Ticket Barcode / Code Section */}
          <div className="rounded-xl border border-dashed border-primary/30 bg-muted/40 p-4 text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t({ en: "Official Entry Pass Code", bn: "অফিসিয়াল এন্ট্রি পাস কোড" })}
            </span>
            <div className="font-mono text-2xl font-black tracking-widest text-primary">
              {registration.ticketCode}
            </div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span>
                {t({
                  en: "Verified & registered electronically",
                  bn: "ইলেকট্রনিক্যালি যাচাইকৃত ও নিবন্ধিত",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted/30 px-6 py-3 text-center text-[11px] text-muted-foreground border-t border-border/40">
          {t({
            en: "Please show this digital pass or printed copy at the event entrance.",
            bn: "অনুগ্রহ করে ইভেন্টের প্রবেশদ্বারে এই ডিজিটাল পাস অথবা প্রিন্ট কপি প্রদর্শন করুন।",
          })}
        </div>
      </div>
    </div>
  )
}
