"use client"

import * as React from "react"
import {
  ArrowDownUp,
  Award,
  Calendar,
  CreditCard,
  Download,
  FileText,
  FolderGit2,
  FolderTree,
  GraduationCap,
  Image as ImageIcon,
  Mail,
  Search,
  Ticket,
  Trophy,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"
import { ENTITY_REGISTRY } from "@/lib/data-transfer/registry"
import type { DataFormat, SupportedEntity } from "@/lib/data-transfer/types"
import { ExportModal } from "./export-modal"
import { ImportModal } from "./import-modal"

const ENTITY_ICONS: Record<SupportedEntity, LucideIcon> = {
  users: Users,
  events: Calendar,
  tickets: Ticket,
  courses: GraduationCap,
  enrollments: CreditCard,
  committees: Award,
  achievements: Trophy,
  posts: FileText,
  projects: FolderGit2,
  category: FolderTree,
  media: ImageIcon,
  templates: FolderTree,
  emails: Mail,
}

interface DataTransferHubProps {
  initialCounts: Record<SupportedEntity, number>
}

export function DataTransferHub({ initialCounts }: DataTransferHubProps) {
  const { t } = useLanguage()

  const [search, setSearch] = React.useState("")
  const [selectedEntityForExport, setSelectedEntityForExport] = React.useState<SupportedEntity | null>(null)
  const [selectedEntityForImport, setSelectedEntityForImport] = React.useState<SupportedEntity | null>(null)

  const entityKeys = Object.keys(ENTITY_REGISTRY) as SupportedEntity[]

  const filteredEntities = entityKeys.filter((key) => {
    const meta = ENTITY_REGISTRY[key]
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      meta.label.en.toLowerCase().includes(q) ||
      meta.label.bn.toLowerCase().includes(q) ||
      meta.description.en.toLowerCase().includes(q) ||
      key.includes(q)
    )
  })

  const handleDownloadTemplate = (entity: SupportedEntity, format: DataFormat) => {
    window.open(`/api/admin/data-transfer/template?entity=${entity}&format=${format}`, "_blank")
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
              {t("Data Management & Transfer Hub", "ডাটা ব্যাকআপ, ইমপোর্ট ও এক্সপোর্ট হাব")}
            </h1>
            <Badge variant="outline" className="text-xs font-semibold">
              13 {t("Modules", "মডিউল")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              "Backup, export to CSV/JSON, or bulk import data across the entire society platform.",
              "প্ল্যাটফর্মের সকল ডাটা সিএসভি বা জেএসন ফরম্যাটে এক্সপোর্ট ও বাল্ক ইমপোর্ট করুন।"
            )}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder={t("Filter modules...", "মডিউল অনুসন্ধান...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-8 bg-card"
          />
        </div>
      </div>

      {/* Grid of 13 Entity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntities.map((key) => {
          const meta = ENTITY_REGISTRY[key]
          const Icon = ENTITY_ICONS[key] || ArrowDownUp
          const count = initialCounts[key] ?? 0

          return (
            <Card
              key={key}
              className="flex flex-col justify-between border-border/80 bg-card hover:border-primary/40 transition-all shadow-xs"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        {t(meta.label.en, meta.label.bn)}
                      </CardTitle>
                      <span className="text-[10px] text-muted-foreground block">
                        {key} • {t("Identifier", "আইডেন্টিফায়ার")}: <span className="font-mono text-foreground font-medium">{meta.uniqueKey}</span>
                      </span>
                    </div>
                  </div>

                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-foreground tabular-nums">
                    {count.toLocaleString()}
                  </span>
                </div>

                <CardDescription className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                  {t(meta.description.en, meta.description.bn)}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 pt-3 border-t bg-muted/10 space-y-2.5">
                {/* Actions row */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEntityForExport(key)}
                    className="gap-1.5 text-xs font-medium w-full justify-center"
                  >
                    <Download className="size-3 text-muted-foreground" />
                    <span>{t("Export", "এক্সপোর্ট")}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEntityForImport(key)}
                    className="gap-1.5 text-xs font-medium w-full justify-center bg-background"
                  >
                    <Upload className="size-3 text-muted-foreground" />
                    <span>{t("Import", "ইমপোর্ট")}</span>
                  </Button>
                </div>

                {/* Templates & quick links */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span className="font-medium text-[10px] uppercase tracking-wider text-muted-foreground/80">
                    {t("Templates", "টেমপ্লেট")}:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate(key, "csv")}
                      className="hover:text-primary transition-colors hover:underline text-[11px]"
                    >
                      .CSV
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate(key, "json")}
                      className="hover:text-primary transition-colors hover:underline text-[11px]"
                    >
                      .JSON
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modals */}
      {selectedEntityForExport && (
        <ExportModal
          entity={selectedEntityForExport}
          open={!!selectedEntityForExport}
          onOpenChange={(open) => !open && setSelectedEntityForExport(null)}
        />
      )}

      {selectedEntityForImport && (
        <ImportModal
          entity={selectedEntityForImport}
          open={!!selectedEntityForImport}
          onOpenChange={(open) => !open && setSelectedEntityForImport(null)}
          onImportComplete={() => window.location.reload()}
        />
      )}
    </div>
  )
}
