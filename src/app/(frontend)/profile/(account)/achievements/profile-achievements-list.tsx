"use client"

import { Award, Plus, Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { AchievementCard } from "@/components/achievements/achievement-card"
import { AchievementPagination } from "@/components/achievements/achievement-pagination"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PostStatus } from "@/generated/prisma/enums"
import { makeT, type Lang } from "@/lib/i18n"
import type {
  AchievementListFilters,
  AchievementPage,
  AchievementSummary,
} from "@/lib/services/achievement.service"
import { cn } from "cn"

const ALL = "ALL"

const STATUS_TABS: { value: string; label: { en: string; bn: string } }[] = [
  { value: ALL, label: { en: "All", bn: "সব" } },
  { value: PostStatus.PUBLISHED, label: { en: "Published", bn: "প্রকাশিত" } },
  { value: PostStatus.PENDING, label: { en: "In review", bn: "পর্যালোচনায়" } },
  { value: PostStatus.DRAFT, label: { en: "Drafts", bn: "খসড়া" } },
  { value: PostStatus.REJECTED, label: { en: "Needs work", bn: "ফেরত" } },
]

export function ProfileAchievementsList({
  initialData,
  counts,
  filters,
  lang,
}: {
  initialData: AchievementPage<AchievementSummary>
  counts: Record<PostStatus, number> & { total: number }
  filters: AchievementListFilters
  lang: Lang
}) {
  const router = useRouter()
  const t = makeT(lang)
  const [data, setData] = useState(initialData)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const buildHref = (nextPage: number, overrides?: { status?: string | null }) => {
    const query = new URLSearchParams()
    const activeStatus =
      overrides && overrides.status !== undefined ? overrides.status : filters.status

    if (activeStatus && activeStatus !== ALL) query.set("status", activeStatus)
    if (filters.category) query.set("category", filters.category)
    if (filters.q) query.set("q", filters.q)
    if (nextPage > 1) query.set("page", String(nextPage))

    const searchStr = query.toString()
    return searchStr ? `/profile/achievements?${searchStr}` : "/profile/achievements"
  }

  const countFor = (val: string) => {
    if (val === ALL) return counts.total
    return counts[val as PostStatus] ?? 0
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t("Are you sure you want to delete this draft achievement?", "আপনি কি নিশ্চিত যে এই খসড়াটি মুছে ফেলতে চান?"))) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/my/achievements/${id}`, { method: "DELETE" })
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          achievements: prev.achievements.filter((a) => a.id !== id),
          total: prev.total - 1,
        }))
        router.refresh()
      }
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async (id: string) => {
    try {
      const res = await fetch(`/api/my/achievements/${id}/submit`, { method: "POST" })
      if (res.ok) {
        router.refresh()
      }
    } catch {}
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b pb-2.5">
        {STATUS_TABS.map((tab) => {
          const isActive =
            (!filters.status && tab.value === ALL) || filters.status === tab.value
          const href =
            tab.value === ALL ? buildHref(1, { status: null }) : buildHref(1, { status: tab.value })

          return (
            <Link
              key={tab.value}
              href={href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {t(tab.label)}
              <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
                {countFor(tab.value)}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Grid or Empty */}
      {data.achievements.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center bg-card/50">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Award className="size-6" />
          </div>
          <h3 className="mt-4 font-heading text-base font-semibold">
            {t("No achievements found", "কোনো অর্জন পাওয়া যায়নি")}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {t(
              "You have not added any achievements in this section yet. Share your success with the community!",
              "আপনি এখনও এই বিভাগে কোনো অর্জন যোগ করেননি। কমিউনিটির সাথে আপনার সফলতা শেয়ার করুন!"
            )}
          </p>
          <div className="mt-5">
            <Link href="/profile/achievements/add" className={buttonVariants({ size: "sm" })}>
              <Plus className="size-3.5" />
              {t("Add your first achievement", "প্রথম অর্জন যোগ করুন")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.achievements.map((item) => (
            <AchievementCard
              key={item.id}
              achievement={item}
              lang={lang}
              href={`/achievements/${item.slug}`}
              showStatus
              isAuthorView
              onDelete={handleDelete}
              onSubmit={handleSubmit}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <AchievementPagination
          page={data.page}
          totalPages={data.totalPages}
          buildHref={buildHref}
          labels={{
            previous: t("Previous", "পূর্ববর্তী"),
            next: t("Next", "পরবর্তী"),
            page: (cur, tot) =>
              t(`Page ${cur} of ${tot}`, `পৃষ্ঠা ${cur} / ${tot}`),
          }}
          className="pt-4"
        />
      )}
    </div>
  )
}
