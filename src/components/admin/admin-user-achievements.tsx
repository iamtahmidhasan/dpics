"use client"

import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  PenSquare,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { useLanguage } from "@/components/language-provider"
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
import type { AchievementPage, AdminAchievementSummary } from "@/lib/services/achievement.service"
import { cn } from "cn"

const ALL = "ALL"

const STATUS_TABS: { value: string; label: { en: string; bn: string } }[] = [
  { value: ALL, label: { en: "All", bn: "সব" } },
  { value: PostStatus.PUBLISHED, label: { en: "Published", bn: "প্রকাশিত" } },
  { value: PostStatus.PENDING, label: { en: "In review", bn: "পর্যালোচনায়" } },
  { value: PostStatus.DRAFT, label: { en: "Drafts", bn: "খসড়া" } },
  { value: PostStatus.REJECTED, label: { en: "Rejected", bn: "ফেরত" } },
  { value: PostStatus.ARCHIVED, label: { en: "Archived", bn: "আর্কাইভ" } },
]

export function AdminUserAchievements({
  userId,
  userName,
  initialAchievements = {
    achievements: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  },
}: {
  userId: string
  userName: string
  initialAchievements?: AchievementPage<AdminAchievementSummary>
}) {
  const { t, lang } = useLanguage()
  const isBn = lang === "bn"

  const [data, setData] = useState<AchievementPage<AdminAchievementSummary>>(initialAchievements)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>(ALL)
  const [page, setPage] = useState(1)

  // Review states
  const [rejectItem, setRejectItem] = useState<AdminAchievementSummary | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [reviewing, setReviewing] = useState(false)

  // Delete state
  const [deleteItem, setDeleteItem] = useState<AdminAchievementSummary | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchData = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({
        authorId: userId,
        page: String(page),
      })
      if (search) q.set("q", search)
      if (status !== ALL) q.set("status", status)

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
  }, [page, search, status, userId])

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

  return (
    <Card className="border-border/80 shadow-xs">
      <CardContent className="space-y-4 pt-4">
        {/* Header summary */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">
              {t(`${userName}'s Achievements`, `${userName}-এর অর্জনসমূহ`)}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t(
                "Review, approve, or manage achievements authored by this user.",
                "এই ব্যবহারকারীর জমাদানকৃত অর্জনসমূহ পর্যালোচনা বা পরিচালনা করুন।"
              )}
            </p>
          </div>

          <Link href="/admin/achievements/add" className={buttonVariants({ size: "sm" })}>
            <Plus className="size-3.5" />
            {t("Add achievement", "অর্জন যোগ করুন")}
          </Link>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b pb-2.5">
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
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                    : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {t(tab.label)}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("Filter achievements…", "অর্জন খুঁজুন…")}
            className="pl-8 text-xs h-8"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>{t("Title & Organization", "শিরোনাম ও প্রতিষ্ঠান")}</TableHead>
                <TableHead>{t("Category", "ক্যাটাগরি")}</TableHead>
                <TableHead>{t("Status", "অবস্থা")}</TableHead>
                <TableHead>{t("Event Date", "তারিখ")}</TableHead>
                <TableHead className="text-right">{t("Actions", "কাজ")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.achievements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Spinner className="size-4" />
                        <span>{t("Loading…", "লোড হচ্ছে…")}</span>
                      </div>
                    ) : (
                      t("No achievements found for this user.", "এই ব্যবহারকারীর কোনো অর্জন পাওয়া যায়নি।")
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                data.achievements.map((item) => {
                  const displayTitle = isBn && item.titleBn ? item.titleBn : item.title
                  const displayOrg = isBn && item.organizationBn ? item.organizationBn : item.organization

                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30">
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

                      <TableCell className="text-xs text-muted-foreground">
                        {item.category ? (
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {isBn && item.category.nameBn ? item.category.nameBn : item.category.name}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={achievementStatusBadgeVariant(item.status)}
                          className="text-[10px] uppercase font-semibold"
                        >
                          {t(achievementStatusLabel(item.status))}
                        </Badge>
                      </TableCell>

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

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.status === PostStatus.PENDING && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs"
                                onClick={() => handleApprove(item)}
                                title={t("Approve", "অনুমোদন")}
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
                                title={t("Reject with note", "মতামতসহ ফেরত")}
                              >
                                <X className="size-3.5" />
                              </Button>
                            </>
                          )}

                          <Link
                            href={`/admin/achievements/${item.id}`}
                            className={buttonVariants({ variant: "ghost", size: "sm", className: "h-7 px-2 text-xs" })}
                          >
                            <PenSquare className="size-3.5" />
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteItem(item)}
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

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
            <span>
              {t(`Page ${data.page} of ${data.totalPages}`, `পৃষ্ঠা ${data.page} / ${data.totalPages}`)}
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

      {/* Reject Modal */}
      <Dialog open={Boolean(rejectItem)} onOpenChange={(open) => !open && setRejectItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-amber-600 flex items-center gap-2">
              <MessageSquare className="size-5" />
              {t("Reject Achievement", "অর্জন ফেরত পাঠান")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t(
                "Explain why this achievement needs revision.",
                "লেখককে জানান কেন এটি পরিবর্তন করা প্রয়োজন।"
              )}
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder={t("e.g. Please provide a clear certificate image or event proof...", "যেমন: সুস্পষ্ট সার্টিফিকেট ছবি যুক্ত করুন...")}
            rows={3}
            className="text-xs"
          />

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRejectItem(null)}>
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

      {/* Delete Modal */}
      <Dialog open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="size-5" />
              {t("Delete Achievement?", "অর্জন মুছে ফেলতে চান?")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t(
                `Are you sure you want to delete "${deleteItem?.title}"?`,
                `আপনি কি নিশ্চিত যে "${deleteItem?.title}" মুছে ফেলতে চান?`
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteItem(null)}>
              {t("Cancel", "বাতিল")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSubmit}
              disabled={deleting}
            >
              {deleting && <Spinner className="size-3.5" />}
              {t("Delete", "মুছুন")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
