"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  CheckCircle2,
  Code2,
  ExternalLink,
  FolderGit2,
  Globe,
  MessageSquare,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react"

import { GithubIcon } from "@/components/icons/github-icon"
import { useLanguage } from "@/components/language-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { Spinner } from "@/components/ui/spinner"
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
import type { AdminProjectSummary, ProjectListResult } from "@/lib/services/project.service"
import { cn } from "cn"

const ALL = "ALL"

const STATUS_TABS: { value: string; label: { en: string; bn: string } }[] = [
  { value: ALL, label: { en: "All", bn: "সব" } },
  { value: PostStatus.PUBLISHED, label: { en: "Published", bn: "প্রকাশিত" } },
  { value: PostStatus.PENDING, label: { en: "Pending Review", bn: "অপেক্ষমান" } },
  { value: PostStatus.DRAFT, label: { en: "Drafts", bn: "খসড়া" } },
  { value: PostStatus.REJECTED, label: { en: "Rejected", bn: "ফেরত" } },
]

export function AdminUserProjects({
  userId,
  userName,
  initialProjects = {
    projects: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  },
}: {
  userId: string
  userName: string
  initialProjects?: ProjectListResult
}) {
  const { t, lang } = useLanguage()
  const isBn = lang === "bn"

  const [data, setData] = useState<ProjectListResult>(initialProjects)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>(ALL)
  const [page, setPage] = useState(1)

  // Review states
  const [reviewItem, setReviewItem] = useState<AdminProjectSummary | null>(null)
  const [reviewStatus, setReviewStatus] = useState<PostStatus>(PostStatus.PUBLISHED)
  const [reviewFeedback, setReviewFeedback] = useState("")
  const [reviewing, setReviewing] = useState(false)

  // Delete states
  const [deleteItem, setDeleteItem] = useState<AdminProjectSummary | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch projects for this user
  const fetchProjects = async (targetPage = page, targetStatus = status, targetSearch = search) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("authorId", userId)
      params.set("page", String(targetPage))
      params.set("pageSize", "20")

      if (targetStatus !== ALL) {
        params.set("status", targetStatus)
      }
      if (targetSearch) {
        params.set("q", targetSearch)
      }

      const res = await fetch(`/api/admin/projects?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error("Failed to fetch user projects:", err)
    } finally {
      setLoading(false)
    }
  }

  // Refetch when status or search or page changes
  useEffect(() => {
    fetchProjects(page, status, search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, search, userId])

  const handleReviewSubmit = async () => {
    if (!reviewItem) return
    setReviewing(true)
    try {
      const res = await fetch(`/api/admin/projects/${reviewItem.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewStatus,
          massageForAuthor: reviewFeedback.trim() || null,
        }),
      })

      if (res.ok) {
        setReviewItem(null)
        setReviewFeedback("")
        fetchProjects()
      }
    } catch (err) {
      console.error("Failed to review project:", err)
    } finally {
      setReviewing(false)
    }
  }

  const handleDeleteSubmit = async () => {
    if (!deleteItem) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/projects/${deleteItem.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setDeleteItem(null)
        fetchProjects()
      }
    } catch (err) {
      console.error("Failed to delete project:", err)
    } finally {
      setDeleting(false)
    }
  }

  const renderStatusBadge = (s: PostStatus) => {
    switch (s) {
      case PostStatus.PUBLISHED:
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs">
            {t("Published", "প্রকাশিত")}
          </Badge>
        )
      case PostStatus.PENDING:
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs">
            {t("Pending Review", "পর্যালোচনা অপেক্ষমান")}
          </Badge>
        )
      case PostStatus.REJECTED:
        return (
          <Badge variant="destructive" className="text-xs">
            {t("Changes Requested", "ফেরত")}
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            {t("Draft", "খসড়া")}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Top action & search header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FolderGit2 className="size-4 text-cyan-500" />
            <h2 className="font-heading text-base font-semibold">
              {t("User Projects & Showcases", "ব্যবহারকারীর প্রজেক্ট ও প্রদর্শনী")}
            </h2>
            <Badge variant="secondary" className="text-xs font-mono">
              {data.total}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              `Managing project submissions and portfolios authored by ${userName}.`,
              `${userName}-এর তৈরি করা প্রজেক্ট, হার্ডওয়্যার ডেমো ও পোর্টফোলিও পরিচালনা।`
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/projects/new"
            className={buttonVariants({ size: "sm", className: "gap-1.5" })}
          >
            <Plus className="size-3.5" />
            <span>{t("New Project", "নতুন প্রজেক্ট")}</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <Card className="p-3 border-border/80 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {STATUS_TABS.map((tab) => {
              const active = status === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setStatus(tab.value)
                    setPage(1)
                  }}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap",
                    active
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {t(tab.label)}
                </button>
              )
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("Search projects...", "প্রজেক্ট খুঁজুন...")}
              className="pl-8 pr-7 h-8 text-xs"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Projects Table / List */}
      <Card className="overflow-hidden border-border/80">
        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <Spinner className="size-5 mx-auto text-primary" />
            <p>{t("Loading user projects...", "প্রজেক্ট লোড হচ্ছে...")}</p>
          </div>
        ) : data.projects.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FolderGit2 className="size-10 mx-auto text-muted-foreground/30" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {t("No projects found", "কোনো প্রজেক্ট পাওয়া যায়নি")}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {status !== ALL || search
                  ? t("Try clearing the search or status filter.", "সার্চ বা ফিল্টার পরিবর্তন করে চেষ্টা করুন।")
                  : t("This user has not submitted any projects yet.", "এই ব্যবহারকারী এখনো কোনো প্রজেক্ট তৈরি বা জমা দেননি।")}
              </p>
            </div>
            <Link
              href="/admin/projects/new"
              className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}
            >
              <Plus className="size-3.5" />
              <span>{t("Submit Project for User", "প্রজেক্ট তৈরি করুন")}</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="w-[340px]">{t("Project", "প্রজেক্ট")}</TableHead>
                  <TableHead>{t("Category", "ক্যাটাগরি")}</TableHead>
                  <TableHead>{t("Tech Stack", "টেক স্ট্যাক")}</TableHead>
                  <TableHead>{t("Status", "স্ট্যাটাস")}</TableHead>
                  <TableHead>{t("Links", "লিঙ্ক")}</TableHead>
                  <TableHead className="text-right">{t("Actions", "অ্যাকশন")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.projects.map((project) => (
                  <TableRow key={project.id} className="text-xs">
                    {/* Project info */}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {project.coverImage ? (
                          <img
                            src={project.coverImage}
                            alt={project.title}
                            className="size-10 rounded-md object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="size-10 rounded-md bg-muted/60 border border-border flex items-center justify-center shrink-0 text-muted-foreground">
                            <FolderGit2 className="size-5" />
                          </div>
                        )}
                        <div className="min-w-0 space-y-0.5">
                          <Link
                            href={`/admin/projects/${project.slug}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                          >
                            {project.title}
                          </Link>
                          {project.excerpt && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {project.excerpt}
                            </p>
                          )}
                          {project.massageForAuthor && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 line-clamp-1">
                              <MessageSquare className="size-2.5 shrink-0" />
                              <span>{project.massageForAuthor}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] py-0">
                        {project.category?.name || "Project"}
                      </Badge>
                    </TableCell>

                    {/* Tech Stack */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {project.techStack.slice(0, 3).map((tech) => (
                          <Badge
                            key={tech}
                            variant="secondary"
                            className="text-[9px] py-0 px-1 font-mono"
                          >
                            {tech}
                          </Badge>
                        ))}
                        {project.techStack.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{project.techStack.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>{renderStatusBadge(project.status)}</TableCell>

                    {/* Links */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {project.liveUrl && (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-muted-foreground hover:text-primary transition-colors"
                            title="Live Demo"
                          >
                            <Globe className="size-3.5" />
                          </a>
                        )}
                        {project.githubUrl && (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                            title="GitHub Repository"
                          >
                            <GithubIcon className="size-3.5" />
                          </a>
                        )}
                        <Link
                          href={`/projects/${project.slug}`}
                          target="_blank"
                          className="p-1 text-muted-foreground hover:text-primary transition-colors"
                          title={t("View Public Showcase", "পাবলিক প্রদর্শনী")}
                        >
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Review / Moderate button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReviewItem(project as AdminProjectSummary)
                            setReviewStatus(
                              project.status === PostStatus.PUBLISHED
                                ? PostStatus.REJECTED
                                : PostStatus.PUBLISHED
                            )
                            setReviewFeedback(project.massageForAuthor || "")
                          }}
                          className="h-7 text-xs px-2 gap-1"
                        >
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          <span>{t("Review", "রিভিউ")}</span>
                        </Button>

                        {/* Edit Button */}
                        <Link
                          href={`/admin/projects/${project.slug}`}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "sm",
                            className: "h-7 w-7 p-0",
                          })}
                          title={t("Edit Project", "সম্পাদনা")}
                        >
                          <Pencil className="size-3.5" />
                        </Link>

                        {/* Delete Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteItem(project as AdminProjectSummary)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title={t("Delete Project", "মুছুন")}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-border/80 text-xs">
            <span className="text-muted-foreground">
              {t("Page", "পৃষ্ঠা")} {data.page} {t("of", "/")} {data.totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 text-xs"
              >
                {t("Previous", "পূর্ববর্তী")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 text-xs"
              >
                {t("Next", "পরবর্তী")}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Review Dialog */}
      <Dialog open={Boolean(reviewItem)} onOpenChange={(open) => !open && setReviewItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-primary" />
              <span>{t("Review & Moderate Project", "প্রজেক্ট মডারেশন ও অনুমোদন")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              {t(
                `Set publishing status and optionally send moderation feedback to the author.`,
                `প্রকাশনার স্ট্যাটাস নির্ধারণ করুন ও শিক্ষার্থীর জন্য ফিডব্যাক দিন।`
              )}
            </DialogDescription>
          </DialogHeader>

          {reviewItem && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg border border-border bg-muted/30 text-xs space-y-1">
                <p className="font-semibold text-foreground truncate">{reviewItem.title}</p>
                <p className="text-muted-foreground">
                  {t("Author:", "লেখক:")} {reviewItem.author?.name} ({reviewItem.author?.email})
                </p>
              </div>

              {/* Status Radio / Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">{t("Target Status", "লক্ষ্য স্ট্যাটাস")}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus(PostStatus.PUBLISHED)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all",
                      reviewStatus === PostStatus.PUBLISHED
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <span>{t("Approve & Publish", "অনুমোদন ও প্রকাশ")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus(PostStatus.REJECTED)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all",
                      reviewStatus === PostStatus.REJECTED
                        ? "border-destructive bg-destructive/10 text-destructive ring-1 ring-destructive/30"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <XCircle className="size-3.5 text-destructive" />
                    <span>{t("Request Changes", "পরিবর্তন অনুরোধ")}</span>
                  </button>
                </div>
              </div>

              {/* Feedback Note to Student */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">
                  {t("Feedback / Note to Author", "শিক্ষার্থীর প্রতি মন্তব্য / ফিডব্যাক")}
                </label>
                <Textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder={t(
                    "Optional guidance, missing links, or approval remarks...",
                    "প্রয়োজনীয় দিকনির্দেশনা বা মন্তব্যের বিবরণ..."
                  )}
                  className="text-xs min-h-[90px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={reviewing}
              onClick={() => setReviewItem(null)}
            >
              {t("Cancel", "বাতিল")}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={reviewing}
              onClick={handleReviewSubmit}
              className="gap-1.5"
            >
              {reviewing && <Spinner className="size-3.5" />}
              <span>{t("Save Review", "সংরক্ষণ করুন")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              <span>{t("Delete Project Permanently?", "প্রজেক্টটি মুছে ফেলবেন?")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              {t(
                `Are you sure you want to delete "${deleteItem?.title}"? All project details and portfolio links will be deleted. This cannot be undone.`,
                `আপনি কি নিশ্চিত যে "${deleteItem?.title}" স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।`
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={deleting}
              onClick={() => setDeleteItem(null)}
            >
              {t("Cancel", "বাতিল")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={handleDeleteSubmit}
              className="gap-1.5"
            >
              {deleting && <Spinner className="size-3.5" />}
              <span>{t("Yes, Delete", "হ্যাঁ, মুছে ফেলুন")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
