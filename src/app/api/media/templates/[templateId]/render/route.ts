import { ImageResponse } from "next/og"
import { NextRequest, NextResponse } from "next/server"
import { ApiError, toErrorResponse } from "@/lib/api-error"
import { getSession, isAdmin } from "@/lib/session"
import { getMediaTemplateById } from "@/lib/services/media-template.service"
import { resolveTemplateData } from "@/lib/template-engine/resolver"
import { getTemplateFonts } from "@/lib/template-engine/fonts"
import { prepareTemplate, TemplateRootView } from "@/lib/template-engine/renderer"
import prisma from "@/lib/prisma"
import type { TemplateDesign, TemplateType } from "@/lib/template-engine/types"

// Next.js route segment configuration
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params
    const { searchParams } = new URL(request.url)

    const session = await getSession()
    if (!session?.user) {
      throw ApiError.unauthorized("Authentication required to generate images")
    }

    const template = await getMediaTemplateById(templateId)
    if (!template) {
      throw ApiError.notFound("Template not found")
    }

    // Determine target member / user
    let targetUserId = searchParams.get("userId")
    let targetMemberId = searchParams.get("memberId")
    const isPreview = searchParams.get("preview") === "1" || searchParams.get("preview") === "true"
    const isDownload = searchParams.get("download") === "1" || searchParams.get("download") === "true"
    const ticketCode = searchParams.get("ticketCode") || undefined
    const eventId = searchParams.get("eventId") || undefined

    const userIsAdmin = isAdmin(session.user)

    // Default to current logged-in user if no specific target is requested
    if (!targetUserId && !targetMemberId && !isPreview) {
      targetUserId = session.user.id
    }

    // Security / IDOR Protection:
    // If not admin and not previewing own data, verify ownership
    if (!userIsAdmin) {
      if (isPreview) {
        throw ApiError.forbidden("Preview mode is only accessible to admins")
      }

      // Check if target user matches current user
      if (targetUserId && targetUserId !== session.user.id) {
        throw ApiError.forbidden("You are only authorized to generate your own assets")
      }

      if (targetMemberId) {
        const userMember = await prisma.member.findUnique({
          where: { userId: session.user.id },
          select: { id: true },
        })
        if (!userMember || userMember.id !== targetMemberId) {
          throw ApiError.forbidden("You are only authorized to generate your own member card")
        }
      }
    }

    // Resolve dynamic data
    let resolvedData: Record<string, string> = {}
    if (isPreview) {
      // 1. Realistic fallback defaults
      const defaultMockData: Record<string, string> = {
        "member.name": session.user.name || "Tahmid Hasan",
        "member.studentId": "DPI-2024-0012",
        "member.boardRoll": "612450",
        "member.department": "Computer Science and Technology",
        "member.semester": "6th Semester",
        "member.session": "2021-2022",
        "member.shift": "1st Shift",
        "member.bloodGroup": "B+",
        "member.phone": session.user.phone || "+8801712345678",
        "member.email": session.user.email || "member@dpics.org",
        "member.photo":
          "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20fill%3D%22%23cbd5e1%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23e2e8f0%22%2F%3E%3Ccircle%20cx%3D%22100%22%20cy%3D%2275%22%20r%3D%2235%22%20fill%3D%22%2394a3b8%22%2F%3E%3Cpath%20d%3D%22M40%20170%20C40%20130%2C%2070%20120%2C%20100%20120%20C130%20120%2C%20160%20130%2C%20160%20170%20Z%22%20fill%3D%22%2394a3b8%22%2F%3E%3C%2Fsvg%3E",
        "member.profileUrl": `https://dpics.org/u/${session.user.id}`,
        "member.qrCode": `https://dpics.org/u/${session.user.id}`,
        "member.joinDate": "15 Jan 2024",
        "member.validUntil": "31 Dec 2026",
        "event.title": "DPICS Intra Poly Tech Fest 2026",
        "event.attendeeName": session.user.name || "Tahmid Hasan",
        "event.ticketCode": "TKT-2026-8941",
        "event.venue": "DPI Campus Auditorium",
        "event.date": "24 Nov 2026",
        "event.qrCode": `https://dpics.org/verify/ticket/TKT-2026-8941`,
        "course.title": "Full-Stack Web Development with Next.js",
        "course.instructor": "Engr. Monirul Islam",
        "certificate.issueDate": "08 Oct 2026",
        "certificate.certificateId": "CERT-DPICS-2026-0812",
        "certificate.qrCode": `https://dpics.org/verify/cert/CERT-DPICS-2026-0812`,
        "achievement.title": "National Skills Competition Champion 2026",
        "achievement.winnerName": session.user.name || "Tahmid Hasan",
        "dpics.name": "DPI Computing Society",
        "dpics.shortName": "DPICS",
        "dpics.website": "https://dpics.org",
        "dpics.logo": "/DPICS_logo_vector.svg",
      }

      // 2. Fetch the builder/admin's real profile data (including selected avatar from User.image and User.selactedImg)
      const realAdminData = await resolveTemplateData(template.type, {
        userId: session.user.id,
      })

      // 3. Real profile data overrides defaults
      resolvedData = {
        ...defaultMockData,
        ...realAdminData,
      }
    } else {
      resolvedData = await resolveTemplateData(template.type, {
        userId: targetUserId || undefined,
        memberId: targetMemberId || undefined,
        ticketCode,
        eventId,
      })
    }

    // Ensure background media url is passed in design
    const design = {
      ...template.design,
      backgroundMediaUrl: template.media?.url || template.design.backgroundMediaUrl,
    }

    // Pre-process template (generates dynamic QR codes, font lists)
    const prepared = await prepareTemplate(design, resolvedData)

    // Load required TTF fonts
    const fonts = await getTemplateFonts(prepared.fontFamilies)

    // Response headers for security and zero caching
    const headers: Record<string, string> = {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    }

    if (isDownload) {
      const sanitizedName = template.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-")
      headers["Content-Disposition"] = `attachment; filename="${sanitizedName}.png"`
    }

    // Generate PNG image directly on the fly
    return new ImageResponse(
      TemplateRootView({ prepared }),
      {
        width: template.width,
        height: template.height,
        fonts: fonts.map((f) => ({
          name: f.name,
          data: f.data,
          weight: f.weight,
          style: f.style,
        })),
        headers,
      }
    )
  } catch (error) {
    return toErrorResponse(error)
  }
}

/**
 * POST /api/media/templates/[templateId]/render
 * Live on-the-fly rendering with live uncommitted design payload from the visual editor.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params
    const { searchParams } = new URL(request.url)

    const session = await getSession()
    if (!session?.user || !isAdmin(session.user)) {
      throw ApiError.forbidden("Admin access required for live preview rendering")
    }

    const template = await getMediaTemplateById(templateId)
    if (!template) {
      throw ApiError.notFound("Template not found")
    }

    const body = await request.json().catch(() => ({}))

    const width = Number(body.width) || template.width
    const height = Number(body.height) || template.height
    const templateType = (body.type as TemplateType) || template.type

    const liveDesign: TemplateDesign = body.design || template.design
    const backgroundMediaUrl =
      template.media?.url || liveDesign.backgroundMediaUrl || template.design.backgroundMediaUrl

    const design: TemplateDesign = {
      ...liveDesign,
      width,
      height,
      backgroundMediaUrl,
    }

    // 1. Realistic fallback defaults
    const defaultMockData: Record<string, string> = {
      "member.name": session.user.name || "Tahmid Hasan",
      "member.studentId": "DPI-2024-0012",
      "member.boardRoll": "612450",
      "member.department": "Computer Science and Technology",
      "member.semester": "6th Semester",
      "member.session": "2021-2022",
      "member.shift": "1st Shift",
      "member.bloodGroup": "B+",
      "member.phone": session.user.phone || "+8801712345678",
      "member.email": session.user.email || "member@dpics.org",
      "member.photo":
        "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20fill%3D%22%23cbd5e1%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23e2e8f0%22%2F%3E%3Ccircle%20cx%3D%22100%22%20cy%3D%2275%22%20r%3D%2235%22%20fill%3D%22%2394a3b8%22%2F%3E%3Cpath%20d%3D%22M40%20170%20C40%20130%2C%2070%20120%2C%20100%20120%20C130%20120%2C%20160%20130%2C%20160%20170%20Z%22%20fill%3D%22%2394a3b8%22%2F%3E%3C%2Fsvg%3E",
      "member.profileUrl": `https://dpics.org/u/${session.user.id}`,
      "member.qrCode": `https://dpics.org/u/${session.user.id}`,
      "member.joinDate": "15 Jan 2024",
      "member.validUntil": "31 Dec 2026",
      "event.title": "DPICS Intra Poly Tech Fest 2026",
      "event.attendeeName": session.user.name || "Tahmid Hasan",
      "event.ticketCode": "TKT-2026-8941",
      "event.venue": "DPI Campus Auditorium",
      "event.date": "24 Nov 2026",
      "event.qrCode": `https://dpics.org/verify/ticket/TKT-2026-8941`,
      "course.title": "Full-Stack Web Development with Next.js",
      "course.instructor": "Engr. Monirul Islam",
      "certificate.issueDate": "08 Oct 2026",
      "certificate.certificateId": "CERT-DPICS-2026-0812",
      "certificate.qrCode": `https://dpics.org/verify/cert/CERT-DPICS-2026-0812`,
      "achievement.title": "National Skills Competition Champion 2026",
      "achievement.winnerName": session.user.name || "Tahmid Hasan",
      "dpics.name": "DPI Computing Society",
      "dpics.shortName": "DPICS",
      "dpics.website": "https://dpics.org",
      "dpics.logo": "/DPICS_logo_vector.svg",
    }

    // 2. Fetch builder's real profile data
    const realAdminData = await resolveTemplateData(templateType, {
      userId: session.user.id,
    })

    const resolvedData = {
      ...defaultMockData,
      ...realAdminData,
    }

    const prepared = await prepareTemplate(design, resolvedData)
    const fonts = await getTemplateFonts(prepared.fontFamilies)

    const isDownload = searchParams.get("download") === "1"
    const headers: Record<string, string> = {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    }

    if (isDownload) {
      const sanitizedName = template.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-")
      headers["Content-Disposition"] = `attachment; filename="${sanitizedName}.png"`
    }

    return new ImageResponse(TemplateRootView({ prepared }), {
      width,
      height,
      fonts: fonts.map((f) => ({
        name: f.name,
        data: f.data,
        weight: f.weight,
        style: f.style,
      })),
      headers,
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
