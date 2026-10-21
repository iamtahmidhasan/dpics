"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  Code2,
  ExternalLink,
  Globe,
  Lock,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"

import { GithubIcon } from "@/components/icons/github-icon"
import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { PostStatus } from "@/generated/prisma/enums"
import type { ProjectSummary } from "@/lib/services/project.service"

interface UserProjectsListProps {
  initialProjects: ProjectSummary[]
}

export function UserProjectsList({ initialProjects }: UserProjectsListProps) {
  const router = useRouter()
  const { t } = useLanguage()

  const [projects, setProjects] = useState<ProjectSummary[]>(initialProjects)
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch(`/api/projects/${deleteTarget.id}`, {
        method: "DELETE",
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error?.message ?? data?.error ?? "Failed to delete project")
      }

      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
      router.refresh()
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete project")
    } finally {
      setIsDeleting(false)
    }
  }

  const renderStatusBadge = (s: PostStatus) => {
    switch (s) {
      case PostStatus.PUBLISHED:
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs flex items-center gap-1 font-medium">
            <CheckCircle2 className="size-3" />
            <span>{t("Published", "প্রকাশিত")}</span>
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

  if (projects.length === 0) {
    return (
      <Card className="border-dashed p-10 text-center space-y-4">
        <Code2 className="size-10 mx-auto text-muted-foreground/40" />
        <div className="space-y-1">
          <h3 className="font-semibold text-sm">
            {t("No projects submitted yet", "এখনো কোনো প্রজেক্ট জমা দেননি")}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {t(
              "Submit your semester projects, hackathon prototypes, or open-source repositories to showcase to the community and recruiters.",
              "আপনার তৈরি সেমিস্টার প্রজেক্ট বা হ্যাকাথনের প্রজেক্ট জমা দিয়ে নিজের পোর্টফোলিও তৈরি করুন।"
            )}
          </p>
        </div>
        <Link
          href="/profile/projects/new"
          className={buttonVariants({ size: "sm", className: "gap-1.5 mx-auto" })}
        >
          <Plus className="size-4" />
          <span>{t("Submit First Project", "প্রথম প্রজেক্ট জমা দিন")}</span>
        </Link>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {projects.map((project) => {
          const isApproved = project.status === PostStatus.PUBLISHED

          return (
            <Card key={project.id} className="p-5 border-border/70 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-base font-bold text-foreground truncate">
                      {project.title}
                    </h3>
                    {renderStatusBadge(project.status)}
                    {isApproved && (
                      <Badge
                        variant="outline"
                        className="text-[10px] gap-1 text-muted-foreground border-border/80 bg-muted/40 font-normal py-0.5"
                      >
                        <Lock className="size-2.5 text-amber-500" />
                        <span>{t("Locked (Approved)", "লক করা (অনুমোদিত)")}</span>
                      </Badge>
                    )}
                  </div>
                  {project.excerpt && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {project.excerpt}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/projects/${project.slug}`}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                      className: "gap-1 text-xs h-8",
                    })}
                  >
                    <span>{t("View Public Page", "পাবলিক পেজ দেখুন")}</span>
                    <ExternalLink className="size-3" />
                  </Link>

                  {/* If Approved, author CANNOT edit or delete */}
                  {!isApproved ? (
                    <>
                      <Link
                        href={`/profile/projects/${project.id}/edit`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                          className: "gap-1 text-xs h-8",
                        })}
                      >
                        <Pencil className="size-3" />
                        <span>{t("Edit", "সম্পাদনা")}</span>
                      </Link>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeleteError(null)
                          setDeleteTarget(project)
                        }}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">
                          {t("Delete", "মুছুন")}
                        </span>
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Informative Lock Notice for Approved Projects */}
              {isApproved && (
                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5 text-[11px] text-muted-foreground flex items-center gap-2">
                  <Lock className="size-3.5 shrink-0 text-amber-500" />
                  <span>
                    {t(
                      "This project has been approved and published to the society directory. Approved projects cannot be edited or deleted from the profile page. To request modifications or removal, please contact an Admin or Super Admin.",
                      "এই প্রজেক্টটি অনুমোদিত ও প্রকাশিত হয়েছে। নিয়ম অনুযায়ী অনুমোদিত প্রজেক্ট প্রোফাইল থেকে এডিট বা ডিলিট করা যায় না। কোনো পরিবর্তনের জন্য অ্যাডমিন বা সুপার অ্যাডমিনের সাথে যোগাযোগ করুন।"
                    )}
                  </span>
                </div>
              )}

              {/* Feedback from Admin if rejected or notes present */}
              {project.massageForAuthor && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/25 p-3 text-xs space-y-1 text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-1.5 font-medium">
                    <MessageSquare className="size-3.5 text-amber-600 dark:text-amber-400" />
                    <span>{t("Moderation Note / Feedback:", "মডারেশন মন্তব্য:")}</span>
                  </div>
                  <p className="pl-5 text-muted-foreground dark:text-amber-300/80">
                    {project.massageForAuthor}
                  </p>
                </div>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {project.category?.name || "Project"}
                  </Badge>
                  {project.techStack.length > 0 && (
                    <span className="text-[11px]">
                      {project.techStack.slice(0, 4).join(", ")}
                      {project.techStack.length > 4 ? "..." : ""}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Globe className="size-3" /> Demo
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <GithubIcon className="size-3" /> GitHub
                    </a>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              <span>{t("Delete Project?", "প্রজেক্ট মুছে ফেলতে চান?")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              {t(
                `Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`,
                `আপনি কি নিশ্চিত যে "${deleteTarget?.title}" মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।`
              )}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
            >
              {t("Cancel", "বাতিল")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
              className="gap-1.5"
            >
              {isDeleting && <Spinner className="size-3.5" />}
              <span>{t("Yes, Delete", "হ্যাঁ, মুছে ফেলুন")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
