"use client"

import { Check, CheckCircle2, Loader2, TriangleAlert } from "lucide-react"
import { useEffect, useState } from "react"

import { TextField } from "@/components/form-fields"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import type { BatchMemberStats } from "@/lib/services/member-id.service"
import type { Settings, SettingsInput } from "@/lib/services/settings.service"
import { cn } from "cn"

const MAX_FEE = 999_999

type ToggleRowProps = {
  id: string
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ id, label, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-lg border border-border/80 p-3.5 transition-colors",
        disabled ? "opacity-60 bg-muted/30" : "bg-card hover:border-ring/40"
      )}
    >
      <div className="space-y-1">
        <label
          htmlFor={id}
          className={cn(
            "text-xs/relaxed font-medium block",
            disabled ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer text-foreground"
          )}
        >
          {label}
        </label>
        <FieldDescription>{description}</FieldDescription>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(nextChecked) => onChange(Boolean(nextChecked))}
      />
    </div>
  )
}

function AdminSettingsInnerForm({
  settings,
  initialStats,
  saving,
  error,
  saved,
  onSave,
}: {
  settings: Settings
  initialStats?: BatchMemberStats | null
  saving: boolean
  error: string | null
  saved: boolean
  onSave: (payload: SettingsInput) => void
}) {
  const { t } = useLanguage()

  const [isSignupEnabled, setIsSignupEnabled] = useState(settings.isSignupEnabled)
  const [isMemberSignupEnabled, setIsMemberSignupEnabled] = useState(settings.isMemberSignupEnabled)
  const [isInstructorSignupEnabled, setIsInstructorSignupEnabled] = useState(
    settings.isInstructorSignupEnabled
  )

  const [isRegistrationFeeRequired, setIsRegistrationFeeRequired] = useState(
    settings.isRegistrationFeeRequired
  )
  const [registrationFee, setRegistrationFee] = useState(String(settings.registrationFee))

  const [bkashPersonalNumber, setBkashPersonalNumber] = useState(
    settings.bkashPersonalNumber ?? ""
  )
  const [bkashAgentNumber, setBkashAgentNumber] = useState(settings.bkashAgentNumber ?? "")
  const [nagadPersonalNumber, setNagadPersonalNumber] = useState(
    settings.nagadPersonalNumber ?? ""
  )
  const [nagadAgentNumber, setNagadAgentNumber] = useState(settings.nagadAgentNumber ?? "")
  const [rocketPersonalNumber, setRocketPersonalNumber] = useState(
    settings.rocketPersonalNumber ?? ""
  )
  const [rocketAgentNumber, setRocketAgentNumber] = useState(settings.rocketAgentNumber ?? "")

  const [isAutoStudentIdEnabled, setIsAutoStudentIdEnabled] = useState(
    settings.isAutoStudentIdEnabled ?? true
  )
  const [studentIdPrefix, setStudentIdPrefix] = useState(settings.studentIdPrefix ?? "DPICS")
  const [studentIdBatch, setStudentIdBatch] = useState(settings.studentIdBatch ?? "24")
  const [batchMemberLimit, setBatchMemberLimit] = useState(String(settings.batchMemberLimit ?? 0))
  const [stats, setStats] = useState<BatchMemberStats | null>(initialStats ?? null)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const batch = studentIdBatch.trim()
    const prefix = studentIdPrefix.trim().toUpperCase()

    if (!batch) return

    const timer = setTimeout(async () => {
      setStatsLoading(true)
      try {
        const res = await fetch(
          `/api/admin/settings/batch-stats?batch=${encodeURIComponent(batch)}&prefix=${encodeURIComponent(prefix)}`
        )
        if (res.ok && !cancelled) {
          const data = await res.json()
          setStats(data)
        }
      } catch {
        // ignore background refresh errors
      } finally {
        if (!cancelled) setStatsLoading(false)
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [studentIdBatch, studentIdPrefix])

  const [validationError, setValidationError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setValidationError(null)

    const fee = Number.parseInt(registrationFee.trim() || "0", 10)
    if (Number.isNaN(fee) || fee < 0) {
      setValidationError(
        t("Registration fee must be a non-negative whole number", "নিবন্ধন ফি অবশ্যই একটি ধনাত্মক পূর্ণসংখ্যা হতে হবে")
      )
      return
    }

    if (fee > MAX_FEE) {
      setValidationError(
        t(`Registration fee cannot exceed ${MAX_FEE}`, `নিবন্ধন ফি সর্বোচ্চ ${MAX_FEE} হতে পারে`)
      )
      return
    }

    if (isRegistrationFeeRequired && fee <= 0) {
      setValidationError(
        t(
          "Registration fee must be greater than 0 when required",
          "ফি আবশ্যক হলে নিবন্ধন ফি ০ এর বেশি হতে হবে"
        )
      )
      return
    }

    const limit = Number.parseInt(batchMemberLimit.trim() || "0", 10)
    if (Number.isNaN(limit) || limit < 0) {
      setValidationError(
        t(
          "Batch member limit must be a non-negative whole number",
          "ব্যাচ সদস্য সীমা অবশ্যই একটি অ-ঋণাত্মক পূর্ণসংখ্যা হতে হবে"
        )
      )
      return
    }

    onSave({
      isSignupEnabled,
      isMemberSignupEnabled,
      isInstructorSignupEnabled,
      isRegistrationFeeRequired,
      registrationFee: fee,
      bkashPersonalNumber: bkashPersonalNumber.trim() || null,
      bkashAgentNumber: bkashAgentNumber.trim() || null,
      nagadPersonalNumber: nagadPersonalNumber.trim() || null,
      nagadAgentNumber: nagadAgentNumber.trim() || null,
      rocketPersonalNumber: rocketPersonalNumber.trim() || null,
      rocketAgentNumber: rocketAgentNumber.trim() || null,
      isAutoStudentIdEnabled,
      studentIdPrefix: studentIdPrefix.trim().toUpperCase() || "DPICS",
      studentIdBatch: studentIdBatch.trim() || "24",
      batchMemberLimit: limit,
    })
  }

  const previewPrefix = `${studentIdPrefix.trim().toUpperCase() || "DPICS"}${studentIdBatch.trim() || "24"}`
  const currentLimit = Number.parseInt(batchMemberLimit.trim() || "0", 10) || 0
  const isLimitReached = Boolean(
    currentLimit > 0 && stats && stats.totalMembers >= currentLimit
  )

  const displayError = validationError || error

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 1. Signup availability */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>{t("Signup availability", "নিবন্ধন প্রাপ্যতা")}</CardTitle>
          <CardDescription>
            {t(
              "Control who can create accounts and register for society roles.",
              "সমিতির বিভিন্ন ভূমিকায় কারা অ্যাকাউন্ট তৈরি ও নিবন্ধন করতে পারবেন তা নিয়ন্ত্রণ করুন।"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="space-y-3">
            <ToggleRow
              id="is-signup-enabled"
              label={t("Master sign-up toggle", "প্রধান নিবন্ধন সুইচ")}
              description={t(
                "When disabled, new user registrations are stopped entirely. Mid-flow onboarding and existing users are not affected.",
                "বন্ধ থাকলে নতুন ব্যবহারকারী নিবন্ধন সম্পূর্ণরূপে বন্ধ থাকবে। চলমান অনবোর্ডিং এবং বিদ্যমান ব্যবহারকারীরা প্রভাবিত হবেন না।"
              )}
              checked={isSignupEnabled}
              onChange={setIsSignupEnabled}
            />

            <ToggleRow
              id="is-member-signup-enabled"
              label={t("Member sign-up", "সদস্য নিবন্ধন")}
              description={t(
                "Allow students to register as society members.",
                "শিক্ষার্থীদের সমিতির সদস্য হিসেবে নিবন্ধনের অনুমতি দিন।"
              )}
              checked={isMemberSignupEnabled}
              disabled={!isSignupEnabled}
              onChange={setIsMemberSignupEnabled}
            />

            <ToggleRow
              id="is-instructor-signup-enabled"
              label={t("Instructor sign-up", "শিক্ষক নিবন্ধন")}
              description={t(
                "Allow teachers and mentors to register as instructors.",
                "শিক্ষক ও মেন্টরদের শিক্ষক হিসেবে নিবন্ধনের অনুমতি দিন।"
              )}
              checked={isInstructorSignupEnabled}
              disabled={!isSignupEnabled}
              onChange={setIsInstructorSignupEnabled}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      {/* 2. Registration payment */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>{t("Registration payment", "নিবন্ধন ফি ও পেমেন্ট")}</CardTitle>
          <CardDescription>
            {t(
              "Configure registration fee requirements for members and provide society recipient account numbers.",
              "সদস্যদের জন্য নিবন্ধন ফি ও সমিতির প্রাপক অ্যাকাউন্ট নম্বর নির্ধারণ করুন।"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGroup className="space-y-3">
            <ToggleRow
              id="is-fee-required"
              label={t("Require registration fee", "নিবন্ধন ফি আবশ্যক")}
              description={t(
                "When turned on, members must pay the registration fee before membership verification. Instructors register for free.",
                "চালু থাকলে সদস্যদের যাচাইকরণের আগে নিবন্ধন ফি প্রদান করতে হবে। শিক্ষকদের নিবন্ধন বিনামূল্যে।"
              )}
              checked={isRegistrationFeeRequired}
              onChange={setIsRegistrationFeeRequired}
            />

            <Field>
              <FieldLabel htmlFor="registration-fee">
                {t("Registration fee (৳ / Taka)", "নিবন্ধন ফি (৳ / টাকা)")}
              </FieldLabel>
              <Input
                id="registration-fee"
                name="registrationFee"
                type="number"
                min={0}
                max={MAX_FEE}
                value={registrationFee}
                onChange={(e) => setRegistrationFee(e.target.value)}
                placeholder="0"
                className="max-w-xs"
              />
              <FieldDescription>
                {t(
                  "The fee amount in whole Bangladeshi Taka (whole numbers only).",
                  "পূর্ণসংখ্যায় বাংলাদেশি টাকায় ফি-এর পরিমাণ।"
                )}
              </FieldDescription>
            </Field>
          </FieldGroup>

          <Separator className="my-2" />

          <div className="space-y-3">
            <div>
              <h3 className="text-xs/relaxed font-semibold text-foreground">
                {t("Payment recipient numbers", "পেমেন্ট প্রাপক নম্বর")}
              </h3>
              <p className="text-xs/relaxed text-muted-foreground">
                {t(
                  "Provide the society official account numbers shown to applicants on the member details step.",
                  "সদস্য বিস্তারিত ধাপে আবেদনকারীদের দেখানো হবে এমন সমিতির অফিসিয়াল অ্যাকাউন্ট নম্বর প্রদান করুন।"
                )}
              </p>
            </div>

            {/* bKash */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("bKash", "বিকাশ")}
              </span>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  id="bkash-personal"
                  label={t("bKash Personal", "বিকাশ পার্সোনাল")}
                  value={bkashPersonalNumber}
                  onChange={setBkashPersonalNumber}
                  placeholder="01XXXXXXXXX"
                  type="tel"
                />
                <TextField
                  id="bkash-agent"
                  label={t("bKash Agent", "বিকাশ এজেন্ট")}
                  value={bkashAgentNumber}
                  onChange={setBkashAgentNumber}
                  placeholder="01XXXXXXXXX"
                  type="tel"
                />
              </div>
            </div>

            <Separator className="my-1" />

            {/* Nagad */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("Nagad", "নগদ")}
              </span>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  id="nagad-personal"
                  label={t("Nagad Personal", "নগদ পার্সোনাল")}
                  value={nagadPersonalNumber}
                  onChange={setNagadPersonalNumber}
                  placeholder="01XXXXXXXXX"
                  type="tel"
                />
                <TextField
                  id="nagad-agent"
                  label={t("Nagad Agent", "নগদ এজেন্ট")}
                  value={nagadAgentNumber}
                  onChange={setNagadAgentNumber}
                  placeholder="01XXXXXXXXX"
                  type="tel"
                />
              </div>
            </div>

            <Separator className="my-1" />

            {/* Rocket */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("Rocket", "রকেট")}
              </span>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  id="rocket-personal"
                  label={t("Rocket Personal", "রকেট পার্সোনাল")}
                  value={rocketPersonalNumber}
                  onChange={setRocketPersonalNumber}
                  placeholder="01XXXXXXXXX"
                  type="tel"
                />
                <TextField
                  id="rocket-agent"
                  label={t("Rocket Agent", "রকেট এজেন্ট")}
                  value={rocketAgentNumber}
                  onChange={setRocketAgentNumber}
                  placeholder="01XXXXXXXXX"
                  type="tel"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Student ID & Batch configuration */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>{t("Student ID & Batch settings", "স্টুডেন্ট আইডি ও ব্যাচ সেটিংস")}</CardTitle>
          <CardDescription>
            {t(
              "Configure automatic DPICS[BATCH][xxxx] student ID generation, gap-filling, and batch member limits.",
              "স্বয়ংক্রিয় DPICS[BATCH][xxxx] স্টুডেন্ট আইডি তৈরি, শূন্যস্থান পূরণ এবং ব্যাচ সদস্য সীমা নির্ধারণ করুন।"
            )}
          </CardDescription>
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
                    {previewPrefix}0001
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
                    {statsLoading ? "..." : (stats?.nextAvailableId ?? (isLimitReached ? t("Limit reached", "সীমা পূর্ণ") : `${previewPrefix}0001`))}
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

      {/* 5. Save button card & feedback */}
      <Card size="sm">
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
                {t("Settings saved successfully.", "সেটিংস সফলভাবে সংরক্ষণ হয়েছে।")}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end shrink-0">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Check />}
              {saving ? t("Saving...", "সংরক্ষণ হচ্ছে...") : t("Save settings", "সেটিংস সংরক্ষণ করুন")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

export function AdminSettingsForm({
  initialSettings,
  initialStats,
}: {
  initialSettings: Settings
  initialStats?: BatchMemberStats | null
}) {
  const { t } = useLanguage()
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSave(payload: SettingsInput) {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const body = await response.json()

      if (!response.ok) {
        throw new Error(
          body?.error?.message ?? t("Failed to save settings", "সেটিংস সংরক্ষণ ব্যর্থ হয়েছে")
        )
      }

      setSettings(body as Settings)
      setSaved(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Request failed", "অনুরোধ ব্যর্থ হয়েছে"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminSettingsInnerForm
      key={settings.updatedAt}
      settings={settings}
      initialStats={initialStats}
      saving={saving}
      error={error}
      saved={saved}
      onSave={handleSave}
    />
  )
}
