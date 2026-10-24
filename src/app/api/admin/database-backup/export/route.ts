import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { DatabaseBackupService } from "@/lib/database-backup/service"
import type { BackupFormat } from "@/lib/database-backup/types"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminApi()
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get("format") || "json").toLowerCase() as BackupFormat

    if (format !== "json" && format !== "sql") {
      return NextResponse.json({ error: "Invalid format. Supported: json, sql" }, { status: 400 })
    }

    const { filename, contentType, data } = await DatabaseBackupService.exportBackup(format, session.user)

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
