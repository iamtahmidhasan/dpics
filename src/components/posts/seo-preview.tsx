import { Globe } from "lucide-react"

import { deriveExcerpt } from "@/lib/markdown"
import { MAX_POST_SEO_DESCRIPTION_LENGTH } from "@/lib/post-constants"
import { postPath, SITE_NAME } from "@/lib/site"
import { cn } from "cn"

export type SeoPreviewProps = {
  title: string
  slug: string
  description: string | null
  content?: string
  path?: string
  className?: string
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`
}

/**
 * Renders a Google-style result plus a social card, so authors can sanity check
 * metadata before saving. Mirrors what `generateMetadata` will emit.
 */
export function SeoPreview({
  title,
  slug,
  description,
  content = "",
  path,
  className,
}: SeoPreviewProps) {
  const resolvedTitle = title.trim()
  const resolvedDescription = (
    description?.trim() ||
    deriveExcerpt(content, null, MAX_POST_SEO_DESCRIPTION_LENGTH) ||
    ""
  ).trim()
  const href = path ?? postPath(slug || "untitled-post")

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-1.5 rounded-md border bg-card p-3">
        <p className="text-muted-foreground text-[0.625rem] font-medium tracking-wide uppercase">
          Search result
        </p>

        <div className="flex items-start gap-2">
          <Globe className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
          <div className="min-w-0 space-y-0.5">
            <p className="truncate text-[0.6875rem] text-muted-foreground">
              {SITE_NAME}
              <span className="mx-1">›</span>
              <span className="text-foreground/70">{href}</span>
            </p>
            <p className="text-primary truncate text-sm leading-snug">
              {resolvedTitle || "Untitled post"}
            </p>
            <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
              {resolvedDescription || "No description yet — one will be derived from the content."}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        <div className="bg-muted flex h-24 items-center justify-center border-b text-[0.625rem] text-muted-foreground">
          Social card image
        </div>
        <div className="space-y-1 p-3">
          <p className="text-[0.625rem] tracking-wide text-muted-foreground uppercase">
            {SITE_NAME}
          </p>
          <p className="line-clamp-2 text-sm leading-snug font-semibold">
            {resolvedTitle || "Untitled post"}
          </p>
          <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
            {truncate(resolvedDescription || href, MAX_POST_SEO_DESCRIPTION_LENGTH)}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.625rem]">
        <dt className="text-muted-foreground">Title</dt>
        <dd className={cn("truncate", resolvedTitle.length > 60 && "text-destructive")}>
          {resolvedTitle.length} / 60
        </dd>
        <dt className="text-muted-foreground">Description</dt>
        <dd className={cn("truncate", resolvedDescription.length > 160 && "text-destructive")}>
          {resolvedDescription.length} / 160
        </dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="truncate">{slug || "—"}</dd>
      </dl>
    </div>
  )
}
