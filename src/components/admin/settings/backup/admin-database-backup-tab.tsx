"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Clock,
  Database,
  Download,
  Layers,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import type { BackupHistoryItem, DatabaseStats } from "@/lib/database-backup/types"
import { DatabaseStatsCards } from "./database-stats-cards"
import { DatabaseTablesTable } from "./database-tables-table"
import { BackupHistoryTable } from "./backup-history-table"
import { BackupExportModal } from "./backup-export-modal"
import { BackupRestoreModal } from "./backup-restore-modal"
import { cn } from "cn"

interface AdminDatabaseBackupTabProps {
  initialStats?: DatabaseStats
  initialHistory?: BackupHistoryItem[]
}

export function AdminDatabaseBackupTab({
  initialStats,
  initialHistory = [],
}: AdminDatabaseBackupTabProps) {
  const { t } = useLanguage()
  const router = useRouter()

  const [stats, setStats] = React.useState<DatabaseStats | null>(initialStats || null)
  const [history, setHistory] = React.useState<BackupHistoryItem[]>(initialHistory)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"tables" | "history">("tables")

  const [exportModalOpen, setExportModalOpen] = React.useState(false)
  const [restoreModalOpen, setRestoreModalOpen] = React.useState(false)

  const fetchStatsAndHistory = React.useCallback(async (showToast = false) => {
    try {
      setIsRefreshing(true)
      const res = await fetch("/api/admin/database-backup/stats")
      if (!res.ok) {
        throw new Error("Failed to load database backup statistics")
      }
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
        setHistory(data.history || [])
        if (showToast) {
          toast.success(t("Database statistics refreshed", "ডাটাবেজ পরিসংখ্যান রিফ্রেশ করা হয়েছে"))
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error refreshing stats"
      toast.error(msg)
    } finally {
      setIsRefreshing(false)
    }
  }, [t])

  React.useEffect(() => {
    let ignore = false
    if (!initialStats) {
      fetch("/api/admin/database-backup/stats")
        .then((res) => res.json())
        .then((data) => {
          if (!ignore && data?.success) {
            setStats(data.stats)
            setHistory(data.history || [])
          }
        })
        .catch((err) => console.error("Failed to load database backup statistics:", err))
    }
    return () => {
      ignore = true
    }
  }, [initialStats])

  const handleExportSuccess = () => {
    // Refresh history so the new audit item shows up
    fetchStatsAndHistory(false)
  }

  const handleRestoreSuccess = () => {
    fetchStatsAndHistory(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-xl border border-border/80 bg-gradient-to-r from-card via-card/95 to-primary/5 p-5 md:p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 ring-1 ring-primary/20">
              <Database className="size-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold tracking-tight text-foreground font-heading">
                  {t("Database Backup & Disaster Recovery", "ডাটাবেজ ব্যাকআপ ও রিকভারি")}
                </h2>
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-[11px] font-mono">
                  PostgreSQL
                </Badge>
              </div>
              <p className="text-xs/relaxed text-muted-foreground max-w-2xl">
                {t(
                  "Export full PostgreSQL database dumps, inspect pre-flight table row diffs, and safely restore state across Vercel, VPS Docker, Supabase, and self-hosted environments without requiring system binaries.",
                  "কোনো সিস্টেম বাইনারি ছাড়াই সম্পূর্ণ পোস্টগ্রিসকিউএল ডাটাবেজ ব্যাকআপ এক্সপোর্ট করুন, প্রাক-ফ্লাইট টেবিল রো ডিফারেন্স যাচাই করুন এবং নিরাপদে রিস্টোর করুন।"
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:self-center shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchStatsAndHistory(true)}
              disabled={isRefreshing}
              className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">{t("Refresh", "রিফ্রেশ")}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setRestoreModalOpen(true)}
              className="h-9 gap-1.5 text-xs border-amber-500/40 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 dark:border-amber-500/30 dark:text-amber-400 dark:hover:bg-amber-500/15"
            >
              <RotateCcw className="size-3.5" />
              <span>{t("Restore Database", "ডাটাবেজ রিস্টোর")}</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setExportModalOpen(true)}
              disabled={!stats}
              className="h-9 gap-1.5 text-xs bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              <Download className="size-3.5" />
              <span>{t("Export Backup", "ব্যাকআপ এক্সপোর্ট")}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Info Callout */}
      <Card className="border border-border/60 bg-muted/30 shadow-none">
        <CardContent className="p-3.5 flex items-start gap-3 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              {t("Zero-Binary Safe Architecture & Atomic Transactions", "জিরো-বাইনারি নিরাপদ আর্কিটেকচার ও অ্যাটমিক ট্রানজেকশন")}
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {t(
                "Backups are serialized purely through Prisma and PostgreSQL protocol with SHA-256 integrity hashing. Restores run inside an atomic single transaction with session replication bypass, eliminating foreign-key and circular reference deadlocks.",
                "ব্যাকআপসমূহ সরাসরি প্রিজমা এবং পোস্টগ্রিসকিউএল প্রোটোকলের মাধ্যমে SHA-256 ইন্টিগ্রিটি হ্যাশ সহ তৈরি হয়। রিস্টোর একটি একক অ্যাটমিক ট্রানজেকশনে সম্পন্ন হয়।"
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Live Stats Cards */}
      {stats ? (
        <DatabaseStatsCards stats={stats} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted/40 border border-border/50" />
          ))}
        </div>
      )}

      {/* Segmented View Switcher: Tables vs History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("tables")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                activeTab === "tables"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Layers className="size-3.5" />
              <span>{t("Database Tables", "ডাটাবেজ টেবিলসমূহ")}</span>
              {stats?.totalTables ? (
                <span
                  className={cn(
                    "text-[10px] font-mono px-1.5 py-0.5 rounded-md",
                    activeTab === "tables"
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-background text-muted-foreground"
                  )}
                >
                  {stats.totalTables}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                activeTab === "history"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Clock className="size-3.5" />
              <span>{t("Backup & Restore History", "ব্যাকআপ ও রিস্টোর ইতিহাস")}</span>
              <span
                className={cn(
                  "text-[10px] font-mono px-1.5 py-0.5 rounded-md",
                  activeTab === "history"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background text-muted-foreground"
                )}
              >
                {history.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab View Content */}
        {activeTab === "tables" && stats ? (
          <DatabaseTablesTable tables={stats.tables} />
        ) : null}

        {activeTab === "history" ? (
          <BackupHistoryTable
            history={history}
            onRefresh={() => fetchStatsAndHistory(true)}
            isLoading={isRefreshing}
          />
        ) : null}
      </div>

      {/* Export Modal */}
      {stats ? (
        <BackupExportModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          stats={stats}
          onExportSuccess={handleExportSuccess}
        />
      ) : null}

      {/* Restore Modal */}
      <BackupRestoreModal
        open={restoreModalOpen}
        onOpenChange={setRestoreModalOpen}
        onRestoreSuccess={handleRestoreSuccess}
      />
    </div>
  )
}
