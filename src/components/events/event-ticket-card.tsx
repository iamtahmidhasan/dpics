"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Download,
  Loader2,
  MapPin,
  Palette,
  Printer,
  ShieldCheck,
  Ticket,
} from "lucide-react"
import QRCode from "qrcode"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import type { EventRegistrationSummary, EventSummary } from "@/lib/services/event.service"

interface EventTicketCardProps {
  registration: EventRegistrationSummary
  event: EventSummary
  ticketTemplateId?: string | null
  isAdminUser?: boolean
}

function TicketBarcode() {
  const bars = [
    3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 2, 1, 2, 4, 1, 3, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 4, 2, 1, 2, 3, 1, 2, 4, 1,
  ]
  return (
    <div
      className="flex items-center justify-center gap-[2px] h-6 sm:h-7 max-w-[180px] sm:max-w-[210px] mx-auto w-full overflow-hidden opacity-60 text-foreground"
      aria-hidden="true"
    >
      {bars.map((w, i) => (
        <span
          key={i}
          className="bg-current h-full shrink-0"
          style={{ width: `${w}px` }}
        />
      ))}
    </div>
  )
}

function getStatusBadge(status: string, t: (vals: { en: string; bn: string }) => string) {
  switch (status) {
    case "ATTENDED":
      return {
        label: t({ en: "ATTENDED", bn: "উপস্থিত" }),
        className: "border-teal-500/50 text-teal-600 dark:text-teal-400 bg-teal-500/10",
      }
    case "CONFIRMED":
      return {
        label: t({ en: "CONFIRMED", bn: "অনুমোদিত" }),
        className: "border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
      }
    case "PENDING":
      return {
        label: t({ en: "PENDING", bn: "অপেক্ষমান" }),
        className: "border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10",
      }
    case "CANCELLED":
      return {
        label: t({ en: "CANCELLED", bn: "বাতিল" }),
        className: "border-rose-500/50 text-rose-600 dark:text-rose-400 bg-rose-500/10",
      }
    default:
      return {
        label: status,
        className: "border-border text-muted-foreground bg-muted",
      }
  }
}

export function EventTicketCard({
  registration,
  event,
  ticketTemplateId,
  isAdminUser = false,
}: EventTicketCardProps) {
  const { t, lang } = useLanguage()
  const isBn = lang === "bn"

  const [qrDataUrl, setQrDataUrl] = useState<string>("")

  // Generate QR code pointing to official verification URL
  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://dgpics.org"
    const verifyUrl = `${origin}/verify/ticket/${registration.ticketCode}`

    QRCode.toDataURL(verifyUrl, {
      width: 280,
      margin: 1,
      color: {
        dark: "#09090b",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Failed to generate ticket QR code:", err))
  }, [registration.ticketCode])

  const startDate = new Date(event.startDate)
  const formattedDate = new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-US", {
    weekday: "short",
    month: "short",
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

  const graphicPassDownloadUrl = ticketTemplateId
    ? `/api/media/templates/${ticketTemplateId}/render?ticketCode=${encodeURIComponent(
        registration.ticketCode
      )}&download=1`
    : null

  const statusInfo = getStatusBadge(registration.status, t)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 sm:space-y-4">
      {/* Top Action Toolbar (hidden when printing) */}
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/events/${event.slug}`} />}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 px-2.5"
        >
          <ArrowLeft className="size-3.5" />
          <span className="hidden xs:inline">{t({ en: "Back to Event", bn: "ইভেন্টে ফিরে যান" })}</span>
          <span className="xs:hidden">{t({ en: "Back", bn: "পেছনে" })}</span>
        </Button>

        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {isAdminUser && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link
                  href={
                    ticketTemplateId
                      ? `/admin/templates/${ticketTemplateId}/edit`
                      : `/admin/templates`
                  }
                  target="_blank"
                />
              }
              className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5 h-8 px-2.5"
            >
              <Palette className="size-3.5" />
              <span className="hidden sm:inline">{t({ en: "Edit Design", bn: "ডিজাইন পরিবর্তন" })}</span>
              <span className="sm:hidden">{t({ en: "Edit", bn: "এডিট" })}</span>
            </Button>
          )}

          {graphicPassDownloadUrl && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href={graphicPassDownloadUrl} download />}
              className="gap-1.5 text-xs h-8 px-2.5"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">{t({ en: "Download Pass", bn: "পাস ডাউনলোড" })}</span>
              <span className="sm:hidden">{t({ en: "Pass", bn: "পাস" })}</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs font-semibold shadow-xs h-8 px-3"
          >
            <Printer className="size-3.5" />
            <span>{t({ en: "Print", bn: "প্রিন্ট" })}</span>
          </Button>
        </div>
      </div>

      {/* Unified Paper Ticket Card */}
      <div className="relative mx-auto w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lg flex flex-col md:flex-row print:border print:border-black print:shadow-none print:rounded-none">
        {/* Main Body */}
        <div className="flex-1 p-4 sm:p-6 md:p-7 flex flex-col justify-between space-y-4 sm:space-y-5">
          {/* Header */}
          <div className="flex flex-col xs:flex-row xs:items-start justify-between gap-2.5 sm:gap-4 border-b border-border/60 pb-3 sm:pb-4">
            <div className="space-y-0.5 sm:space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-primary">
                <Ticket className="size-3.5 shrink-0" />
                <span className="truncate">DPI Computing Society</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground font-semibold truncate">
                  {event.eventType || "Event"} Pass
                </span>
              </div>
              <h1 className="text-base sm:text-xl md:text-2xl font-black text-foreground tracking-tight leading-snug break-words">
                {isBn && event.titleBn ? event.titleBn : event.title}
              </h1>
            </div>

            {/* Status Stamp */}
            <div
              className={`self-start xs:self-auto shrink-0 border px-2.5 sm:px-3 py-0.5 sm:py-1 text-center font-bold text-[10px] sm:text-xs uppercase tracking-wider rounded-md select-none ${statusInfo.className}`}
            >
              {statusInfo.label}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 sm:gap-y-4 gap-x-2.5 sm:gap-x-4 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 truncate">
                <CalendarDays className="size-3 text-muted-foreground shrink-0" />
                {t({ en: "Date", bn: "তারিখ" })}
              </span>
              <span className="font-semibold text-foreground text-xs sm:text-sm mt-0.5 block truncate">
                {formattedDate}
              </span>
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 truncate">
                <Clock className="size-3 text-muted-foreground shrink-0" />
                {t({ en: "Time", bn: "সময়" })}
              </span>
              <span className="font-semibold text-foreground text-xs sm:text-sm mt-0.5 block truncate">
                {formattedTime}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 truncate">
                <MapPin className="size-3 text-muted-foreground shrink-0" />
                {t({ en: "Venue", bn: "স্থান" })}
              </span>
              <span className="font-semibold text-foreground text-xs sm:text-sm mt-0.5 block truncate">
                {event.venue || (event.onlineJoinUrl ? "Online Platform" : "DPI Campus")}
              </span>
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
                {t({ en: "Attendee", bn: "অংশগ্রহণকারী" })}
              </span>
              <span className="font-bold text-foreground text-xs sm:text-sm mt-0.5 block truncate">
                {registration.name}
              </span>
              <span className="text-[11px] text-muted-foreground truncate block">
                {registration.email}
              </span>
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
                {t({ en: "Student / Roll ID", bn: "শিক্ষার্থী / রোল" })}
              </span>
              <span className="font-semibold text-foreground text-xs sm:text-sm mt-0.5 block truncate">
                {registration.studentId || "Attendee"}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
                {t({ en: "Department / Info", bn: "বিভাগ / তথ্য" })}
              </span>
              <span className="font-semibold text-foreground text-xs sm:text-sm mt-0.5 block truncate">
                {[registration.department, registration.shift].filter(Boolean).join(" • ") ||
                  registration.institution ||
                  "DPI Computing Society"}
              </span>
            </div>
          </div>

          {/* Ticket Footer */}
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 pt-2.5 sm:pt-3 border-t border-border/60 text-[10px] sm:text-[11px] text-muted-foreground">
            <div className="font-mono tracking-wider font-bold text-foreground flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground font-sans uppercase">No.</span>
              <span className="truncate">{registration.ticketCode}</span>
            </div>
            <div className="flex items-center gap-1 tracking-wide font-medium">
              <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">
                {t({
                  en: "Official entry pass • Present at gate",
                  bn: "অফিসিয়াল এন্ট্রি পাস • গেটে প্রদর্শন করুন",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Perforation Divider with Clean Notches */}
        {/* On desktop: vertical dashed line with top & bottom notches */}
        <div className="hidden md:flex relative flex-col items-center justify-center shrink-0 w-0">
          <div className="absolute -top-3.5 size-7 rounded-full bg-background border border-border z-10" />
          <div className="absolute -bottom-3.5 size-7 rounded-full bg-background border border-border z-10" />
          <div className="h-full border-r-2 border-dashed border-border/70" />
        </div>

        {/* On mobile: horizontal dashed line with left & right notches */}
        <div className="md:hidden relative flex items-center justify-center w-full h-6 shrink-0 my-0">
          <div className="absolute -left-3 size-6 rounded-full bg-background border border-border z-10" />
          <div className="absolute -right-3 size-6 rounded-full bg-background border border-border z-10" />
          <div className="w-full border-b-2 border-dashed border-border/70" />
        </div>

        {/* Tear-off Stub */}
        <div className="w-full md:w-60 lg:w-64 bg-muted/20 p-4 sm:p-6 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 shrink-0">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              ★ ADMIT ONE ★
            </div>
            <div className="text-xs font-bold text-foreground mt-0.5">
              ENTRY STUB
            </div>
          </div>

          {/* QR Code */}
          <div className="size-28 sm:size-36 rounded-xl bg-white p-1.5 sm:p-2 border border-border shadow-xs flex items-center justify-center">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`QR Code for ${registration.ticketCode}`}
                className="size-full object-contain"
              />
            ) : (
              <Loader2 className="size-5 sm:size-6 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Code & Barcode */}
          <div className="w-full space-y-1">
            <div className="font-mono text-xs sm:text-sm font-black tracking-widest text-foreground truncate">
              {registration.ticketCode}
            </div>

            <TicketBarcode />

            <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
              {t({
                en: "Scan QR code at venue gate",
                bn: "গেটে কিউআর কোড স্ক্যান করুন",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
