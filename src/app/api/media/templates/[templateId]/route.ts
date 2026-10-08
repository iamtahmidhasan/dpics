import { NextRequest, NextResponse } from "next/server"
import { ApiError, toErrorResponse } from "@/lib/api-error"
import { requireAdminApi, requireUserApi } from "@/lib/session"
import {
  deleteMediaTemplate,
  getMediaTemplateById,
  updateMediaTemplate,
} from "@/lib/services/media-template.service"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    await requireUserApi()
    const { templateId } = await params

    const template = await getMediaTemplateById(templateId)
    if (!template) {
      throw ApiError.notFound("Template not found")
    }

    return NextResponse.json(template)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    await requireAdminApi()
    const { templateId } = await params
    const body = await request.json()

    const updated = await updateMediaTemplate(templateId, {
      name: body.name,
      description: body.description,
      type: body.type,
      mediaId: body.mediaId,
      width: body.width,
      height: body.height,
      design: body.design,
      isActive: body.isActive,
    })

    return NextResponse.json(updated)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    await requireAdminApi()
    const { templateId } = await params

    await deleteMediaTemplate(templateId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return toErrorResponse(error)
  }
}
