"use client"

import { Check, CheckCircle2, Loader2, TriangleAlert } from "lucide-react"

import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAdminSettings } from "./admin-settings-context"

export function AdminSettingsSaveCard() {
  const { t } = useLanguage()
  const { saving, error, saved, validationError, handleSave } = useAdminSettings()

  const displayError = validationError || error

  return (
    <Card size="sm" className="border-primary/20 bg-card mt-6">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          {displayError ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs/relaxed text-destructive"
            >
              <TriangleAlert className="mt-px size-3.5 shrink-0" />
              {displayError}
            </p>
          ) : null}

          {saved && !displayError ? (
            <p
              role="status"
              className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-xs/relaxed text-success"
            >
              <CheckCircle2 className="size-3.5 shrink-0" />
              {t(
                "Settings saved successfully across all categories.",
                "সকল ক্যাটাগরির সেটিংস সফলভাবে সংরক্ষণ হয়েছে।"
              )}
            </p>
          ) : null}

          {!displayError && !saved ? (
            <span className="text-xs text-muted-foreground">
              {t(
                "Changes in all tabs will be saved simultaneously.",
                "সব ট্যাবের পরিবর্তনগুলো একসাথেই সংরক্ষিত হবে।"
              )}
            </span>
          ) : null}
        </div>

        <div className="flex justify-end shrink-0">
          <Button type="button" onClick={() => handleSave()} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Check />}
            {saving
              ? t("Saving...", "সংরক্ষণ হচ্ছে...")
              : t("Save all settings", "সব সেটিংস সংরক্ষণ করুন")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
