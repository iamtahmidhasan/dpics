"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  Globe,
  Laptop,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react"

import { useLanguage } from "@/components/language-provider"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ActivityLogSummary } from "@/lib/services/activity-log.service"

const ACTION_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary" | "muted"> = {
  CREATE: "success",
  UPDATE: "default",
  DELETE: "destructive",
  STATUS_CHANGE: "warning",
  ROLE_CHANGE: "secondary",
  VERIFICATION: "success",
  ENROLLMENT: "default",
  LOGIN: "muted",
  SETTINGS_CHANGE: "warning",
  BULK_ACTION: "secondary",
  OTHER: "muted",
}

export function ActivityLogsTable() {
  const { t, lang } = useLanguage()
  const isBn = lang === "bn"

  const [logs, setLogs] = useState<ActivityLogSummary[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState("")
  const [selectedAction, setSelectedAction] = useState<string>("ALL")
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL")
  const [availableEntities, setAvailableEntities] = useState<string[]>([])

  // Modal inspection
  const [selectedLog, setSelectedLog] = useState<ActivityLogSummary | null>(null)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  // Fetch filter options
  useEffect(() => {
    fetch("/api/admin/activity-logs?options=true")
      .then((res) => (res.ok ? res.json() : { entities: [] }))
      .then((data) => {
        if (Array.isArray(data.entities)) {
          setAvailableEntities(data.entities)
        }
      })
      .catch(() => {})
  }, [])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (search.trim()) params.set("search", search.trim())
      if (selectedAction !== "ALL") params.set("action", selectedAction)
      if (selectedEntity !== "ALL") params.set("entity", selectedEntity)

      const res = await fetch(`/api/admin/activity-logs?${params.toString()}`)
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error(
            t(
              "Super Admin access required to view Activity Logs",
              "অ্যাক্টিভিটি লগ দেখতে সুপার অ্যাডমিন অনুমতি প্রয়োজন"
            )
          )
        }
        throw new Error(t("Failed to load activity logs", "অ্যাক্টিভিটি লগ লোড করতে ব্যর্থ হয়েছে"))
      }

      const data = await res.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading activity logs")
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, selectedAction, selectedEntity, t])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs()
    }, 250)
    return () => clearTimeout(timer)
  }, [fetchLogs])

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString(isBn ? "bn-BD" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <div className="space-y-4">
      {/* Header & Filters Card */}
      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-64 flex-1 md:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder={t(
                "Search logs by actor, entity, description...",
                "ব্যবহারকারী, বর্ণনা বা এন্টিটি খুঁজুন..."
              )}
              className="h-9 pl-9 text-xs"
            />
          </div>

          {/* Action Filter */}
          <div className="w-40">
            <Select
              value={selectedAction}
              onValueChange={(val) => {
                if (val) {
                  setSelectedAction(val)
                  setPage(1)
                }
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={t("All Actions", "সকল অ্যাকশন")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("All Actions", "সকল অ্যাকশন")}</SelectItem>
                <SelectItem value="CREATE">{t("Create", "তৈরি")}</SelectItem>
                <SelectItem value="UPDATE">{t("Update", "আপডেট")}</SelectItem>
                <SelectItem value="DELETE">{t("Delete", "মুছে ফেলা")}</SelectItem>
                <SelectItem value="STATUS_CHANGE">{t("Status Change", "অবস্থা পরিবর্তন")}</SelectItem>
                <SelectItem value="ROLE_CHANGE">{t("Role Change", "ভূমিকা পরিবর্তন")}</SelectItem>
                <SelectItem value="VERIFICATION">{t("Verification", "ভেরিফিকেশন")}</SelectItem>
                <SelectItem value="ENROLLMENT">{t("Enrollment", "এনরোলমেন্ট")}</SelectItem>
                <SelectItem value="SETTINGS_CHANGE">{t("Settings Change", "সেটিংস পরিবর্তন")}</SelectItem>
                <SelectItem value="BULK_ACTION">{t("Bulk Action", "বাল্ক অ্যাকশন")}</SelectItem>
                <SelectItem value="LOGIN">{t("Login", "লগইন")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Entity Filter */}
          <div className="w-44">
            <Select
              value={selectedEntity}
              onValueChange={(val) => {
                if (val) {
                  setSelectedEntity(val)
                  setPage(1)
                }
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={t("All Entities", "সকল এন্টিটি")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("All Entities", "সকল এন্টিটি")}</SelectItem>
                {availableEntities.map((ent) => (
                  <SelectItem key={ent} value={ent}>
                    {ent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters */}
          {(search || selectedAction !== "ALL" || selectedEntity !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("")
                setSelectedAction("ALL")
                setSelectedEntity("ALL")
                setPage(1)
              }}
              className="h-9 text-xs"
            >
              {t("Reset Filters", "ফিল্টার মুছুন")}
            </Button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs()}
            disabled={loading}
            className="h-9 gap-1.5 text-xs"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            {t("Refresh", "রিফ্রেশ")}
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Logs Table */}
      <div className="rounded-xl border border-border/60 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[180px] text-xs font-semibold">{t("Timestamp", "সময়")}</TableHead>
                <TableHead className="w-[200px] text-xs font-semibold">{t("Actor", "অ্যাক্টর")}</TableHead>
                <TableHead className="w-[140px] text-xs font-semibold">{t("Action", "অ্যাকশন")}</TableHead>
                <TableHead className="w-[150px] text-xs font-semibold">{t("Entity", "এন্টিটি")}</TableHead>
                <TableHead className="text-xs font-semibold">{t("Description", "বর্ণনা")}</TableHead>
                <TableHead className="w-[100px] text-right text-xs font-semibold">{t("Inspect", "বিবরণ")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Spinner className="size-6 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {t("Loading activity trail...", "অ্যাক্টিভিটি ট্রেল লোড হচ্ছে...")}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                      <ShieldAlert className="size-8 opacity-40" />
                      <p className="text-sm font-medium">{t("No activity logs found", "কোনো অ্যাক্টিভিটি লগ পাওয়া যায়নি")}</p>
                      <p className="text-xs">
                        {t("Try adjusting your search criteria or filters.", "ফিল্টার বা সার্চ পরিবর্তন করে দেখুন।")}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const badgeVariant = ACTION_COLORS[log.action] ?? "muted"

                  return (
                    <TableRow key={log.id} className="hover:bg-muted/30">
                      {/* Timestamp */}
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3 shrink-0 text-muted-foreground/70" />
                          <span>{formatTimestamp(log.createdAt)}</span>
                        </div>
                      </TableCell>

                      {/* Actor */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-foreground">
                              {log.userName || t("System / Anonymous", "সিস্টেম")}
                            </span>
                            {log.userRole?.includes("SUPER_ADMIN") ? (
                              <Badge variant="default" className="text-[10px] px-1 py-0 h-4">
                                Super Admin
                              </Badge>
                            ) : log.userRole?.includes("ADMIN") ? (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                Admin
                              </Badge>
                            ) : null}
                          </div>
                          {log.userEmail && (
                            <span className="text-[11px] text-muted-foreground">{log.userEmail}</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Action */}
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <Badge variant={badgeVariant} className="text-[11px] font-medium">
                            {log.action}
                          </Badge>
                          <span className="text-[10px] font-mono text-muted-foreground/80">
                            {log.actionName}
                          </span>
                        </div>
                      </TableCell>

                      {/* Entity */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-foreground">{log.entity}</span>
                          {log.entityId && (
                            <span
                              className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]"
                              title={log.entityId}
                            >
                              {log.entityId}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Description */}
                      <TableCell className="max-w-[320px]">
                        <p className="text-xs text-foreground/90 truncate" title={log.description || ""}>
                          {log.description || "—"}
                        </p>
                      </TableCell>

                      {/* Inspect Button */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-7 gap-1 px-2 text-xs font-normal text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Eye className="size-3.5" />
                          {t("View", "দেখুন")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-4 py-3 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {t("Total records:", "মোট রেকর্ড:")} <strong className="text-foreground">{total}</strong>
            </span>
            <span>•</span>
            <span>
              {t("Page", "পৃষ্ঠা")} {page} {t("of", "এর")} {totalPages}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Page Size selector */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
              <span>{t("Per page:", "প্রতি পৃষ্ঠায়:")}</span>
              <Select
                value={String(limit)}
                onValueChange={(val) => {
                  if (val) {
                    setLimit(Number(val))
                    setPage(1)
                  }
                }}
              >
                <SelectTrigger className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prev / Next */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="h-7 px-2 text-xs"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="h-7 px-2 text-xs"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Details & Diff Inspection Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        {selectedLog && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant={ACTION_COLORS[selectedLog.action] ?? "default"}>
                  {selectedLog.action}
                </Badge>
                <DialogTitle className="text-base font-semibold">
                  {selectedLog.actionName}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                {selectedLog.description || t("Audit trail event details", "অডিট ট্রেল ইভেন্ট বিবরণ")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Event Metadata Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">{t("Actor", "অ্যাক্টর")}</span>
                  <div className="font-medium text-foreground mt-0.5">
                    {selectedLog.userName || "System"}
                  </div>
                  {selectedLog.userEmail && (
                    <div className="text-muted-foreground text-[11px]">{selectedLog.userEmail}</div>
                  )}
                  {selectedLog.userRole && (
                    <div className="text-[10px] text-primary mt-0.5">{selectedLog.userRole}</div>
                  )}
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">{t("Target Entity", "টার্গেট এন্টিটি")}</span>
                  <div className="font-medium text-foreground mt-0.5">{selectedLog.entity}</div>
                  {selectedLog.entityId && (
                    <div className="font-mono text-[10px] text-muted-foreground break-all">
                      ID: {selectedLog.entityId}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">{t("Timestamp & Network", "সময় ও নেটওয়ার্ক")}</span>
                  <div className="font-medium text-foreground mt-0.5">
                    {formatTimestamp(selectedLog.createdAt)}
                  </div>
                  {selectedLog.ipAddress && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Globe className="size-3" /> {selectedLog.ipAddress}
                    </div>
                  )}
                  {selectedLog.userAgent && (
                    <div className="text-[10px] text-muted-foreground truncate" title={selectedLog.userAgent}>
                      <Laptop className="inline size-3 mr-0.5" /> {selectedLog.userAgent}
                    </div>
                  )}
                </div>
              </div>

              {/* Old State vs New State Diff Inspection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Old / Previous State */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <span className="size-2 rounded-full bg-destructive inline-block" />
                      {t("Before (Old State)", "পূর্ববর্তী অবস্থা (Old Data)")}
                    </span>
                    {Boolean(selectedLog.oldData) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(selectedLog.oldData, null, 2),
                            "oldData"
                          )
                        }
                        className="h-6 px-1.5 text-[10px] gap-1"
                      >
                        {copiedSection === "oldData" ? (
                          <Check className="size-3 text-success" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                        {copiedSection === "oldData" ? t("Copied", "কপি হয়েছে") : t("Copy JSON", "কপি")}
                      </Button>
                    )}
                  </div>
                  <pre className="max-h-60 overflow-auto rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-[11px] font-mono text-foreground leading-relaxed">
                    {selectedLog.oldData
                      ? JSON.stringify(selectedLog.oldData, null, 2)
                      : t("No previous state recorded", "কোনো পূর্ববর্তী অবস্থা রেকর্ড নেই")}
                  </pre>
                </div>

                {/* New / After State */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <span className="size-2 rounded-full bg-success inline-block" />
                      {t("After (New State)", "পরবর্তী অবস্থা (New Data)")}
                    </span>
                    {Boolean(selectedLog.newData) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(selectedLog.newData, null, 2),
                            "newData"
                          )
                        }
                        className="h-6 px-1.5 text-[10px] gap-1"
                      >
                        {copiedSection === "newData" ? (
                          <Check className="size-3 text-success" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                        {copiedSection === "newData" ? t("Copied", "কপি হয়েছে") : t("Copy JSON", "কপি")}
                      </Button>
                    )}
                  </div>
                  <pre className="max-h-60 overflow-auto rounded-lg border border-success/20 bg-success/5 p-3 text-[11px] font-mono text-foreground leading-relaxed">
                    {selectedLog.newData
                      ? JSON.stringify(selectedLog.newData, null, 2)
                      : t("No new state recorded", "কোনো নতুন অবস্থা রেকর্ড নেই")}
                  </pre>
                </div>
              </div>

              {/* Extra Metadata if present */}
              {Boolean(selectedLog.metadata) && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {t("Additional Metadata", "অতিরিক্ত মেটাডেটা")}
                  </span>
                  <pre className="max-h-36 overflow-auto rounded-lg border border-border/60 bg-muted/40 p-3 text-[11px] font-mono text-foreground">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
