import { NextResponse, type NextRequest } from "next/server"

import { ApiError, toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { EmailService } from "@/lib/services/email.service"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAdminApi()
    const { id } = await context.params
    const body = await request.json()

    const template = await EmailService.getTemplateById(id)
    if (!template) {
      throw ApiError.notFound("Template not found")
    }

    const targetEmail =
      typeof body.recipientEmail === "string" && body.recipientEmail.trim()
        ? body.recipientEmail.trim()
        : session.user.email

    if (!targetEmail) {
      throw ApiError.badRequest("Recipient email is required")
    }

    const customVariables = (body.variables && typeof body.variables === "object") ? body.variables : {}

    // Generate informative mock values for common template variables
    const mockVariables: Record<string, string> = {
      userName: session.user.name || "Test User",
      courseTitle: "Full-Stack Web Development with Next.js",
      amountPaid: "1500",
      paymentMethod: "bKash",
      transactionId: "TRX992837418",
      courseUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/courses/sample-course`,
      adminNote: "Please confirm your payment screenshot.",
      studentId: "DPICS-26-0042",
      instructorId: "INS-2026-001",
      department: "Computer Science and Technology",
      semester: "5th Semester",
      session: "2023-2024",
      portalUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/profile`,
      rejectionReason: "ID card photo is blurry. Please upload a clear scan.",
      postTitle: "Building Scalable APIs with Prisma & PostgreSQL",
      postUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/posts/sample-post`,
      massageForAuthor: "Please improve the conclusion and add code comments.",
      achievementTitle: "1st Place - National Polytechnic Tech Fest 2026",
      achievementUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/achievements/sample-achievement`,
      eventTitle: "DPICS Annual Tech Summit & Hackathon 2026",
      ticketCode: "DPICS-TKT-84920",
      eventDate: "Saturday, November 14, 2026",
      venue: "Main Auditorium, Dhaka Polytechnic Institute",
      ticketUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/events/tickets/DPICS-TKT-84920`,
      committeeName: "Executive Committee 2026-2027",
      roleName: "Technical Secretary",
      customMessage: "This is a test notification message from the DPI Computing Society administration.",
      ...customVariables,
    }

    const result = await EmailService.sendTemplatedEmail(
      template.key,
      {
        email: targetEmail,
        name: session.user.name,
        userId: session.user.id,
      },
      mockVariables
    )

    if (!result.success) {
      return NextResponse.json(
        { error: { message: result.error || "Failed to send test email" } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${targetEmail}`,
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
