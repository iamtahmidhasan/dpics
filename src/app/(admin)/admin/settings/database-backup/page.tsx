import type { Metadata } from "next"
import { requireAdmin } from "@/lib/session"
import { DatabaseBackupService } from "@/lib/database-backup/service"
import type { BackupHistoryItem, DatabaseStats } from "@/lib/database-backup/types"
import { AdminDatabaseBackupTab } from "@/components/admin/settings/backup/admin-database-backup-tab"

export const metadata: Metadata = {
  title: "Database Backup & Disaster Recovery - Admin Settings",
}

export default async function AdminDatabaseBackupPage() {
  await requireAdmin()

  let initialStats: DatabaseStats | undefined = undefined
  let initialHistory: BackupHistoryItem[] = []

  try {
    const [stats, history] = await Promise.all([
      DatabaseBackupService.getDatabaseStats(),
      DatabaseBackupService.getBackupHistory(25),
    ])
    initialStats = stats
    initialHistory = history
  } catch (error) {
    console.error("Failed to prefetch database backup statistics:", error)
  }

  return (
    <AdminDatabaseBackupTab
      initialStats={initialStats}
      initialHistory={initialHistory}
    />
  )
}
