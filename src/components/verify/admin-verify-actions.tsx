"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Loader2, Shield, Ticket } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EventRegistrationStatus } from "@/generated/prisma/enums"
import { useLanguage } from "@/components/language-provider"

interface AdminVerifyActionsProps {
  registrationId: string
  currentStatus: string
  ticketCode: string
}

export function AdminVerifyActions({
  registrationId,
  currentStatus: initialStatus,
  ticketCode,
}: AdminVerifyActionsProps) {
  const { t } = useLanguage()
  const [status, setStatus] = useState<string>(initialStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async (newStatus: EventRegistrationStatus) => {
    if (isUpdating) return
    setIsUpdating(true)

    try {
      const res = await fetch(`/api/admin/tickets/${registrationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        setStatus(newStatus)
        toast.success(
          t({
            en: `Ticket status updated to ${newStatus}`,
            bn: `টিকেট সফলভাবে ${newStatus} করা হয়েছে`,
          })
        )
      } else {
        const err = await res.json()
        toast.error(err.message || "Failed to update status")
      }
    } catch {
      toast.error("Network error while updating status")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3 print:hidden">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Shield className="size-4 text-primary" />
          <span>{t({ en: "Admin Quick Actions", bn: "অ্যাডমিন দ্রুত পদক্ষেপ" })}</span>
        </div>

        {status !== EventRegistrationStatus.ATTENDED && (
          <Button
            size="sm"
            disabled={isUpdating}
            onClick={() => handleUpdate(EventRegistrationStatus.ATTENDED)}
            className="h-8 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isUpdating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            {t({ en: "Mark as Complete / Attended", bn: "উপস্থিতি নিশ্চিত করুন" })}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground">
          {t({ en: "Change Status:", bn: "স্ট্যাটাস পরিবর্তন:" })}
        </span>
        <Select
          value={status}
          onValueChange={(val) => {
            if (val) handleUpdate(val as EventRegistrationStatus)
          }}
          disabled={isUpdating}
        >
          <SelectTrigger className="h-8 text-xs font-semibold bg-background sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EventRegistrationStatus.CONFIRMED}>CONFIRMED</SelectItem>
            <SelectItem value={EventRegistrationStatus.ATTENDED}>ATTENDED</SelectItem>
            <SelectItem value={EventRegistrationStatus.PENDING}>PENDING</SelectItem>
            <SelectItem value={EventRegistrationStatus.CANCELLED}>CANCELLED</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          {ticketCode && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/events/ticket/${ticketCode}`} target="_blank" />}
              className="h-8 text-xs gap-1.5"
            >
              <Ticket className="size-3.5" />
              {t({ en: "View Pass", bn: "পাস দেখুন" })}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/admin/tickets" target="_blank" />}
            className="h-8 text-xs gap-1.5"
          >
            {t({ en: "All Tickets", bn: "সব টিকেট" })}
          </Button>
        </div>
      </div>
    </div>
  )
}
