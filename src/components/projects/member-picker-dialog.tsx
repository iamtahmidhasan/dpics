"use client"

import {
  Check,
  Plus,
  Search,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import type { TeamMember } from "@/lib/services/project.service"

export type ApprovedMemberItem = {
  id: string
  userId: string
  name: string
  email: string
  avatar: string | null
  studentId: string | null
  department: string | null
  roles?: string[]
}

export interface MemberPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddMember: (member: TeamMember) => void
  existingTeamMemberUserIds: string[]
}

const COMMON_ROLES = [
  "Lead Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Hardware / IoT Engineer",
  "Robotics Engineer",
  "Firmware Engineer",
  "UI/UX Designer",
  "QA & Testing",
  "Project Contributor",
]

const POPULAR_DEPARTMENTS = [
  { value: "ALL", label: { en: "All Departments", bn: "সকল ডিপার্টমেন্ট" } },
  { value: "COMPUTER_SCIENCE_AND_TECHNOLOGY", label: { en: "CST / Computer", bn: "কম্পিউটার" } },
  { value: "ELECTRICAL_TECHNOLOGY", label: { en: "Electrical", bn: "ইলেকট্রিক্যাল" } },
  { value: "ELECTRONICS_TECHNOLOGY", label: { en: "Electronics", bn: "ইলেকট্রনিক্স" } },
  { value: "MECHANICAL_TECHNOLOGY", label: { en: "Mechanical", bn: "মেকানিক্যাল" } },
  { value: "CIVIL_TECHNOLOGY", label: { en: "Civil", bn: "সিভিল" } },
]

export function MemberPickerDialog({
  open,
  onOpenChange,
  onAddMember,
  existingTeamMemberUserIds,
}: MemberPickerDialogProps) {
  const { t } = useLanguage()

  // Mode: "approved" or "manual"
  const [mode, setMode] = useState<"approved" | "manual">("approved")

  // Approved members search and filter state
  const [members, setMembers] = useState<ApprovedMemberItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDept, setSelectedDept] = useState("ALL")

  // Selection & Configuration state
  const [selectedMember, setSelectedMember] = useState<ApprovedMemberItem | null>(null)
  const [role, setRole] = useState("Lead Developer")
  const [githubUrl, setGithubUrl] = useState("")

  // Manual non-member state
  const [manualName, setManualName] = useState("")
  const [manualStudentId, setManualStudentId] = useState("")
  const [manualRole, setManualRole] = useState("Contributor")
  const [manualGithubUrl, setManualGithubUrl] = useState("")

  // Fetch approved members when dialog opens
  useEffect(() => {
    if (!open) return
    let active = true
    setIsLoading(true)

    fetch("/api/members/approved?limit=100")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (active && Array.isArray(data)) {
          setMembers(data)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [open])

  // Remote debounced search when user types in search box
  useEffect(() => {
    if (!open || !searchQuery.trim()) return
    let active = true

    const timer = setTimeout(() => {
      fetch(`/api/members/approved?q=${encodeURIComponent(searchQuery.trim())}&limit=50`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (active && Array.isArray(data)) {
            setMembers((prev) => {
              const map = new Map<string, ApprovedMemberItem>()
              for (const item of data) map.set(item.userId, item)
              for (const item of prev) {
                if (!map.has(item.userId)) map.set(item.userId, item)
              }
              return Array.from(map.values())
            })
          }
        })
        .catch(() => {})
    }, 200)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [searchQuery, open])

  // Filtered approved members list in memory
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Department filter
      if (selectedDept !== "ALL") {
        if (m.department !== selectedDept) return false
      }
      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = m.name?.toLowerCase().includes(q)
        const matchesEmail = m.email?.toLowerCase().includes(q)
        const matchesStudentId = m.studentId?.toLowerCase().includes(q)
        const matchesDept = m.department?.toLowerCase().includes(q)
        if (!matchesName && !matchesEmail && !matchesStudentId && !matchesDept) {
          return false
        }
      }
      return true
    })
  }, [members, selectedDept, searchQuery])

  // Add approved member to team
  const handleAddApprovedMember = () => {
    if (!selectedMember) return

    const newMember: TeamMember = {
      name: selectedMember.name,
      role: role.trim() || "Contributor",
      studentId: selectedMember.studentId || undefined,
      department: selectedMember.department || undefined,
      userId: selectedMember.userId,
      avatar: selectedMember.avatar || undefined,
      profileUrl: `/members/${selectedMember.userId}`,
      githubUrl: githubUrl.trim() || undefined,
    }

    onAddMember(newMember)
    handleClose()
  }

  // Add manual external collaborator to team
  const handleAddManualMember = () => {
    if (!manualName.trim()) return

    const newMember: TeamMember = {
      name: manualName.trim(),
      role: manualRole.trim() || "Contributor",
      studentId: manualStudentId.trim() || undefined,
      githubUrl: manualGithubUrl.trim() || undefined,
    }

    onAddMember(newMember)
    handleClose()
  }

  const handleClose = () => {
    setSelectedMember(null)
    setSearchQuery("")
    setSelectedDept("ALL")
    setRole("Lead Developer")
    setGithubUrl("")
    setManualName("")
    setManualStudentId("")
    setManualRole("Contributor")
    setManualGithubUrl("")
    setMode("approved")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border/70 pb-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <span>
                  {mode === "approved"
                    ? t("Select from Approved Members", "অনুমোদিত সদস্যদের মধ্য থেকে নির্বাচন")
                    : t("Add External Collaborator", "বাহ্যিক সহযোগী যুক্ত করুন")}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {mode === "approved"
                  ? t(
                      "Browse verified society members, assign their project role, and add them to your team.",
                      "সোসাইটির ভেরিফাইড সদস্যদের খুঁজুন, প্রজেক্টে ভূমিকা নির্বাচন করুন এবং টিমে যুক্ত করুন।"
                    )
                  : t(
                      "Add a classmate or collaborator who is not registered in the society directory.",
                      "সোসাইটিতে নিবন্ধিত নয় এমন কোনো সহপাঠী বা সহযোগীকে টিমে যুক্ত করুন।"
                    )}
              </DialogDescription>
            </div>

            {/* Toggle Mode */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setMode("approved")}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  mode === "approved"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("Society Member", "সোসাইটি সদস্য")}
              </button>
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  mode === "manual"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("External / Non-Member", "বাহ্যিক")}
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        {mode === "approved" ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Search & Department Filters Bar */}
            <div className="p-3 sm:px-5 border-b border-border/50 bg-background space-y-2.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(
                    "Search by student name, roll/ID, or department...",
                    "সদস্যের নাম, রোল বা ডিপার্টমেন্ট দিয়ে খুঁজুন..."
                  )}
                  className="pl-8 pr-8 text-xs h-9"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Department Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {POPULAR_DEPARTMENTS.map((dept) => (
                  <button
                    key={dept.value}
                    type="button"
                    onClick={() => setSelectedDept(dept.value)}
                    className={`px-2.5 py-1 text-[11px] rounded-full whitespace-nowrap transition-colors shrink-0 ${
                      selectedDept === dept.value
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
                  >
                    {t(dept.label)}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content Area: Split List & Selected Config */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/60 min-h-0 overflow-hidden">
              {/* Left Column: Member List */}
              <div className="overflow-y-auto p-3 space-y-1.5 max-h-[360px] md:max-h-[460px]">
                {isLoading ? (
                  <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                    <Spinner className="size-5 mx-auto text-primary" />
                    <p>{t("Loading approved members...", "সদস্য তালিকা লোড হচ্ছে...")}</p>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
                    <Users className="size-8 mx-auto opacity-30 mb-2" />
                    <p className="font-semibold">{t("No approved members found.", "কোনো সদস্য পাওয়া যায়নি।")}</p>
                    <p className="text-[11px]">
                      {t("Try clearing your search query or department filter.", "সার্চ বা ফিল্টার পরিবর্তন করে চেষ্টা করুন।")}
                    </p>
                  </div>
                ) : (
                  filteredMembers.map((m) => {
                    const isAlreadyAdded = existingTeamMemberUserIds.includes(m.userId)
                    const isCurrentSelection = selectedMember?.userId === m.userId

                    return (
                      <button
                        key={m.userId || m.id}
                        type="button"
                        onClick={() => !isAlreadyAdded && setSelectedMember(m)}
                        disabled={isAlreadyAdded}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-all border ${
                          isAlreadyAdded
                            ? "opacity-45 bg-muted/30 border-transparent cursor-not-allowed"
                            : isCurrentSelection
                              ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                              : "border-border/60 hover:border-primary/40 hover:bg-muted/40 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="size-8.5 shrink-0 border border-border/60">
                            {m.avatar && <AvatarImage src={m.avatar} alt={m.name} />}
                            <AvatarFallback className="text-[11px] font-bold">
                              {m.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{m.name}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              {m.studentId ? (
                                <span className="font-mono bg-muted px-1.5 py-0.2 rounded-xs text-[10px]">
                                  {m.studentId}
                                </span>
                              ) : null}
                              {m.department ? (
                                <span className="truncate">
                                  {m.department.replace(/_/g, " ")}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {isAlreadyAdded ? (
                          <Badge variant="secondary" className="text-[9px] py-0">
                            {t("In Team", "টিমে আছে")}
                          </Badge>
                        ) : isCurrentSelection ? (
                          <div className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                            <Check className="size-3.5" />
                          </div>
                        ) : (
                          <span className="text-[10px] text-primary font-medium hover:underline">
                            {t("Select", "বাছাই")}
                          </span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>

              {/* Right Column: Member Assignment Details */}
              <div className="p-4 bg-muted/10 flex flex-col justify-between overflow-y-auto max-h-[360px] md:max-h-[460px]">
                {selectedMember ? (
                  <div className="space-y-4">
                    {/* Selected Member Hero Card */}
                    <div className="p-3.5 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                          {t("Selected Member", "নির্বাচিত সদস্য")}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => setSelectedMember(null)}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <Avatar className="size-11 border border-primary/40">
                          {selectedMember.avatar && <AvatarImage src={selectedMember.avatar} />}
                          <AvatarFallback className="text-sm font-bold">
                            {selectedMember.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">
                            {selectedMember.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {selectedMember.email}
                          </p>
                          {selectedMember.studentId && (
                            <p className="text-[11px] font-mono text-primary font-medium">
                              ID: {selectedMember.studentId}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Role in Project Input */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        {t("Role in Project*", "প্রজেক্টে ভূমিকা*")}
                      </Label>
                      <Input
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g., Lead Developer, Firmware Engineer"
                        className="text-xs h-8"
                      />

                      {/* Quick Role Selection Pills */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {COMMON_ROLES.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                              role === r
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* GitHub URL (Optional) */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        {t("GitHub Profile URL (Optional)", "গিটহাব প্রোফাইল লিঙ্ক (ঐচ্ছিক)")}
                      </Label>
                      <Input
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username"
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="my-auto py-10 text-center text-xs text-muted-foreground space-y-2">
                    <UserPlus className="size-8 mx-auto opacity-30 text-primary" />
                    <p className="font-semibold text-foreground">
                      {t("Select a member from the list", "তালিকা থেকে সদস্য নির্বাচন করুন")}
                    </p>
                    <p className="text-[11px] max-w-xs mx-auto">
                      {t(
                        "Click on any active society member on the left to assign their engineering role and add them.",
                        "বামের তালিকা থেকে যেকোনো সদস্যে ক্লিক করে তার ভূমিকা ও লিঙ্ক নির্ধারণ করুন।"
                      )}
                    </p>
                  </div>
                )}

                {/* Confirm Action Button */}
                <div className="pt-4 border-t border-border/50">
                  <Button
                    type="button"
                    onClick={handleAddApprovedMember}
                    disabled={!selectedMember || !role.trim()}
                    className="w-full gap-1.5"
                  >
                    <Plus className="size-4" />
                    <span>{t("Add to Project Team", "টিমে যুক্ত করুন")}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Manual External Collaborator Mode */
          <div className="p-5 space-y-4">
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground">
              {t(
                "Use this form for non-DPI collaborators, mentors, or external contributors who don't have a society member account.",
                "যেসব সহযোগী বা সহপাঠীর সোসাইটি অ্যাকাউন্ট নেই তাদের এই ফর্মের মাধ্যমে টিমে যুক্ত করুন।"
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t("Full Name*", "পূর্ণ নাম*")}</Label>
                <Input
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g., Sarah Connor"
                  className="text-xs h-8"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t("Student Roll / ID", "স্টুডেন্ট রোল বা আইডি")}</Label>
                <Input
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  placeholder="e.g., 512345 (Optional)"
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("Role in Project*", "প্রজেক্টে ভূমিকা*")}</Label>
              <Input
                value={manualRole}
                onChange={(e) => setManualRole(e.target.value)}
                placeholder="e.g., Hardware Engineer"
                className="text-xs h-8"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {COMMON_ROLES.slice(0, 6).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setManualRole(r)}
                    className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                      manualRole === r
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("GitHub Profile URL", "গিটহাব লিঙ্ক")}</Label>
              <Input
                value={manualGithubUrl}
                onChange={(e) => setManualGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="text-xs h-8"
              />
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setMode("approved")}>
                {t("Back to Approved Members", "সদস্য তালিকায় ফিরুন")}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddManualMember}
                disabled={!manualName.trim() || !manualRole.trim()}
                className="gap-1.5"
              >
                <Plus className="size-4" />
                <span>{t("Add Collaborator", "সহযোগী যুক্ত করুন")}</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
