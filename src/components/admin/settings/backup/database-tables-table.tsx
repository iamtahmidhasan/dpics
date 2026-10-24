"use client"

import * as React from "react"
import { Layers, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import type { TableStatsInfo } from "@/lib/database-backup/types"

interface DatabaseTablesTableProps {
  tables: TableStatsInfo[]
}

const CATEGORY_COLORS: Record<TableStatsInfo["category"], string> = {
  core: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  content: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  lms: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  events: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  media: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
  system: "bg-muted text-muted-foreground border-border",
}

export function DatabaseTablesTable({ tables }: DatabaseTablesTableProps) {
  const { t } = useLanguage()
  const [search, setSearch] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all")

  const categories = [
    { key: "all", label: t("All Tables", "সকল টেবিল") },
    { key: "core", label: t("Core & Users", "মূল ও ব্যবহারকারী") },
    { key: "content", label: t("Content & Posts", "কন্টেন্ট ও পোস্ট") },
    { key: "lms", label: t("LMS & Courses", "কোর্স ও শিক্ষা") },
    { key: "events", label: t("Events & Tickets", "ইভেন্ট ও টিকেট") },
    { key: "media", label: t("Media & Templates", "মিডিয়া ও ডিজাইন") },
    { key: "system", label: t("System & Logs", "সিস্টেম ও লগ") },
  ]

  const filtered = React.useMemo(() => {
    return tables.filter((item) => {
      const matchesSearch = item.tableName.toLowerCase().includes(search.toLowerCase().trim())
      const matchesCat = selectedCategory === "all" || item.category === selectedCategory
      return matchesSearch && matchesCat
    })
  }, [tables, search, selectedCategory])

  const totalFilteredRows = filtered.reduce((acc, curr) => acc + curr.rowCount, 0)

  return (
    <Card className="border border-border/70 shadow-none bg-card/60 backdrop-blur-sm">
      <CardHeader className="p-4 sm:p-5 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <span>{t("Database Schema & Live Table Counts", "ডাটাবেজ স্কিমা ও টেবিল রেকর্ড")}</span>
              <Badge variant="outline" className="font-mono text-xs">
                {tables.length} {t("Tables", "টেবিল")}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              {t(
                "Live row counts and storage utilization across all PostgreSQL public tables.",
                "সকল পোস্টগ্রেসকিউএল টেবিলের বর্তমান রেকর্ড সংখ্যা ও ডিস্ক ব্যবহারের বিবরণ।"
              )}
            </CardDescription>
          </div>

          <div className="w-full sm:w-64">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("Filter tables...", "টেবিল খুঁজুন...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-background/50"
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`text-[11px] px-2.5 py-1 rounded-md transition-all font-medium ${
                selectedCategory === cat.key
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[420px] scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-muted/40 sticky top-0 border-b border-border text-[11px] font-semibold text-muted-foreground">
              <tr>
                <th className="py-2.5 px-4">{t("Table Name", "টেবিলের নাম")}</th>
                <th className="py-2.5 px-3">{t("Category", "ক্যাটাগরি")}</th>
                <th className="py-2.5 px-4 text-right">{t("Live Records", "বর্তমান রেকর্ড")}</th>
                <th className="py-2.5 px-4 text-right">{t("Disk Size", "ডিস্ক আকার")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground text-xs">
                    {t("No matching tables found", "কোনো টেবিল পাওয়া যায়নি")}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.tableName} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-foreground">
                      <code>{item.tableName}</code>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase tracking-wider py-0 px-2 font-mono ${CATEGORY_COLORS[item.category]}`}
                      >
                        {item.category}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold">
                      <span
                        className={
                          item.rowCount > 0
                            ? "text-foreground"
                            : "text-muted-foreground/50 font-normal"
                        }
                      >
                        {item.rowCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">
                      {item.sizeFormatted}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground px-4">
          <span>
            {t("Showing", "প্রদর্শন")} {filtered.length} {t("of", "এর মধ্যে")} {tables.length} {t("tables", "টেবিল")}
          </span>
          <span className="font-mono font-medium text-foreground">
            {t("Total Displayed Records:", "মোট প্রদর্শিত রেকর্ড:")} {totalFilteredRows.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
