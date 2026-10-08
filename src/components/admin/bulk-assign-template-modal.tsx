"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Filter,
  UserCheck,
  Search,
  Layers,
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import type { BulkAssignCriteria, MediaTemplateSummary } from "@/lib/template-engine/types"

const DEPARTMENTS = [
  { value: "COMPUTER_SCIENCE_AND_TECHNOLOGY", label: "Computer Science & Technology" },
  { value: "CIVIL_TECHNOLOGY", label: "Civil Technology" },
  { value: "ELECTRICAL_TECHNOLOGY", label: "Electrical Technology" },
  { value: "ELECTRONICS_TECHNOLOGY", label: "Electronics Technology" },
  { value: "MECHANICAL_TECHNOLOGY", label: "Mechanical Technology" },
  { value: "POWER_TECHNOLOGY", label: "Power Technology" },
  { value: "RAC_TECHNOLOGY", label: "RAC Technology" },
  { value: "ARCHITECTURE_TECHNOLOGY", label: "Architecture Technology" },
  { value: "FOOD_TECHNOLOGY", label: "Food Technology" },
  { value: "CHEMICAL_TECHNOLOGY", label: "Chemical Technology" },
  { value: "TELECOMMUNICATION_TECHNOLOGY", label: "Telecommunication Technology" },
  { value: "AUTOMOBILE_TECHNOLOGY", label: "Automobile Technology" },
  { value: "GRAPHIC_DESIGN_TECHNOLOGY", label: "Graphic Design Technology" },
  { value: "OTHER", label: "Other" },
]

const SHIFTS = [
  { value: "MORNING", label: "1st Shift (Morning)" },
  { value: "DAY", label: "2nd Shift (Day)" },
]

const SEMESTERS = [
  { value: "FIRST", label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "THIRD", label: "3rd Semester" },
  { value: "FOURTH", label: "4th Semester" },
  { value: "FIFTH", label: "5th Semester" },
  { value: "SIXTH", label: "6th Semester" },
  { value: "SEVENTH", label: "7th Semester" },
  { value: "EIGHTH", label: "8th Semester" },
]

const SESSIONS = ["2020-2021", "2021-2022", "2022-2023", "2023-2024", "2024-2025", "2025-2026"]

const ROLES = [
  { value: "MEMBER", label: "Member" },
  { value: "INSTRUCTOR", label: "Instructor" },
  { value: "USER", label: "Standard User" },
  { value: "ADMIN", label: "Admin" },
]

interface BulkAssignTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: MediaTemplateSummary[]
  selectedTemplateId?: string | null
  onSuccess?: () => void
}

export function BulkAssignTemplateModal({
  open,
  onOpenChange,
  templates,
  selectedTemplateId: initialTemplateId,
  onSuccess,
}: BulkAssignTemplateModalProps) {
  const { t } = useLanguage()
  const [templateId, setTemplateId] = useState<string>(
    initialTemplateId || (templates[0]?.id ?? "")
  )

  useEffect(() => {
    if (initialTemplateId) {
      setTemplateId(initialTemplateId)
    } else if (templates.length > 0 && !templateId) {
      setTemplateId(templates[0].id)
    }
  }, [initialTemplateId, templates, templateId])

  const [targetType, setTargetType] = useState<
    "all_members" | "all_users" | "by_filter" | "specific_users"
  >("all_members")

  // Filter selections
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedShifts, setSelectedShifts] = useState<string[]>([])
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>([])
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  // Specific user search
  const [userQuery, setUserQuery] = useState("")
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [foundUsers, setFoundUsers] = useState<Array<{ id: string; name: string; email: string; member?: { studentId?: string; department?: string } }>>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

  // Live Count Preview State
  const [matchingCount, setMatchingCount] = useState<number | null>(null)
  const [sampleUsers, setSampleUsers] = useState<Array<{ id: string; name: string; email: string; department?: string }>>([])
  const [counting, setCounting] = useState(false)

  // Execution State
  const [assigning, setAssigning] = useState(false)
  const [result, setResult] = useState<{ count: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Construct current criteria
  const getCriteria = useCallback((): BulkAssignCriteria => {
    return {
      targetType,
      departments: targetType === "by_filter" ? selectedDepartments : undefined,
      shifts: targetType === "by_filter" ? selectedShifts : undefined,
      semesters: targetType === "by_filter" ? selectedSemesters : undefined,
      sessions: targetType === "by_filter" ? selectedSessions : undefined,
      roles: targetType === "by_filter" ? selectedRoles : undefined,
      userIds: targetType === "specific_users" ? selectedUserIds : undefined,
    }
  }, [
    targetType,
    selectedDepartments,
    selectedShifts,
    selectedSemesters,
    selectedSessions,
    selectedRoles,
    selectedUserIds,
  ])

  // Recalculate count on filter change
  useEffect(() => {
    if (!open) return

    const criteria = getCriteria()
    if (criteria.targetType === "specific_users") {
      setMatchingCount(selectedUserIds.length)
      setSampleUsers([])
      return
    }

    const timer = setTimeout(async () => {
      setCounting(true)
      try {
        const res = await fetch("/api/admin/templates/preview-count", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ criteria }),
        })
        if (res.ok) {
          const data = await res.json()
          setMatchingCount(data.count)
          setSampleUsers(data.sampleUsers || [])
        }
      } catch {
        // Ignore preview count failure
      } finally {
        setCounting(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [open, getCriteria, selectedUserIds.length])

  // Search users for specific assignment
  useEffect(() => {
    if (targetType !== "specific_users" || !userQuery.trim() || userQuery.length < 2) {
      setFoundUsers([])
      return
    }

    const timer = setTimeout(async () => {
      setSearchingUsers(true)
      try {
        const res = await fetch(`/api/admin/users?query=${encodeURIComponent(userQuery.trim())}&limit=8`)
        if (res.ok) {
          const data = await res.json()
          const usersList = data.users || data.items || []
          setFoundUsers(usersList)
        }
      } catch {
        // Ignore
      } finally {
        setSearchingUsers(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [targetType, userQuery])

  const toggleItem = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item))
    } else {
      setList([...list, item])
    }
  }

  const handleExecute = async () => {
    if (!templateId) {
      setError("Please select a template to assign")
      return
    }

    setAssigning(true)
    setError(null)
    setResult(null)

    try {
      const criteria = getCriteria()
      const payload: Record<string, unknown> = {
        templateId,
      }

      if (targetType === "specific_users") {
        if (selectedUserIds.length === 0) {
          throw new Error("Please select at least one user")
        }
        payload.userIds = selectedUserIds
      } else {
        payload.criteria = criteria
      }

      const res = await fetch("/api/admin/templates/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to assign template")
      }

      setResult({ count: data.assignedCount ?? data.count ?? 0 })
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Assignment failed")
    } finally {
      setAssigning(false)
    }
  }

  const handleClose = () => {
    setResult(null)
    setError(null)
    onOpenChange(false)
  }

  const currentTemplate = templates.find((t) => t.id === templateId)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {t("Bulk Assign Template to Users", "ব্যবহারকারীদের বাল্ক টেমপ্লেট অ্যাসাইন করুন")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t(
                  "Assign dynamic ID cards, certificates, or passes to multiple users simultaneously.",
                  "একসাথে একাধিক ব্যবহারকারীকে আইডি কার্ড, সার্টিফিকেট বা পাস অ্যাসাইন করুন।"
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {result ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold">
                  {t("Bulk Assignment Successful!", "বাল্ক অ্যাসাইনমেন্ট সফল হয়েছে!")}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {t(
                    `Successfully assigned "${currentTemplate?.name || "Template"}" to ${result.count} users. They can now access and download their customized cards from their profiles.`,
                    `সফলভাবে "${currentTemplate?.name || "টেমপ্লেট"}" ${result.count} জন ব্যবহারকারীকে অ্যাসাইন করা হয়েছে। তারা প্রোফাইল থেকে কার্ড দেখতে ও ডাউনলোড করতে পারবেন।`
                  )}
                </p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-xs font-medium">{error}</p>
                </div>
              )}

              {/* Step 1: Select Template */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("1. Select Template", "১. টেমপ্লেট নির্বাচন করুন")}
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {templates.map((tpl) => {
                    const isSelected = tpl.id === templateId
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setTemplateId(tpl.id)}
                        className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-border/60 hover:border-border hover:bg-muted/40"
                        }`}
                      >
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0 border border-border/40 text-muted-foreground overflow-hidden">
                          {tpl.media.thumbnailUrl || tpl.media.url ? (
                            <img
                              src={tpl.media.thumbnailUrl || tpl.media.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Layers className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{tpl.name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                              {tpl.type}
                            </Badge>
                            {tpl.assignmentCount !== undefined && (
                              <span className="text-[10px] text-muted-foreground">
                                {tpl.assignmentCount} assigned
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Step 2: Target Selection Mode */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("2. Target Audience", "২. টার্গেট অডিয়েন্স")}
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    type="button"
                    variant={targetType === "all_members" ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-9"
                    onClick={() => setTargetType("all_members")}
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                    {t("All Members", "সকল সদস্য")}
                  </Button>

                  <Button
                    type="button"
                    variant={targetType === "by_filter" ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-9"
                    onClick={() => setTargetType("by_filter")}
                  >
                    <Filter className="w-3.5 h-3.5 mr-1.5" />
                    {t("Filter Rules", "ফিল্টার নিয়ম")}
                  </Button>

                  <Button
                    type="button"
                    variant={targetType === "specific_users" ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-9"
                    onClick={() => setTargetType("specific_users")}
                  >
                    <Search className="w-3.5 h-3.5 mr-1.5" />
                    {t("Select Users", "নির্দিষ্ট ব্যবহারকারী")}
                  </Button>

                  <Button
                    type="button"
                    variant={targetType === "all_users" ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-9"
                    onClick={() => setTargetType("all_users")}
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    {t("All Accounts", "সকল অ্যাকাউন্ট")}
                  </Button>
                </div>
              </div>

              {/* Target: Filter Rules */}
              {targetType === "by_filter" && (
                <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-4">
                  {/* Department Filter */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      {t("Departments (Optional)", "ডিপার্টমেন্ট (ঐচ্ছিক)")}
                    </Label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 border rounded-lg bg-background">
                      {DEPARTMENTS.map((dept) => {
                        const active = selectedDepartments.includes(dept.value)
                        return (
                          <button
                            key={dept.value}
                            type="button"
                            onClick={() => toggleItem(selectedDepartments, setSelectedDepartments, dept.value)}
                            className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                              active
                                ? "bg-primary text-primary-foreground font-medium"
                                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            {dept.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Shifts & Sessions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Shift */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("Shift", "শিফট")}</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {SHIFTS.map((s) => {
                          const active = selectedShifts.includes(s.value)
                          return (
                            <button
                              key={s.value}
                              type="button"
                              onClick={() => toggleItem(selectedShifts, setSelectedShifts, s.value)}
                              className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                                active
                                  ? "bg-primary text-primary-foreground font-medium"
                                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                            >
                              {s.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Session */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("Session / Batch", "সেশন / ব্যাচ")}</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {SESSIONS.map((sess) => {
                          const active = selectedSessions.includes(sess)
                          return (
                            <button
                              key={sess}
                              type="button"
                              onClick={() => toggleItem(selectedSessions, setSelectedSessions, sess)}
                              className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                                active
                                  ? "bg-primary text-primary-foreground font-medium"
                                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                            >
                              {sess}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Semesters & Roles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Semesters */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("Semester", "সেমিস্টার")}</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {SEMESTERS.slice(0, 4).map((sem) => {
                          const active = selectedSemesters.includes(sem.value)
                          return (
                            <button
                              key={sem.value}
                              type="button"
                              onClick={() => toggleItem(selectedSemesters, setSelectedSemesters, sem.value)}
                              className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                                active
                                  ? "bg-primary text-primary-foreground font-medium"
                                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {sem.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Roles */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("Role", "রোল")}</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {ROLES.map((r) => {
                          const active = selectedRoles.includes(r.value)
                          return (
                            <button
                              key={r.value}
                              type="button"
                              onClick={() => toggleItem(selectedRoles, setSelectedRoles, r.value)}
                              className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                                active
                                  ? "bg-primary text-primary-foreground font-medium"
                                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {r.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Target: Specific Users Selection */}
              {targetType === "specific_users" && (
                <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      {t("Search and Select Users", "ব্যবহারকারী খুঁজুন ও সিলেক্ট করুন")}
                    </Label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        placeholder={t("Type user name, email, or student roll...", "নাম, ইমেইল বা রোল লিখুন...")}
                        className="pl-8 text-xs h-9"
                      />
                    </div>
                  </div>

                  {searchingUsers && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 justify-center">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Searching...
                    </div>
                  )}

                  {foundUsers.length > 0 && (
                    <div className="border rounded-lg bg-background divide-y max-h-40 overflow-y-auto">
                      {foundUsers.map((u) => {
                        const isSelected = selectedUserIds.includes(u.id)
                        return (
                          <div
                            key={u.id}
                            onClick={() => toggleItem(selectedUserIds, setSelectedUserIds, u.id)}
                            className="flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer text-xs"
                          >
                            <div>
                              <p className="font-semibold">{u.name}</p>
                              <p className="text-[10px] text-muted-foreground">{u.email}</p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant={isSelected ? "default" : "outline"}
                              className="h-6 text-[10px] px-2"
                            >
                              {isSelected ? "Selected" : "Add"}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {selectedUserIds.length > 0 && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">
                        {selectedUserIds.length} user(s) selected
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 text-destructive"
                        onClick={() => setSelectedUserIds([])}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Live Count Preview Banner */}
              <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    {counting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">
                      {t("Estimated Audience", "আনুমানিক প্রাপক সংখ্যা")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {matchingCount !== null
                        ? `${matchingCount} users will receive this template`
                        : "Calculating recipients..."}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs font-mono font-bold px-2.5 py-1">
                  {matchingCount !== null ? `${matchingCount} Users` : "..."}
                </Badge>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-between sm:justify-between">
          {result ? (
            <Button type="button" onClick={handleClose} className="w-full sm:w-auto ml-auto text-xs">
              {t("Done", "সম্পন্ন")}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={assigning}
                className="text-xs"
              >
                {t("Cancel", "বাতিল")}
              </Button>
              <Button
                type="button"
                onClick={handleExecute}
                disabled={assigning || (matchingCount !== null && matchingCount === 0)}
                className="text-xs gap-1.5"
              >
                {assigning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t("Assigning...", "অ্যাসাইন হচ্ছে...")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t(
                      `Assign to ${matchingCount !== null ? matchingCount : ""} Users`,
                      `${matchingCount !== null ? matchingCount : ""} জনকে অ্যাসাইন করুন`
                    )}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
