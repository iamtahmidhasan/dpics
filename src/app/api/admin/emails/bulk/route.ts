import { NextResponse, type NextRequest } from "next/server"

import { ApiError, toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { EmailService } from "@/lib/services/email.service"

export async function POST(request: NextRequest) {
  try {
    await requireAdminApi()
    const body = await request.json()

    const { filters, subject, bodyHtml, batchSize, delayMsBetweenBatches } = body

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      throw ApiError.badRequest("Subject is required")
    }

    if (!bodyHtml || typeof bodyHtml !== "string" || !bodyHtml.trim()) {
      throw ApiError.badRequest("Email body HTML is required")
    }

    const result = await EmailService.sendBulkCampaign({
      filters: filters || {},
      subject: subject.trim(),
      bodyHtml: bodyHtml.trim(),
      batchSize: typeof batchSize === "number" ? batchSize : 5,
      delayMsBetweenBatches:
        typeof delayMsBetweenBatches === "number" ? delayMsBetweenBatches : 300,
    })

    return NextResponse.json({
      success: true,
      result,
      message: `Bulk mail completed: ${result.sent} sent, ${result.failed} failed out of ${result.total} recipients.`,
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
