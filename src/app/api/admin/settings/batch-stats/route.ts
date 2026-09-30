import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { getBatchMemberStats } from "@/lib/services/member-id.service"
import { requireAdminApi } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()

    const { searchParams } = new URL(request.url)
    const batch = searchParams.get("batch") || undefined
    const prefix = searchParams.get("prefix") || undefined

    const stats = await getBatchMemberStats(batch, prefix)

    return NextResponse.json(stats)
  } catch (error) {
    return toErrorResponse(error)
  }
}
