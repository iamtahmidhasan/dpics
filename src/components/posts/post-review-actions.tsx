"use client"

import { AlertCircle, Check, Loader2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PostStatus } from "@/generated/prisma/enums"
import { MAX_REJECTION_REASON_LENGTH } from "@/lib/post-constants"
import { cn } from "cn"

export type PostReviewActionsProps = {
  postId: string
  status: PostStatus
  onChanged?: () => void
}

/**
 * The moderation decision. Only `PENDING` posts can be approved or rejected;
 * for any other status this renders nothing and status changes happen through
 * the composer's save button.
 */
export function PostReviewActions({ postId, status, onChanged }: PostReviewActionsProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [reason, setReason] = useState("")
  const [pending, setPending] = useState<null | "APPROVE" | "REJECT">(null)
  const [error, setError] = useState<string | null>(null)

  if (status !== PostStatus.PENDING) return null

  const decide = async (decision: "APPROVE" | "REJECT") => {
    if (decision === "REJECT" && !reason.trim()) {
      setError(t("Add a reason so the author knows what to fix.", "লেখক যা ঠিক করবেন তা জানাতে একটি কারণ লিখুন।"))
      return
    }

    setPending(decision)
    setError(null)

    try {
      const response = await fetch(`/api/admin/posts/${postId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          decision === "APPROVE" ? { decision: "APPROVE" } : { decision, reason: reason.trim() }
        ),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)

        throw new Error(body?.error?.message ?? "Request failed")
      }

      router.refresh()
      onChanged?.()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Request failed", "অনুরোধ ব্যর্থ"))
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-warning/40 bg-warning/5 p-3">
      <p className="text-xs font-medium">
        {t("Awaiting review", "পর্যালোচনার অপেক্ষায়")}
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="review-reason" className="text-[0.6875rem] font-normal">
          {t(
            `Reason (required to reject, ${MAX_REJECTION_REASON_LENGTH} chars max)`,
            `কারণ (ফেরত দিতে আবশ্যক, সর্বোচ্চ ${MAX_REJECTION_REASON_LENGTH} অক্ষর)`
          )}
        </Label>
        <Textarea
          id="review-reason"
          rows={3}
          value={reason}
          onChange={(event) => {
            setReason(event.target.value)
            setError(null)
          }}
          placeholder={t("What should the author change?", "লেখকের কী বদলাতে হবে?")}
        />
      </div>

      {error ? (
        <p className="text-destructive flex items-start gap-1.5 text-[0.6875rem]">
          <AlertCircle className="mt-0.5 size-3 shrink-0" />
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          disabled={pending !== null}
          onClick={() => void decide("APPROVE")}
        >
          {pending === "APPROVE" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          {t("Approve & publish", "অনুমোদন ও প্রকাশ")}
        </Button>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending !== null}
          onClick={() => void decide("REJECT")}
          className={cn(reason.trim() ? "" : "opacity-70")}
        >
          {pending === "REJECT" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <X className="size-3.5" />
          )}
          {t("Reject", "ফেরত দিন")}
        </Button>
      </div>
    </div>
  )
}
