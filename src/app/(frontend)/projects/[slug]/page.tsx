import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Code2,
  ExternalLink,
  FolderGit2,
  Globe,
  Star,
  Users,
  Video,
} from "lucide-react"

import { GithubIcon } from "@/components/icons/github-icon"
import { MarkdownContent } from "@/components/posts/markdown-content"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { absoluteUrl, websiteMetadata } from "@/lib/seo"
import { ProjectService } from "@/lib/services/project.service"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const project = await ProjectService.getProjectBySlug(slug)
    const title = `${project.title} | DPI Computing Society Projects`
    const description = project.excerpt || `Student project engineered by ${project.author.name} at Dhaka Polytechnic Institute.`
    const url = absoluteUrl(`/projects/${project.slug}`)

    return {
      title: { absolute: title },
      description,
      alternates: { canonical: url },
      openGraph: {
        type: "article",
        url,
        title,
        description,
        images: project.coverImage ? [project.coverImage] : undefined,
      },
    }
  } catch {
    return {
      title: "Project Not Found | DPI Computing Society",
    }
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params
  const lang = await getLang()
  const t = makeT(lang)
  const isBn = lang === "bn"

  let project
  try {
    project = await ProjectService.getProjectBySlug(slug)
  } catch {
    notFound()
  }

  const title = isBn && project.titleBn ? project.titleBn : project.title
  const excerpt = isBn && project.excerptBn ? project.excerptBn : project.excerpt
  const description = isBn && project.descriptionBn ? project.descriptionBn : project.description

  const formattedDate = project.publishedAt
    ? new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(project.publishedAt))
    : null

  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-12 md:py-16 space-y-8">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/projects" />}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {t("Back to Projects", "প্রজেক্ট তালিকায় ফিরুন")}
        </Button>
      </div>

      {/* Header Info */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {project.isFeatured && (
            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs gap-1 font-semibold">
              <Star className="size-3 fill-amber-500" />
              {t("Featured Project", "ফিচার্ড প্রজেক্ট")}
            </Badge>
          )}
          {project.category && (
            <Badge variant="outline" className="text-xs">
              {isBn && project.category.nameBn ? project.category.nameBn : project.category.name}
            </Badge>
          )}
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          {title}
        </h1>

        {excerpt && (
          <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
            {excerpt}
          </p>
        )}

        {/* Author & Meta bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/60">
          <Link
            href={`/members/${project.author.id}`}
            className="flex items-center gap-3 group hover:opacity-85 transition-opacity"
          >
            <Avatar className="size-10 border border-border">
              {project.author.avatar && <AvatarImage src={project.author.avatar} />}
              <AvatarFallback className="text-sm font-bold">
                {project.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                {project.author.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {project.author.studentId ? `${project.author.studentId} • ` : ""}
                {project.author.department || "Dhaka Polytechnic Institute"}
              </p>
            </div>
          </Link>

          {formattedDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5 text-primary" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {project.liveUrl && (
            <Button
              size="sm"
              nativeButton={false}
              render={<a href={project.liveUrl} target="_blank" rel="noreferrer" />}
              className="gap-2 font-semibold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Globe className="size-4" />
              {t("Open Live Application", "লাইভ প্রজেক্ট দেখুন")}
            </Button>
          )}
          {project.githubUrl && (
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<a href={project.githubUrl} target="_blank" rel="noreferrer" />}
              className="gap-2 font-semibold"
            >
              <GithubIcon className="size-4" />
              {t("Source Code (GitHub)", "সোর্স কোড (গিটহাব)")}
            </Button>
          )}
          {project.youtubeUrl && (
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<a href={project.youtubeUrl} target="_blank" rel="noreferrer" />}
              className="gap-2 font-semibold text-red-600 dark:text-red-400"
            >
              <Video className="size-4" />
              {t("Watch Video Demo", "ভিডিও ডেমো দেখুন")}
            </Button>
          )}
        </div>
      </div>

      {/* Main Cover Banner */}
      {project.coverImage && (
        <div className="relative aspect-16/9 w-full overflow-hidden rounded-2xl border border-border shadow-lg bg-muted">
          <Image
            src={project.coverImage}
            alt={project.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 896px"
          />
        </div>
      )}

      {/* Tech Stack Chips Bar */}
      {project.techStack.length > 0 && (
        <Card className="p-4 border-border/70 shadow-xs bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="size-4 text-primary" />
            <h3 className="font-heading font-semibold text-xs text-foreground uppercase tracking-wider">
              {t("Technologies & Frameworks", "ব্যবহৃত প্রযুক্তি")}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <Badge key={tech} variant="secondary" className="text-xs px-2.5 py-1 font-medium">
                {tech}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Team Collaboration Section */}
      {project.teamMembers.length > 0 && (
        <Card className="p-5 border-border/70 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <h3 className="font-heading font-semibold text-sm text-foreground">
              {t("Project Contributors & Team", "প্রজেক্ট টিম ও অবদানকারী")}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {project.teamMembers.map((member, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="size-8 shrink-0 border border-border/60">
                    {member.avatar && <AvatarImage src={member.avatar} />}
                    <AvatarFallback className="text-[11px] font-bold">
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-0.5">
                    {member.userId ? (
                      <Link
                        href={`/members/${member.userId}`}
                        className="font-bold text-foreground hover:text-primary transition-colors truncate block"
                      >
                        {member.name}
                      </Link>
                    ) : (
                      <p className="font-bold text-foreground truncate">{member.name}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      {member.role && (
                        <span className="font-medium text-foreground/80">{member.role}</span>
                      )}
                      {member.studentId && (
                        <span>• ID: {member.studentId}</span>
                      )}
                      {member.department && (
                        <span>• {member.department}</span>
                      )}
                    </div>
                  </div>
                </div>

                {member.githubUrl && (
                  <a
                    href={member.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                    title={`${member.name}'s GitHub`}
                  >
                    <GithubIcon className="size-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Markdown Story Content */}
      <div className="pt-4 border-t border-border/60">
        <MarkdownContent>{description}</MarkdownContent>
      </div>

      {/* Gallery Screenshots */}
      {project.images.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border/60">
          <h3 className="font-heading text-lg font-bold text-foreground">
            {t("Project Gallery & Screenshots", "স্ক্রিনশট ও ডায়াগ্রাম")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {project.images.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative aspect-16/10 rounded-xl overflow-hidden border border-border shadow-sm bg-muted"
              >
                <Image
                  src={imgUrl}
                  alt={`Screenshot ${idx + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 448px"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
