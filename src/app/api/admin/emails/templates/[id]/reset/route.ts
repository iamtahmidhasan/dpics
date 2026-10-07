import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { EmailService } from "@/lib/services/email.service"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdminApi()
    const { id } = await context.params

    const resetTemplate = await EmailService.resetTemplate(id)

    return NextResponse.json({
      success: true,
      template: resetTemplate,
      message: "Template reset to system default successfully",
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
