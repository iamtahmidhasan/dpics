"use client"

import { useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Check,
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
  Star,
  Trash2,
  X,
  XCircle,
} from "lucide-react"

import { GithubIcon } from "@/components/icons/github-icon"

import { useLanguage } from "@/components/language-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { ExportImportMenu } from "@/components/admin/data-transfer/export-import-menu"
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
import type { AdminProjectSummary } from "@/lib/services/project.service"

const ALL = "ALL"

const STATUS_TABS: { value: string; label: { en: string; bn: string } }[] = [
  { value: ALL, label: { en: "All", bn: "সব" } },
  { value: PostStatus.PUBLISHED, label: { en: "Published", bn: "প্রকাশিত" } },
  { value: PostStatus.PENDING, label: { en: "Pending Review", bn: "অপেক্ষমান" } },
  { value: PostStatus.DRAFT, label: { en: "Drafts", bn: "খসড়া" } },
  { value: PostStatus.REJECTED, label: { en: "Rejected", bn: "ফেরত" } },
]

export function AdminProjectsTable({
  initialData,
}: {
  initialData: {
    projects: AdminProjectSummary[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}) {
  const { t } = useLanguage()
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>(ALL)
  const [search, setSearch] = useState("")

  // Review Dialog State
  const [reviewProject, setReviewProject] = useState<AdminProjectSummary | null>(null)
  const [reviewStatus, setReviewStatus] = useState<PostStatus>(PostStatus.PUBLISHED)
  const [feedback, setFeedback] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<AdminProjectSummary | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = async (overrideStatus?: string, overrideSearch?: string) => {
    setLoading(true)
    try {
      const activeStatus = overrideStatus ?? status
      const activeSearch = overrideSearch ?? search

      const query = new URLSearchParams()
      if (activeStatus !== ALL) query.set("status", activeStatus)
      if (activeSearch.trim()) query.set("q", activeSearch.trim())
      query.set("page", "1")
      query.set("pageSize", "20")

      const res = await fetch(`/api/admin/projects?${query.toString()}`)
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
    fetchData(newStatus, search)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData(status, search)
  }

  const handleToggleFeatured = async (project: AdminProjectSummary) => {
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/feature`, {
        method: "PATCH",
      })
      if (res.ok) {
        const json = await res.json()
        setData((prev) => ({
          ...prev,
          projects: prev.projects.map((p) =>
            p.id === project.id ? { ...p, isFeatured: json.isFeatured } : p
          ),
        }))
      }
    } catch {
      // Ignored
    }
  }

  const handleReviewSubmit = async () => {
    if (!reviewProject) return
    setIsSubmittingReview(true)
    try {
      const res = await fetch(`/api/admin/projects/${reviewProject.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewStatus,
          massageForAuthor: feedback,
        }),
      })

      if (res.ok) {
        setReviewProject(null)
        setFeedback("")
        fetchData()
      }
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/projects/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setDeleteTarget(null)
        fetchData()
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const statusBadge = (s: PostStatus) => {
    switch (s) {
      case PostStatus.PUBLISHED:
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">Published</Badge>
      case PostStatus.PENDING:
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0">Pending</Badge>
      case PostStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">{s}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1">
          {STATUS_TABS.map((tab) => (
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

        <div className="flex items-center gap-2 flex-wrap">
          <ExportImportMenu
            entity="projects"
            onImportComplete={() => fetchData()}
          />

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder={t({ en: "Search projects or tech...", bn: "প্রজেক্ট খুঁজুন..." })}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary" className="h-8 text-xs">
              {t({ en: "Search", bn: "খুঁজুন" })}
            </Button>
          </form>
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-border/70 shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>{t({ en: "Project", bn: "প্রজেক্ট" })}</TableHead>
              <TableHead>{t({ en: "Author / Student", bn: "নির্মাতা / শিক্ষার্থী" })}</TableHead>
              <TableHead>{t({ en: "Type & Tech", bn: "ধরন ও টেকনোলজি" })}</TableHead>
              <TableHead>{t({ en: "Status", bn: "স্ট্যাটাস" })}</TableHead>
              <TableHead className="text-right">{t({ en: "Actions", bn: "অ্যাকশন" })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-primary" />
                  <span className="text-xs">{t({ en: "Loading projects...", bn: "লোড হচ্ছে..." })}</span>
                </TableCell>
              </TableRow>
            ) : data.projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <Code2 className="size-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">{t({ en: "No projects found matching criteria.", bn: "কোনো প্রজেক্ট পাওয়া যায়নি।" })}</p>
                </TableCell>
              </TableRow>
            ) : (
              data.projects.map((project) => (
                <TableRow key={project.id}>
                  {/* Featured Toggle */}
                  <TableCell className="w-10">
                    <button
                      onClick={() => handleToggleFeatured(project)}
                      className="p-1 text-muted-foreground hover:text-amber-500 transition-colors"
                      title={project.isFeatured ? "Unfeature project" : "Feature on homepage"}
                    >
                      <Star
                        className={`size-4 ${
                          project.isFeatured
                            ? "fill-amber-400 text-amber-400"
                            : "opacity-40 hover:opacity-100"
                        }`}
                      />
                    </button>
                  </TableCell>

                  {/* Project Info */}
                  <TableCell>
                    <div className="space-y-1 max-w-sm">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/projects/${project.slug}`}
                          className="font-semibold text-xs sm:text-sm hover:underline"
                        >
                          {project.title}
                        </Link>
                        <a
                          href={`/projects/${project.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          title="View live public page"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="size-3" />
                        </a>
                      </div>
                      {project.titleBn && (
                        <p className="text-[11px] text-muted-foreground truncate">{project.titleBn}</p>
                      )}
                      {project.excerpt && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{project.excerpt}</p>
                      )}
                      <div className="flex items-center gap-2 pt-0.5">
                        {project.liveUrl && (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                          >
                            <Globe className="size-3" /> Live
                          </a>
                        )}
                        {project.githubUrl && (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                          >
                            <GithubIcon className="size-3" /> Code
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Author */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        {project.author.avatar && <AvatarImage src={project.author.avatar} />}
                        <AvatarFallback className="text-[10px] font-bold">
                          {project.author.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-xs min-w-0">
                        <p className="font-medium text-foreground truncate">{project.author.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{project.author.email}</p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Type & Tech */}
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {project.category?.name || "General"}
                      </Badge>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {project.techStack.slice(0, 3).map((tech) => (
                          <span
                            key={tech}
                            className="text-[9px] px-1.5 py-0.5 rounded-xs bg-muted text-muted-foreground"
                          >
                            {tech}
                          </span>
                        ))}
                        {project.techStack.length > 3 && (
                          <span className="text-[9px] text-muted-foreground">
                            +{project.techStack.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>{statusBadge(project.status)}</TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/projects/${project.slug}`}
                        className={buttonVariants({
                          size: "sm",
                          variant: "outline",
                          className: "h-7 text-xs gap-1",
                        })}
                      >
                        <Pencil className="size-3" />
                        {t({ en: "Edit", bn: "এডিট" })}
                      </Link>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          setReviewProject(project)
                          setReviewStatus(
                            project.status === PostStatus.PUBLISHED
                              ? PostStatus.REJECTED
                              : PostStatus.PUBLISHED
                          )
                          setFeedback(project.massageForAuthor || "")
                        }}
                      >
                        <MessageSquare className="size-3.5" />
                        {t({ en: "Review", bn: "রিভিউ" })}
                      </Button>

                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="size-7 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(project)}
                        title="Delete project"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Review Dialog */}
      <Dialog open={Boolean(reviewProject)} onOpenChange={() => setReviewProject(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {t({ en: "Moderate Project Submission", bn: "প্রজেক্ট মডারেশন" })}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {reviewProject?.title} • by {reviewProject?.author.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">
                {t({ en: "Decision Status", bn: "সিদ্ধান্ত" })}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={reviewStatus === PostStatus.PUBLISHED ? "default" : "outline"}
                  className="h-9 text-xs gap-1.5"
                  onClick={() => setReviewStatus(PostStatus.PUBLISHED)}
                >
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  {t({ en: "Approve & Publish", bn: "অনুমোদন করুন" })}
                </Button>
                <Button
                  type="button"
                  variant={reviewStatus === PostStatus.REJECTED ? "destructive" : "outline"}
                  className="h-9 text-xs gap-1.5"
                  onClick={() => setReviewStatus(PostStatus.REJECTED)}
                >
                  <XCircle className="size-4" />
                  {t({ en: "Reject / Request Changes", bn: "ফেরত পাঠান" })}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">
                {t({ en: "Feedback for Author (Optional / Rejection reason)", bn: "শিক্ষার্থীর জন্য মন্তব্য" })}
              </label>
              <Textarea
                placeholder="Write constructive review feedback or notes..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReviewProject(null)}
            >
              {t({ en: "Cancel", bn: "বাতিল" })}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSubmittingReview}
              onClick={handleReviewSubmit}
            >
              {isSubmittingReview ? "Submitting..." : t({ en: "Save Decision", bn: "সংরক্ষণ করুন" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <Trash2 className="size-4" />
              {t({ en: "Delete Project?", bn: "প্রজেক্ট মুছে ফেলবেন?" })}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to permanently delete <strong>{deleteTarget?.title}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteSubmit}
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
