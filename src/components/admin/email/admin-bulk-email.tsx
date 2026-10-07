"use client"

import { useEffect, useState, useTransition } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Filter,
  Mail,
  RotateCcw,
  Send,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Department, EnrollmentStatus, EventRegistrationStatus, MembershipStatus, Role, Semester, Shift, VerificationStatus } from "@/generated/prisma/enums"
import { cn } from "cn"

interface RecipientSample {
  id: string
  name: string
  email: string
  phone: string | null
  roles: Role[]
  member: {
    studentId: string | null
    department: Department
    semester: Semester
    shift: Shift
    session: string
    status: MembershipStatus
    verificationStatus: VerificationStatus
  } | null
}

interface MetaData {
  courses: { id: string; title: string }[]
  events: { id: string; title: string }[]
}

export function AdminBulkEmail() {
  // Metadata options
  const [meta, setMeta] = useState<MetaData>({ courses: [], events: [] })

  // Audience filters
  const [role, setRole] = useState<string>("ALL")
  const [department, setDepartment] = useState<string>("ALL")
  const [semester, setSemester] = useState<string>("ALL")
  const [shift, setShift] = useState<string>("ALL")
  const [session, setSession] = useState<string>("")
  const [membershipStatus, setMembershipStatus] = useState<string>("ALL")
  const [verificationStatus, setVerificationStatus] = useState<string>("ALL")
  const [courseId, setCourseId] = useState<string>("ALL")
  const [courseStatus, setCourseStatus] = useState<string>("ALL")
  const [eventId, setEventId] = useState<string>("ALL")
  const [eventStatus, setEventStatus] = useState<string>("ALL")
  const [search, setSearch] = useState<string>("")

  // Recipient calculation
  const [totalRecipients, setTotalRecipients] = useState<number>(0)
  const [sampleRecipients, setSampleRecipients] = useState<RecipientSample[]>([])
  const [isCounting, setIsCounting] = useState(false)
  const [inspectDialogOpen, setInspectDialogOpen] = useState(false)

  // Composer state
  const [subject, setSubject] = useState("")
  const [bodyHtml, setBodyHtml] = useState("")
  const [composerTab, setComposerTab] = useState<"write" | "preview">("write")

  // Send campaign state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [isSending, startSending] = useTransition()
  const [campaignProgress, setCampaignProgress] = useState<{
    inProgress: boolean
    result?: { total: number; sent: number; failed: number; errors: { email: string; error: string }[] }
  }>({ inProgress: false })

  // Fetch courses and events metadata
  useEffect(() => {
    fetch("/api/admin/emails/meta")
      .then((res) => res.json())
      .then((data) => {
        if (data.courses) setMeta(data)
      })
      .catch((err) => console.error("Failed to fetch meta:", err))
  }, [])

  // Recalculate recipient audience on filter change
  useEffect(() => {
    const fetchAudience = async () => {
      setIsCounting(true)
      try {
        const filters: Record<string, unknown> = {}
        if (role !== "ALL") filters.role = role
        if (department !== "ALL") filters.department = department
        if (semester !== "ALL") filters.semester = semester
        if (shift !== "ALL") filters.shift = shift
        if (session.trim()) filters.session = session.trim()
        if (membershipStatus !== "ALL") filters.membershipStatus = membershipStatus
        if (verificationStatus !== "ALL") filters.verificationStatus = verificationStatus
        if (courseId !== "ALL") {
          filters.courseId = courseId
          if (courseStatus !== "ALL") filters.courseStatus = courseStatus
        }
        if (eventId !== "ALL") {
          filters.eventId = eventId
          if (eventStatus !== "ALL") filters.eventStatus = eventStatus
        }
        if (search.trim()) filters.search = search.trim()

        const res = await fetch("/api/admin/emails/recipients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filters, limit: 30 }),
        })
        const data = await res.json()
        setTotalRecipients(data.total || 0)
        setSampleRecipients(data.sample || [])
      } catch (err) {
        console.error("Failed to query audience:", err)
      } finally {
        setIsCounting(false)
      }
    }

    const timer = setTimeout(fetchAudience, 250)
    return () => clearTimeout(timer)
  }, [
    role,
    department,
    semester,
    shift,
    session,
    membershipStatus,
    verificationStatus,
    courseId,
    courseStatus,
    eventId,
    eventStatus,
    search,
  ])

  const resetFilters = () => {
    setRole("ALL")
    setDepartment("ALL")
    setSemester("ALL")
    setShift("ALL")
    setSession("")
    setMembershipStatus("ALL")
    setVerificationStatus("ALL")
    setCourseId("ALL")
    setCourseStatus("ALL")
    setEventId("ALL")
    setEventStatus("ALL")
    setSearch("")
  }

  const handleExecuteSend = () => {
    if (!subject.trim() || !bodyHtml.trim()) return

    const filters: Record<string, unknown> = {}
    if (role !== "ALL") filters.role = role
    if (department !== "ALL") filters.department = department
    if (semester !== "ALL") filters.semester = semester
    if (shift !== "ALL") filters.shift = shift
    if (session.trim()) filters.session = session.trim()
    if (membershipStatus !== "ALL") filters.membershipStatus = membershipStatus
    if (verificationStatus !== "ALL") filters.verificationStatus = verificationStatus
    if (courseId !== "ALL") {
      filters.courseId = courseId
      if (courseStatus !== "ALL") filters.courseStatus = courseStatus
    }
    if (eventId !== "ALL") {
      filters.eventId = eventId
      if (eventStatus !== "ALL") filters.eventStatus = eventStatus
    }
    if (search.trim()) filters.search = search.trim()

    setConfirmDialogOpen(false)
    setCampaignProgress({ inProgress: true })

    startSending(async () => {
      try {
        const res = await fetch("/api/admin/emails/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filters,
            subject,
            bodyHtml,
            batchSize: 5,
            delayMsBetweenBatches: 250,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error?.message || "Failed to send bulk campaign")
        }

        setCampaignProgress({
          inProgress: false,
          result: data.result,
        })

        const { sent = 0, failed = 0, total = 0 } = data.result ?? {}
        if (sent > 0 && failed === 0) {
          toast.success("Emails sent successfully", {
            description: `Delivered to all ${sent} recipient${sent === 1 ? "" : "s"}.`,
          })
        } else if (sent > 0) {
          toast.warning("Campaign partially sent", {
            description: `${sent} of ${total} delivered, ${failed} failed. Check Delivery Logs.`,
          })
        } else {
          toast.error("Campaign failed", {
            description: "No emails were delivered. Check Delivery Logs for details.",
          })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Dispatch error"
        setCampaignProgress({
          inProgress: false,
          result: {
            total: totalRecipients,
            sent: 0,
            failed: totalRecipients,
            errors: [{ email: "Bulk Batch", error: message }],
          },
        })
        toast.error("Campaign failed", { description: message })
      }
    })
  }

  const insertTag = (tag: string) => {
    setBodyHtml((prev) => prev + " " + tag)
  }

  return (
    <div className="space-y-6">
      {/* AUDIENCE FILTERS SECTION */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-primary" />
            <h3 className="text-sm font-bold">1. Target Audience Filters</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3" /> Reset Filters
          </Button>
        </div>

        {/* Filter Selects Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 text-xs">
          {/* User Role */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">User Role</label>
            <Select value={role} onValueChange={(val) => setRole(val || "ALL")}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                {Object.values(Role).map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Department</label>
            <Select value={department} onValueChange={(val) => setDepartment(val || "ALL")}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="ALL">All Departments</SelectItem>
                {Object.values(Department).map((d) => (
                  <SelectItem key={d} value={d}>{d.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Semester */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Semester</label>
            <Select value={semester} onValueChange={(val) => setSemester(val || "ALL")}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Semesters</SelectItem>
                {Object.values(Semester).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shift */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Shift</label>
            <Select value={shift} onValueChange={(val) => setShift(val || "ALL")}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Shifts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Shifts</SelectItem>
                {Object.values(Shift).map((sh) => (
                  <SelectItem key={sh} value={sh}>{sh}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Session */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Session</label>
            <Input
              value={session}
              onChange={(e) => setSession(e.target.value)}
              placeholder="e.g. 2023-24"
              className="h-8 text-xs"
            />
          </div>

          {/* Membership Status */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Member Status</label>
            <Select value={membershipStatus} onValueChange={(val) => setMembershipStatus(val || "ALL")}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Any Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Any Status</SelectItem>
                {Object.values(MembershipStatus).map((ms) => (
                  <SelectItem key={ms} value={ms}>{ms}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Verification Status */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Verification</label>
            <Select value={verificationStatus} onValueChange={(val) => setVerificationStatus(val || "ALL")}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Any Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Any Verification</SelectItem>
                {Object.values(VerificationStatus).map((vs) => (
                  <SelectItem key={vs} value={vs}>{vs}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course Enrolled */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Enrolled In Course</label>
            <Select value={courseId} onValueChange={(val) => setCourseId(val || "ALL")}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Any Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Any Course</SelectItem>
                {meta.courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Event Registered */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Registered In Event</label>
            <Select value={eventId} onValueChange={(val) => setEventId(val || "ALL")}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Any Event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Any Event</SelectItem>
                {meta.events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Query */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Search User</label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, roll..."
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Live Audience Counter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">Matched Recipients:</span>
                {isCounting ? (
                  <Spinner className="size-3 text-primary" />
                ) : (
                  <Badge variant="default" className="text-xs font-bold px-2 py-0">
                    {totalRecipients} {totalRecipients === 1 ? "user" : "users"}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                All selected active users matching current filter conditions will receive this broadcast.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setInspectDialogOpen(true)}
            disabled={totalRecipients === 0}
            className="h-8 text-xs gap-1.5"
          >
            <Eye className="size-3.5" /> View Recipient List
          </Button>
        </div>
      </div>

      {/* EMAIL COMPOSER SECTION */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            <h3 className="text-sm font-bold">2. Compose Broadcast Message</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setComposerTab("write")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                composerTab === "write" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Write HTML
            </button>
            <button
              type="button"
              onClick={() => setComposerTab("preview")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                composerTab === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Preview
            </button>
          </div>
        </div>

        {/* Subject Line */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Broadcast Subject</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Important Announcement: Upcoming Society Activities..."
            className="text-xs font-medium"
          />
        </div>

        {/* Quick Dynamic Tag Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-muted-foreground">Insert Variable:</span>
          {["userName", "email", "studentId", "department", "semester", "session"].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => insertTag(`{{${tag}}}`)}
              className="rounded-md border bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-primary hover:bg-muted font-medium"
            >
              + {`{{${tag}}}`}
            </button>
          ))}
        </div>

        {/* Editor vs Preview */}
        {composerTab === "write" ? (
          <div className="space-y-1">
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={12}
              placeholder="<p>Dear <strong>{{userName}}</strong>,</p>&#10;&#10;<p>We are excited to announce our upcoming workshop...</p>"
              className="w-full font-mono text-xs rounded-lg border border-border bg-muted/10 p-3 leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-[11px] text-muted-foreground">
              HTML formatting is supported. Your message will be automatically framed inside the DPICS branded email template.
            </p>
          </div>
        ) : (
          <div className="flex justify-center rounded-lg border border-border bg-muted/20 p-4 min-h-[300px]">
            <div className="w-full max-w-[620px] bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 p-4 text-white font-bold text-sm">
                DPI Computing Society (DPICS)
              </div>
              <div
                className="p-6 text-slate-800 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html:
                    bodyHtml
                      .replace(/\{\{\s*userName\s*\}\}/g, "Tahmid Hasan")
                      .replace(/\{\{\s*studentId\s*\}\}/g, "DPICS-26-0042")
                      .replace(/\{\{\s*department\s*\}\}/g, "Computer Science") ||
                    "<p class='text-muted-foreground italic'>Your email content preview will appear here...</p>",
                }}
              />
              <div className="bg-slate-100 p-3 text-center text-xs text-slate-500">
                &copy; 2026 DPI Computing Society. Dhaka Polytechnic Institute.
              </div>
            </div>
          </div>
        )}

        {/* Send Action Bar */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Targeting <strong>{totalRecipients}</strong> verified recipients.
          </p>

          <Button
            onClick={() => setConfirmDialogOpen(true)}
            disabled={totalRecipients === 0 || !subject.trim() || !bodyHtml.trim() || isSending}
            className="gap-2"
          >
            {isSending ? <Spinner className="size-4" /> : <Send className="size-4" />}
            Dispatch Bulk Campaign
          </Button>
        </div>
      </div>

      {/* DISPATCH PROGRESS / RESULT BANNER */}
      {campaignProgress.inProgress && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
          <Spinner className="size-5 text-primary" />
          <div>
            <p className="text-xs font-bold text-primary">Sending Bulk Campaign via Gmail SMTP...</p>
            <p className="text-[11px] text-muted-foreground">
              Processing in throttled batches to respect Gmail rate limits and prevent spam blocking. Please keep this tab open.
            </p>
          </div>
        </div>
      )}

      {campaignProgress.result && (
        <div
          className={cn(
            "rounded-xl border p-4 space-y-2",
            campaignProgress.result.failed === 0
              ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300"
              : "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300"
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5" />
            <h4 className="text-sm font-bold">Campaign Dispatch Completed</h4>
          </div>
          <p className="text-xs">
            Successfully sent: <strong>{campaignProgress.result.sent}</strong> &bull; Failed:{" "}
            <strong>{campaignProgress.result.failed}</strong> out of{" "}
            <strong>{campaignProgress.result.total}</strong> recipients.
          </p>

          {campaignProgress.result.errors.length > 0 && (
            <div className="mt-2 space-y-1 text-[11px] font-mono bg-background/50 p-2 rounded">
              <p className="font-bold">Errors encountered:</p>
              {campaignProgress.result.errors.map((e, idx) => (
                <p key={idx}>{e.email}: {e.error}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INSPECT RECIPIENTS DIALOG */}
      <Dialog open={inspectDialogOpen} onOpenChange={setInspectDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Users className="size-4 text-primary" /> Matching Audience ({totalRecipients})
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Preview of recipients matching your current audience filters:
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="divide-y divide-border">
              {sampleRecipients.map((rec) => (
                <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-foreground">{rec.name}</p>
                    <p className="text-muted-foreground font-mono text-[11px]">{rec.email}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    {rec.member?.studentId && (
                      <span className="font-mono text-[11px] font-medium block">
                        {rec.member.studentId}
                      </span>
                    )}
                    {rec.member?.department && (
                      <span className="text-[10px] text-muted-foreground block">
                        {rec.member.department.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalRecipients > sampleRecipients.length && (
              <p className="text-center text-xs text-muted-foreground pt-4 italic">
                ...and {totalRecipients - sampleRecipients.length} more recipients.
              </p>
            )}
          </div>

          <DialogFooter className="p-3 border-t">
            <Button size="sm" onClick={() => setInspectDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION DIALOG */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <AlertCircle className="size-5 text-amber-500" /> Confirm Bulk Email Campaign
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to send this broadcast to <strong>{totalRecipients}</strong> recipients?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-3 text-xs bg-muted/40 p-3 rounded-lg">
            <p><strong>Subject:</strong> {subject}</p>
            <p><strong>Total Recipients:</strong> {totalRecipients}</p>
            <p><strong>Batch Strategy:</strong> 5 emails per batch with 250ms rate throttle</p>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleExecuteSend} className="gap-1.5">
              <Send className="size-3.5" /> Start Sending Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
