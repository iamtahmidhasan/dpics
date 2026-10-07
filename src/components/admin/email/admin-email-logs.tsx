"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock, RefreshCw, Search } from "lucide-react"

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
import { EmailCategory, EmailLogStatus } from "@/generated/prisma/enums"
import { cn } from "cn"

interface LogItem {
  id: string
  to: string
  recipientName: string | null
  userId: string | null
  templateKey: string | null
  subject: string
  category: EmailCategory
  status: EmailLogStatus
  errorMessage: string | null
  createdAt: string
  sentAt: string | null
}

export function AdminEmailLogs() {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("pageSize", "20")
      if (search.trim()) params.set("search", search.trim())
      if (statusFilter !== "ALL") params.set("status", statusFilter)
      if (categoryFilter !== "ALL") params.set("category", categoryFilter)

      const res = await fetch(`/api/admin/emails/logs?${params.toString()}`)
      const data = await res.json()

      if (data.logs) {
        setLogs(data.logs)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (err) {
      console.error("Failed to load logs:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, statusFilter, categoryFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchLogs()
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by recipient or subject..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="h-8 text-xs">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val || "ALL"); setPage(1); }}>
            <SelectTrigger className="h-8 text-xs w-32">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val || "ALL"); setPage(1); }}>
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {Object.values(EmailCategory).map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={fetchLogs}
            disabled={loading}
            className="size-8"
            title="Refresh logs"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No email dispatch logs found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Recipient</th>
                  <th className="py-2.5 px-4 font-semibold">Subject</th>
                  <th className="py-2.5 px-4 font-semibold">Category</th>
                  <th className="py-2.5 px-4 font-semibold">Trigger Key</th>
                  <th className="py-2.5 px-4 font-semibold">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      {log.status === "SENT" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">
                          <CheckCircle2 className="size-3" /> Sent
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 px-2 py-0.5 text-[10px] font-semibold"
                          title={log.errorMessage || "Failed"}
                        >
                          <AlertCircle className="size-3" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        {log.recipientName && (
                          <p className="font-semibold text-foreground">{log.recipientName}</p>
                        )}
                        <p className="font-mono text-[11px] text-muted-foreground">{log.to}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-medium text-foreground truncate" title={log.subject}>
                        {log.subject}
                      </p>
                      {log.errorMessage && (
                        <p className="text-[10px] text-destructive truncate mt-0.5" title={log.errorMessage}>
                          Error: {log.errorMessage}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px]">
                        {log.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-muted-foreground">
                      {log.templateKey || "CUSTOM"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className="size-3 text-muted-foreground" />
                        {new Date(log.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            <span>
              Showing page {page} of {totalPages} ({total} total logs)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="size-7"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="size-7"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
