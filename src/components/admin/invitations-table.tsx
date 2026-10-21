"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Hourglass,
  Loader2,
  Mail,
  MoreVertical,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { InvitationStatus, Role } from "@/generated/prisma/enums"
import { InviteUserDialog } from "@/components/admin/invite-user-dialog"
import { useAdminInvitations } from "@/components/admin/use-admin-invitations"

const SEARCH_DEBOUNCE_MS = 300

function statusBadgeVariant(status: InvitationStatus) {
  switch (status) {
    case InvitationStatus.ACCEPTED:
      return "success" as const
    case InvitationStatus.PENDING:
      return "warning" as const
    case InvitationStatus.REVOKED:
      return "destructive" as const
    case InvitationStatus.EXPIRED:
    default:
      return "muted" as const
  }
}

function roleBadgeVariant(role: Role) {
  switch (role) {
    case Role.SUPER_ADMIN:
    case Role.ADMIN:
      return "default" as const
    case Role.MEMBER:
      return "success" as const
    case Role.INSTRUCTOR:
      return "warning" as const
    case Role.USER:
    default:
      return "muted" as const
  }
}

function formatRelativeExpiry(expiresAtStr: string, status: InvitationStatus, t: (en: string, bn: string) => string): string {
  if (status === InvitationStatus.ACCEPTED) {
    return t("Accepted", "গৃহীত")
  }
  if (status === InvitationStatus.REVOKED) {
    return t("Revoked", "বাতিলকৃত")
  }

  const expiry = new Date(expiresAtStr).getTime()
  const now = Date.now()
  const diffMs = expiry - now

  if (diffMs <= 0 || status === InvitationStatus.EXPIRED) {
    return t("Expired", "মেয়াদোত্তীর্ণ")
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 24) {
    return t(`Expires in ${diffHours}h`, `${diffHours} ঘণ্টার মধ্যে মেয়াদ শেষ`)
  }

  const diffDays = Math.ceil(diffHours / 24)
  return t(`Expires in ${diffDays}d`, `${diffDays} দিনের মধ্যে মেয়াদ শেষ`)
}

export function InvitationsTable({
  currentUserRoles = [],
}: {
  currentUserRoles?: Role[]
}) {
  const { t, lang } = useLanguage()

  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<InvitationStatus | "ALL">("ALL")
  const [role, setRole] = useState<Role | "ALL">("ALL")
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const { data, isLoading, error } = useAdminInvitations({
    page,
    search,
    status,
    role,
    refreshKey,
  })

  const { invitations, total, totalPages, counts } = data

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [lang]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  async function handleCopyLink(token: string) {
    const link = `${window.location.origin}/invite/${token}`
    try {
      await navigator.clipboard.writeText(link)
      toast.success(t("Invitation link copied!", "আমন্ত্রণ লিংক কপি করা হয়েছে!"))
    } catch {
      toast.error(t("Failed to copy link", "লিংক কপি করতে ব্যর্থ হয়েছে"))
    }
  }

  async function handleResend(id: string) {
    setActionLoadingId(id)
    try {
      const res = await fetch(`/api/admin/invitations/${id}/resend`, {
        method: "POST",
      })
      const body = await res.json()
      if (!res.ok) {
        throw new Error(body.message || body.error?.message || "Failed to resend")
      }

      toast.success(body.message || t("Invitation resent!", "আমন্ত্রণ পুনরায় পাঠানো হয়েছে!"))
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend")
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleExtend(id: string, days = 7) {
    setActionLoadingId(id)
    try {
      const res = await fetch(`/api/admin/invitations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend", days }),
      })
      const body = await res.json()
      if (!res.ok) {
        throw new Error(body.message || body.error?.message || "Failed to extend")
      }

      toast.success(t(`Invitation extended by ${days} days!`, `আমন্ত্রণের মেয়াদ ${days} দিন বাড়ানো হয়েছে!`))
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to extend")
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm(t("Are you sure you want to revoke this invitation?", "আপনি কি নিশ্চিত যে এই আমন্ত্রণটি বাতিল করতে চান?"))) {
      return
    }

    setActionLoadingId(id)
    try {
      const res = await fetch(`/api/admin/invitations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      })
      const body = await res.json()
      if (!res.ok) {
        throw new Error(body.message || body.error?.message || "Failed to revoke")
      }

      toast.success(t("Invitation revoked!", "আমন্ত্রণ বাতিল করা হয়েছে!"))
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke")
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("Permanently delete this invitation record?", "এই আমন্ত্রণের রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?"))) {
      return
    }

    setActionLoadingId(id)
    try {
      const res = await fetch(`/api/admin/invitations/${id}`, {
        method: "DELETE",
      })
      const body = await res.json()
      if (!res.ok) {
        throw new Error(body.message || body.error?.message || "Failed to delete")
      }

      toast.success(t("Invitation deleted!", "আমন্ত্রণ মুছে ফেলা হয়েছে!"))
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setActionLoadingId(null)
    }
  }

  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <Card size="sm" className="gap-3">
      <CardContent className="space-y-4">
        {/* Metric Overview Counters */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div
            onClick={() => setStatus("ALL")}
            className={`cursor-pointer rounded-lg border p-2.5 transition-colors ${
              status === "ALL" ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted/40"
            }`}
          >
            <div className="text-[0.7rem] font-medium text-muted-foreground">{t("Total Invites", "মোট আমন্ত্রণ")}</div>
            <div className="mt-0.5 text-base font-bold tabular-nums">{counts.total}</div>
          </div>

          <div
            onClick={() => setStatus(InvitationStatus.PENDING)}
            className={`cursor-pointer rounded-lg border p-2.5 transition-colors ${
              status === InvitationStatus.PENDING ? "border-amber-500/50 bg-amber-500/10" : "border-border hover:bg-muted/40"
            }`}
          >
            <div className="text-[0.7rem] font-medium text-amber-600 dark:text-amber-400">
              {t("Pending", "অপেক্ষমাণ")}
            </div>
            <div className="mt-0.5 text-base font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {counts.pending}
            </div>
          </div>

          <div
            onClick={() => setStatus(InvitationStatus.ACCEPTED)}
            className={`cursor-pointer rounded-lg border p-2.5 transition-colors ${
              status === InvitationStatus.ACCEPTED ? "border-emerald-500/50 bg-emerald-500/10" : "border-border hover:bg-muted/40"
            }`}
          >
            <div className="text-[0.7rem] font-medium text-emerald-600 dark:text-emerald-400">
              {t("Accepted", "গৃহীত")}
            </div>
            <div className="mt-0.5 text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {counts.accepted}
            </div>
          </div>

          <div
            onClick={() => setStatus(InvitationStatus.EXPIRED)}
            className={`cursor-pointer rounded-lg border p-2.5 transition-colors ${
              status === InvitationStatus.EXPIRED ? "border-slate-500/50 bg-slate-500/10" : "border-border hover:bg-muted/40"
            }`}
          >
            <div className="text-[0.7rem] font-medium text-muted-foreground">{t("Expired", "মেয়াদোত্তীর্ণ")}</div>
            <div className="mt-0.5 text-base font-bold tabular-nums text-muted-foreground">{counts.expired}</div>
          </div>

          <div
            onClick={() => setStatus(InvitationStatus.REVOKED)}
            className={`cursor-pointer rounded-lg border p-2.5 transition-colors ${
              status === InvitationStatus.REVOKED ? "border-destructive/50 bg-destructive/10" : "border-border hover:bg-muted/40"
            }`}
          >
            <div className="text-[0.7rem] font-medium text-destructive">{t("Revoked", "বাতিলকৃত")}</div>
            <div className="mt-0.5 text-base font-bold tabular-nums text-destructive">{counts.revoked}</div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative sm:max-w-64 sm:flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("Search recipient or email...", "প্রাপক বা ইমেইল খুঁজুন...")}
                className="pl-8 text-xs"
              />
            </div>

            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val as InvitationStatus | "ALL")
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-36 text-xs">
                <SelectValue placeholder={t("All Statuses", "সব অবস্থা")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("All Statuses", "সব অবস্থা")}</SelectItem>
                <SelectItem value={InvitationStatus.PENDING}>{t("Pending", "অপেক্ষমাণ")}</SelectItem>
                <SelectItem value={InvitationStatus.ACCEPTED}>{t("Accepted", "গৃহীত")}</SelectItem>
                <SelectItem value={InvitationStatus.EXPIRED}>{t("Expired", "মেয়াদোত্তীর্ণ")}</SelectItem>
                <SelectItem value={InvitationStatus.REVOKED}>{t("Revoked", "বাতিলকৃত")}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={role}
              onValueChange={(val) => {
                setRole(val as Role | "ALL")
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-36 text-xs">
                <SelectValue placeholder={t("All Roles", "সব পদবি")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("All Roles", "সব পদবি")}</SelectItem>
                {Object.values(Role).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon-lg"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={isLoading}
              aria-label={t("Refresh", "রিফ্রেশ")}
            >
              {isLoading ? <Loader2 className="animate-spin size-4" /> : <RefreshCw className="size-4" />}
            </Button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/admin/emails?template=USER_INVITATION">
              <Button
                variant="outline"
                className="gap-1.5 text-xs"
                title={t("Customize Invitation Email Template", "আমন্ত্রণ ইমেইল টেমপ্লেট কাস্টমাইজ করুন")}
              >
                <Mail className="size-3.5" />
                <span>{t("Email Template", "ইমেইল টেমপ্লেট")}</span>
              </Button>
            </Link>

            <Button
              onClick={() => setIsInviteDialogOpen(true)}
              className="gap-2 shrink-0"
            >
              <UserPlus className="size-4" />
              <span>{t("Invite User", "আমন্ত্রণ জানান")}</span>
            </Button>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs/relaxed text-destructive">
            {error}
          </p>
        )}

        {/* Invitations Table */}
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("Recipient", "প্রাপক")}</TableHead>
                <TableHead>{t("Role", "নির্ধারিত পদবি")}</TableHead>
                <TableHead>{t("Status", "অবস্থা")}</TableHead>
                <TableHead>{t("Invited By", "আমন্ত্রণকারী")}</TableHead>
                <TableHead>{t("Validity / Expiry", "মেয়াদ")}</TableHead>
                <TableHead>{t("Sent Date", "পাঠানোর তারিখ")}</TableHead>
                <TableHead className="text-right">{t("Actions", "পদক্ষেপ")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={isLoading ? "opacity-60" : undefined}>
              {invitations.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Mail className="size-8 text-muted-foreground/50" />
                      <p>{t("No invitations found matching filters.", "ফিল্টারের সাথে মিলে এমন কোনো আমন্ত্রণ পাওয়া যায়নি।")}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsInviteDialogOpen(true)}
                        className="mt-1 gap-1.5"
                      >
                        <Plus className="size-3.5" />
                        <span>{t("Send an Invitation", "আমন্ত্রণ পাঠান")}</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                invitations.map((invite) => {
                  const isActionLoading = actionLoadingId === invite.id
                  const isPending = invite.status === InvitationStatus.PENDING
                  const isExpired = invite.status === InvitationStatus.EXPIRED

                  return (
                    <TableRow key={invite.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {invite.name || t("Unnamed Invitee", "নামবিহীন প্রাপক")}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">{invite.email}</span>
                          {invite.customMessage && (
                            <span className="mt-0.5 line-clamp-1 text-[0.65rem] italic text-muted-foreground">
                              &ldquo;{invite.customMessage}&rdquo;
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={roleBadgeVariant(invite.role)}>{invite.role}</Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant={statusBadgeVariant(invite.status)}>
                          {invite.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col text-xs text-muted-foreground">
                          <span className="text-foreground">{invite.invitedByName || "Admin"}</span>
                          <span className="text-[0.68rem]">{invite.invitedByEmail}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3 shrink-0" />
                          <span>{formatRelativeExpiry(invite.expiresAt, invite.status, t)}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        <div>{dateFormatter.format(new Date(invite.createdAt))}</div>
                        {invite.resendCount > 0 && (
                          <span className="text-[0.65rem] text-primary">
                            {t(`Resent ${invite.resendCount}x`, `${invite.resendCount} বার পুনরায় পাঠানো`)}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isPending && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleCopyLink(invite.token)}
                              title={t("Copy invitation link", "আমন্ত্রণ লিংক কপি করুন")}
                              aria-label={t("Copy link", "লিংক কপি")}
                            >
                              <Copy className="size-3.5" />
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  disabled={isActionLoading}
                                  aria-label={t("More actions", "আরও পদক্ষেপ")}
                                >
                                  {isActionLoading ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <MoreVertical className="size-3.5" />
                                  )}
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="w-44 text-xs">
                              {isPending && (
                                <DropdownMenuItem onClick={() => handleCopyLink(invite.token)} className="gap-2">
                                  <Copy className="size-3.5" />
                                  <span>{t("Copy Link", "লিংক কপি করুন")}</span>
                                </DropdownMenuItem>
                              )}

                              {(isPending || isExpired) && (
                                <DropdownMenuItem onClick={() => handleResend(invite.id)} className="gap-2">
                                  <RotateCcw className="size-3.5" />
                                  <span>{t("Resend Email", "পুনরায় ইমেইল পাঠান")}</span>
                                </DropdownMenuItem>
                              )}

                              {isPending && (
                                <DropdownMenuItem onClick={() => handleExtend(invite.id, 7)} className="gap-2">
                                  <Hourglass className="size-3.5" />
                                  <span>{t("Extend Expiry (+7d)", "মেয়াদ বাড়ান (+৭ দিন)")}</span>
                                </DropdownMenuItem>
                              )}

                              {isPending && (
                                <DropdownMenuItem
                                  onClick={() => handleRevoke(invite.id)}
                                  className="gap-2 text-destructive focus:text-destructive"
                                >
                                  <XCircle className="size-3.5" />
                                  <span>{t("Revoke Invite", "আমন্ত্রণ বাতিল করুন")}</span>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleDelete(invite.id)}
                                className="gap-2 text-destructive focus:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                                <span>{t("Delete Record", "রেকর্ড মুছুন")}</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs/relaxed text-muted-foreground">
            {t("Total", "মোট")}: {total.toLocaleString()} · {t("Page", "পৃষ্ঠা")} {page}/{totalPages}
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-lg"
              disabled={!hasPrev || isLoading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              aria-label={t("Previous page", "আগের পৃষ্ঠা")}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-lg"
              disabled={!hasNext || isLoading}
              onClick={() => setPage((current) => current + 1)}
              aria-label={t("Next page", "পরের পৃষ্ঠা")}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </CardContent>

      <InviteUserDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onSuccess={() => setRefreshKey((k) => k + 1)}
        currentUserRoles={currentUserRoles}
      />
    </Card>
  )
}
