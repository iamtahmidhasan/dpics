import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { DataTransferService } from "@/lib/data-transfer/service"
import type { DataFormat, SupportedEntity } from "@/lib/data-transfer/types"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminApi()
    const searchParams = request.nextUrl.searchParams

    const entity = searchParams.get("entity") as SupportedEntity
    const format = (searchParams.get("format") || "csv").toLowerCase() as DataFormat

    if (!entity) {
      return NextResponse.json({ error: "entity query parameter is required" }, { status: 400 })
    }

    if (format !== "csv" && format !== "json") {
      return NextResponse.json({ error: "format must be 'csv' or 'json'" }, { status: 400 })
    }

    const { filename, contentType, data } = await DataTransferService.exportData(
      entity,
      format,
      { actor: session.user }
    )

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
