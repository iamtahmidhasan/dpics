"use client"

import * as React from "react"
import { Download, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import type { SupportedEntity } from "@/lib/data-transfer/types"
import { ExportModal } from "./export-modal"
import { ImportModal } from "./import-modal"

interface ExportImportMenuProps {
  entity: SupportedEntity
  onImportComplete?: () => void
  size?: "xs" | "sm" | "default"
  className?: string
  showLabels?: boolean
}

export function ExportImportMenu({
  entity,
  onImportComplete,
  size = "sm",
  className = "",
  showLabels = true,
}: ExportImportMenuProps) {
  const { t } = useLanguage()

  const [exportOpen, setExportOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Export Button */}
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={() => setExportOpen(true)}
        className="gap-1.5 text-xs h-8"
        title={t("Export data to CSV or JSON", "সিএসভি বা জেএসনে এক্সপোর্ট করুন")}
      >
        <Download className="size-3.5 text-muted-foreground" />
        {showLabels && <span>{t("Export", "এক্সপোর্ট")}</span>}
      </Button>

      {/* Import Button */}
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={() => setImportOpen(true)}
        className="gap-1.5 text-xs h-8"
        title={t("Import data from CSV or JSON", "সিএসভি বা জেএসন থেকে ইমপোর্ট করুন")}
      >
        <Upload className="size-3.5 text-muted-foreground" />
        {showLabels && <span>{t("Import", "ইমপোর্ট")}</span>}
      </Button>

      {/* Modals */}
      <ExportModal
        entity={entity}
        open={exportOpen}
        onOpenChange={setExportOpen}
      />

      <ImportModal
        entity={entity}
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportComplete={onImportComplete}
      />
    </div>
  )
}
