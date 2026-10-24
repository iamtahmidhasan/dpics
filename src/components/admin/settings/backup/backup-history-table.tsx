"use client"

import { Clock, Download, RefreshCw, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import type { BackupHistoryItem } from "@/lib/database-backup/types"

interface BackupHistoryTableProps {
  history: BackupHistoryItem[]
  onRefresh?: () => void
  isLoading?: boolean
}

export function BackupHistoryTable({
  history,
  onRefresh,
  isLoading,
}: BackupHistoryTableProps) {
  const { t } = useLanguage()

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return iso
    }
  }

  return (
    <Card className="border border-border/70 shadow-none bg-card/60 backdrop-blur-sm">
      <CardHeader className="p-4 sm:p-5 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <span>{t("Backup & Restore Operation History", "ব্যাকআপ ও রিস্টোর ইতিহাস")}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {t(
                "Audit trail recording all recent database snapshots and restoration actions.",
                "সাম্প্রতিক সকল ডাটাবেজ স্ন্যাপশট ও রিস্টোর অপারেশনের অডিট বিবরণ।"
              )}
            </CardDescription>
          </div>

          {onRefresh ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 gap-1.5 text-xs"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{t("Refresh", "রিফ্রেশ")}</span>
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground">
              <tr>
                <th className="py-2.5 px-4">{t("Date & Time", "তারিখ ও সময়")}</th>
                <th className="py-2.5 px-3">{t("Operation Type", "অপারেশনের ধরন")}</th>
                <th className="py-2.5 px-3">{t("Format", "ফরম্যাট")}</th>
                <th className="py-2.5 px-4 text-right">{t("Records", "রেকর্ড")}</th>
                <th className="py-2.5 px-4 text-right">{t("Size", "আকার")}</th>
                <th className="py-2.5 px-4">{t("Initiated By", "সম্পাদনকারী")}</th>
                <th className="py-2.5 px-4 text-center">{t("Status", "স্ট্যাটাস")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground text-xs">
                    {t("No backup or restore operations recorded yet.", "এখনো কোনো ব্যাকআপ বা রিস্টোর লগ পাওয়া যায়নি।")}
                  </td>
                </tr>
              ) : (
                history.map((item) => {
                  const isExport = item.type === "EXPORT"
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(item.createdAt)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-medium">
                          {isExport ? (
                            <Download className="size-3.5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <RotateCcw className="size-3.5 text-amber-600 dark:text-amber-400" />
                          )}
                          <span>
                            {isExport
                              ? t("Database Backup", "ডাটাবেজ ব্যাকআপ")
                              : t("Database Restore", "ডাটাবেজ রিস্টোর")}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="font-mono text-[10px] uppercase">
                          .{item.format}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-foreground">
                        {item.totalRecords.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                        {item.fileSizeFormatted || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="truncate max-w-[140px]">
                          <span className="font-medium text-foreground">
                            {item.adminName || item.adminEmail || "Admin"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        >
                          {t("Completed", "সম্পন্ন")}
                        </Badge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
