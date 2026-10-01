"use client"

import { Loader2, PenSquare, Search } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { useAdminPosts, type AdminPostsPayload } from "@/components/admin/use-admin-posts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { PostStatus } from "@/generated/prisma/enums"
import { postStatusBadgeVariant, postStatusLabel } from "@/lib/post-labels"
import { cn } from "cn"

const SEARCH_DEBOUNCE_MS = 300
const ALL = "ALL"

const STATUS_TABS: { value: string; label: { en: string; bn: string } }[] = [
  { value: ALL, label: { en: "All", bn: "সব" } },
  { value: PostStatus.DRAFT, label: { en: "Drafts", bn: "খসড়া" } },
  { value: PostStatus.PENDING, label: { en: "In review", bn: "পর্যালোচনায়" } },
  { value: PostStatus.PUBLISHED, label: { en: "Published", bn: "প্রকাশিত" } },
  { value: PostStatus.REJECTED, label: { en: "Rejected", bn: "ফেরত পাঠানো" } },
  { value: PostStatus.ARCHIVED, label: { en: "Archived", bn: "আর্কাইভ" } },
]

type CategoryItem = {
  id: string
  name: string
  nameBn: string | null
  slug: string
}

export function AdminPostsTable({ initialData }: { initialData: AdminPostsPayload }) {
  const { t, lang } = useLanguage()
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)
  const [category, setCategory] = useState(ALL)
  const [categoryList, setCategoryList] = useState<CategoryItem[]>([])
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetch("/api/categories?type=post")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setCategoryList(data)
      })
      .catch(() => {})
  }, [])

  const { data, isLoading, error } = useAdminPosts(
    { page, search, status, category, refreshKey },
    initialData
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [searchInput])

  const statusLabel = useMemo(() => postStatusLabel(t), [t])
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-US", { dateStyle: "medium" }),
    [lang]
  )

  const counts = data.counts
  const hasPrev = data.page > 1
  const hasNext = data.page < data.totalPages

  const countFor = (value: string) =>
    value === ALL ? counts.total : counts[value as PostStatus]

  return (
    <Card size="sm" className="gap-3">
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
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
                  "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[0.6875rem] font-medium transition-colors",
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {t(tab.label)}
                <span className="text-[0.625rem] opacity-70">{countFor(tab.value)}</span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:max-w-64 sm:flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("Filter by title or tag…", "শিরোনাম বা ট্যাগ দিয়ে খুঁজুন…")}
              className="pl-7"
            />
          </div>

          <Select
            value={category}
            onValueChange={(next) => {
              setCategory(next ?? ALL)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-40" aria-label={t("Category", "বিভাগ")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("All categories", "সব বিভাগ")}</SelectItem>
              {categoryList.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {lang === "bn" && cat.nameBn ? `${cat.nameBn} (${cat.name})` : cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isLoading}
            onClick={() => setRefreshKey((value) => value + 1)}
            aria-label={t("Refresh", "রিফ্রেশ")}
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <PenSquare className="size-3.5" />
            )}
          </Button>

          <Link href="/admin/posts/new" className={buttonVariants({ size: "sm" })}>
            {t("New post", "নতুন পোস্ট")}
          </Link>
        </div>

        {error ? (
          <p className="text-destructive text-xs">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Title", "শিরোনাম")}</TableHead>
                  <TableHead>{t("Author", "লেখক")}</TableHead>
                  <TableHead>{t("Status", "অবস্থা")}</TableHead>
                  <TableHead>{t("Updated", "হালনাগাদ")}</TableHead>
                  <TableHead className="text-right">{t("Actions", "কাজ")}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center text-xs">
                      {t("No posts match these filters.", "এই ফিল্টারে কোনো পোস্ট নেই।")}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="max-w-72">
                        <span className="line-clamp-1 font-medium">
                          {lang === "bn" && post.titleBn ? `${post.titleBn} (${post.title})` : post.title}
                        </span>
                        {post.category ? (
                          <span className="text-muted-foreground text-[0.6875rem]">
                            {lang === "bn" && post.category.nameBn ? post.category.nameBn : post.category.name}
                          </span>
                        ) : null}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Avatar className="size-5">
                            {post.author.avatar ? (
                              <AvatarImage src={post.author.avatar} alt={post.author.name} />
                            ) : null}
                            <AvatarFallback>{post.author.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="line-clamp-1 text-xs">{post.author.name}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={postStatusBadgeVariant(post.status)}>
                          {statusLabel(post.status)}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {dateFormatter.format(new Date(post.updatedAt))}
                      </TableCell>

                      <TableCell className="text-right">
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className={buttonVariants({ variant: "ghost", size: "xs" })}
                        >
                          {t("Edit", "সম্পাদনা")}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {t(
              `Showing ${(data.page - 1) * data.pageSize + (data.posts.length > 0 ? 1 : 0)}–${(data.page - 1) * data.pageSize + data.posts.length} of ${data.total}`,
              `${data.total} টির মধ্যে ${(data.page - 1) * data.pageSize + (data.posts.length > 0 ? 1 : 0)}–${(data.page - 1) * data.pageSize + data.posts.length} দেখানো হচ্ছে`
            )}
          </span>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={!hasPrev || isLoading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              {t("Previous", "আগের")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={!hasNext || isLoading}
              onClick={() => setPage((value) => value + 1)}
            >
              {t("Next", "পরের")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
