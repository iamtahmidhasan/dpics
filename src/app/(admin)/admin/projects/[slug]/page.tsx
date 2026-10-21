import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLink, MessageSquare, ShieldCheck, UserCheck } from "lucide-react"

import { ProjectComposerForm } from "@/components/projects/project-composer-form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { PostStatus } from "@/generated/prisma/enums"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import prisma from "@/lib/prisma"
import { ProjectService } from "@/lib/services/project.service"
import { requireAdmin } from "@/lib/session"

type AdminProjectEditPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: AdminProjectEditPageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const project = await ProjectService.getProjectForAdmin(slug)
    return {
      title: `Edit ${project.title} | Admin Panel`,
    }
  } catch {
    return {
      title: "Edit Project | Admin Panel",
    }
  }
}

export default async function AdminProjectEditPage({ params }: AdminProjectEditPageProps) {
  const { slug } = await params
  const [lang] = await Promise.all([getLang(), requireAdmin()])
  const t = makeT(lang)

  let project
  try {
    project = await ProjectService.getProjectForAdmin(slug)
  } catch {
    notFound()
  }

  // Pre-load project categories
  const categories = await prisma.category.findMany({
    where: { type: "PROJECT", isActive: true },
    select: { id: true, name: true, nameBn: true, slug: true },
    orderBy: { name: "asc" },
  })

  const statusBadge = (s: PostStatus) => {
    switch (s) {
      case PostStatus.PUBLISHED:
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
            {t("Published", "প্রকাশিত")}
          </Badge>
        )
      case PostStatus.PENDING:
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">
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
            {s}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Context Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 border border-border">
            {project.author.avatar && <AvatarImage src={project.author.avatar} />}
            <AvatarFallback className="text-xs font-bold">
              {project.author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-lg font-bold leading-tight line-clamp-1">
                {project.title}
              </h1>
              {statusBadge(project.status)}
            </div>
            <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
              <span>
                {t("Authored by", "নির্মাতা:")}{" "}
                <span className="font-medium text-foreground">{project.author.name}</span>
              </span>
              {project.author.email && (
                <>
                  <span>·</span>
                  <span>{project.author.email}</span>
                </>
              )}
              {project.author.studentId && (
                <>
                  <span>·</span>
                  <span className="font-mono text-[11px] bg-muted px-1.5 py-0.2 rounded-xs">
                    {project.author.studentId}
                  </span>
                </>
              )}
              {project.author.department && (
                <>
                  <span>·</span>
                  <span>{project.author.department}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${project.slug}`}
            target="_blank"
            className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border hover:bg-muted/50 transition-colors"
          >
            <span>{t("View Public Page", "পাবলিক পেজ দেখুন")}</span>
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Review Feedback Notice if present */}
      {project.massageForAuthor && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <MessageSquare className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{t("Moderation Note / Feedback to Author:", "মডারেশন মন্তব্য / শিক্ষার্থীর প্রতি বার্তা:")}</p>
            <p className="whitespace-pre-wrap text-muted-foreground dark:text-amber-300/80">
              {project.massageForAuthor}
            </p>
          </div>
        </div>
      )}

      {/* Project Composer Form in Admin Scope */}
      <ProjectComposerForm
        scope="admin"
        projectId={project.id}
        status={project.status}
        massageForAuthor={project.massageForAuthor}
        initialCategories={categories}
        initialValues={{
          title: project.title,
          titleBn: project.titleBn ?? "",
          slug: project.slug,
          categoryId: project.categoryId ?? project.category?.id ?? null,
          excerpt: project.excerpt ?? "",
          excerptBn: project.excerptBn ?? "",
          description: project.description,
          descriptionBn: project.descriptionBn ?? "",
          coverImage: project.coverImage ?? "",
          images: project.images ?? [],
          liveUrl: project.liveUrl ?? "",
          githubUrl: project.githubUrl ?? "",
          youtubeUrl: project.youtubeUrl ?? "",
          techStack: project.techStack ?? [],
          tags: project.tags ?? [],
          teamMembers: project.teamMembers ?? [],
          isFeatured: project.isFeatured ?? false,
        }}
        backHref="/admin/projects"
      />
    </div>
  )
}
