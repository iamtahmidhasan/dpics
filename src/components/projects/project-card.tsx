"use client"

import Image from "next/image"
import Link from "next/link"
import { ExternalLink, Globe, Star, Users } from "lucide-react"

import { GithubIcon } from "@/components/icons/github-icon"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import type { ProjectSummary } from "@/lib/services/project.service"

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const { lang } = useLanguage()
  const isBn = lang === "bn"

  const title = isBn && project.titleBn ? project.titleBn : project.title
  const excerpt = isBn && project.excerptBn ? project.excerptBn : project.excerpt

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border/70 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
      {/* Cover / Media Area */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
        {project.coverImage ? (
          <Image
            src={project.coverImage}
            alt={project.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 p-6 text-center">
            <span className="font-heading text-lg font-bold text-foreground/40">
              {project.title}
            </span>
          </div>
        )}

        {/* Featured Ribbon */}
        {project.isFeatured && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs">
            <Star className="size-3 fill-white" />
            <span>Featured</span>
          </div>
        )}

        {/* Category Badge */}
        {project.category && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-background/90 text-foreground font-medium text-[10px] backdrop-blur-xs shadow-xs border-0">
              {isBn && project.category.nameBn ? project.category.nameBn : project.category.name}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col p-5 space-y-3">
        {/* Title */}
        <Link href={`/projects/${project.slug}`} className="group-hover:text-primary transition-colors">
          <h3 className="font-heading text-base sm:text-lg font-bold tracking-tight line-clamp-1">
            {title}
          </h3>
        </Link>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {excerpt}
          </p>
        )}

        {/* Tech Stack Pills */}
        {project.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {project.techStack.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="rounded-md bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-foreground/80 border border-border/40"
              >
                {tech}
              </span>
            ))}
            {project.techStack.length > 4 && (
              <span className="text-[10px] text-muted-foreground self-center">
                +{project.techStack.length - 4}
              </span>
            )}
          </div>
        )}
      </CardContent>

      {/* Author & Action Links Footer */}
      <CardFooter className="p-5 pt-0 mt-auto flex items-center justify-between border-t border-border/40 text-xs">
        {/* Author Avatar & Name */}
        <Link
          href={`/members/${project.author.id}`}
          className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
        >
          <Avatar className="size-6 shrink-0 border border-border/60">
            {project.author.avatar && <AvatarImage src={project.author.avatar} />}
            <AvatarFallback className="text-[10px] font-bold">
              {project.author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground/90 truncate text-xs">
            {project.author.name}
          </span>
        </Link>

        {/* Quick Links */}
        <div className="flex items-center gap-1.5 shrink-0">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              title="GitHub Repository"
            >
              <GithubIcon className="size-3.5" />
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
              title="Live Demo"
            >
              <Globe className="size-3.5" />
            </a>
          )}
          <Button
            size="sm"
            variant="ghost"
            nativeButton={false}
            render={<Link href={`/projects/${project.slug}`} />}
            className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
          >
            <span>View</span>
            <ExternalLink className="size-3" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
