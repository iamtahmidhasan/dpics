"use client"

import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react"

import { useLanguage } from "@/components/language-provider"
import { useAdminUser } from "./admin-user-context"

export function AdminUserStatusAlert() {
  const { t } = useLanguage()
  const { error, saved, saving } = useAdminUser()

  if (!error && !saved && !saving) return null

  return (
    <div className="space-y-2">
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs/relaxed text-destructive"
        >
          <TriangleAlert className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}

      {saved && !error ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-xs/relaxed text-success"
        >
          <CheckCircle2 className="size-3.5" />
          {t("Saved.", "সংরক্ষণ হয়েছে।")}
        </p>
      ) : null}

      {saving ? (
        <p className="flex items-center gap-2 text-xs/relaxed text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          {t("Saving...", "সংরক্ষণ হচ্ছে...")}
        </p>
      ) : null}
    </div>
  )
}
