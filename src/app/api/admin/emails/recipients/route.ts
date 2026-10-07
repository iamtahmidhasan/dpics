import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { EmailService, type BulkAudienceFilter } from "@/lib/services/email.service"

export async function POST(request: NextRequest) {
  try {
    await requireAdminApi()
    const body = await request.json()

    const filters: BulkAudienceFilter = body.filters || {}
    const limit = typeof body.limit === "number" ? body.limit : 50

    const { total, sample } = await EmailService.getRecipientAudience(filters, limit)

    return NextResponse.json({ total, sample })
  } catch (error) {
    return toErrorResponse(error)
  }
}
