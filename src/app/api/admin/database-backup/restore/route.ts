import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { DatabaseBackupService } from "@/lib/database-backup/service"
import type { BackupFormat } from "@/lib/database-backup/types"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminApi()
    const contentType = request.headers.get("content-type") || ""

    let format: BackupFormat = "json"
    let content = ""
    let confirmation = ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      confirmation = String(formData.get("confirmation") || "").trim()

      const file = formData.get("file") as File | null
      if (!file) {
        return NextResponse.json({ error: "No backup file uploaded" }, { status: 400 })
      }

      const fileName = file.name.toLowerCase()
      format = fileName.endsWith(".sql") ? "sql" : "json"
      content = await file.text()
    } else {
      const body = await request.json()
      confirmation = String(body.confirmation || "").trim()
      format = body.format === "sql" ? "sql" : "json"
      content = body.content || ""
    }

    if (confirmation !== "RESTORE") {
      return NextResponse.json(
        { error: 'Confirmation failed. You must type "RESTORE" to proceed with database restoration.' },
        { status: 400 }
      )
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Backup content cannot be empty" }, { status: 400 })
    }

    const result = await DatabaseBackupService.restoreBackup(content, format, session.user)
    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}
