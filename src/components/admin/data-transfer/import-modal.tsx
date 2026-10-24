"use client"

import * as React from "react"
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Loader2,
  Upload,
  X,
} from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/components/language-provider"
import { ENTITY_REGISTRY } from "@/lib/data-transfer/registry"
import { parseCsv } from "@/lib/data-transfer/csv-utils"
import type {
  DataFormat,
  ImportMode,
  ImportResult,
  SupportedEntity,
} from "@/lib/data-transfer/types"

interface ImportModalProps {
  entity: SupportedEntity
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: () => void
}

export function ImportModal({
  entity,
  open,
  onOpenChange,
  onImportComplete,
}: ImportModalProps) {
  const { t } = useLanguage()
  const meta = ENTITY_REGISTRY[entity]

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [file, setFile] = React.useState<File | null>(null)
  const [fileContent, setFileContent] = React.useState<string>("")
  const [format, setFormat] = React.useState<DataFormat>("csv")
  const [previewRows, setPreviewRows] = React.useState<Record<string, unknown>[]>([])
  const [totalParsedRows, setTotalParsedRows] = React.useState<number>(0)

  const [mode, setMode] = React.useState<ImportMode>("upsert")
  const [dryRun, setDryRun] = React.useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const [result, setResult] = React.useState<ImportResult | null>(null)

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setFile(null)
      setFileContent("")
      setPreviewRows([])
      setTotalParsedRows(0)
      setResult(null)
      setIsSubmitting(false)
    }
    onOpenChange(isOpen)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setResult(null)

    const isJson = selected.name.toLowerCase().endsWith(".json")
    const detectedFormat: DataFormat = isJson ? "json" : "csv"
    setFormat(detectedFormat)

    try {
      const text = await selected.text()
      setFileContent(text)

      if (detectedFormat === "csv") {
        const parsed = parseCsv(text)
        setTotalParsedRows(parsed.length)
        setPreviewRows(parsed.slice(0, 4))
      } else {
        const parsed = JSON.parse(text)
        const rows = Array.isArray(parsed) ? parsed : parsed.data || []
        setTotalParsedRows(rows.length)
        setPreviewRows(rows.slice(0, 4))
      }
    } catch {
      toast.error(t("Could not parse file structure", "ফাইলের গঠন পড়া সম্ভব হয়নি"))
      setPreviewRows([])
      setTotalParsedRows(0)
    }
  }

  const handleDownloadTemplate = (templateFormat: DataFormat) => {
    window.open(
      `/api/admin/data-transfer/template?entity=${entity}&format=${templateFormat}`,
      "_blank"
    )
  }

  const handleSubmit = async () => {
    if (!fileContent.trim()) {
      toast.error(t("Please select a file to import", "অনুগ্রহ করে একটি ফাইল নির্বাচন করুন"))
      return
    }

    try {
      setIsSubmitting(true)
      setResult(null)

      const res = await fetch("/api/admin/data-transfer/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity,
          format,
          mode,
          dryRun,
          content: fileContent,
        }),
      })

      const data: ImportResult = await res.json()

      if (!res.ok) {
        throw new Error((data as unknown as { message?: string })?.message || "Import request failed")
      }

      setResult(data)

      if (data.success && !dryRun) {
        toast.success(
          t(
            `Import complete: ${data.created} created, ${data.updated} updated`,
            `ইমপোর্ট সফল: ${data.created} তৈরি, ${data.updated} আপডেট`
          )
        )
        onImportComplete?.()
      } else if (dryRun) {
        toast.info(
          t(
            `Dry run validated: ${data.created + data.updated} valid records, ${data.failed} errors`,
            `যাচাইকরণ সম্পন্ন: ${data.created + data.updated} টি সঠিক, ${data.failed} টি ত্রুটি`
          )
        )
      } else {
        toast.error(
          t(
            `Import encountered ${data.failed} errors`,
            `ইমপোর্টে ${data.failed} টি ত্রুটি পাওয়া গেছে`
          )
        )
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Import failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const label = meta ? meta.label.en : entity
  const labelBn = meta ? meta.label.bn : entity

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Upload className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  {t(`Import ${label}`, `${labelBn} ইমপোর্ট করুন`)}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {t(
                    `Upload a .csv or .json file to batch insert or update ${label.toLowerCase()}.`,
                    `বাল্ক ইনসার্ট বা আপডেট করার জন্য .csv বা .json ফাইল আপলোড করুন।`
                  )}
                </DialogDescription>
              </div>
            </div>

            {/* Template download shortcuts */}
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => handleDownloadTemplate("csv")}
                className="gap-1 text-[11px]"
                title={t("Download CSV Template", "সিএসভি টেমপ্লেট ডাউনলোড")}
              >
                <FileSpreadsheet className="size-3 text-emerald-600" />
                <span>CSV Template</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => handleDownloadTemplate("json")}
                className="gap-1 text-[11px]"
                title={t("Download JSON Template", "জেএসন টেমপ্লেট ডাউনলোড")}
              >
                <FileText className="size-3 text-indigo-600" />
                <span>JSON</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File Upload Zone */}
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/80 bg-muted/20 p-6 text-center cursor-pointer hover:border-primary/60 hover:bg-muted/40 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,text/csv,application/json"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex size-11 items-center justify-center rounded-full bg-background shadow-xs border">
                <Upload className="size-5 text-primary" />
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground">
                  {t("Click to upload", "আপলোড করতে ক্লিক করুন")}
                </span>{" "}
                <span className="text-xs text-muted-foreground">
                  {t("or drag and drop", "অথবা ফাইল ড্র্যাগ করুন")}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t("Supported formats: .CSV (Excel compatible), .JSON", "সমর্থিত ফরম্যাট: .CSV এবং .JSON")}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-3 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    {format === "csv" ? (
                      <FileSpreadsheet className="size-4 text-emerald-600" />
                    ) : (
                      <FileText className="size-4 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <span>{file.name}</span>
                      <Badge variant="outline" className="text-[10px] uppercase h-4 px-1.5">
                        {format}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB • {totalParsedRows} {t("records found", "টি রেকর্ড পাওয়া গেছে")}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    setFile(null)
                    setFileContent("")
                    setPreviewRows([])
                    setResult(null)
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3.5" />
                </Button>
              </div>

              {/* Data Preview Table */}
              {previewRows.length > 0 && (
                <div className="space-y-1.5 border-t pt-2.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>{t("Data Preview (First 4 rows)", "ডাটা প্রিভিউ (প্রথম ৪ সারি)")}</span>
                    <span className="text-[10px] text-muted-foreground/80">
                      {meta?.uniqueKey ? `${t("Matcher key", "শনাক্তকারী ফিল্ড")}: ${meta.uniqueKey}` : ""}
                    </span>
                  </div>
                  <div className="rounded-lg border overflow-x-auto max-h-36 bg-background">
                    <table className="w-full text-[10px] text-left">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          {Object.keys(previewRows[0] || {}).slice(0, 6).map((key) => (
                            <th key={key} className="p-1.5 font-semibold text-foreground whitespace-nowrap">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {previewRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            {Object.keys(previewRows[0] || {}).slice(0, 6).map((key) => (
                              <td key={key} className="p-1.5 whitespace-nowrap max-w-[120px] truncate">
                                {String(row[key] ?? "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Options: Mode & Dry Run */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground block">
                {t("Import Strategy", "ইমপোর্ট কৌশল")}
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMode("upsert")}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    mode === "upsert"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-background border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {t("Upsert (Update & Insert)", "আপসার্ট (আপডেট ও নতুন)")}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("create_only")}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    mode === "create_only"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-background border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {t("Insert Only (Skip duplicates)", "শুধুমাত্র নতুন")}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 sm:border-l sm:pl-3">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold text-foreground cursor-pointer" htmlFor="dry-run-switch">
                  {t("Dry Run / Test Validation", "ড্রাই রান / টেস্ট যাচাই")}
                </label>
                <p className="text-[10px] text-muted-foreground">
                  {t("Validate data without writing to database", "ডাটাবেজে পরিবর্তন না করে পরীক্ষা করুন")}
                </p>
              </div>
              <Switch
                id="dry-run-switch"
                checked={dryRun}
                onCheckedChange={setDryRun}
              />
            </div>
          </div>

          {/* Import Results Box */}
          {result && (
            <div
              className={`rounded-xl border p-3.5 space-y-2.5 transition-all ${
                result.success
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-destructive/40 bg-destructive/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="size-4 text-destructive" />
                  )}
                  <span className="text-xs font-bold text-foreground">
                    {result.dryRun
                      ? t("Validation Test Results", "যাচাইকরণ ফলাফল")
                      : t("Import Processing Summary", "ইমপোর্ট ফলাফল সারসংক্ষেপ")}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <Badge variant="success" className="h-5 px-1.5 font-bold">
                    +{result.created} {t("created", "নতুন")}
                  </Badge>
                  <Badge variant="default" className="h-5 px-1.5 font-bold">
                    {result.updated} {t("updated", "আপডেট")}
                  </Badge>
                  {result.skipped > 0 && (
                    <Badge variant="muted" className="h-5 px-1.5">
                      {result.skipped} {t("skipped", "বাদ")}
                    </Badge>
                  )}
                  {result.failed > 0 && (
                    <Badge variant="destructive" className="h-5 px-1.5 font-bold">
                      {result.failed} {t("errors", "ত্রুটি")}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Row error breakdown */}
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-destructive">
                    {t("Issue Details:", "ত্রুটির বিবরণ:")}
                  </div>
                  <div className="rounded-lg border border-destructive/20 bg-background max-h-36 overflow-y-auto divide-y divide-border/60 text-[11px]">
                    {result.errors.map((err, idx) => (
                      <div key={idx} className="p-2 flex items-start gap-2">
                        <span className="font-mono text-xs font-bold text-destructive shrink-0">
                          Row {err.row}:
                        </span>
                        <div className="flex-1 text-muted-foreground">
                          {err.identifier && (
                            <span className="font-semibold text-foreground mr-1">
                              [{err.identifier}]
                            </span>
                          )}
                          <span>{err.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {result?.success && !dryRun ? t("Close", "বন্ধ করুন") : t("Cancel", "বাতিল")}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !file}
            className={`gap-1.5 font-semibold ${
              dryRun ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : dryRun ? (
              <HelpCircle className="size-3.5" />
            ) : (
              <Upload className="size-3.5" />
            )}
            <span>
              {isSubmitting
                ? t("Processing...", "প্রক্রিয়াধীন...")
                : dryRun
                ? t("Run Test Validation", "টেস্ট যাচাই করুন")
                : t(`Import ${totalParsedRows > 0 ? `(${totalParsedRows})` : ""}`, `ইমপোর্ট শুরু করুন`)}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
