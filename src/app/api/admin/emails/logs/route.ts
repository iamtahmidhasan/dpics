import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { EmailService } from "@/lib/services/email.service"
import { EmailCategory, EmailLogStatus } from "@/generated/prisma/enums"

export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()

    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") ? Number.parseInt(searchParams.get("page")!, 10) : 1
    const pageSize = searchParams.get("pageSize")
      ? Number.parseInt(searchParams.get("pageSize")!, 10)
      : 25
    const status = (searchParams.get("status") as EmailLogStatus) || undefined
    const category = (searchParams.get("category") as EmailCategory) || undefined
    const search = searchParams.get("search") || undefined

    const data = await EmailService.listLogs({
      page,
      pageSize,
      status,
      category,
      search,
    })

    return NextResponse.json(data)
  } catch (error) {
    return toErrorResponse(error)
  }
}
