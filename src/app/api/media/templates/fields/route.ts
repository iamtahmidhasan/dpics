import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { getFieldsForTemplateType } from "@/lib/template-engine/fields"
import type { TemplateType } from "@/lib/template-engine/types"

export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()

    const { searchParams } = new URL(request.url)
    const type = (searchParams.get("type") as TemplateType) || "MEMBER_CARD"

    const fields = getFieldsForTemplateType(type)

    return NextResponse.json(fields)
  } catch (error) {
    return toErrorResponse(error)
  }
}
