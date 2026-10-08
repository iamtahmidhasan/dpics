import { NextRequest, NextResponse } from "next/server"
import { ApiError, toErrorResponse } from "@/lib/api-error"
import { requireAdmin } from "@/lib/session"
import {
  assignTemplateToUsers,
  bulkAssignTemplateByCriteria,
  listTemplateAssignments,
} from "@/lib/services/media-template-assignment.service"
import type { BulkAssignCriteria } from "@/lib/template-engine/types"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("templateId")
    const search = searchParams.get("search") || undefined
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "50", 10)

    if (!templateId) {
      throw ApiError.badRequest("templateId is required")
    }

    const data = await listTemplateAssignments(templateId, { search, page, limit })
    return NextResponse.json(data)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const { templateId, userIds, criteria, customData } = body

    if (!templateId || typeof templateId !== "string") {
      throw ApiError.badRequest("templateId is required")
    }

    // Direct User IDs assignment
    if (Array.isArray(userIds) && userIds.length > 0) {
      const result = await assignTemplateToUsers({
        templateId,
        userIds,
        assignedById: session.user.id,
        customData,
      })
      return NextResponse.json({
        success: true,
        assignedCount: result.count,
        userIds: result.assignedUserIds,
      })
    }

    // Criteria-based bulk assignment
    if (criteria && typeof criteria === "object") {
      const result = await bulkAssignTemplateByCriteria({
        templateId,
        criteria: criteria as BulkAssignCriteria,
        assignedById: session.user.id,
        customData,
      })
      return NextResponse.json({
        success: true,
        matchedCount: result.matchedCount,
        assignedCount: result.assignedCount,
      })
    }

    throw ApiError.badRequest("Either userIds array or criteria object must be provided")
  } catch (error) {
    return toErrorResponse(error)
  }
}
