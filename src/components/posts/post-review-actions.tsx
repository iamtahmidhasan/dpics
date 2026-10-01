"use client"

import { AlertCircle, Check, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PostStatus } from "@/generated/prisma/enums"
import { MAX_REJECTION_REASON_LENGTH } from "@/lib/post-constants"
import { postStatusLabel } from "@/lib/post-labels"

export type PostReviewActionsProps = {
  postId: string
  status: PostStatus
  initialMessage?: string | null
  onChanged?: () => void
}

const ALL_STATUSES: PostStatus[] = [
  PostStatus.PUBLISHED,
  PostStatus.REJECTED,
  PostStatus.PENDING,
  PostStatus.UPDATE,
  PostStatus.DRAFT,
  PostStatus.ARCHIVED,
]

export function PostReviewActions({
  postId,
  status,
  onChanged,
}: PostReviewActionsProps) {
  const router = useRouter()
  const { t } = useLanguage()

  // Closed by default; opens when a status is selected
  const [selectedStatus, setSelectedStatus] = useState<PostStatus | null>(null)
  const [message, setMessage] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const statusLabel = postStatusLabel(t)

  if (status !== PostStatus.PENDING && status !== PostStatus.UPDATE) return null

  const handleSelectStatus = (val: string | null) => {
    if (!val) return
    const nextStatus = val as PostStatus
    setSelectedStatus(nextStatus)
    // Clear the input area when selecting another option
    setMessage("")
    setError(null)
  }

  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      setError(t("Please select a status first.", "অনুগ্রহ করে প্রথমে একটি অবস্থা নির্বাচন করুন।"))
      return
    }

    setIsUpdating(true)
    setError(null)
    setSaved(false)

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          massageForAuthor: message.trim() || null,
        }),
      })

      const body = await response.json()

      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Failed to update status")
      }

      setSaved(true)
      router.refresh()
      onChanged?.()

      setTimeout(() => setSaved(false), 3000)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to update status")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-warning/40 bg-warning/5 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-foreground">
            {status === PostStatus.UPDATE
              ? t("Update awaiting review", "আপডেট পর্যালোচনার অপেক্ষায়")
              : t("Awaiting review", "পর্যালোচনার অপেক্ষায়")}
          </p>
          <p className="text-[0.6875rem] text-muted-foreground">
            {t(
              "Select a status below to review this post and send feedback to the author.",
              "এই পোস্টটি পর্যালোচনা করতে এবং লেখককে মতামত পাঠাতে নিচে একটি অবস্থা নির্বাচন করুন।"
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            {t("Status:", "অবস্থা:")}
          </span>
          <Select
            value={selectedStatus ?? ""}
            disabled={isUpdating}
            onValueChange={handleSelectStatus}
          >
            <SelectTrigger className="h-8 min-w-[155px] text-xs font-medium bg-background">
              <SelectValue placeholder={t("Select status...", "অবস্থা নির্বাচন করুন...")} />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {statusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Opens when status is selected; message textarea is blanked on each status selection */}
      {selectedStatus ? (
        <div className="space-y-3 pt-2.5 border-t border-warning/20 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-1.5">
            <Label htmlFor="review-message" className="text-[0.6875rem] font-medium text-foreground">
              {t(
                `Message for author (${statusLabel(selectedStatus)}) — optional, ${MAX_REJECTION_REASON_LENGTH} chars max`,
                `লেখকের জন্য বার্তা (${statusLabel(selectedStatus)}) — ঐচ্ছিক, সর্বোচ্চ ${MAX_REJECTION_REASON_LENGTH} অক্ষর`
              )}
            </Label>
            <Textarea
              id="review-message"
              rows={3}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value)
                setError(null)
              }}
              placeholder={
                selectedStatus === PostStatus.REJECTED
                  ? t("Tell the author what needs to be changed...", "লেখককে বলুন কী পরিবর্তন করতে হবে...")
                  : selectedStatus === PostStatus.PUBLISHED
                    ? t("Add an approval note or message for the author...", "অনুমোদনের বার্তা বা লেখকের জন্য মন্তব্য লিখুন...")
                    : t("Write a message or notes for the author...", "লেখকের জন্য কোনো বার্তা বা মন্তব্য লিখুন...")
              }
              className="bg-background"
            />
          </div>

          {error ? (
            <p className="text-destructive flex items-start gap-1.5 text-[0.6875rem]">
              <AlertCircle className="mt-0.5 size-3 shrink-0" />
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-between pt-0.5">
            <Button
              type="button"
              size="sm"
              disabled={isUpdating}
              onClick={handleUpdateStatus}
              className="text-xs"
            >
              {isUpdating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              {t("Update status", "অবস্থা হালনাগাদ করুন")}
            </Button>

            {saved ? (
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                {t("Status updated successfully", "অবস্থা সফলভাবে হালনাগাদ করা হয়েছে")}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
