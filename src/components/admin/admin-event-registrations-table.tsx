"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ExternalLink,
  Printer,
  RefreshCw,
  Search,
  UserCheck,
  X,
  XCircle,
} from "lucide-react"
import Link from "next/link"

import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EventRegistrationStatus } from "@/generated/prisma/enums"
import {
  eventRegistrationBadgeVariant,
  eventRegistrationStatusLabel,
} from "@/lib/event-labels"
import type { EventRegistrationSummary } from "@/lib/services/event.service"

const ALL = "ALL"

export function AdminEventRegistrationsTable({
  eventId,
  eventTitle,
  initialData,
}: {
  eventId: string
  eventTitle: string
  initialData: {
    registrations: EventRegistrationSummary[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    stats: {
      total: number
      confirmed: number
      pending: number
      attended: number
      cancelled: number
    }
  }
}) {
  const { t, lang } = useLanguage()
  const isBn = lang === "bn"

  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>(ALL)
  const [searchInput, setSearchInput] = useState("")

  const fetchData = async (overrideStatus?: string, overrideSearch?: string) => {
    setLoading(true)
    try {
      const activeStatus = overrideStatus ?? status
      const activeSearch = overrideSearch ?? searchInput

      const query = new URLSearchParams()
      if (activeStatus !== ALL) query.set("status", activeStatus)
      if (activeSearch.trim()) query.set("q", activeSearch.trim())
      query.set("page", "1")
      query.set("pageSize", "50")

      const res = await fetch(`/api/admin/events/${eventId}/registrations?${query.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    fetchData(newStatus, searchInput)
  }

  const updateRegistrationStatus = async (
    regId: string,
    newStatus: EventRegistrationStatus
  ) => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}/registrations/${regId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        fetchData()
      }
    } catch {
      // silently handle or toast
    }
  }

  return (
    <div className="space-y-4">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/admin/events" />}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {t({ en: "Back to Events", bn: "ইভেন্টে ফিরুন" })}
        </Button>
      </div>

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-border/70 bg-card p-3 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground block">
            {t({ en: "Total Registrations", bn: "মোট নিবন্ধন" })}
          </span>
          <span className="text-xl font-bold text-foreground">{data.stats.total}</span>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-3 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground block">
            {t({ en: "Confirmed", bn: "নিশ্চিত" })}
          </span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {data.stats.confirmed}
          </span>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-3 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground block">
            {t({ en: "Pending Review", bn: "অপেক্ষমান" })}
          </span>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {data.stats.pending}
          </span>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-3 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground block">
            {t({ en: "Attended", bn: "উপস্থিত" })}
          </span>
          <span className="text-xl font-bold text-sky-600 dark:text-sky-400">
            {data.stats.attended}
          </span>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-3 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground block">
            {t({ en: "Cancelled", bn: "বাতিল" })}
          </span>
          <span className="text-xl font-bold text-destructive">
            {data.stats.cancelled}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div className="flex flex-wrap items-center gap-1">
          {[
            { value: ALL, label: { en: "All", bn: "সব" } },
            { value: EventRegistrationStatus.CONFIRMED, label: { en: "Confirmed", bn: "নিশ্চিত" } },
            { value: EventRegistrationStatus.PENDING, label: { en: "Pending", bn: "অপেক্ষমান" } },
            { value: EventRegistrationStatus.ATTENDED, label: { en: "Attended", bn: "উপস্থিত" } },
            { value: EventRegistrationStatus.CANCELLED, label: { en: "Cancelled", bn: "বাতিল" } },
          ].map((tab) => (
            <Button
              key={tab.value}
              variant={status === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusChange(tab.value)}
              className="h-8 text-xs font-medium"
            >
              {t(tab.label)}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchData(status, searchInput)}
              placeholder={t({ en: "Search name, ticket, phone...", bn: "নাম বা টিকিট খুঁজুন..." })}
              className="h-8 text-xs pr-8"
            />
            <button
              type="button"
              onClick={() => fetchData(status, searchInput)}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            >
              <Search className="size-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            disabled={loading}
            className="h-8"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t({ en: "Ticket Code", bn: "টিকিট কোড" })}</TableHead>
              <TableHead>{t({ en: "Attendee", bn: "অংশগ্রহণকারী" })}</TableHead>
              <TableHead>{t({ en: "Dept / Roll", bn: "বিভাগ / রোল" })}</TableHead>
              <TableHead>{t({ en: "Payment", bn: "পেমেন্ট" })}</TableHead>
              <TableHead>{t({ en: "Status", bn: "স্ট্যাটাস" })}</TableHead>
              <TableHead className="text-right">{t({ en: "Actions", bn: "পদক্ষেপ" })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.registrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                  {t({ en: "No attendees found.", bn: "কোনো অংশগ্রহণকারী পাওয়া যায়নি।" })}
                </TableCell>
              </TableRow>
            ) : (
              data.registrations.map((reg) => (
                <TableRow key={reg.id}>
                  {/* Ticket code with link */}
                  <TableCell>
                    <Link
                      href={`/events/ticket/${reg.ticketCode}`}
                      target="_blank"
                      className="font-mono text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      {reg.ticketCode}
                      <ExternalLink className="size-3" />
                    </Link>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {new Date(reg.registeredAt).toLocaleDateString()}
                    </span>
                  </TableCell>

                  {/* Name & Contact */}
                  <TableCell>
                    <div className="font-semibold text-xs text-foreground">{reg.name}</div>
                    <div className="text-[11px] text-muted-foreground">{reg.email}</div>
                    <div className="text-[11px] text-muted-foreground">{reg.phone}</div>
                  </TableCell>

                  {/* Academic info */}
                  <TableCell>
                    <div className="text-xs font-medium text-foreground">
                      {reg.studentId || "No Roll"}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                      {reg.department || reg.institution || "DPI"}
                    </div>
                  </TableCell>

                  {/* Payment */}
                  <TableCell>
                    {reg.amountPaid > 0 ? (
                      <div>
                        <span className="text-xs font-semibold text-foreground">
                          ৳ {reg.amountPaid}
                        </span>
                        <div className="text-[11px] text-muted-foreground">
                          {reg.paymentMethod}: {reg.transactionId || "No Trx"}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Free
                      </Badge>
                    )}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell>
                    <Badge
                      variant={eventRegistrationBadgeVariant(reg.status)}
                      className="text-[11px]"
                    >
                      {t(eventRegistrationStatusLabel(reg.status))}
                    </Badge>
                  </TableCell>

                  {/* Quick Status Action Buttons */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {reg.status === EventRegistrationStatus.PENDING && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateRegistrationStatus(reg.id, EventRegistrationStatus.CONFIRMED)
                          }
                          className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                        >
                          <Check className="size-3.5 mr-1" />
                          Confirm
                        </Button>
                      )}

                      {reg.status === EventRegistrationStatus.CONFIRMED && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateRegistrationStatus(reg.id, EventRegistrationStatus.ATTENDED)
                          }
                          className="h-7 text-xs text-sky-600 hover:text-sky-700"
                        >
                          <UserCheck className="size-3.5 mr-1" />
                          Check In
                        </Button>
                      )}

                      {reg.status !== EventRegistrationStatus.CANCELLED && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateRegistrationStatus(reg.id, EventRegistrationStatus.CANCELLED)
                          }
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <X className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
