import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/lib/api-error"
import { requireAdminApi, requireUserApi } from "@/lib/session"
import { createMediaTemplate, listMediaTemplates } from "@/lib/services/media-template.service"
import type { TemplateType } from "@/lib/template-engine/types"

export async function GET(request: NextRequest) {
  try {
    await requireUserApi()

    const { searchParams } = new URL(request.url)
    const type = (searchParams.get("type") as TemplateType) || undefined
    const search = searchParams.get("search") || undefined
    const isActiveOnly = searchParams.get("active") === "true"

    const templates = await listMediaTemplates({
      type,
      search,
      isActiveOnly,
    })

    return NextResponse.json(templates)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminApi()
    const body = await request.json()

    const created = await createMediaTemplate({
      name: body.name,
      description: body.description,
      type: body.type,
      mediaId: body.mediaId,
      width: body.width,
      height: body.height,
      design: body.design,
      userId: session.user.id,
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
