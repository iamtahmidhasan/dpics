import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { DatabaseBackupService } from "@/lib/database-backup/service"
import type { BackupFormat } from "@/lib/database-backup/types"

export async function POST(request: NextRequest) {
  try {
    await requireAdminApi()
    const contentType = request.headers.get("content-type") || ""

    let format: BackupFormat = "json"
    let content = ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const file = formData.get("file") as File | null
      if (!file) {
        return NextResponse.json({ error: "No backup file uploaded" }, { status: 400 })
      }

      const fileName = file.name.toLowerCase()
      format = fileName.endsWith(".sql") ? "sql" : "json"
      content = await file.text()
    } else {
      const body = await request.json()
      format = body.format === "sql" ? "sql" : "json"
      content = body.content || ""
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Backup content cannot be empty" }, { status: 400 })
    }

    const validation = await DatabaseBackupService.validateBackup(content, format)
    return NextResponse.json(validation)
  } catch (error) {
    return toErrorResponse(error)
  }
}
