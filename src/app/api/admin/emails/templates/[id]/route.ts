import { NextResponse, type NextRequest } from "next/server"

import { ApiError, toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { EmailService } from "@/lib/services/email.service"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdminApi()
    const { id } = await context.params

    const template = await EmailService.getTemplateById(id)
    if (!template) {
      throw ApiError.notFound("Template not found")
    }

    return NextResponse.json({ template })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdminApi()
    const { id } = await context.params
    const body = await request.json()

    const { subject, bodyHtml, isActive, name, description } = body

    const updated = await EmailService.updateTemplate(id, {
      subject: typeof subject === "string" ? subject.trim() : undefined,
      bodyHtml: typeof bodyHtml === "string" ? bodyHtml.trim() : undefined,
      isActive: typeof isActive === "boolean" ? isActive : undefined,
      name: typeof name === "string" ? name.trim() : undefined,
      description: typeof description === "string" ? description.trim() : undefined,
    })

    return NextResponse.json({ template: updated })
  } catch (error) {
    return toErrorResponse(error)
  }
}
