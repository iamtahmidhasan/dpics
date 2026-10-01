import { CalendarDays, Clock3, ImageOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { makeT, type Lang } from "@/lib/i18n"
import { postStatusBadgeVariant, postStatusLabel } from "@/lib/post-labels"
import type { PostSummary } from "@/lib/services/post.service"
import { cn } from "cn"

export type PostCardProps = {
  post: PostSummary
  lang: Lang
  href?: string
  showStatus?: boolean
  className?: string
}

export function PostCard({ post, lang, href, showStatus = false, className }: PostCardProps) {
  const t = makeT(lang)
  const timestamp = post.publishedAt ?? post.createdAt
  const dateLabel = new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp))
  const target = href ?? `/posts/${post.slug}`

  const displayTitle = lang === "bn" && post.titleBn ? post.titleBn : post.title
  const displayExcerpt = lang === "bn" && post.excerptBn ? post.excerptBn : post.excerpt
  const categoryName = post.category
    ? lang === "bn" && post.category.nameBn
      ? post.category.nameBn
      : post.category.name
    : null

  return (
    <article
      className={cn(
        "group bg-card relative flex flex-col overflow-hidden rounded-lg border transition-colors hover:border-primary/40",
        className
      )}
    >
      <div className="bg-muted relative aspect-video overflow-hidden">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={displayTitle}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="text-muted-foreground/40 flex h-full items-center justify-center">
            <ImageOff className="size-8" />
          </div>
        )}

        {(post.isFeatured || showStatus) && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {post.isFeatured ? (
              <Badge className="text-[0.625rem]">{t("Featured", "ফিচার্ড")}</Badge>
            ) : null}
            {showStatus ? (
              <Badge variant={postStatusBadgeVariant(post.status)} className="text-[0.625rem]">
                {postStatusLabel(t)(post.status)}
              </Badge>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {categoryName ? (
          <span className="text-primary text-[0.6875rem] font-medium tracking-wide uppercase">
            {categoryName}
          </span>
        ) : null}

        <h3 className="line-clamp-2 text-sm leading-snug font-semibold">
          <Link href={target} className="after:absolute after:inset-0 hover:underline">
            {displayTitle}
          </Link>
        </h3>

        {displayExcerpt ? (
          <p className="text-muted-foreground line-clamp-3 text-xs leading-relaxed">
            {displayExcerpt}
          </p>
        ) : null}

        {post.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[0.625rem]"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="text-muted-foreground mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[0.6875rem]">
          <span className="truncate">{post.author.name}</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3" />
            <time dateTime={timestamp}>{dateLabel}</time>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="size-3" />
            {t(`${post.readingMinutes} min read`, `${post.readingMinutes} মিনিটের পড়া`)}
          </span>
        </div>
      </div>
    </article>
  )
}
