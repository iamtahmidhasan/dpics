"use client"

import * as React from "react"
import { CheckCircle2, Download, FileCode, FileJson, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLanguage } from "@/components/language-provider"
import type { BackupFormat, DatabaseStats } from "@/lib/database-backup/types"

interface BackupExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stats: DatabaseStats
  onExportSuccess?: () => void
}

export function BackupExportModal({
  open,
  onOpenChange,
  stats,
  onExportSuccess,
}: BackupExportModalProps) {
  const { t } = useLanguage()
  const [format, setFormat] = React.useState<BackupFormat>("json")
  const [isExporting, setIsExporting] = React.useState(false)

  const handleDownload = async () => {
    try {
      setIsExporting(true)

      const url = `/api/admin/database-backup/export?format=${format}`
      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to generate database backup")
      }

      const contentDisposition = response.headers.get("Content-Disposition") || ""
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
      const filename = filenameMatch ? filenameMatch[1] : `dpics_backup.${format}`

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)

      toast.success(
        t(
          `Backup downloaded successfully (${stats.totalRecords} records)`,
          `ডাটাবেজ ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে (${stats.totalRecords} টি রেকর্ড)`
        )
      )

      onExportSuccess?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : t("Failed to export backup", "ব্যাকআপ তৈরি ব্যর্থ হয়েছে")
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-border/80 shadow-2xl">
        <DialogHeader className="p-5 pb-4 border-b border-border/60 bg-muted/20">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Download className="size-5 text-primary" />
            <span>{t("Export Full Database Backup", "সম্পূর্ণ ডাটাবেজ ব্যাকআপ তৈরি")}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t(
              "Generate and download a complete, safe snapshot of all 30 PostgreSQL tables, relations, and schemas.",
              "সকল ৩০টি পোস্টগ্রেসকিউএল টেবিল, সম্পর্ক ও স্কিমার পূর্ণাঙ্গ ব্যাকআপ স্ন্যাপশট ডাউনলোড করুন।"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Database Summary Box */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-muted-foreground">{t("Scope: ", "পরিসর: ")}</span>
              <span className="font-semibold text-foreground">{stats.totalTables} {t("Tables", "টেবিল")}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("Records: ", "রেকর্ড: ")}</span>
              <span className="font-semibold text-foreground">{stats.totalRecords.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("Live Size: ", "আকার: ")}</span>
              <span className="font-semibold text-foreground">{stats.databaseSizeFormatted}</span>
            </div>
          </div>

          {/* Format Selection Cards */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              {t("Select Backup Format", "ব্যাকআপ ফরম্যাট নির্বাচন করুন")}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* JSON Option */}
              <button
                type="button"
                onClick={() => setFormat("json")}
                className={`p-3.5 rounded-lg border text-left transition-all relative ${
                  format === "json"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-border/80 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <FileJson className="size-4 text-blue-600 dark:text-blue-400" />
                    <span>JSON Archive</span>
                  </div>
                  {format === "json" && (
                    <CheckCircle2 className="size-4 text-primary" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t(
                    "Recommended. Checksum verified, inspectable pre-flight restore, and manifest metadata.",
                    "সুপারিশকৃত। হ্যাশ যাচাইকৃত, রিস্টোর প্রিভিউ এবং সম্পূর্ণ মেটাডাটা সহ।"
                  )}
                </p>
                <div className="mt-2.5">
                  <Badge variant="outline" className="text-[10px] font-mono py-0">
                    .json
                  </Badge>
                </div>
              </button>

              {/* SQL Option */}
              <button
                type="button"
                onClick={() => setFormat("sql")}
                className={`p-3.5 rounded-lg border text-left transition-all relative ${
                  format === "sql"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-border/80 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <FileCode className="size-4 text-amber-600 dark:text-amber-400" />
                    <span>SQL Script</span>
                  </div>
                  {format === "sql" && (
                    <CheckCircle2 className="size-4 text-primary" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t(
                    "Standard PostgreSQL DDL/DML script. Can be executed directly in psql or Supabase SQL editor.",
                    "স্ট্যান্ডার্ড পোস্টগ্রেসকিউএল স্ক্রিপ্ট। সরাসরি psql বা Supabase এ চালানো যায়।"
                  )}
                </p>
                <div className="mt-2.5">
                  <Badge variant="outline" className="text-[10px] font-mono py-0">
                    .sql
                  </Badge>
                </div>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/20 border-t border-border/60 flex items-center justify-between sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            className="text-xs"
          >
            {t("Cancel", "বাতিল")}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleDownload}
            disabled={isExporting}
            className="gap-2 text-xs shadow-xs"
          >
            {isExporting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>{t("Generating Snapshot...", "স্ন্যাপশট তৈরি হচ্ছে...")}</span>
              </>
            ) : (
              <>
                <Download className="size-3.5" />
                <span>{t(`Download .${format.toUpperCase()}`, `ডাউনলোড .${format.toUpperCase()}`)}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
