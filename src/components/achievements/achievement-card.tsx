"use client"

import { Award, Building2, CalendarDays, ExternalLink, ImageOff, PenSquare, Trash2, Send } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { makeT, type Lang } from "@/lib/i18n"
import { achievementStatusBadgeVariant, achievementStatusLabel } from "@/lib/achievement-labels"
import { PostStatus } from "@/generated/prisma/enums"
import type { AchievementSummary } from "@/lib/services/achievement.service"
import { cn } from "cn"

export type AchievementCardProps = {
  achievement: AchievementSummary
  lang: Lang
  href?: string
  showStatus?: boolean
  isAuthorView?: boolean
  onDelete?: (id: string) => void
  onSubmit?: (id: string) => void
  className?: string
}

export function AchievementCard({
  achievement,
  lang,
  href,
  showStatus = false,
  isAuthorView = false,
  onDelete,
  onSubmit,
  className,
}: AchievementCardProps) {
  const t = makeT(lang)
  const isBn = lang === "bn"
  const [submitting, setSubmitting] = useState(false)

  const timestamp = achievement.eventDate ?? achievement.publishedAt ?? achievement.createdAt
  const dateLabel = new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp))

  const target = href ?? `/achievements/${achievement.slug}`
  const displayTitle = isBn && achievement.titleBn ? achievement.titleBn : achievement.title
  const displayExcerpt = isBn && achievement.excerptBn ? achievement.excerptBn : achievement.excerpt
  const displayOrg = isBn && achievement.organizationBn ? achievement.organizationBn : achievement.organization
  const categoryName = achievement.category
    ? isBn && achievement.category.nameBn
      ? achievement.category.nameBn
      : achievement.category.name
    : null

  const authorInitials = (achievement.author?.name || "?").trim().charAt(0).toUpperCase()
  const authorIdentifier = achievement.author?.studentId || achievement.author?.instructorId || null

  const canEdit = isAuthorView && (achievement.status === PostStatus.DRAFT || achievement.status === PostStatus.REJECTED)
  const canSubmit = isAuthorView && (achievement.status === PostStatus.DRAFT || achievement.status === PostStatus.REJECTED)

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-md",
        className
      )}
    >
      {/* Media / Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted/50">
        {achievement.coverImage ? (
          <Image
            src={achievement.coverImage}
            alt={displayTitle}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-muted/80 text-muted-foreground/50">
            <Award className="size-12 text-primary/40" />
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none">
          <div className="flex flex-wrap gap-1">
            {achievement.isFeatured && (
              <Badge className="bg-primary text-primary-foreground text-[0.625rem] shadow-sm">
                {t("Featured", "ফিচার্ড")}
              </Badge>
            )}
            {categoryName && (
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-xs text-[0.625rem] font-medium shadow-xs">
                {categoryName}
              </Badge>
            )}
          </div>

          {showStatus && (
            <Badge
              variant={achievementStatusBadgeVariant(achievement.status)}
              className="text-[0.625rem] shadow-xs uppercase tracking-wider font-semibold"
            >
              {t(achievementStatusLabel(achievement.status))}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Organization / Awarder info */}
        {displayOrg && (
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-primary">
            <Building2 className="size-3.5 shrink-0" />
            <span className="truncate">{displayOrg}</span>
          </div>
        )}

        <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight">
          <Link href={target} className="hover:text-primary transition-colors">
            {displayTitle}
          </Link>
        </h3>

        {displayExcerpt && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {displayExcerpt}
          </p>
        )}

        {/* Tags */}
        {achievement.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {achievement.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted/80 px-1.5 py-0.5 text-[0.625rem] text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta info footer */}
        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-[0.6875rem] text-muted-foreground">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-6 border">
              {achievement.author.avatar && (
                <AvatarImage src={achievement.author.avatar} alt={achievement.author.name} />
              )}
              <AvatarFallback className="text-[10px]">{authorInitials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex flex-col">
              <span className="truncate font-medium text-foreground">{achievement.author.name}</span>
              {authorIdentifier && (
                <span className="truncate text-[10px] text-muted-foreground font-mono">{authorIdentifier}</span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <CalendarDays className="size-3" />
            <time dateTime={timestamp}>{dateLabel}</time>
          </div>
        </div>

        {/* Author Actions Bar if on profile page */}
        {isAuthorView && (
          <div className="mt-3 flex flex-wrap items-center justify-end gap-1.5 border-t border-border/50 pt-2.5">
            {canSubmit && onSubmit && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10"
                onClick={() => {
                  setSubmitting(true)
                  onSubmit(achievement.id)
                }}
                disabled={submitting}
              >
                <Send className="size-3" />
                {t("Submit for review", "পর্যালোচনায় জমা দিন")}
              </Button>
            )}

            {canEdit && (
              <Link
                href={`/profile/achievements/${achievement.id}/edit`}
                className={buttonVariants({ variant: "ghost", size: "sm", className: "h-7 text-xs gap-1" })}
              >
                <PenSquare className="size-3" />
                {t("Edit", "সম্পাদনা")}
              </Link>
            )}

            {onDelete && achievement.status !== PostStatus.PUBLISHED && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(achievement.id)}
              >
                <Trash2 className="size-3" />
                {t("Delete", "মুছুন")}
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
