"use client"

import * as React from "react"
import {
  AlertTriangle,
  CheckCircle2,
  FileCode,
  FileJson,
  Loader2,
  RotateCcw,
  Upload,
  X,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLanguage } from "@/components/language-provider"
import type {
  BackupFormat,
  RestoreExecutionResult,
  RestoreValidationResult,
} from "@/lib/database-backup/types"

interface BackupRestoreModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRestoreSuccess?: () => void
}

export function BackupRestoreModal({
  open,
  onOpenChange,
  onRestoreSuccess,
}: BackupRestoreModalProps) {
  const { t } = useLanguage()

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [file, setFile] = React.useState<File | null>(null)
  const [fileContent, setFileContent] = React.useState<string>("")
  const [format, setFormat] = React.useState<BackupFormat>("json")

  const [isValidating, setIsValidating] = React.useState(false)
  const [validationResult, setValidationResult] = React.useState<RestoreValidationResult | null>(null)

  const [confirmationInput, setConfirmationInput] = React.useState("")
  const [isRestoring, setIsRestoring] = React.useState(false)
  const [restoreResult, setRestoreResult] = React.useState<RestoreExecutionResult | null>(null)

  const resetState = () => {
    setFile(null)
    setFileContent("")
    setFormat("json")
    setIsValidating(false)
    setValidationResult(null)
    setConfirmationInput("")
    setIsRestoring(false)
    setRestoreResult(null)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetState()
    }
    onOpenChange(isOpen)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setValidationResult(null)
    setRestoreResult(null)
    setConfirmationInput("")

    const isSql = selected.name.toLowerCase().endsWith(".sql")
    const detectedFormat: BackupFormat = isSql ? "sql" : "json"
    setFormat(detectedFormat)

    try {
      setIsValidating(true)
      const text = await selected.text()
      setFileContent(text)

      // Call validation API
      const res = await fetch("/api/admin/database-backup/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: detectedFormat,
          content: text,
        }),
      })

      const data: RestoreValidationResult = await res.json()
      if (!res.ok) {
        throw new Error((data as unknown as { error?: string })?.error || "Validation failed")
      }

      setValidationResult(data)
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : t("Failed to validate backup file", "ব্যাকআপ ফাইল যাচাইকরণ ব্যর্থ হয়েছে")
      )
      setValidationResult(null)
    } finally {
      setIsValidating(false)
    }
  }

  const handleRestoreSubmit = async () => {
    if (confirmationInput !== "RESTORE") {
      toast.error(t('Please type "RESTORE" to confirm', 'নিশ্চিত করতে "RESTORE" টাইপ করুন'))
      return
    }

    try {
      setIsRestoring(true)

      const res = await fetch("/api/admin/database-backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: confirmationInput,
          format,
          content: fileContent,
        }),
      })

      const data: RestoreExecutionResult = await res.json()

      if (!res.ok) {
        throw new Error((data as unknown as { error?: string })?.error || "Database restoration failed")
      }

      setRestoreResult(data)
      toast.success(
        t(
          `Database restored successfully: ${data.recordsRestoredCount} records across ${data.tablesRestoredCount} tables`,
          `ডাটাবেজ সফলভাবে রিস্টোর হয়েছে: ${data.recordsRestoredCount} রেকর্ড, ${data.tablesRestoredCount} টি টেবিল`
        )
      )

      onRestoreSuccess?.()
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : t("Restoration failed", "রিস্টোর ব্যর্থ হয়েছে")
      )
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-border/80 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b border-border/60 bg-muted/20 shrink-0">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <RotateCcw className="size-5 text-amber-600 dark:text-amber-400" />
            <span>{t("Restore Database Snapshot", "ডাটাবেজ ব্যাকআপ রিস্টোর")}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t(
              "Inspect, validate and restore the entire PostgreSQL database from a previously exported .json or .sql backup.",
              "পূর্বে ডাউনলোড করা .json বা .sql ব্যাকআপ ফাইল থেকে ডাটাবেজ পূর্ণাঙ্গ রিস্টোর করুন।"
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          {/* File Upload Dropzone */}
          {!file && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-muted/30 transition-all rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center gap-2.5"
            >
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Upload className="size-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t("Click to upload backup file", "ব্যাকআপ ফাইল নির্বাচন করুন")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("Supports structured .json archives or .sql dumps (up to 50MB)", ".json বা .sql ফরম্যাট (সর্বোচ্চ ৫০ মেগাবাইট)")}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.sql"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Selected File Card */}
          {file && (
            <div className="p-3.5 rounded-lg border border-border/70 bg-card/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {format === "json" ? (
                    <FileJson className="size-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <FileCode className="size-5 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold font-mono text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB • {format.toUpperCase()}
                  </p>
                </div>
              </div>

              {!isRestoring && !restoreResult && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          )}

          {/* Validation In Progress */}
          {isValidating && (
            <div className="p-8 text-center space-y-2">
              <Loader2 className="size-6 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">
                {t("Parsing and validating database snapshot...", "ডাটাবেজ স্ন্যাপশট যাচাই করা হচ্ছে...")}
              </p>
            </div>
          )}

          {/* Validation Results & Pre-flight Inspection */}
          {validationResult && !restoreResult && (
            <div className="space-y-4">
              {/* Warnings / Errors */}
              {validationResult.errors.length > 0 && (
                <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <XCircle className="size-4 shrink-0" />
                    <span>{t("Validation Errors", "যাচাইকরণ ত্রুটি")}</span>
                  </div>
                  {validationResult.errors.map((err, idx) => (
                    <p key={idx} className="pl-6">{err}</p>
                  ))}
                </div>
              )}

              {validationResult.warnings.length > 0 && (
                <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>{t("Important Notice", "গুরুত্বপূর্ণ সতর্কতা")}</span>
                  </div>
                  {validationResult.warnings.map((warn, idx) => (
                    <p key={idx} className="pl-6">{warn}</p>
                  ))}
                </div>
              )}

              {/* Pre-Flight Table Comparison */}
              <div className="border border-border/70 rounded-lg overflow-hidden bg-card/40">
                <div className="p-3 bg-muted/40 border-b border-border text-xs font-semibold flex items-center justify-between">
                  <span>{t("Pre-Flight Table Comparison", "প্রাক-রিস্টোর টেবিল তুলনা")}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span>{validationResult.totalTablesInBackup} {t("Tables", "টেবিল")}</span>
                    <span>•</span>
                    <span className="text-primary font-bold">{validationResult.totalRecordsInBackup.toLocaleString()} {t("Records", "রেকর্ড")}</span>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto scrollbar-thin text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-muted/20 text-[10px] text-muted-foreground uppercase font-semibold border-b border-border/50">
                      <tr>
                        <th className="py-2 px-3">{t("Table", "টেবিল")}</th>
                        <th className="py-2 px-3 text-right">{t("Current DB", "বর্তমান ডাটাবেজ")}</th>
                        <th className="py-2 px-3 text-right">{t("Backup File", "ব্যাকআপ ফাইল")}</th>
                        <th className="py-2 px-3 text-right">{t("Net Change", "পরিবর্তন")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                      {validationResult.comparisons.map((c) => (
                        <tr key={c.tableName} className="hover:bg-muted/20">
                          <td className="py-1.5 px-3 font-medium text-foreground">
                            <code>{c.tableName}</code>
                          </td>
                          <td className="py-1.5 px-3 text-right text-muted-foreground">{c.currentDbRows}</td>
                          <td className="py-1.5 px-3 text-right font-semibold text-foreground">{c.backupRows}</td>
                          <td className="py-1.5 px-3 text-right">
                            {c.diff > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">+{c.diff}</span>
                            ) : c.diff < 0 ? (
                              <span className="text-rose-600 dark:text-rose-400">{c.diff}</span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Destructive Warning Box */}
              <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>{t("Caution: Irreversible Action", "সতর্কতা: অপরিবর্তনীয় পদক্ষেপ")}</span>
                </div>
                <p className="leading-relaxed">
                  {t(
                    "Restoring will wipe current live records and replace them completely with the contents of this backup file inside an atomic transaction. This action cannot be undone.",
                    "রিস্টোর করলে বর্তমান ডাটাবেজের সকল রেকর্ড মুছে এই ব্যাকআপের ডেটা দিয়ে প্রতিস্থাপিত হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।"
                  )}
                </p>
                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-foreground mb-1.5">
                    {t('To confirm, type "RESTORE" below:', 'নিশ্চিত করতে নিচে "RESTORE" টাইপ করুন:')}
                  </label>
                  <Input
                    type="text"
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value.trim().toUpperCase())}
                    placeholder="RESTORE"
                    className="h-8 font-mono tracking-widest text-center text-xs bg-background max-w-[200px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Restore Success Summary */}
          {restoreResult && (
            <div className="p-6 text-center space-y-4">
              <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto w-fit">
                <CheckCircle2 className="size-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  {t("Database Successfully Restored", "ডাটাবেজ সফলভাবে রিস্টোর হয়েছে")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t(
                    `Restored ${restoreResult.recordsRestoredCount} records across ${restoreResult.tablesRestoredCount} tables in ${restoreResult.durationMs}ms`,
                    `${restoreResult.recordsRestoredCount} টি রেকর্ড এবং ${restoreResult.tablesRestoredCount} টি টেবিল সফলভাবে হালনাগাদ করা হয়েছে (${restoreResult.durationMs}ms)`
                  )}
                </p>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg text-xs font-mono text-muted-foreground max-w-sm mx-auto">
                {t("Status: 100% Complete (Atomic Transaction)", "স্ট্যাটাস: ১০০% সম্পন্ন (অ্যাটোমিক ট্রানজেকশন)")}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 bg-muted/20 border-t border-border/60 flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isRestoring}
            className="text-xs"
          >
            {restoreResult ? t("Close", "বন্ধ করুন") : t("Cancel", "বাতিল")}
          </Button>

          {validationResult && !restoreResult && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRestoreSubmit}
              disabled={isRestoring || confirmationInput !== "RESTORE" || !validationResult.valid}
              className="gap-2 text-xs font-semibold shadow-xs"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>{t("Restoring Database...", "ডাটাবেজ রিস্টোর হচ্ছে...")}</span>
                </>
              ) : (
                <>
                  <RotateCcw className="size-3.5" />
                  <span>{t("Execute Database Restore", "ডাটাবেজ রিস্টোর সম্পন্ন করুন")}</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
