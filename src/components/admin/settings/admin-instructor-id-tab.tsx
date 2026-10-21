"use client"

import { TextField } from "@/components/form-fields"
import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import { ToggleRow } from "./toggle-row"
import { AdminSettingsSaveCard } from "./admin-settings-save-card"
import { useAdminSettings } from "./admin-settings-context"

export function AdminInstructorIdTab() {
  const { t } = useLanguage()
  const {
    isAutoInstructorIdEnabled,
    setIsAutoInstructorIdEnabled,
    instructorIdPrefix,
    setInstructorIdPrefix,
    instructorStats,
    instructorStatsLoading,
    instructorPrefixPreview,
  } = useAdminSettings()

  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>{t("Instructor ID settings", "শিক্ষক আইডি সেটিংস")}</CardTitle>
              <CardDescription>
                {t(
                  "Configure automatic INS[xxxx] instructor ID generation, gap-filling sequence, and custom prefix.",
                  "স্বয়ংক্রিয় INS[xxxx] শিক্ষক আইডি তৈরি, শূন্যস্থান পূরণ ক্রম এবং প্রিফিক্স নির্ধারণ করুন।"
                )}
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {instructorPrefixPreview}0001
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGroup className="space-y-3">
            <ToggleRow
              id="auto-instructor-id-enabled"
              label={t("Auto-generate instructor ID", "স্বয়ংক্রিয় শিক্ষক আইডি তৈরি")}
              description={t(
                "Automatically assign IDs in INS[xxxx] format starting from 0001 with gap filling on registration & admin forms.",
                "নিবন্ধন ও অ্যাডমিন ফরমে ০০০১ থেকে শুরু করে শূন্যস্থান পূরণসহ স্বয়ংক্রিয়ভাবে INS[xxxx] ফরম্যাটে আইডি প্রদান করুন।"
              )}
              checked={isAutoInstructorIdEnabled}
              onChange={setIsAutoInstructorIdEnabled}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="instructor-id-prefix"
                label={t("Instructor ID prefix", "শিক্ষক আইডি প্রিফিক্স")}
                value={instructorIdPrefix}
                onChange={(val) => setInstructorIdPrefix(val.toUpperCase())}
                placeholder="INS"
                disabled={!isAutoInstructorIdEnabled}
                hint={t("Prefix before 4-digit sequence (e.g. INS)", "৪ ডিজিটের ক্রমের আগের প্রিফিক্স (যেমন INS)")}
              />
            </div>

            {/* Live Preview & Instructor Stats Card */}
            <div className="rounded-lg border border-border/80 bg-muted/30 p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {t("Instructor ID Preview:", "শিক্ষক আইডি প্রিভিউ:")}
                  </span>
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {instructorPrefixPreview}0001
                  </span>
                </div>
                <span className="text-[0.6875rem] text-muted-foreground">
                  {t("Maintains continuous sequence • Gaps reused first", "ধারাবাহিক ক্রম বজায় রাখে • ফাঁকা আইডি আগে পূরণ")}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="rounded border bg-background p-2">
                  <div className="text-muted-foreground text-[0.6875rem]">
                    {t("Total Instructors", "মোট শিক্ষক")}
                  </div>
                  <div className="font-heading font-semibold text-sm">
                    {instructorStats?.totalInstructors ?? 0}
                  </div>
                </div>

                <div className="rounded border bg-background p-2">
                  <div className="text-muted-foreground text-[0.6875rem]">
                    {t("Configured Prefix", "নির্ধারিত প্রিফিক্স")}
                  </div>
                  <div className="font-mono font-semibold text-sm">
                    {instructorPrefixPreview}
                  </div>
                </div>

                <div className="rounded border bg-background p-2">
                  <div className="text-muted-foreground text-[0.6875rem]">
                    {t("Next Generated ID", "পরবর্তী তৈরি আইডি")}
                  </div>
                  <div className="font-mono font-semibold text-sm text-primary">
                    {instructorStatsLoading ? "..." : (instructorStats?.nextAvailableId ?? `${instructorPrefixPreview}0001`)}
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
