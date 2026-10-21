"use client"

import { useId, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  Check,
  Copy,
  Loader2,
  Mail,
  Send,
  Upload,
  User,
  UserPlus,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "cn"
import { Role } from "@/generated/prisma/enums"
import type {
  BulkInvitationItemResult,
  CreateBulkInvitationsResult,
} from "@/lib/services/invitation.service"

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  currentUserRoles?: Role[]
  initialMode?: "single" | "bulk"
}

const EXPIRY_OPTIONS = [
  { value: "1", label: "24 Hours (1 day)" },
  { value: "3", label: "3 Days" },
  { value: "7", label: "7 Days (Recommended)" },
  { value: "14", label: "14 Days (2 weeks)" },
  { value: "30", label: "30 Days (1 month)" },
]

export function InviteUserDialog({
  open,
  onOpenChange,
  onSuccess,
  currentUserRoles = [],
  initialMode = "single",
}: InviteUserDialogProps) {
  const { t } = useLanguage()
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<"single" | "bulk">(initialMode)

  // Single Invite State
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<Role>(Role.MEMBER)
  const [expiryDays, setExpiryDays] = useState("7")
  const [customMessage, setCustomMessage] = useState("")
  const [sendEmail, setSendEmail] = useState(true)

  // Bulk Invite State
  const [bulkEmailsText, setBulkEmailsText] = useState("")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Success States
  const [singleSuccessData, setSingleSuccessData] = useState<{
    inviteUrl: string
    emailSent: boolean
    email: string
    role: Role
  } | null>(null)

  const [bulkSuccessData, setBulkSuccessData] = useState<CreateBulkInvitationsResult | null>(null)
  const [hasCopied, setHasCopied] = useState(false)

  // RBAC: An Admin user CANNOT assign SUPER_ADMIN role! Only a Super Admin can!
  const isSuperAdmin = currentUserRoles.includes(Role.SUPER_ADMIN)

  const availableRoles = useMemo(() => {
    if (isSuperAdmin) {
      return [Role.USER, Role.MEMBER, Role.INSTRUCTOR, Role.ADMIN, Role.SUPER_ADMIN]
    }
    // Admin user cannot assign SUPER_ADMIN
    return [Role.USER, Role.MEMBER, Role.INSTRUCTOR, Role.ADMIN]
  }, [isSuperAdmin])

  // Extract valid emails from bulk text
  const detectedEmails = useMemo(() => {
    const rawTokens = bulkEmailsText
      .split(/[\s,;]+/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 3 && t.includes("@") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t))
    return Array.from(new Set(rawTokens))
  }, [bulkEmailsText])

  function resetForm() {
    setEmail("")
    setName("")
    setRole(Role.MEMBER)
    setExpiryDays("7")
    setCustomMessage("")
    setSendEmail(true)
    setBulkEmailsText("")
    setError(null)
    setSingleSuccessData(null)
    setBulkSuccessData(null)
    setHasCopied(false)
  }

  function handleClose() {
    resetForm()
    onOpenChange(false)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        setBulkEmailsText((prev) => (prev ? `${prev}\n${content}` : content))
        toast.success(t("Email list loaded from file!", "ফাইল থেকে ইমেইল তালিকা যুক্ত করা হয়েছে!"))
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError(t("Please enter a valid email address.", "অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা দিন।"))
      return
    }

    if (role === Role.SUPER_ADMIN && !isSuperAdmin) {
      setError(t("Only Super Administrators can assign the Super Admin role.", "শুধুমাত্র সুপার অ্যাডমিনরা এই ভূমিকা প্রদান করতে পারেন।"))
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          name: name.trim() || undefined,
          role,
          expiryDays: Number.parseInt(expiryDays, 10) || 7,
          customMessage: customMessage.trim() || undefined,
          sendEmail,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || data.message || "Failed to create invitation")
      }

      setSingleSuccessData({
        inviteUrl: data.inviteUrl,
        emailSent: Boolean(data.emailSent),
        email: cleanEmail,
        role,
      })

      toast.success(
        sendEmail && data.emailSent
          ? t("Invitation sent via email successfully!", "ইমেইলের মাধ্যমে আমন্ত্রণ সফলভাবে পাঠানো হয়েছে!")
          : t("Invitation created successfully!", "আমন্ত্রণ সফলভাবে তৈরি হয়েছে!")
      )

      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (detectedEmails.length === 0) {
      setError(t("Please provide at least one valid email address.", "অনুগ্রহ করে অন্তত একটি সঠিক ইমেইল ঠিকানা দিন।"))
      return
    }

    if (role === Role.SUPER_ADMIN && !isSuperAdmin) {
      setError(t("Only Super Administrators can assign the Super Admin role.", "শুধুমাত্র সুপার অ্যাডমিনরা এই ভূমিকা প্রদান করতে পারেন।"))
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/admin/invitations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: detectedEmails,
          role,
          expiryDays: Number.parseInt(expiryDays, 10) || 7,
          customMessage: customMessage.trim() || undefined,
          sendEmail,
        }),
      })

      const data = (await res.json()) as CreateBulkInvitationsResult & {
        error?: { message?: string }
        message?: string
      }

      if (!res.ok) {
        throw new Error(data.error?.message || data.message || "Bulk invitation failed")
      }

      setBulkSuccessData(data)

      toast.success(
        t(
          `Bulk invitations completed: ${data.successCount} created, ${data.skippedCount} skipped.`,
          `বাল্ক আমন্ত্রণ সম্পন্ন: ${data.successCount}টি তৈরি হয়েছে, ${data.skippedCount}টি বাদ দেওয়া হয়েছে।`
        )
      )

      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCopySingleLink() {
    if (!singleSuccessData?.inviteUrl) return
    try {
      await navigator.clipboard.writeText(singleSuccessData.inviteUrl)
      setHasCopied(true)
      toast.success(t("Invitation link copied!", "আমন্ত্রণ লিংক কপি করা হয়েছে!"))
      setTimeout(() => setHasCopied(false), 2500)
    } catch {
      toast.error(t("Failed to copy link", "লিংক কপি করতে ব্যর্থ হয়েছে"))
    }
  }

  async function handleCopyAllBulkLinks() {
    if (!bulkSuccessData?.results) return
    const links = bulkSuccessData.results
      .filter((r) => r.inviteUrl)
      .map((r) => `${r.email}: ${r.inviteUrl}`)
      .join("\n")

    if (!links) return
    try {
      await navigator.clipboard.writeText(links)
      setHasCopied(true)
      toast.success(t("All generated links copied to clipboard!", "সবগুলো লিংক ক্লিপবোর্ডে কপি করা হয়েছে!"))
      setTimeout(() => setHasCopied(false), 2500)
    } catch {
      toast.error(t("Failed to copy links", "লিংক কপি করতে ব্যর্থ হয়েছে"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => (val ? onOpenChange(true) : handleClose())}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="size-5" />
            </div>
            <div>
              <DialogTitle>{t("Send User Invitations", "ব্যবহারকারীদের আমন্ত্রণ জানান")}</DialogTitle>
              <DialogDescription>
                {t(
                  "Invite individual users or batch send invitations via email with pre-assigned roles.",
                  "পূর্বনির্ধারিত ভূমিকা সহ একক বা দলবদ্ধভাবে ইমেইল আমন্ত্রণ পাঠান।"
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Mode Selector (Single vs Bulk) */}
        {!singleSuccessData && !bulkSuccessData && (
          <div className="border-b border-border">
            <nav className="flex space-x-2 pb-px" aria-label="Invitation Mode">
              <button
                type="button"
                onClick={() => setMode("single")}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap outline-none",
                  mode === "single"
                    ? "border-primary text-primary font-semibold bg-primary/5 rounded-t-md"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <User className={cn("size-3.5", mode === "single" ? "text-primary" : "text-muted-foreground")} />
                <span>{t("Single Invite", "একক আমন্ত্রণ")}</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("bulk")}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap outline-none",
                  mode === "bulk"
                    ? "border-primary text-primary font-semibold bg-primary/5 rounded-t-md"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Users className={cn("size-3.5", mode === "bulk" ? "text-primary" : "text-muted-foreground")} />
                <span>{t("Bulk Invite", "বাল্ক আমন্ত্রণ")}</span>
              </button>
            </nav>
          </div>
        )}

        {/* Single Success View */}
        {singleSuccessData ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-950 dark:text-emerald-200">
              <div className="flex items-center gap-2 font-medium">
                <Check className="size-5 text-emerald-500" />
                <span>
                  {singleSuccessData.emailSent
                    ? t("Invitation email dispatched!", "আমন্ত্রণ ইমেইল পাঠানো হয়েছে!")
                    : t("Invitation created (Email not sent)", "আমন্ত্রণ তৈরি হয়েছে (ইমেইল পাঠানো হয়নি)")}
                </span>
              </div>
              <p className="mt-1 text-xs/relaxed opacity-90">
                {t(
                  `Invitation active for ${singleSuccessData.email} with role "${singleSuccessData.role}".`,
                  `"${singleSuccessData.role}" পদবি সহ ${singleSuccessData.email}-এর জন্য আমন্ত্রণ সক্রিয়।`
                )}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("Direct Invitation Link", "সরাসরি আমন্ত্রণ লিংক")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={singleSuccessData.inviteUrl}
                  className="font-mono text-xs select-all bg-muted"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopySingleLink}
                  className="shrink-0 gap-1.5"
                >
                  {hasCopied ? (
                    <>
                      <Check className="size-4 text-emerald-500" />
                      <span>{t("Copied", "কপি হয়েছে")}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      <span>{t("Copy", "কপি")}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                {t("Invite Another", "অন্য কাউকে আমন্ত্রণ জানান")}
              </Button>
              <Button type="button" onClick={handleClose}>
                {t("Done", "সম্পন্ন")}
              </Button>
            </DialogFooter>
          </div>
        ) : bulkSuccessData ? (
          /* Bulk Success View */
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-200">
                <Check className="size-5 text-emerald-500" />
                <span>{t("Bulk Invitations Processed", "বাল্ক আমন্ত্রণ সম্পন্ন")}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Badge variant="success">
                  {t("Created", "তৈরি হয়েছে")}: {bulkSuccessData.successCount}
                </Badge>
                {bulkSuccessData.skippedCount > 0 && (
                  <Badge variant="warning">
                    {t("Skipped", "বাদ দেওয়া হয়েছে")}: {bulkSuccessData.skippedCount}
                  </Badge>
                )}
                {bulkSuccessData.failedCount > 0 && (
                  <Badge variant="destructive">
                    {t("Failed", "ব্যর্থ")}: {bulkSuccessData.failedCount}
                  </Badge>
                )}
              </div>
            </div>

            {/* List of results */}
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border p-2 space-y-1.5 text-xs">
              {bulkSuccessData.results.map((r: BulkInvitationItemResult, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 rounded p-1.5 bg-muted/40"
                >
                  <span className="font-mono truncate">{r.email}</span>
                  <div className="shrink-0 flex items-center gap-1.5">
                    {r.status === "SENT" || r.status === "CREATED" ? (
                      <Badge variant="success" className="text-[0.65rem]">
                        {r.status === "SENT" ? t("Sent", "পাঠানো হয়েছে") : t("Created", "তৈরি হয়েছে")}
                      </Badge>
                    ) : r.status === "SKIPPED_EXISTING_USER" ? (
                      <Badge variant="muted" className="text-[0.65rem]">
                        {t("Already User", "নিবন্ধিত অ্যাকাউন্ট")}
                      </Badge>
                    ) : r.status === "SKIPPED_ACTIVE_INVITE" ? (
                      <Badge variant="warning" className="text-[0.65rem]">
                        {t("Already Invited", "আমন্ত্রণ সক্রিয়")}
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[0.65rem]">
                        {t("Failed", "ব্যর্থ")}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyAllBulkLinks}
                className="gap-1.5"
              >
                {hasCopied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                <span>{t("Copy All Links", "সবগুলো লিংক কপি করুন")}</span>
              </Button>
              <Button type="button" onClick={handleClose}>
                {t("Done", "সম্পন্ন")}
              </Button>
            </DialogFooter>
          </div>
        ) : mode === "single" ? (
          /* Single Invite Form */
          <form onSubmit={handleSingleSubmit} className="space-y-4 py-1">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs/relaxed text-destructive"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email" className="text-xs font-medium">
                  {t("Recipient Email", "প্রাপকের ইমেইল")} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="invite-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-name" className="text-xs font-medium">
                    {t("Recipient Name (Optional)", "প্রাপকের নাম (ঐচ্ছিক)")}
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="invite-name"
                      type="text"
                      placeholder="e.g. Tanvir Ahmed"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="invite-role" className="text-xs font-medium">
                    {t("Assigned Role", "নির্ধারিত পদবি")} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={role}
                    onValueChange={(val) => val && setRole(val as Role)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="invite-role" className="w-full">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invite-expiry" className="text-xs font-medium">
                  {t("Invitation Validity / Expiration", "আমন্ত্রণের মেয়াদ")}
                </Label>
                <Select
                  value={expiryDays}
                  onValueChange={(val) => val && setExpiryDays(val)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="invite-expiry" className="w-full">
                    <SelectValue placeholder="Select Expiry" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invite-message" className="text-xs font-medium">
                  {t("Personal Message / Note (Optional)", "ব্যক্তিগত বার্তা / নোট (ঐচ্ছিক)")}
                </Label>
                <Textarea
                  id="invite-message"
                  rows={2}
                  placeholder={t(
                    "Add a personal welcome note that will be included in the invitation email...",
                    "একটি স্বাগত বার্তা যুক্ত করুন যা আমন্ত্রণ ইমেইলে দেখানো হবে..."
                  )}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  disabled={isLoading}
                  className="resize-none text-xs"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="send-email-toggle" className="text-xs font-medium cursor-pointer">
                    {t("Dispatch Email Notification", "ইমেইল নোটিফিকেশন পাঠান")}
                  </Label>
                  <p className="text-[0.7rem] text-muted-foreground">
                    {t(
                      "Deliver invitation link directly to recipient's inbox via SMTP.",
                      "SMTP-এর মাধ্যমে প্রাপকের ইনবক্সে সরাসরি আমন্ত্রণ লিংক পাঠান।"
                    )}
                  </p>
                </div>
                <Switch
                  id="send-email-toggle"
                  checked={sendEmail}
                  onCheckedChange={setSendEmail}
                  disabled={isLoading}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                {t("Cancel", "বাতিল")}
              </Button>
              <Button type="submit" disabled={isLoading} className="gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>{t("Sending...", "পাঠানো হচ্ছে...")}</span>
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    <span>{t("Send Invitation", "আমন্ত্রণ পাঠান")}</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* Bulk Invite Form */
          <form onSubmit={handleBulkSubmit} className="space-y-4 py-1">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs/relaxed text-destructive"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bulk-emails" className="text-xs font-medium">
                    {t("Recipient Email Addresses", "প্রাপকদের ইমেইল ঠিকানা")} <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      id={fileInputId}
                      type="file"
                      accept=".txt,.csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-6 gap-1 px-2 text-[0.7rem]"
                    >
                      <Upload className="size-3" />
                      <span>{t("Upload .txt/.csv", "ফাইল আপলোড")}</span>
                    </Button>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.68rem] font-semibold text-primary tabular-nums">
                      {detectedEmails.length} {t("emails", "টি ইমেইল")}
                    </span>
                  </div>
                </div>

                <Textarea
                  id="bulk-emails"
                  rows={4}
                  required
                  placeholder={t(
                    "Paste multiple emails separated by commas, spaces, or new lines:\nuser1@example.com\nuser2@example.com, user3@example.com",
                    "কমা, স্পেস বা নতুন লাইনে পৃথক করে একাধিক ইমেইল পেস্ট করুন:\nuser1@example.com\nuser2@example.com, user3@example.com"
                  )}
                  value={bulkEmailsText}
                  onChange={(e) => setBulkEmailsText(e.target.value)}
                  disabled={isLoading}
                  className="font-mono text-xs"
                />
                <p className="text-[0.68rem] text-muted-foreground">
                  {t(
                    "Duplicate emails are automatically filtered out. Already registered users will be safely skipped.",
                    "ডুপ্লিকেট ইমেইল স্বয়ংক্রিয়ভাবে ফিল্টার করা হবে। ইতিমধ্যে নিবন্ধিত অ্যাকাউন্টগুলো বাদ থাকবে।"
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="bulk-role" className="text-xs font-medium">
                    {t("Assigned Role", "নির্ধারিত পদবি")} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={role}
                    onValueChange={(val) => val && setRole(val as Role)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="bulk-role" className="w-full">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bulk-expiry" className="text-xs font-medium">
                    {t("Invitation Validity / Expiration", "আমন্ত্রণের মেয়াদ")}
                  </Label>
                  <Select
                    value={expiryDays}
                    onValueChange={(val) => val && setExpiryDays(val)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="bulk-expiry" className="w-full">
                      <SelectValue placeholder="Select Expiry" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPIRY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bulk-message" className="text-xs font-medium">
                  {t("Personal Message / Note (Optional)", "ব্যক্তিগত বার্তা / নোট (ঐচ্ছিক)")}
                </Label>
                <Textarea
                  id="bulk-message"
                  rows={2}
                  placeholder={t(
                    "Add a welcome note that will be included in all invitation emails...",
                    "একটি স্বাগত বার্তা যুক্ত করুন যা সকল আমন্ত্রণ ইমেইলে পাঠানো হবে..."
                  )}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  disabled={isLoading}
                  className="resize-none text-xs"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="bulk-send-email-toggle" className="text-xs font-medium cursor-pointer">
                    {t("Dispatch Email Notifications", "ইমেইল নোটিফিকেশন পাঠান")}
                  </Label>
                  <p className="text-[0.7rem] text-muted-foreground">
                    {t(
                      "Deliver invitation links to all recipients via SMTP.",
                      "SMTP-এর মাধ্যমে সকল প্রাপকের ইনবক্সে আমন্ত্রণ লিংক পাঠান।"
                    )}
                  </p>
                </div>
                <Switch
                  id="bulk-send-email-toggle"
                  checked={sendEmail}
                  onCheckedChange={setSendEmail}
                  disabled={isLoading}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                {t("Cancel", "বাতিল")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || detectedEmails.length === 0}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>{t("Processing Batch...", "প্রক্রিয়াধীন...")}</span>
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    <span>
                      {t(`Send ${detectedEmails.length} Invitations`, `${detectedEmails.length}টি আমন্ত্রণ পাঠান`)}
                    </span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
