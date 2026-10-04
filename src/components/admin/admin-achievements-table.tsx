"use client"

import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  PenSquare,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { PostStatus } from "@/generated/prisma/enums"
import { achievementStatusBadgeVariant, achievementStatusLabel } from "@/lib/achievement-labels"
import type { AdminAchievementSummary } from "@/lib/services/achievement.service"
import { cn } from "cn"

const SEARCH_DEBOUNCE_MS = 300
const ALL = "ALL"

const STATUS_TABS: { value: string; label: { en: string; bn: string } }[] = [
  { value: ALL, label: { en: "All", bn: "সব" } },
  { value: PostStatus.PUBLISHED, label: { en: "Published", bn: "প্রকাশিত" } },
  { value: PostStatus.PENDING, label: { en: "In review", bn: "পর্যালোচনায়" } },
  { value: PostStatus.DRAFT, label: { en: "Drafts", bn: "খসড়া" } },
  { value: PostStatus.REJECTED, label: { en: "Rejected", bn: "ফেরত পাঠানো" } },
  { value: PostStatus.ARCHIVED, label: { en: "Archived", bn: "আর্কাইভ" } },
]

export type AdminAchievementsPayload = {
  achievements: AdminAchievementSummary[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  counts: Record<PostStatus, number> & { total: number }
}

export function AdminAchievementsTable({
  initialData,
}: {
  initialData: AdminAchievementsPayload
}) {
  const { t, lang } = useLanguage()
  const isBn = lang === "bn"

  const [data, setData] = useState<AdminAchievementsPayload>(initialData)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>(ALL)
  const [category, setCategory] = useState<string>(ALL)
  const [categories, setCategories] = useState<{ id: string; name: string; nameBn: string | null; slug: string }[]>([])
  const [page, setPage] = useState(1)

  // Review & Delete modal states
  const [rejectItem, setRejectItem] = useState<AdminAchievementSummary | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [reviewing, setReviewing] = useState(false)

  const [deleteItem, setDeleteItem] = useState<AdminAchievementSummary | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch categories
  useEffect(() => {
    fetch("/api/categories?type=ACHIEVEMENT")
      .then((res) => (res.ok ? res.json() : []))
      .then((cats) => {
        if (Array.isArray(cats)) setCategories(cats)
      })
      .catch(() => {})
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch data
  const fetchData = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      if (page > 1) q.set("page", String(page))
      if (search) q.set("q", search)
      if (status !== ALL) q.set("status", status)
      if (category !== ALL) q.set("category", category)

      const res = await fetch(`/api/admin/achievements?${q.toString()}`)
      if (res.ok) {
        const body = await res.json()
        setData(body)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status, category])

  // Quick Approve
  const handleApprove = async (item: AdminAchievementSummary) => {
    try {
      const res = await fetch(`/api/admin/achievements/${item.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "APPROVE" }),
      })
      if (res.ok) {
        fetchData()
      }
    } catch {}
  }

  // Reject with feedback
  const handleRejectSubmit = async () => {
    if (!rejectItem) return
    setReviewing(true)
    try {
      const res = await fetch(`/api/admin/achievements/${rejectItem.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "REJECT", reason: rejectionReason }),
      })
      if (res.ok) {
        setRejectItem(null)
        setRejectionReason("")
        fetchData()
      }
    } finally {
      setReviewing(false)
    }
  }

  // Delete
  const handleDeleteSubmit = async () => {
    if (!deleteItem) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/achievements/${deleteItem.id}`, {
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

  const countFor = (val: string) => {
    if (val === ALL) return data.counts.total
    return data.counts[val as PostStatus] ?? 0
  }

  return (
    <Card className="gap-3 border-border/80 shadow-xs">
      <CardContent className="space-y-4 pt-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b pb-3">
          {STATUS_TABS.map((tab) => {
            const isActive = status === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setStatus(tab.value)
                  setPage(1)
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                    : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {t(tab.label)}
                <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
                  {countFor(tab.value)}
                </span>
              </button>
            )
          })}
        </div>

        {/* Filter controls row */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1 sm:max-w-64">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("Filter by title, organization, author…", "শিরোনাম, প্রতিষ্ঠান বা লেখক দিয়ে খুঁজুন…")}
                className="pl-8 text-xs h-9"
              />
            </div>

            <Select
              value={category}
              onValueChange={(val) => {
                setCategory(val ?? ALL)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-40 text-xs h-9">
                <SelectValue placeholder={t("All categories", "সব ক্যাটাগরি")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("All categories", "সব ক্যাটাগরি")}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>
                    {isBn && c.nameBn ? c.nameBn : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={loading}
              onClick={fetchData}
              title={t("Refresh", "রিফ্রেশ")}
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            </Button>
          </div>

          <Link href="/admin/achievements/add" className={buttonVariants({ size: "sm" })}>
            <Plus className="size-3.5" />
            {t("Add achievement", "অর্জন যোগ করুন")}
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>{t("Achievement", "অর্জন")}</TableHead>
                <TableHead>{t("Author", "লেখক")}</TableHead>
                <TableHead>{t("Category", "ক্যাটাগরি")}</TableHead>
                <TableHead>{t("Status", "অবস্থা")}</TableHead>
                <TableHead>{t("Date", "তারিখ")}</TableHead>
                <TableHead className="text-right">{t("Actions", "কাজ")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.achievements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-xs text-muted-foreground">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Spinner className="size-4" />
                        <span>{t("Loading achievements…", "অর্জনসমূহ লোড হচ্ছে…")}</span>
                      </div>
                    ) : (
                      t("No achievements found matching your criteria.", "কোনো অর্জন পাওয়া যায়নি।")
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                data.achievements.map((item) => {
                  const authorInitials = (item.author.name || "?").trim().charAt(0).toUpperCase()
                  const displayTitle = isBn && item.titleBn ? item.titleBn : item.title
                  const displayOrg = isBn && item.organizationBn ? item.organizationBn : item.organization

                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      {/* Title & Organization */}
                      <TableCell className="max-w-[280px]">
                        <div className="space-y-0.5">
                          <Link
                            href={`/admin/achievements/${item.id}`}
                            className="font-medium hover:text-primary transition-colors line-clamp-1 text-xs"
                          >
                            {displayTitle}
                          </Link>
                          {displayOrg && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                              <Building2 className="size-3 shrink-0" />
                              <span>{displayOrg}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Author */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6 border">
                            {item.author.avatar && (
                              <AvatarImage src={item.author.avatar} alt={item.author.name} />
                            )}
                            <AvatarFallback className="text-[10px]">{authorInitials}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium truncate max-w-[130px]">{item.author.name}</span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                              {item.author.studentId || item.author.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell className="text-xs text-muted-foreground">
                        {item.category ? (
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {isBn && item.category.nameBn ? item.category.nameBn : item.category.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant={achievementStatusBadgeVariant(item.status)}
                          className="text-[10px] uppercase font-semibold"
                        >
                          {t(achievementStatusLabel(item.status))}
                        </Badge>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {item.eventDate ? (
                          new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }).format(new Date(item.eventDate))
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick review buttons for PENDING */}
                          {item.status === PostStatus.PENDING && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs"
                                onClick={() => handleApprove(item)}
                                title={t("Approve", "অনুমোদন করুন")}
                              >
                                <CheckCircle2 className="size-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs"
                                onClick={() => {
                                  setRejectItem(item)
                                  setRejectionReason("")
                                }}
                                title={t("Reject with note", "মতামতসহ ফেরত পাঠান")}
                              >
                                <X className="size-3.5" />
                              </Button>
                            </>
                          )}

                          <Link
                            href={`/admin/achievements/${item.id}`}
                            className={buttonVariants({ variant: "ghost", size: "sm", className: "h-7 px-2 text-xs" })}
                            title={t("Edit", "সম্পাদনা")}
                          >
                            <PenSquare className="size-3.5" />
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteItem(item)}
                            title={t("Delete", "মুছুন")}
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

        {/* Pagination footer */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
            <span>
              {t(
                `Page ${data.page} of ${data.totalPages} (${data.total} total achievements)`,
                `পৃষ্ঠা ${data.page} / ${data.totalPages} (মোট ${data.total}টি অর্জন)`
              )}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={data.page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t("Previous", "পূর্ববর্তী")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={data.page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("Next", "পরবর্তী")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Reject with Note Dialog */}
      <Dialog open={Boolean(rejectItem)} onOpenChange={(open) => !open && setRejectItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-amber-600 flex items-center gap-2">
              <MessageSquare className="size-5" />
              {t("Reject Achievement", "অর্জন ফেরত পাঠান")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t(
                "Provide feedback to the author explaining what needs correction before it can be approved.",
                "লেখককে জানান কি কারণে এটি পরিবর্তন করা প্রয়োজন যাতে সে সংশোধন করে আবার জমা দিতে পারে।"
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t("e.g. Please provide a valid certificate link and clear image proof...", "যেমন: অনুগ্রহ করে সঠিক সার্টিফিকেট লিঙ্ক ও সুস্পষ্ট ছবি যুক্ত করুন...")}
              rows={3}
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectItem(null)}
              disabled={reviewing}
            >
              {t("Cancel", "বাতিল")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRejectSubmit}
              disabled={reviewing}
            >
              {reviewing && <Spinner className="size-3.5" />}
              {t("Reject & Notify", "ফেরত পাঠান")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="size-5" />
              {t("Delete Achievement?", "অর্জন মুছে ফেলতে চান?")}
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              {t(
                `Are you sure you want to delete "${deleteItem?.title}"? This action cannot be undone.`,
                `আপনি কি নিশ্চিত যে "${deleteItem?.title}" মুছে ফেলতে চান? এই কাজটি অপরিবর্তনীয়।`
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteItem(null)}
              disabled={deleting}
            >
              {t("Cancel", "বাতিল")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSubmit}
              disabled={deleting}
            >
              {deleting && <Spinner className="size-3.5" />}
              {t("Delete Permanently", "স্থায়ীভাবে মুছুন")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
