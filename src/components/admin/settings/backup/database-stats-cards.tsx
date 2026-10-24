"use client"

import { Database, HardDrive, Layers, Server } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import type { DatabaseStats } from "@/lib/database-backup/types"

interface DatabaseStatsCardsProps {
  stats: DatabaseStats
}

export function DatabaseStatsCards({ stats }: DatabaseStatsCardsProps) {
  const { t } = useLanguage()

  const cards = [
    {
      title: t("Database Size", "ডাটাবেজ আকার"),
      value: stats.databaseSizeFormatted,
      description: `${stats.databaseName} (PostgreSQL)`,
      icon: HardDrive,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10 dark:bg-blue-500/15",
    },
    {
      title: t("Total Records", "মোট রেকর্ড"),
      value: stats.totalRecords.toLocaleString(),
      description: t("Across all active tables", "সকল সক্রিয় টেবিলে"),
      icon: Database,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    },
    {
      title: t("Total Tables", "মোট টেবিল"),
      value: stats.totalTables,
      description: t("Public schema tables", "পাবলিক স্কিমা টেবিলসমূহ"),
      icon: Layers,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10 dark:bg-indigo-500/15",
    },
    {
      title: t("Database Engine", "ডাটাবেজ ইঞ্জিন"),
      value: "PostgreSQL 17",
      description: stats.postgresVersion.slice(0, 32),
      icon: Server,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10 dark:bg-purple-500/15",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((c, idx) => {
        const Icon = c.icon
        return (
          <Card key={idx} className="border border-border/70 shadow-none bg-card/60 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {c.title}
                </p>
                <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                  {c.value}
                </p>
                <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                  {c.description}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl ${c.bg} shrink-0`}>
                <Icon className={`size-5 ${c.color}`} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
