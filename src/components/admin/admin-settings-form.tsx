"use client"

import {
  Award,
  Check,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Info,
  Loader2,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react"
import { useEffect, useState } from "react"

import { TextField } from "@/components/form-fields"
import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import type { InstructorStats } from "@/lib/services/instructor-id.service"
import type { BatchMemberStats } from "@/lib/services/member-id.service"
import type { Settings, SettingsInput } from "@/lib/services/settings.service"
import { cn } from "cn"

const MAX_FEE = 999_999

type SettingsTab = "signups" | "member_id" | "instructor_id" | "payments"

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
  initialInstructorStats,
  saving,
  error,
  saved,
  onSave,
}: {
  settings: Settings
  initialStats?: BatchMemberStats | null
  initialInstructorStats?: InstructorStats | null
  saving: boolean
  error: string | null
  saved: boolean
  onSave: (payload: SettingsInput) => void
}) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<SettingsTab>("signups")

  // Signups
  const [isSignupEnabled, setIsSignupEnabled] = useState(settings.isSignupEnabled)
  const [isMemberSignupEnabled, setIsMemberSignupEnabled] = useState(settings.isMemberSignupEnabled)
  const [isInstructorSignupEnabled, setIsInstructorSignupEnabled] = useState(
    settings.isInstructorSignupEnabled
  )

  // Payments & Fees
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

  // Member ID
  const [isAutoStudentIdEnabled, setIsAutoStudentIdEnabled] = useState(
    settings.isAutoStudentIdEnabled ?? true
  )
  const [studentIdPrefix, setStudentIdPrefix] = useState(settings.studentIdPrefix ?? "DPICS")
  const [studentIdBatch, setStudentIdBatch] = useState(settings.studentIdBatch ?? "24")
  const [batchMemberLimit, setBatchMemberLimit] = useState(String(settings.batchMemberLimit ?? 0))
  const [stats, setStats] = useState<BatchMemberStats | null>(initialStats ?? null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Instructor ID
  const [isAutoInstructorIdEnabled, setIsAutoInstructorIdEnabled] = useState(
    settings.isAutoInstructorIdEnabled ?? true
  )
  const [instructorIdPrefix, setInstructorIdPrefix] = useState(
    settings.instructorIdPrefix ?? "INS"
  )
  const [instructorStats, setInstructorStats] = useState<InstructorStats | null>(
    initialInstructorStats ?? null
  )
  const [instructorStatsLoading, setInstructorStatsLoading] = useState(false)

  // Fetch Member Batch stats
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

  // Fetch Instructor ID stats
  useEffect(() => {
    let cancelled = false
    const prefix = instructorIdPrefix.trim().toUpperCase()

    const timer = setTimeout(async () => {
      setInstructorStatsLoading(true)
      try {
        const res = await fetch(
          `/api/admin/settings/instructor-stats?prefix=${encodeURIComponent(prefix)}`
        )
        if (res.ok && !cancelled) {
          const data = await res.json()
          setInstructorStats(data)
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setInstructorStatsLoading(false)
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [instructorIdPrefix])

  const [validationError, setValidationError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setValidationError(null)

    const fee = Number.parseInt(registrationFee.trim() || "0", 10)
    if (Number.isNaN(fee) || fee < 0) {
      setValidationError(
        t("Registration fee must be a non-negative whole number", "নিবন্ধন ফি অবশ্যই একটি ধনাত্মক পূর্ণসংখ্যা হতে হবে")
      )
      setActiveTab("payments")
      return
    }

    if (fee > MAX_FEE) {
      setValidationError(
        t(`Registration fee cannot exceed ${MAX_FEE}`, `নিবন্ধন ফি সর্বোচ্চ ${MAX_FEE} হতে পারে`)
      )
      setActiveTab("payments")
      return
    }

    if (isRegistrationFeeRequired && fee <= 0) {
      setValidationError(
        t(
          "Registration fee must be greater than 0 when required",
          "ফি আবশ্যক হলে নিবন্ধন ফি ০ এর বেশি হতে হবে"
        )
      )
      setActiveTab("payments")
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
      setActiveTab("member_id")
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
      isAutoInstructorIdEnabled,
      instructorIdPrefix: instructorIdPrefix.trim().toUpperCase() || "INS",
    })
  }

  const memberPreviewPrefix = `${studentIdPrefix.trim().toUpperCase() || "DPICS"}${studentIdBatch.trim() || "24"}`
  const currentLimit = Number.parseInt(batchMemberLimit.trim() || "0", 10) || 0
  const isLimitReached = Boolean(
    currentLimit > 0 && stats && stats.totalMembers >= currentLimit
  )

  const instructorPrefixPreview = instructorIdPrefix.trim().toUpperCase() || "INS"

  const displayError = validationError || error

  const tabs: Array<{
    id: SettingsTab
    label: { en: string; bn: string }
    icon: any
    badge?: string
  }> = [
    {
      id: "signups",
      label: { en: "Signups & Access", bn: "নিবন্ধন ও অ্যাক্সেস" },
      icon: Users,
    },
    {
      id: "member_id",
      label: { en: "Student ID & Batch", bn: "স্টুডেন্ট আইডি ও ব্যাচ" },
      icon: GraduationCap,
      badge: memberPreviewPrefix,
    },
    {
      id: "instructor_id",
      label: { en: "Instructor ID", bn: "শিক্ষক আইডি" },
      icon: Award,
      badge: instructorPrefixPreview,
    },
    {
      id: "payments",
      label: { en: "Payments (Reusable)", bn: "পেমেন্টস (পুনঃব্যবহারযোগ্য)" },
      icon: CreditCard,
      badge: t("Shared", "শেয়ার্ড"),
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Settings Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-px" aria-label="Settings Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap outline-none",
                  isActive
                    ? "border-primary text-primary font-semibold bg-primary/5 rounded-t-md"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className={cn("size-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{t(tab.label.en, tab.label.bn)}</span>
                {tab.badge ? (
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.2 rounded font-normal",
                      isActive
                        ? "bg-primary/15 text-primary font-medium"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>
      </div>

      {/* 1. Signup availability */}
      {activeTab === "signups" && (
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
      )}

      {/* 2. Student ID & Batch configuration */}
      {activeTab === "member_id" && (
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
      )}

      {/* 3. Instructor ID configuration */}
      {activeTab === "instructor_id" && (
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
      )}

      {/* 4. Reusable Payments configuration (Shared between Member registration and Courses) */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          {/* Reuse explanation banner */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-xs flex items-start gap-2.5">
            <Info className="size-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-foreground">
                {t("Unified Reusable Payment System", "একীভূত পুনঃব্যবহারযোগ্য পেমেন্ট ব্যবস্থা")}
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {t(
                  "The payment methods and recipient numbers configured below are automatically shared and reused across both the Member Registration Form (for initial fee payments) and the Courses Platform (for course enrollments and payment checkouts).",
                  "নিচে নির্ধারিত পেমেন্ট মাধ্যম এবং প্রাপক নম্বরগুলো স্বয়ংক্রিয়ভাবে সদস্য নিবন্ধন ফর্ম (ফি প্রদান) এবং কোর্স প্ল্যাটফর্ম (কোর্স ভর্তি ও পেমেন্ট চেকআউট) উভয় স্থানে ব্যবহৃত হবে।"
                )}
              </p>
            </div>
          </div>

          {/* Member registration fee settings */}
          <Card size="sm">
            <CardHeader>
              <CardTitle>{t("Member Registration Fee", "সদস্য নিবন্ধন ফি")}</CardTitle>
              <CardDescription>
                {t(
                  "Configure registration fee requirements for student members. (Instructors register for free).",
                  "শিক্ষার্থী সদস্যদের জন্য নিবন্ধন ফি নির্ধারণ করুন। (শিক্ষকদের নিবন্ধন বিনামূল্যে)।"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldGroup className="space-y-3">
                <ToggleRow
                  id="is-fee-required"
                  label={t("Require registration fee", "নিবন্ধন ফি আবশ্যক")}
                  description={t(
                    "When turned on, members must pay the registration fee before membership verification.",
                    "চালু থাকলে সদস্যদের যাচাইকরণের আগে নিবন্ধন ফি প্রদান করতে হবে।"
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
            </CardContent>
          </Card>

          {/* Shared Recipient Account Numbers */}
          <Card size="sm">
            <CardHeader>
              <CardTitle>{t("Payment Recipient Numbers (MFS)", "পেমেন্ট প্রাপক নম্বর (এমএফএস)")}</CardTitle>
              <CardDescription>
                {t(
                  "Provide the society official account numbers shown to applicants on member registration and students on course enrollment checkouts.",
                  "সদস্য নিবন্ধন ও কোর্স ভর্তি চেকআউটে শিক্ষার্থীদের দেখানো সমিতির অফিসিয়াল অ্যাকাউন্ট নম্বর প্রদান করুন।"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* bKash */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {t("bKash", "বিকাশ")}
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal">
                    {t("Personal & Agent", "পার্সোনাল ও এজেন্ট")}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    id="bkash-personal"
                    label={t("bKash Personal Number", "বিকাশ পার্সোনাল নম্বর")}
                    value={bkashPersonalNumber}
                    onChange={setBkashPersonalNumber}
                    placeholder="01XXXXXXXXX"
                    type="tel"
                  />
                  <TextField
                    id="bkash-agent"
                    label={t("bKash Agent Number", "বিকাশ এজেন্ট নম্বর")}
                    value={bkashAgentNumber}
                    onChange={setBkashAgentNumber}
                    placeholder="01XXXXXXXXX"
                    type="tel"
                  />
                </div>
              </div>

              <Separator className="my-2" />

              {/* Nagad */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {t("Nagad", "নগদ")}
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal">
                    {t("Personal & Agent", "পার্সোনাল ও এজেন্ট")}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    id="nagad-personal"
                    label={t("Nagad Personal Number", "নগদ পার্সোনাল নম্বর")}
                    value={nagadPersonalNumber}
                    onChange={setNagadPersonalNumber}
                    placeholder="01XXXXXXXXX"
                    type="tel"
                  />
                  <TextField
                    id="nagad-agent"
                    label={t("Nagad Agent Number", "নগদ এজেন্ট নম্বর")}
                    value={nagadAgentNumber}
                    onChange={setNagadAgentNumber}
                    placeholder="01XXXXXXXXX"
                    type="tel"
                  />
                </div>
              </div>

              <Separator className="my-2" />

              {/* Rocket */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {t("Rocket", "রকেট")}
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal">
                    {t("Personal & Agent", "পার্সোনাল ও এজেন্ট")}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    id="rocket-personal"
                    label={t("Rocket Personal Number", "রকেট পার্সোনাল নম্বর")}
                    value={rocketPersonalNumber}
                    onChange={setRocketPersonalNumber}
                    placeholder="01XXXXXXXXX"
                    type="tel"
                  />
                  <TextField
                    id="rocket-agent"
                    label={t("Rocket Agent Number", "রকেট এজেন্ট নম্বর")}
                    value={rocketAgentNumber}
                    onChange={setRocketAgentNumber}
                    placeholder="01XXXXXXXXX"
                    type="tel"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Global Save button card & status feedback */}
      <Card size="sm" className="border-primary/20 bg-card">
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
                {t("Settings saved successfully across all categories.", "সকল ক্যাটাগরির সেটিংস সফলভাবে সংরক্ষণ হয়েছে।")}
              </p>
            ) : null}

            {!displayError && !saved ? (
              <span className="text-xs text-muted-foreground">
                {t("Changes in all tabs will be saved simultaneously.", "সব ট্যাবের পরিবর্তনগুলো একসাথেই সংরক্ষিত হবে।")}
              </span>
            ) : null}
          </div>

          <div className="flex justify-end shrink-0">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Check />}
              {saving ? t("Saving...", "সংরক্ষণ হচ্ছে...") : t("Save all settings", "সব সেটিংস সংরক্ষণ করুন")}
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
  initialInstructorStats,
}: {
  initialSettings: Settings
  initialStats?: BatchMemberStats | null
  initialInstructorStats?: InstructorStats | null
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
      initialInstructorStats={initialInstructorStats}
      saving={saving}
      error={error}
      saved={saved}
      onSave={handleSave}
    />
  )
}
