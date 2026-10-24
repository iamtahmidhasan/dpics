import { NextResponse } from "next/server"
import { toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { DatabaseBackupService } from "@/lib/database-backup/service"

export async function GET() {
  try {
    await requireAdminApi()
    const [stats, history] = await Promise.all([
      DatabaseBackupService.getDatabaseStats(),
      DatabaseBackupService.getBackupHistory(),
    ])

    return NextResponse.json({ stats, history })
  } catch (error) {
    return toErrorResponse(error)
  }
}
