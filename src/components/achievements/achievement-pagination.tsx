import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

export type AchievementPaginationProps = {
  page: number
  totalPages: number
  buildHref: (page: number) => string
  labels: {
    previous: string
    next: string
    page: (current: number, total: number) => string
  }
  className?: string
}

export function AchievementPagination({
  page,
  totalPages,
  buildHref,
  labels,
  className,
}: AchievementPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
    >
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          rel="prev"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ChevronLeft className="size-3.5" />
          {labels.previous}
        </Link>
      ) : (
        <span aria-hidden className={cn(buttonVariants({ variant: "outline", size: "sm" }), "opacity-50 pointer-events-none")}>
          <ChevronLeft className="size-3.5" />
          {labels.previous}
        </span>
      )}

      <span className="text-muted-foreground text-xs">{labels.page(page, totalPages)}</span>

      {page < totalPages ? (
        <Link
          href={buildHref(page + 1)}
          rel="next"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {labels.next}
          <ChevronRight className="size-3.5" />
        </Link>
      ) : (
        <span aria-hidden className={cn(buttonVariants({ variant: "outline", size: "sm" }), "opacity-50 pointer-events-none")}>
          {labels.next}
          <ChevronRight className="size-3.5" />
        </span>
      )}
    </nav>
  )
}
