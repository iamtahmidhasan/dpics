import { FileText } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

export type EmptyStateProps = {
  title: string
  description?: string
  actionHref?: string
  actionLabel?: string
  className?: string
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-14 text-center",
        className
      )}
    >
      <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
        <FileText className="size-5" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? (
          <p className="text-muted-foreground mx-auto max-w-sm text-xs/relaxed">{description}</p>
        ) : null}
      </div>

      {actionHref && actionLabel ? (
        <Link href={actionHref} className={buttonVariants({ size: "sm" })}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}
