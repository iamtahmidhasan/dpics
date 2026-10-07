import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { EmailService } from "@/lib/services/email.service"
import { EmailCategory } from "@/generated/prisma/enums"

export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()

    const { searchParams } = new URL(request.url)
    const categoryParam = searchParams.get("category") as EmailCategory | null

    const templates = await EmailService.listTemplates(categoryParam || undefined)

    return NextResponse.json({ templates })
  } catch (error) {
    return toErrorResponse(error)
  }
}
