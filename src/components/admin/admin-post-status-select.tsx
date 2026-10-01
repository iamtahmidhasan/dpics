"use client"

import { Check, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PostStatus } from "@/generated/prisma/enums"
import { postStatusBadgeVariant, postStatusLabel } from "@/lib/post-labels"
import { cn } from "cn"

export function AdminPostStatusSelect({
  postId,
  initialStatus,
  className,
}: {
  postId: string
  initialStatus: PostStatus
  className?: string
}) {
  const router = useRouter()
  const { t } = useLanguage()
  const [status, setStatus] = useState<PostStatus>(initialStatus)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const statusLabel = postStatusLabel(t)

  const handleStatusChange = async (nextStatus: string | null) => {
    if (!nextStatus || nextStatus === status) return
    const typedStatus = nextStatus as PostStatus

    setIsUpdating(true)
    setError(null)
    setSaved(false)

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: typedStatus }),
      })

      const body = await response.json()

      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Failed to update status")
      }

      setStatus(typedStatus)
      setSaved(true)
      router.refresh()

      setTimeout(() => setSaved(false), 2500)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to change status")
    } finally {
      setIsUpdating(false)
    }
  }

  const allStatuses: PostStatus[] = [
    PostStatus.PUBLISHED,
    PostStatus.PENDING,
    PostStatus.UPDATE,
    PostStatus.DRAFT,
    PostStatus.REJECTED,
    PostStatus.ARCHIVED,
  ]

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground font-medium">
          {t("Status:", "অবস্থা:")}
        </span>

        <Select
          value={status}
          disabled={isUpdating}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger
            className="h-8 gap-1.5 px-2.5 text-xs font-medium w-auto min-w-[125px]"
            aria-label={t("Change post status", "পোস্টের অবস্থা পরিবর্তন")}
          >
            {isUpdating ? (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            ) : (
              <Badge
                variant={postStatusBadgeVariant(status)}
                className="text-[0.625rem] px-1.5 py-0"
              >
                {statusLabel(status)}
              </Badge>
            )}
            <SelectValue />
          </SelectTrigger>

          <SelectContent align="end">
            {allStatuses.map((st) => (
              <SelectItem key={st} value={st} className="text-xs">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={postStatusBadgeVariant(st)}
                    className="text-[0.625rem] px-1.5 py-0"
                  >
                    {statusLabel(st)}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {saved && (
        <span className="inline-flex items-center gap-1 text-[0.6875rem] text-success font-medium animate-in fade-in">
          <Check className="size-3" />
          {t("Updated", "হালনাগাদ")}
        </span>
      )}

      {error && (
        <span className="text-[0.6875rem] text-destructive font-medium" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
