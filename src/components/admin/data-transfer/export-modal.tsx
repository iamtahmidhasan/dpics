"use client"

import * as React from "react"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLanguage } from "@/components/language-provider"
import { ENTITY_REGISTRY } from "@/lib/data-transfer/registry"
import type { DataFormat, SupportedEntity } from "@/lib/data-transfer/types"

interface ExportModalProps {
  entity: SupportedEntity
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportModal({ entity, open, onOpenChange }: ExportModalProps) {
  const { t } = useLanguage()
  const meta = ENTITY_REGISTRY[entity]

  const [format, setFormat] = React.useState<DataFormat>("csv")
  const [downloading, setDownloading] = React.useState(false)

  const handleDownload = async () => {
    try {
      setDownloading(true)
      const res = await fetch(`/api/admin/data-transfer/export?entity=${entity}&format=${format}`)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || err.error || "Failed to generate export file")
      }

      // Read filename from Content-Disposition header if present
      const disposition = res.headers.get("content-disposition")
      let filename = `${entity}_export_${new Date().toISOString().slice(0, 10)}.${format}`
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/)
        if (match && match[1]) filename = match[1]
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast.success(
        t(
          `Export downloaded: ${filename}`,
          `এক্সপোর্ট ফাইল ডাউনলোড সম্পন্ন: ${filename}`
        )
      )
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Export failed")
    } finally {
      setDownloading(false)
    }
  }

  const label = meta ? meta.label.en : entity
  const labelBn = meta ? meta.label.bn : entity

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Download className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {t(`Export ${label}`, `${labelBn} এক্সপোর্ট করুন`)}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {meta ? t(meta.description.en, meta.description.bn) : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              {t("Choose Export Format", "এক্সপোর্ট ফরম্যাট নির্বাচন করুন")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all ${
                  format === "csv"
                    ? "border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary/30"
                    : "border-border hover:border-border/80 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <FileSpreadsheet className="size-4 text-emerald-600" />
                  <span>CSV (Excel)</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {t(
                    "UTF-8 BOM encoded. Best for Excel, Google Sheets and tables.",
                    "এক্সেল এবং স্প্রেডশিটে সহজে দেখার জন্য সেরা।"
                  )}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormat("json")}
                className={`flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all ${
                  format === "json"
                    ? "border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary/30"
                    : "border-border hover:border-border/80 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <FileText className="size-4 text-indigo-600" />
                  <span>JSON (Raw)</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {t(
                    "Structured JSON payload with complete data relations.",
                    "ডেভেলপার ব্যাকআপ ও সম্পূর্ণ ডাটা স্ট্রাকচারের জন্য।"
                  )}
                </p>
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground">
              {t("Included Fields", "অন্তর্ভুক্ত ফিল্ডসমূহ")}:
            </div>
            <div className="text-[11px] leading-relaxed text-muted-foreground line-clamp-3">
              {meta ? meta.fields.map((f) => f.key).join(", ") : ""}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={downloading}
          >
            {t("Cancel", "বাতিল")}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            className="gap-1.5 font-semibold"
          >
            {downloading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            <span>
              {downloading
                ? t("Generating...", "প্রস্তুত হচ্ছে...")
                : t(`Download ${format.toUpperCase()}`, `${format.toUpperCase()} ডাউনলোড করুন`)}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
