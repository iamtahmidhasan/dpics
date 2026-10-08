import { NextRequest, NextResponse } from "next/server"
import { ApiError, toErrorResponse } from "@/lib/api-error"
import { requireAdmin } from "@/lib/session"
import { countMatchingUsers } from "@/lib/services/media-template-assignment.service"
import type { BulkAssignCriteria } from "@/lib/template-engine/types"

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { criteria } = body

    if (!criteria || typeof criteria !== "object") {
      throw ApiError.badRequest("criteria object is required")
    }

    const data = await countMatchingUsers(criteria as BulkAssignCriteria)
    return NextResponse.json(data)
  } catch (error) {
    return toErrorResponse(error)
  }
}
