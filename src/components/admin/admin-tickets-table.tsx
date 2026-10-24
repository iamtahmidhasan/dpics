"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Camera,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Filter,
  Loader2,
  QrCode,
  RefreshCw,
  Search,
  Ticket,
  UserCheck,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExportImportMenu } from "@/components/admin/data-transfer/export-import-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EventRegistrationStatus } from "@/generated/prisma/enums"
import { useLanguage } from "@/components/language-provider"
import {
  eventRegistrationBadgeVariant,
  eventRegistrationStatusLabel,
} from "@/lib/event-labels"
import type { EventRegistrationSummary } from "@/lib/services/event.service"

interface EventOption {
  id: string
  title: string
}

interface AdminTicketsTableProps {
  initialData: {
    registrations: (EventRegistrationSummary & {
      eventStartDate?: string
      eventVenue?: string | null
    })[]
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
  events: EventOption[]
}

const ALL = "ALL"

export function AdminTicketsTable({ initialData, events }: AdminTicketsTableProps) {
  const { t, lang } = useLanguage()
  const isBn = lang === "bn"

  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Filters
  const [selectedEventId, setSelectedEventId] = useState<string>(ALL)
  const [status, setStatus] = useState<string>(ALL)
  const [searchInput, setSearchInput] = useState("")

  const fetchData = async (
    overrideEventId?: string,
    overrideStatus?: string,
    overrideSearch?: string,
    targetPage = 1
  ) => {
    setLoading(true)
    try {
      const activeEvent = overrideEventId ?? selectedEventId
      const activeStatus = overrideStatus ?? status
      const activeSearch = overrideSearch ?? searchInput

      const query = new URLSearchParams()
      if (activeEvent !== ALL) query.set("eventId", activeEvent)
      if (activeStatus !== ALL) query.set("status", activeStatus)
      if (activeSearch.trim()) query.set("q", activeSearch.trim())
      query.set("page", String(targetPage))
      query.set("pageSize", "25")

      const res = await fetch(`/api/admin/tickets?${query.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        toast.error("Failed to load tickets")
      }
    } catch {
      toast.error("Network error while loading tickets")
    } finally {
      setLoading(false)
    }
  }

  const handleEventChange = (newVal: string | null) => {
    const val = newVal ?? ALL
    setSelectedEventId(val)
    fetchData(val, status, searchInput, 1)
  }

  const handleStatusChange = (newVal: string) => {
    setStatus(newVal)
    fetchData(selectedEventId, newVal, searchInput, 1)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData(selectedEventId, status, searchInput, 1)
  }

  const handleUpdateStatus = async (regId: string, newStatus: EventRegistrationStatus) => {
    setUpdatingId(regId)
    try {
      const res = await fetch(`/api/admin/tickets/${regId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        toast.success(
          t({
            en: `Ticket status updated to ${newStatus}`,
            bn: `টিকেট সফলভাবে ${newStatus} করা হয়েছে`,
          })
        )
        // Refresh local data
        fetchData(selectedEventId, status, searchInput, data.page)
      } else {
        const err = await res.json()
        toast.error(err.message || "Failed to update status")
      }
    } catch {
      toast.error("Network error while updating ticket")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(t({ en: "Copied to clipboard", bn: "কপিকৃত হয়েছে" }))
  }

  return (
    <div className="space-y-6">
      {/* Top Metric Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground block">
            {t({ en: "Total Tickets", bn: "মোট টিকেট" })}
          </span>
          <span className="text-xl font-bold text-foreground">{data.stats.total}</span>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block">
            {t({ en: "Confirmed", bn: "নিশ্চিতকৃত" })}
          </span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {data.stats.confirmed}
          </span>
        </div>

        <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400 block">
            {t({ en: "Attended (Completed)", bn: "উপস্থিত (সম্পন্ন)" })}
          </span>
          <span className="text-xl font-bold text-sky-600 dark:text-sky-400">
            {data.stats.attended}
          </span>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 block">
            {t({ en: "Pending Review", bn: "অপেক্ষমান" })}
          </span>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {data.stats.pending}
          </span>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground block">
            {t({ en: "Cancelled", bn: "বাতিলকৃত" })}
          </span>
          <span className="text-xl font-bold text-destructive">{data.stats.cancelled}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Event Filter Select */}
          <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
            <Filter className="size-4 text-muted-foreground shrink-0" />
            <Select value={selectedEventId} onValueChange={handleEventChange}>
              <SelectTrigger className="h-9 text-xs font-medium bg-background w-full">
                <SelectValue placeholder={t({ en: "All Events", bn: "সব ইভেন্ট" })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t({ en: "All Events", bn: "সব ইভেন্ট" })}</SelectItem>
                {events.map((ev) => (
                  <SelectItem key={ev.id} value={ev.id}>
                    {ev.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Scanner & Data Transfer */}
          <div className="flex items-center gap-2 flex-wrap">
            <ExportImportMenu
              entity="tickets"
              onImportComplete={() => fetchData(selectedEventId, status, searchInput, data.page)}
            />

            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/verify" />}
              className="gap-1.5 text-xs h-9"
            >
              <Camera className="size-3.5 text-primary" />
              {t({ en: "Open QR Scanner", bn: "কিউআর স্ক্যানার খুলুন" })}
            </Button>

            {selectedEventId !== ALL && (
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href={`/admin/events/${selectedEventId}/scanner`} />}
                className="gap-1.5 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <UserCheck className="size-3.5" />
                {t({ en: "Event Gate Scanner", bn: "গেট স্ক্যানার" })}
              </Button>
            )}
          </div>
        </div>

        {/* Status Tabs and Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-1">
            {[
              { value: ALL, label: { en: "All", bn: "সব" } },
              {
                value: EventRegistrationStatus.CONFIRMED,
                label: { en: "Confirmed", bn: "নিশ্চিত" },
              },
              {
                value: EventRegistrationStatus.ATTENDED,
                label: { en: "Attended", bn: "উপস্থিত" },
              },
              {
                value: EventRegistrationStatus.PENDING,
                label: { en: "Pending", bn: "অপেক্ষমান" },
              },
              {
                value: EventRegistrationStatus.CANCELLED,
                label: { en: "Cancelled", bn: "বাতিল" },
              },
            ].map((tab) => (
              <Button
                key={tab.value}
                variant={status === tab.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusChange(tab.value)}
                className="h-8 text-xs font-semibold px-3"
              >
                {t(tab.label)}
              </Button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t({
                  en: "Search code, name, phone...",
                  bn: "কোড, নাম বা ফোন খুঁজুন...",
                })}
                className="h-8 text-xs pr-8 font-mono"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
              >
                <Search className="size-4" />
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => fetchData()}
              disabled={loading}
              className="h-8 px-2.5"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </form>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[180px]">{t({ en: "Ticket Code", bn: "টিকিট কোড" })}</TableHead>
              <TableHead>{t({ en: "Event", bn: "ইভেন্ট" })}</TableHead>
              <TableHead>{t({ en: "Attendee", bn: "অংশগ্রহণকারী" })}</TableHead>
              <TableHead>{t({ en: "Dept / Roll", bn: "বিভাগ / রোল" })}</TableHead>
              <TableHead>{t({ en: "Payment", bn: "পেমেন্ট" })}</TableHead>
              <TableHead>{t({ en: "Status", bn: "স্ট্যাটাস" })}</TableHead>
              <TableHead className="text-right">{t({ en: "Update State", bn: "পদক্ষেপ" })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.registrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-36 text-center text-xs text-muted-foreground">
                  <Ticket className="size-8 mx-auto opacity-30 mb-2" />
                  {t({ en: "No tickets found.", bn: "কোনো টিকেট পাওয়া যায়নি।" })}
                </TableCell>
              </TableRow>
            ) : (
              data.registrations.map((reg) => (
                <TableRow key={reg.id} className="hover:bg-muted/30 transition-colors">
                  {/* Ticket Code */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/events/ticket/${reg.ticketCode}`}
                        target="_blank"
                        className="font-mono text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        {reg.ticketCode}
                        <ExternalLink className="size-3 opacity-60" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleCopy(reg.ticketCode)}
                        className="text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100"
                        title="Copy code"
                      >
                        <Copy className="size-3" />
                      </button>
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {new Date(reg.registeredAt).toLocaleDateString()}
                    </span>
                  </TableCell>

                  {/* Event */}
                  <TableCell>
                    <div className="font-semibold text-xs text-foreground max-w-[180px] truncate">
                      {reg.eventTitle}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      {reg.eventStartDate && new Date(reg.eventStartDate).toLocaleDateString()}
                    </div>
                  </TableCell>

                  {/* Attendee */}
                  <TableCell>
                    <div className="font-semibold text-xs text-foreground">{reg.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                      {reg.email}
                    </div>
                    {reg.phone && (
                      <div className="text-[11px] text-muted-foreground">{reg.phone}</div>
                    )}
                  </TableCell>

                  {/* Dept / Roll */}
                  <TableCell>
                    <div className="text-xs font-medium text-foreground">
                      {reg.studentId || "Attendee"}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                      {reg.department || reg.institution || "DPI"}
                    </div>
                  </TableCell>

                  {/* Payment */}
                  <TableCell>
                    {reg.amountPaid > 0 ? (
                      <div>
                        <span className="text-xs font-bold text-foreground">
                          ৳ {reg.amountPaid}
                        </span>
                        <div className="text-[10px] text-muted-foreground">
                          {reg.paymentMethod}: {reg.transactionId || "No Trx"}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-medium">
                        Free
                      </Badge>
                    )}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell>
                    <Badge
                      variant={eventRegistrationBadgeVariant(reg.status)}
                      className="text-[11px] font-semibold"
                    >
                      {t(eventRegistrationStatusLabel(reg.status))}
                    </Badge>
                  </TableCell>

                  {/* Inline State Update Controls */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Quick Complete / Check in */}
                      {reg.status !== EventRegistrationStatus.ATTENDED && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === reg.id}
                          onClick={() =>
                            handleUpdateStatus(reg.id, EventRegistrationStatus.ATTENDED)
                          }
                          className="h-7 text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/30"
                          title="Mark as Attended / Complete"
                        >
                          {updatingId === reg.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Check className="size-3.5 mr-1" />
                          )}
                          {t({ en: "Admit", bn: "প্রবেশ" })}
                        </Button>
                      )}

                      {/* Quick Confirm if pending */}
                      {reg.status === EventRegistrationStatus.PENDING && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === reg.id}
                          onClick={() =>
                            handleUpdateStatus(reg.id, EventRegistrationStatus.CONFIRMED)
                          }
                          className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          title="Confirm Registration"
                        >
                          <Check className="size-3.5 mr-1" />
                          {t({ en: "Confirm", bn: "নিশ্চিত" })}
                        </Button>
                      )}

                      {/* Status Dropdown */}
                      <Select
                        value={reg.status}
                        onValueChange={(val) => {
                          if (val) handleUpdateStatus(reg.id, val as EventRegistrationStatus)
                        }}
                        disabled={updatingId === reg.id}
                      >
                        <SelectTrigger className="h-7 text-[11px] font-semibold bg-background w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                          <SelectItem value={EventRegistrationStatus.CONFIRMED}>
                            CONFIRMED
                          </SelectItem>
                          <SelectItem value={EventRegistrationStatus.ATTENDED}>
                            ATTENDED
                          </SelectItem>
                          <SelectItem value={EventRegistrationStatus.PENDING}>
                            PENDING
                          </SelectItem>
                          <SelectItem value={EventRegistrationStatus.CANCELLED}>
                            CANCELLED
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        {data.totalPages > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
            <span>
              {t({
                en: `Showing ${data.registrations.length} of ${data.total} tickets (Page ${data.page} of ${data.totalPages})`,
                bn: `মোট ${data.total} টিকেটের মধ্যে ${data.registrations.length}টি প্রদর্শিত (পৃষ্ঠা ${data.page}/${data.totalPages})`,
              })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1 || loading}
                onClick={() => fetchData(selectedEventId, status, searchInput, data.page - 1)}
                className="h-7 text-xs"
              >
                {t({ en: "Previous", bn: "পূর্ববর্তী" })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.totalPages || loading}
                onClick={() => fetchData(selectedEventId, status, searchInput, data.page + 1)}
                className="h-7 text-xs"
              >
                {t({ en: "Next", bn: "পরবর্তী" })}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
