"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import { useLanguage } from "@/components/language-provider"
import type { InstructorStats } from "@/lib/services/instructor-id.service"
import type { BatchMemberStats } from "@/lib/services/member-id.service"
import type { Settings, SettingsInput } from "@/lib/services/settings.service"

const MAX_FEE = 999_999

interface AdminSettingsContextType {
  settings: Settings
  saving: boolean
  error: string | null
  saved: boolean
  validationError: string | null
  handleSave: (e?: React.FormEvent) => Promise<void>

  // Signups
  isSignupEnabled: boolean
  setIsSignupEnabled: (val: boolean) => void
  isMemberSignupEnabled: boolean
  setIsMemberSignupEnabled: (val: boolean) => void
  isInstructorSignupEnabled: boolean
  setIsInstructorSignupEnabled: (val: boolean) => void

  // Payments & Fees
  isRegistrationFeeRequired: boolean
  setIsRegistrationFeeRequired: (val: boolean) => void
  registrationFee: string
  setRegistrationFee: (val: string) => void
  bkashPersonalNumber: string
  setBkashPersonalNumber: (val: string) => void
  bkashAgentNumber: string
  setBkashAgentNumber: (val: string) => void
  nagadPersonalNumber: string
  setNagadPersonalNumber: (val: string) => void
  nagadAgentNumber: string
  setNagadAgentNumber: (val: string) => void
  rocketPersonalNumber: string
  setRocketPersonalNumber: (val: string) => void
  rocketAgentNumber: string
  setRocketAgentNumber: (val: string) => void

  // Member ID
  isAutoStudentIdEnabled: boolean
  setIsAutoStudentIdEnabled: (val: boolean) => void
  studentIdPrefix: string
  setStudentIdPrefix: (val: string) => void
  studentIdBatch: string
  setStudentIdBatch: (val: string) => void
  batchMemberLimit: string
  setBatchMemberLimit: (val: string) => void
  stats: BatchMemberStats | null
  statsLoading: boolean
  memberPreviewPrefix: string
  currentLimit: number
  isLimitReached: boolean

  // Instructor ID
  isAutoInstructorIdEnabled: boolean
  setIsAutoInstructorIdEnabled: (val: boolean) => void
  instructorIdPrefix: string
  setInstructorIdPrefix: (val: string) => void
  instructorStats: InstructorStats | null
  instructorStatsLoading: boolean
  instructorPrefixPreview: string
}

const AdminSettingsContext = createContext<AdminSettingsContextType | null>(null)

export function AdminSettingsProvider({
  children,
  initialSettings,
  initialStats,
  initialInstructorStats,
}: {
  children: ReactNode
  initialSettings: Settings
  initialStats?: BatchMemberStats | null
  initialInstructorStats?: InstructorStats | null
}) {
  const { t } = useLanguage()
  const router = useRouter()

  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

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

  // Live member stats fetcher
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

  // Live instructor stats fetcher
  useEffect(() => {
    let cancelled = false
    const prefix = instructorIdPrefix.trim().toUpperCase()

    if (!prefix) return

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
        // ignore background refresh errors
      } finally {
        if (!cancelled) setInstructorStatsLoading(false)
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [instructorIdPrefix])

  // Computed previews
  const memberPreviewPrefix = `${studentIdPrefix.trim().toUpperCase() || "DPICS"}-${studentIdBatch.trim() || "24"}`
  const currentLimit = Number.parseInt(batchMemberLimit.trim() || "0", 10)
  const isLimitReached = Boolean(
    currentLimit > 0 && stats && stats.totalMembers >= currentLimit
  )
  const instructorPrefixPreview = instructorIdPrefix.trim().toUpperCase() || "INS"

  async function handleSave(event?: React.FormEvent) {
    if (event) event.preventDefault()
    setValidationError(null)
    setError(null)
    setSaved(false)

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

    const payload: SettingsInput = {
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
    }

    setSaving(true)
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
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Request failed", "অনুরোধ ব্যর্থ হয়েছে"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminSettingsContext.Provider
      value={{
        settings,
        saving,
        error,
        saved,
        validationError,
        handleSave,
        isSignupEnabled,
        setIsSignupEnabled,
        isMemberSignupEnabled,
        setIsMemberSignupEnabled,
        isInstructorSignupEnabled,
        setIsInstructorSignupEnabled,
        isRegistrationFeeRequired,
        setIsRegistrationFeeRequired,
        registrationFee,
        setRegistrationFee,
        bkashPersonalNumber,
        setBkashPersonalNumber,
        bkashAgentNumber,
        setBkashAgentNumber,
        nagadPersonalNumber,
        setNagadPersonalNumber,
        nagadAgentNumber,
        setNagadAgentNumber,
        rocketPersonalNumber,
        setRocketPersonalNumber,
        rocketAgentNumber,
        setRocketAgentNumber,
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
        isAutoInstructorIdEnabled,
        setIsAutoInstructorIdEnabled,
        instructorIdPrefix,
        setInstructorIdPrefix,
        instructorStats,
        instructorStatsLoading,
        instructorPrefixPreview,
      }}
    >
      {children}
    </AdminSettingsContext.Provider>
  )
}

export function useAdminSettings() {
  const ctx = useContext(AdminSettingsContext)
  if (!ctx) {
    throw new Error("useAdminSettings must be used within an AdminSettingsProvider")
  }
  return ctx
}
