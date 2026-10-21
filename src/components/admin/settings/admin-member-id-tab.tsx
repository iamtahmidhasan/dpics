"use client"

import { TextField } from "@/components/form-fields"
import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "cn"
import { ToggleRow } from "./toggle-row"
import { AdminSettingsSaveCard } from "./admin-settings-save-card"
import { useAdminSettings } from "./admin-settings-context"

export function AdminMemberIdTab() {
  const { t } = useLanguage()
  const {
    isAutoStudentIdEnabled,
    setIsAutoStudentIdEnabled,
    studentIdPrefix,
    setStudentIdPrefix,
    studentIdBatch,
    setStudentIdBatch,
    batchMemberLimit,
    setBatchMemberLimit,
    stats,
    statsLoading,
    memberPreviewPrefix,
    currentLimit,
    isLimitReached,
  } = useAdminSettings()

  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>{t("Student ID & Batch settings", "স্টুডেন্ট আইডি ও ব্যাচ সেটিংস")}</CardTitle>
              <CardDescription>
                {t(
                  "Configure automatic DPICS[BATCH][xxxx] student ID generation, gap-filling, and batch member limits.",
                  "স্বয়ংক্রিয় DPICS[BATCH][xxxx] স্টুডেন্ট আইডি তৈরি, শূন্যস্থান পূরণ এবং ব্যাচ সদস্য সীমা নির্ধারণ করুন।"
                )}
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {memberPreviewPrefix}0001
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGroup className="space-y-3">
            <ToggleRow
              id="auto-student-id-enabled"
              label={t("Auto-generate student ID", "স্বয়ংক্রিয় স্টুডেন্ট আইডি তৈরি")}
              description={t(
                "Automatically assign IDs in DPICS[BATCH][xxxx] format starting from 0001 with gap filling.",
                "০০০১ থেকে শুরু করে শূন্যস্থান পূরণসহ স্বয়ংক্রিয়ভাবে DPICS[BATCH][xxxx] ফরম্যাটে আইডি প্রদান করুন।"
              )}
              checked={isAutoStudentIdEnabled}
              onChange={setIsAutoStudentIdEnabled}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                id="student-id-prefix"
                label={t("ID prefix", "আইডি প্রিফিক্স")}
                value={studentIdPrefix}
                onChange={(val) => setStudentIdPrefix(val.toUpperCase())}
                placeholder="DPICS"
                disabled={!isAutoStudentIdEnabled}
                hint={t("Default prefix before batch code", "ব্যাচ কোডের আগের প্রাথমিক প্রিফিক্স")}
              />

              <TextField
                id="student-id-batch"
                label={t("Current batch", "বর্তমান ব্যাচ")}
                value={studentIdBatch}
                onChange={setStudentIdBatch}
                placeholder="24"
                disabled={!isAutoStudentIdEnabled}
                hint={t("Intake batch code (e.g. 24)", "ভর্তির ব্যাচ কোড (যেমন ২৪)")}
              />

              <div className="space-y-1">
                <FieldLabel htmlFor="batch-member-limit">
                  {t("Batch member limit", "ব্যাচ সদস্য সীমা")}
                </FieldLabel>
                <Input
                  id="batch-member-limit"
                  type="number"
                  min={0}
                  step={1}
                  value={batchMemberLimit}
                  onChange={(e) => setBatchMemberLimit(e.target.value)}
                  placeholder="0"
                  disabled={!isAutoStudentIdEnabled}
                />
                <FieldDescription>
                  {t("Max members for this batch. 0 = unlimited.", "এই ব্যাচে সর্বোচ্চ সদস্য সংখ্যা। ০ দিলে সীমাহীন।")}
                </FieldDescription>
              </div>
            </div>

            {/* Live Preview & Batch Status Card */}
            <div className="rounded-lg border border-border/80 bg-muted/30 p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {t("ID Format Preview:", "আইডি ফরম্যাট প্রিভিউ:")}
                  </span>
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {memberPreviewPrefix}0001
                  </span>
                </div>
                <span className="text-[0.6875rem] text-muted-foreground">
                  {t("Starts from 0001 • Gaps reused first", "০০০১ থেকে শুরু • ফাঁকা আইডি আগে পূরণ")}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="rounded border bg-background p-2">
                  <div className="text-muted-foreground text-[0.6875rem]">
                    {t("Active Members", "বর্তমান সদস্য")}
                  </div>
                  <div className="font-heading font-semibold text-sm">
                    {stats?.totalMembers ?? 0}
                  </div>
                </div>

                <div className="rounded border bg-background p-2">
                  <div className="text-muted-foreground text-[0.6875rem]">
                    {t("Member Limit", "সদস্য সীমা")}
                  </div>
                  <div className="font-heading font-semibold text-sm">
                    {currentLimit > 0 ? currentLimit : t("Unlimited", "সীমাহীন")}
                  </div>
                </div>

                <div className="rounded border bg-background p-2">
                  <div className="text-muted-foreground text-[0.6875rem]">
                    {t("Next Generated ID", "পরবর্তী তৈরি আইডি")}
                  </div>
                  <div className="font-mono font-semibold text-sm text-primary">
                    {statsLoading ? "..." : (stats?.nextAvailableId ?? (isLimitReached ? t("Limit reached", "সীমা পূর্ণ") : `${memberPreviewPrefix}0001`))}
                  </div>
                </div>

                <div className="rounded border bg-background p-2">
                  <div className="text-muted-foreground text-[0.6875rem]">
                    {t("Batch Status", "ব্যাচ স্ট্যাটাস")}
                  </div>
                  <div className={cn(
                    "font-semibold text-xs mt-0.5 inline-flex items-center gap-1",
                    isLimitReached ? "text-destructive" : "text-success"
                  )}>
                    {isLimitReached ? t("Full (Closed)", "পূর্ণ (বন্ধ)") : t("Accepting", "চলমান")}
                  </div>
                </div>
              </div>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <AdminSettingsSaveCard />
    </div>
  )
}
