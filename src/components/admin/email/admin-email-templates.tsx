"use client"

import { useEffect, useState, useTransition } from "react"
import {
  Check,
  CheckCircle2,
  Copy,
  Edit,
  Eye,
  Mail,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Smartphone,
  Monitor,
  AlertCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { EmailCategory } from "@/generated/prisma/enums"
import { cn } from "cn"
import { toast } from "sonner"

export interface EmailTemplateItem {
  id: string
  key: string
  name: string
  category: EmailCategory
  description: string | null
  subject: string
  bodyHtml: string
  bodyText: string | null
  variables: string[]
  isActive: boolean
  isSystem: boolean
  updatedAt: string
}

export function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [search, setSearch] = useState("")

  // Edit modal state
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateItem | null>(null)
  const [editSubject, setEditSubject] = useState("")
  const [editBodyHtml, setEditBodyHtml] = useState("")
  const [editIsActive, setEditIsActive] = useState(true)
  const [editorTab, setEditorTab] = useState<"code" | "preview">("code")
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop")
  const [isSaving, startSaving] = useTransition()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Test email state
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [testEmailAddress, setTestEmailAddress] = useState("")
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Reset confirmation
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Copied variable notice
  const [copiedVar, setCopiedVar] = useState<string | null>(null)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/emails/templates")
      const data = await res.json()
      if (data.templates) {
        setTemplates(data.templates)
      }
    } catch (err) {
      console.error("Failed to load templates:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const openEditor = (template: EmailTemplateItem) => {
    setEditingTemplate(template)
    setEditSubject(template.subject)
    setEditBodyHtml(template.bodyHtml)
    setEditIsActive(template.isActive)
    setEditorTab("code")
    setSaveSuccess(false)
    setSaveError(null)
  }

  const handleToggleActive = async (template: EmailTemplateItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const nextActive = !template.isActive

    // Optimistic update
    setTemplates((prev) =>
      prev.map((t) => (t.id === template.id ? { ...t, isActive: nextActive } : t))
    )

    try {
      await fetch(`/api/admin/emails/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      })
    } catch {
      // Revert on error
      setTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? { ...t, isActive: template.isActive } : t))
      )
    }
  }

  const handleSave = () => {
    if (!editingTemplate) return
    setSaveError(null)
    setSaveSuccess(false)

    startSaving(async () => {
      try {
        const res = await fetch(`/api/admin/emails/templates/${editingTemplate.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: editSubject,
            bodyHtml: editBodyHtml,
            isActive: editIsActive,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error?.message || "Failed to update template")
        }

        setSaveSuccess(true)
        setTemplates((prev) =>
          prev.map((t) => (t.id === editingTemplate.id ? data.template : t))
        )
        setEditingTemplate(data.template)
        setTimeout(() => setSaveSuccess(false), 3000)
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Error saving template")
      }
    })
  }

  const handleReset = async () => {
    if (!editingTemplate) return
    setIsResetting(true)
    try {
      const res = await fetch(`/api/admin/emails/templates/${editingTemplate.id}/reset`, {
        method: "POST",
      })
      const data = await res.json()
      if (data.template) {
        setEditSubject(data.template.subject)
        setEditBodyHtml(data.template.bodyHtml)
        setEditIsActive(data.template.isActive)
        setEditingTemplate(data.template)
        setTemplates((prev) =>
          prev.map((t) => (t.id === editingTemplate.id ? data.template : t))
        )
        setResetConfirmOpen(false)
      }
    } catch (err) {
      console.error("Failed to reset template:", err)
    } finally {
      setIsResetting(false)
    }
  }

  const handleSendTest = async () => {
    if (!editingTemplate) return
    setIsSendingTest(true)
    setTestResult(null)

    try {
      const res = await fetch(`/api/admin/emails/templates/${editingTemplate.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: testEmailAddress }),
      })
      const data = await res.json()

      if (!res.ok) {
        const message = data.error?.message || "Failed to send test email"
        setTestResult({ success: false, message })
        toast.error("Test email failed", { description: message })
      } else {
        const message = data.message || "Test email sent successfully!"
        setTestResult({ success: true, message })
        toast.success("Email sent successfully", {
          description: `"${editingTemplate.name}" was delivered to ${testEmailAddress}`,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send test email"
      setTestResult({ success: false, message })
      toast.error("Test email failed", { description: message })
    } finally {
      setIsSendingTest(false)
    }
  }

  const copyVariable = (varName: string) => {
    const tag = `{{${varName}}}`
    navigator.clipboard.writeText(tag)
    setCopiedVar(varName)
    setTimeout(() => setCopiedVar(null), 1500)
  }

  const insertVariableIntoBody = (varName: string) => {
    const tag = `{{${varName}}}`
    setEditBodyHtml((prev) => prev + " " + tag)
  }

  const insertVariableIntoSubject = (varName: string) => {
    const tag = `{{${varName}}}`
    setEditSubject((prev) => prev + " " + tag)
  }

  const categories = [
    "ALL",
    ...Object.values(EmailCategory),
  ]

  const filteredTemplates = templates.filter((tpl) => {
    const matchesCategory =
      selectedCategory === "ALL" || tpl.category === selectedCategory
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      tpl.name.toLowerCase().includes(q) ||
      tpl.key.toLowerCase().includes(q) ||
      tpl.subject.toLowerCase().includes(q) ||
      (tpl.description && tpl.description.toLowerCase().includes(q))

    return matchesCategory && matchesSearch
  })

  // Generate preview HTML with mock variables
  const generatePreviewHtml = (htmlContent: string) => {
    const mockDict: Record<string, string> = {
      userName: "Tahmid Hasan",
      userEmail: "student@dpics.org",
      courseTitle: "Full-Stack Web Development with Next.js",
      amountPaid: "1500",
      paymentMethod: "bKash",
      transactionId: "TRX992837418",
      courseUrl: "https://dpics.org/courses/web-dev",
      adminNote: "Payment verified successfully by finance desk.",
      studentId: "DPICS-26-0042",
      instructorId: "INS-2026-001",
      department: "Computer Science and Technology",
      semester: "5th Semester",
      session: "2023-2024",
      portalUrl: "https://dpics.org/profile",
      rejectionReason: "ID card photo is blurry. Please upload a clear scan.",
      postTitle: "Building Scalable APIs with Prisma & PostgreSQL",
      postUrl: "https://dpics.org/posts/building-apis",
      massageForAuthor: "Please review section 2 for clarity.",
      achievementTitle: "1st Place - National Polytechnic Tech Fest 2026",
      achievementUrl: "https://dpics.org/achievements/1st-place-tech-fest",
      eventTitle: "DPICS Annual Tech Summit & Hackathon 2026",
      ticketCode: "DPICS-TKT-84920",
      eventDate: "Saturday, November 14, 2026",
      venue: "Main Auditorium, Dhaka Polytechnic Institute",
      ticketUrl: "https://dpics.org/events/tickets/DPICS-TKT-84920",
      committeeName: "Executive Committee 2026-2027",
      roleName: "Technical Secretary",
      customMessage: "Welcome to the new academic semester at DPI Computing Society!",
      siteName: "DPI Computing Society",
      siteUrl: "https://dpics.org",
    }

    let result = htmlContent
    for (const [k, v] of Object.entries(mockDict)) {
      result = result.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, "g"), v)
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
            .card { background: #fff; max-width: 580px; margin: 0 auto; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .header { background: #0f172a; padding: 20px; color: #fff; font-weight: bold; }
            .content { padding: 24px; line-height: 1.6; font-size: 14px; }
            .button { display: inline-block; background-color: #0284c7; color: #fff !important; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 13px; margin: 12px 0; }
            .footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">DPI Computing Society (DPICS)</div>
            <div class="content">${result}</div>
            <div class="footer">&copy; 2026 DPI Computing Society. Dhaka Polytechnic Institute.</div>
          </div>
        </body>
      </html>
    `
  }

  return (
    <div className="space-y-6">
      {/* Category Pills & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Mail className="mx-auto size-8 text-muted-foreground/60" />
          <h3 className="mt-3 text-sm font-semibold">No templates found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Try choosing another category or clearing your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => openEditor(template)}
              className={cn(
                "group relative flex flex-col justify-between rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md cursor-pointer",
                !template.isActive && "opacity-60 bg-muted/20"
              )}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono tracking-wider uppercase">
                    {template.category}
                  </Badge>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-muted-foreground">
                      {template.isActive ? "Enabled" : "Disabled"}
                    </span>
                    <Switch
                      checked={template.isActive}
                      onCheckedChange={() => {}}
                      onClick={(e) => handleToggleActive(template, e)}
                      aria-label="Toggle template status"
                      className="scale-75"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
                    {template.name}
                  </h4>
                  <p className="font-mono text-[10px] text-muted-foreground truncate">
                    {template.key}
                  </p>
                </div>

                {template.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border/60">
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  <span className="font-medium text-foreground">Subject: </span>
                  {template.subject}
                </p>

                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{template.variables.length} variables</span>
                  <span className="inline-flex items-center gap-1 font-medium text-primary">
                    <Edit className="size-3" /> Edit
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT TEMPLATE MODAL */}
      <Dialog open={Boolean(editingTemplate)} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-3 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  {editingTemplate?.name}
                  <Badge variant="outline" className="text-[10px]">
                    {editingTemplate?.category}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs mt-1 font-mono text-muted-foreground">
                  Trigger Key: {editingTemplate?.key}
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2 pr-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTestDialogOpen(true)}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Send className="size-3.5" /> Send Test
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResetConfirmOpen(true)}
                  className="h-8 gap-1.5 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                >
                  <RotateCcw className="size-3.5" /> Reset Default
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Template Status & Subject */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Email Subject</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Automatic Sending:</span>
                  <Switch
                    checked={editIsActive}
                    onCheckedChange={setEditIsActive}
                  />
                  <span className="text-xs font-medium">{editIsActive ? "Active" : "Disabled"}</span>
                </div>
              </div>
              <Input
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                placeholder="Subject line with {{variables}}..."
                className="text-xs font-medium"
              />
            </div>

            {/* Dynamic Variables Pill Bar */}
            <div className="space-y-1.5 rounded-lg border border-border/80 bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Available Variables
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Click to copy or insert
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {editingTemplate?.variables.map((varName) => (
                  <div key={varName} className="inline-flex items-center rounded-md border bg-background px-2 py-0.5 text-xs">
                    <span className="font-mono text-[11px] font-semibold text-primary">
                      {`{{${varName}}}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyVariable(varName)}
                      title="Copy tag"
                      className="ml-1.5 text-muted-foreground hover:text-foreground"
                    >
                      {copiedVar === varName ? (
                        <Check className="size-3 text-emerald-600" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariableIntoBody(varName)}
                      title="Insert into Body"
                      className="ml-1 text-[10px] text-muted-foreground hover:text-primary font-bold"
                    >
                      +Body
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariableIntoSubject(varName)}
                      title="Insert into Subject"
                      className="ml-1 text-[10px] text-muted-foreground hover:text-primary font-bold"
                    >
                      +Subj
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Editor vs Preview Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditorTab("code")}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                      editorTab === "code"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    HTML Template Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab("preview")}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
                      editorTab === "preview"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Eye className="size-3.5" /> Live Preview
                  </button>
                </div>

                {editorTab === "preview" && (
                  <div className="flex items-center gap-1 rounded-md border bg-muted/40 p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={cn(
                        "p-1 rounded text-xs transition-colors",
                        previewDevice === "desktop" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground"
                      )}
                      title="Desktop view"
                    >
                      <Monitor className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={cn(
                        "p-1 rounded text-xs transition-colors",
                        previewDevice === "mobile" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground"
                      )}
                      title="Mobile view"
                    >
                      <Smartphone className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {editorTab === "code" ? (
                <div className="relative">
                  <textarea
                    value={editBodyHtml}
                    onChange={(e) => setEditBodyHtml(e.target.value)}
                    rows={15}
                    className="w-full font-mono text-xs rounded-lg border border-border bg-muted/10 p-3 leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Enter HTML template content..."
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Tip: Content will be automatically rendered inside the DPICS responsive email frame with header, logo, and footer.
                  </p>
                </div>
              ) : (
                <div className="flex justify-center rounded-lg border border-border bg-muted/20 p-4 min-h-[380px]">
                  <div
                    className={cn(
                      "transition-all duration-300 w-full overflow-hidden rounded-lg shadow-sm bg-white",
                      previewDevice === "mobile" ? "max-w-[360px]" : "max-w-[620px]"
                    )}
                  >
                    <iframe
                      title="Email Preview"
                      srcDoc={generatePreviewHtml(editBodyHtml)}
                      className="w-full h-[400px] border-0"
                    />
                  </div>
                </div>
              )}
            </div>

            {saveError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <DialogFooter className="p-4 border-t border-border bg-muted/10 flex items-center justify-between sm:justify-between">
            <div>
              {saveSuccess && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="size-4" /> Template changes saved!
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingTemplate(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-1.5"
              >
                {isSaving ? <Spinner className="size-3.5" /> : <Check className="size-3.5" />}
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TEST EMAIL DIALOG */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Send className="size-4 text-primary" /> Send Test Email
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Send this template with sample data to inspect its formatting in your real email inbox.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Recipient Email Address</label>
              <Input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="your.email@example.com (or leave empty for admin email)"
                className="text-xs"
              />
            </div>

            {testResult && (
              <div
                className={cn(
                  "p-3 rounded-lg text-xs flex items-center gap-2",
                  testResult.success
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300"
                )}
              >
                {testResult.success ? (
                  <CheckCircle2 className="size-4 shrink-0" />
                ) : (
                  <AlertCircle className="size-4 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTestDialogOpen(false)
                setTestResult(null)
              }}
            >
              Done
            </Button>
            <Button
              size="sm"
              onClick={handleSendTest}
              disabled={isSendingTest}
              className="gap-1.5"
            >
              {isSendingTest ? <Spinner className="size-3.5" /> : <Send className="size-3.5" />}
              Send Test Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RESET CONFIRMATION DIALOG */}
      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-amber-600 flex items-center gap-2">
              <RotateCcw className="size-4" /> Reset Template to Default?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This will overwrite the current subject and HTML body with the system default template for &ldquo;{editingTemplate?.name}&rdquo;. Any custom modifications will be lost.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReset}
              disabled={isResetting}
              className="gap-1.5"
            >
              {isResetting ? <Spinner className="size-3.5" /> : <RefreshCw className="size-3.5" />}
              Confirm Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
