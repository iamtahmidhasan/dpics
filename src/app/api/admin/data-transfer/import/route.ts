import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { DataTransferService } from "@/lib/data-transfer/service"
import type { DataFormat, ImportMode, SupportedEntity } from "@/lib/data-transfer/types"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminApi()
    const contentType = request.headers.get("content-type") || ""

    let entity: SupportedEntity
    let format: DataFormat = "csv"
    let mode: ImportMode = "upsert"
    let dryRun = false
    let content = ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      entity = formData.get("entity") as SupportedEntity
      mode = (formData.get("mode") as ImportMode) || "upsert"
      dryRun = formData.get("dryRun") === "true"

      const file = formData.get("file") as File | null
      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
      }

      const fileName = file.name.toLowerCase()
      if (fileName.endsWith(".json")) {
        format = "json"
      } else {
        format = "csv"
      }

      content = await file.text()
    } else {
      const body = await request.json()
      entity = body.entity
      format = body.format || "csv"
      mode = body.mode || "upsert"
      dryRun = !!body.dryRun
      content = body.content || ""
    }

    if (!entity) {
      return NextResponse.json({ error: "entity is required" }, { status: 400 })
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Import content cannot be empty" }, { status: 400 })
    }

    const result = await DataTransferService.importData(entity, format, content, {
      mode,
      dryRun,
      actor: session.user,
    })

    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}
