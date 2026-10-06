"use client"

import { useState } from "react"
import {
  CalendarDays,
  ExternalLink,
  Globe,
  MapPin,
  PenSquare,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Video,
} from "lucide-react"
import Link from "next/link"

import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EventStatus, EventType } from "@/generated/prisma/enums"
import {
  eventStatusBadgeVariant,
  eventStatusLabel,
  eventTypeLabel,
} from "@/lib/event-labels"
import type { EventSummary } from "@/lib/services/event.service"

const ALL = "ALL"

const STATUS_TABS: { value: string; label: { en: string; bn: string } }[] = [
  { value: ALL, label: { en: "All", bn: "সব" } },
  { value: EventStatus.UPCOMING, label: { en: "Upcoming", bn: "আসন্ন" } },
  { value: EventStatus.ONGOING, label: { en: "Ongoing", bn: "চলমান" } },
  { value: EventStatus.COMPLETED, label: { en: "Completed", bn: "সম্পন্ন" } },
  { value: EventStatus.DRAFT, label: { en: "Drafts", bn: "খসড়া" } },
  { value: EventStatus.CANCELLED, label: { en: "Cancelled", bn: "বাতিল" } },
]

export type AdminEventsPayload = {
  events: EventSummary[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  counts: Record<EventStatus, number> & { total: number }
}

export function AdminEventsTable({
  initialData,
}: {
  initialData: AdminEventsPayload
}) {
  const { t, lang } = useLanguage()
  const isBn = lang === "bn"

  const [data, setData] = useState<AdminEventsPayload>(initialData)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [status, setStatus] = useState<string>(ALL)
  const [page, setPage] = useState(1)

  // Delete modal state
  const [deleteItem, setDeleteItem] = useState<EventSummary | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = async (overrideStatus?: string, overrideSearch?: string, overridePage?: number) => {
    setLoading(true)
    try {
      const activeStatus = overrideStatus ?? status
      const activeSearch = overrideSearch ?? searchInput
      const activePage = overridePage ?? page

      const query = new URLSearchParams()
      if (activeStatus !== ALL) query.set("status", activeStatus)
      if (activeSearch.trim()) query.set("q", activeSearch.trim())
      query.set("page", String(activePage))
      query.set("pageSize", "15")

      const res = await fetch(`/api/admin/events?${query.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (newStatus: string) => {
    setStatus(newStatus)
    setPage(1)
    fetchData(newStatus, searchInput, 1)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchData(status, searchInput, 1)
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/events/${deleteItem.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setDeleteItem(null)
        fetchData()
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Header bar with status tabs & Add button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.value === ALL
                ? data.counts.total
                : data.counts[tab.value as EventStatus] ?? 0

            return (
              <Button
                key={tab.value}
                variant={status === tab.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleTabChange(tab.value)}
                className="h-8 text-xs font-medium gap-1.5"
              >
                <span>{t(tab.label)}</span>
                <span className="rounded-full bg-background/20 px-1.5 py-0.2 text-[10px] font-bold">
                  {count}
                </span>
              </Button>
            )
          })}
        </div>

        <Button
          size="sm"
          nativeButton={false}
          render={<Link href="/admin/events/add" />}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="size-4" />
          {t({ en: "New Event", bn: "নতুন ইভেন্ট" })}
        </Button>
      </div>

      {/* Search Input bar */}
      <div className="flex items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t({ en: "Search events by title, venue...", bn: "শিরোনাম বা স্থান দিয়ে খুঁজুন..." })}
            className="h-8 text-xs pr-8"
          />
          <button type="submit" className="absolute right-2 top-2 text-muted-foreground hover:text-foreground">
            <Search className="size-4" />
          </button>
        </form>

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

      {/* Events Table */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t({ en: "Event", bn: "ইভেন্ট" })}</TableHead>
              <TableHead>{t({ en: "Type", bn: "ধরণ" })}</TableHead>
              <TableHead>{t({ en: "Date & Venue", bn: "তারিখ ও স্থান" })}</TableHead>
              <TableHead>{t({ en: "Registrations", bn: "নিবন্ধন" })}</TableHead>
              <TableHead>{t({ en: "Status", bn: "স্ট্যাটাস" })}</TableHead>
              <TableHead className="text-right">{t({ en: "Actions", bn: "পদক্ষেপ" })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                  {t({ en: "No events found.", bn: "কোনো ইভেন্ট পাওয়া যায়নি।" })}
                </TableCell>
              </TableRow>
            ) : (
              data.events.map((event) => {
                const startDate = new Date(event.startDate)
                const formattedDate = new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(startDate)

                return (
                  <TableRow key={event.id}>
                    {/* Event Title & Category */}
                    <TableCell className="max-w-xs">
                      <div className="font-semibold text-xs text-foreground truncate">
                        {isBn && event.titleBn ? event.titleBn : event.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        {event.category && (
                          <span className="font-medium text-primary">
                            {isBn && event.category.nameBn ? event.category.nameBn : event.category.name}
                          </span>
                        )}
                        <span>•</span>
                        <span>{event.isFree ? "Free" : `৳ ${event.registrationFee}`}</span>
                      </div>
                    </TableCell>

                    {/* Event Type */}
                    <TableCell>
                      <Badge variant="secondary" className="text-[11px] font-normal gap-1">
                        {event.eventType === EventType.ONLINE ? (
                          <Video className="size-3 text-sky-500" />
                        ) : event.eventType === EventType.HYBRID ? (
                          <Globe className="size-3 text-purple-500" />
                        ) : (
                          <MapPin className="size-3 text-emerald-500" />
                        )}
                        {t(eventTypeLabel(event.eventType))}
                      </Badge>
                    </TableCell>

                    {/* Date & Venue */}
                    <TableCell>
                      <div className="text-xs text-foreground flex items-center gap-1">
                        <CalendarDays className="size-3 text-primary shrink-0" />
                        {formattedDate}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[160px] mt-0.5">
                        {event.venue || "Online"}
                      </div>
                    </TableCell>

                    {/* Registrations count */}
                    <TableCell>
                      <Link
                        href={`/admin/events/${event.id}/registrations`}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Users className="size-3" />
                        <span>
                          {event.confirmedRegistrationsCount}
                          {event.maxParticipants ? ` / ${event.maxParticipants}` : ""}
                        </span>
                      </Link>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <Badge
                        variant={eventStatusBadgeVariant(event.status)}
                        className="text-[11px]"
                      >
                        {t(eventStatusLabel(event.status))}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          nativeButton={false}
                          render={<Link href={`/events/${event.slug}`} target="_blank" />}
                          title="View on site"
                          className="size-7"
                        >
                          <ExternalLink className="size-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          nativeButton={false}
                          render={<Link href={`/admin/events/${event.id}`} />}
                          title="Edit event"
                          className="size-7"
                        >
                          <PenSquare className="size-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteItem(event)}
                          title="Delete event"
                          className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t({ en: "Delete Event", bn: "ইভেন্ট মুছে ফেলুন" })}
            </DialogTitle>
            <DialogDescription>
              {t({
                en: `Are you sure you want to delete "${deleteItem?.title}"? All attendee registrations will also be removed. This cannot be undone.`,
                bn: `আপনি কি নিশ্চিতভাবে "${deleteItem?.title}" মুছে ফেলতে চান? সকল অংশগ্রহণকারীর তথ্য মুছে যাবে।`,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteItem(null)} disabled={deleting}>
              {t({ en: "Cancel", bn: "বাতিল" })}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting
                ? t({ en: "Deleting...", bn: "মুছে ফেলা হচ্ছে..." })
                : t({ en: "Delete", bn: "মুছে ফেলুন" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
