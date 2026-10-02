"use client"

import {
  Clock3,
  ExternalLink,
  FileText,
  PenSquare,
  Plus,
  Search,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

export type UserPostItem = {
  id: string
  title: string
  titleBn: string | null
  slug: string
  excerpt: string | null
  coverImage: string | null
  status: PostStatus
  isFeatured: boolean
  readingMinutes: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    nameBn: string | null
    slug: string
  } | null
  tags: string[]
}

export type UserPostsPayload = {
  posts: UserPostItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const ALL = "ALL"

const STATUS_TABS: { value: string; label: { en: string; bn: string } }[] = [
  { value: ALL, label: { en: "All", bn: "সব" } },
  { value: PostStatus.PUBLISHED, label: { en: "Published", bn: "প্রকাশিত" } },
  { value: PostStatus.PENDING, label: { en: "In review", bn: "পর্যালোচনায়" } },
  { value: PostStatus.UPDATE, label: { en: "Updates", bn: "আপডেট" } },
  { value: PostStatus.DRAFT, label: { en: "Drafts", bn: "খসড়া" } },
  { value: PostStatus.REJECTED, label: { en: "Rejected", bn: "ফেরত" } },
  { value: PostStatus.ARCHIVED, label: { en: "Archived", bn: "আর্কাইভ" } },
]

export function AdminUserPosts({
  userId,
  userName,
  initialPosts,
}: {
  userId: string
  userName: string
  initialPosts: UserPostsPayload
}) {
  const { t, lang } = useLanguage()
  const [status, setStatus] = useState<string>(ALL)
  const [category, setCategory] = useState<string>(ALL)
  const [categories, setCategories] = useState<
    { id: string; name: string; nameBn: string | null; slug: string }[]
  >([])
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const key = `${userId}|${page}|${search}|${status}|${category}`
  const [state, setState] = useState<{
    key: string
    data: UserPostsPayload
    error: string | null
  }>({
    key,
    data: initialPosts,
    error: null,
  })

  // Fetch categories for filtering
  useEffect(() => {
    fetch("/api/categories?type=post")
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        if (Array.isArray(list)) setCategories(list)
      })
      .catch(() => {})
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch posts when filters change
  useEffect(() => {
    if (state.key === key) return

    const controller = new AbortController()

    const params = new URLSearchParams({
      page: String(page),
      authorId: userId,
    })

    if (search) params.set("q", search)
    if (status && status !== ALL) params.set("status", status)
    if (category && category !== ALL) params.set("category", category)

    fetch(`/api/admin/posts?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body?.error?.message ?? "Failed to fetch posts")
        return body as UserPostsPayload
      })
      .then((resData) => {
        setState({ key, data: resData, error: null })
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const message = err instanceof Error ? err.message : "Failed to load posts"
        setState((prev) => ({ ...prev, key, error: message }))
      })

    return () => controller.abort()
  }, [category, key, page, search, state.key, status, userId])

  const isLoading = state.key !== key
  const data = state.data
  const error = state.error

  const statusLabel = useMemo(() => postStatusLabel(t), [t])
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-US", { dateStyle: "medium" }),
    [lang]
  )

  const publishedCount = data.posts.filter((p) => p.status === PostStatus.PUBLISHED).length
  const pendingCount = data.posts.filter((p) => p.status === PostStatus.PENDING).length
  const draftCount = data.posts.filter((p) => p.status === PostStatus.DRAFT).length

  return (
    <div className="space-y-4">
      {/* Stats summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card size="sm" className="p-3">
          <p className="text-[0.6875rem] text-muted-foreground">{t("Total Posts", "মোট পোস্ট")}</p>
          <p className="font-heading text-lg font-bold">{data.total}</p>
        </Card>
        <Card size="sm" className="p-3">
          <p className="text-[0.6875rem] text-muted-foreground">{t("Published", "প্রকাশিত")}</p>
          <p className="font-heading text-lg font-bold text-success">{publishedCount}</p>
        </Card>
        <Card size="sm" className="p-3">
          <p className="text-[0.6875rem] text-muted-foreground">{t("In Review", "পর্যালোচনায়")}</p>
          <p className="font-heading text-lg font-bold text-amber-500">{pendingCount}</p>
        </Card>
        <Card size="sm" className="p-3">
          <p className="text-[0.6875rem] text-muted-foreground">{t("Drafts", "খসড়া")}</p>
          <p className="font-heading text-lg font-bold text-muted-foreground">{draftCount}</p>
        </Card>
      </div>

      <Card size="sm">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="size-4" />
                {t(`Articles written by ${userName}`, `${userName}-এর লেখা পোস্টসমূহ`)}
              </CardTitle>
              <CardDescription className="text-xs">
                {t(
                  "Manage, review, edit, or publish posts authored by this user.",
                  "এই ব্যবহারকারীর লেখা পোস্টগুলো দেখুন, সম্পাদনা করুন বা প্রকাশ করুন।"
                )}
              </CardDescription>
            </div>

            <Link
              href="/admin/posts/new"
              className={cn(buttonVariants({ size: "sm" }), "gap-1")}
            >
              <Plus className="size-3.5" />
              {t("New post", "নতুন পোস্ট")}
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {/* Status tabs */}
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
                </button>
              )
            })}
          </div>

          {/* Filters: Search and Category */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative sm:max-w-64 sm:flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
              <SelectTrigger className="w-full sm:w-44" aria-label={t("Category", "বিভাগ")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("All categories", "সব বিভাগ")}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {lang === "bn" && cat.nameBn ? `${cat.nameBn} (${cat.name})` : cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isLoading && <Spinner className="size-4 text-muted-foreground" />}
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}

          {/* Posts Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">{t("Cover", "ছবি")}</TableHead>
                  <TableHead>{t("Title", "শিরোনাম")}</TableHead>
                  <TableHead>{t("Category", "বিভাগ")}</TableHead>
                  <TableHead>{t("Status", "অবস্থা")}</TableHead>
                  <TableHead>{t("Reading", "সময়")}</TableHead>
                  <TableHead>{t("Updated", "হালনাগাদ")}</TableHead>
                  <TableHead className="text-right">{t("Actions", "কাজ")}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground py-8 text-center text-xs">
                      {t("No posts found for this user.", "এই ব্যবহারকারীর কোনো পোস্ট পাওয়া যায়নি।")}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="relative size-9 overflow-hidden rounded border bg-muted">
                          {post.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={post.coverImage}
                              alt=""
                              className="size-full object-cover"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                              }}
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-[0.625rem] text-muted-foreground">
                              —
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="max-w-xs">
                        <span className="line-clamp-1 font-medium">
                          {lang === "bn" && post.titleBn ? `${post.titleBn} (${post.title})` : post.title}
                        </span>
                        {post.excerpt ? (
                          <span className="line-clamp-1 text-[0.6875rem] text-muted-foreground">
                            {post.excerpt}
                          </span>
                        ) : null}
                      </TableCell>

                      <TableCell>
                        {post.category ? (
                          <Badge variant="outline" className="text-[0.625rem]">
                            {lang === "bn" && post.category.nameBn
                              ? post.category.nameBn
                              : post.category.name}
                          </Badge>
                        ) : (
                          <span className="text-[0.6875rem] text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant={postStatusBadgeVariant(post.status)} className="text-[0.625rem]">
                          {statusLabel(post.status)}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="size-3" />
                          {post.readingMinutes}m
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {dateFormatter.format(new Date(post.updatedAt))}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          {post.status === PostStatus.PUBLISHED && (
                            <a
                              href={`/posts/${post.slug}`}
                              target="_blank"
                              rel="noreferrer noopener"
                              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                              title={t("View live", "লাইভ দেখুন")}
                            >
                              <ExternalLink className="size-3" />
                            </a>
                          )}
                          <Link
                            href={`/admin/posts/${post.id}`}
                            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
                            title={t("Edit post", "পোস্ট সম্পাদনা")}
                          >
                            <PenSquare className="size-3" />
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
              <span>
                {t(
                  `Page ${data.page} of ${data.totalPages} (${data.total} total)`,
                  `পৃষ্ঠা ${data.page} / ${data.totalPages} (মোট ${data.total})`
                )}
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t("Previous", "আগের")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("Next", "পরের")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
