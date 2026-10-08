import { NextRequest, NextResponse } from "next/server"
import { ApiError, toErrorResponse } from "@/lib/api-error"
import { getSession } from "@/lib/session"
import { listUserTemplateAssignments } from "@/lib/services/media-template-assignment.service"
import { listMediaTemplates } from "@/lib/services/media-template.service"
import prisma from "@/lib/prisma"

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw ApiError.unauthorized("Authentication required")
    }

    const userId = session.user.id

    // 1. Explicit assignments
    const assignments = await listUserTemplateAssignments(userId)

    // 2. Check if user is a member with an active MEMBER_CARD template not yet explicitly in assignments
    const member = await prisma.member.findUnique({
      where: { userId },
      select: { id: true, status: true },
    })

    const assignedTemplateIds = new Set(assignments.map((a) => a.templateId))

    // If member is active, include default active MEMBER_CARD templates
    if (member) {
      const defaultMemberCards = await listMediaTemplates({
        type: "MEMBER_CARD",
        isActiveOnly: true,
      })

      for (const card of defaultMemberCards) {
        if (!assignedTemplateIds.has(card.id)) {
          assignments.unshift({
            id: `auto-${card.id}`,
            userId,
            templateId: card.id,
            template: card,
            user: {
              id: session.user.id,
              name: session.user.name || "Member",
              email: session.user.email || "",
            },
            assignedById: null,
            assignedBy: { id: "system", name: "System (Membership)" },
            customData: null,
            status: "ACTIVE",
            createdAt: card.createdAt,
            updatedAt: card.updatedAt,
          })
          assignedTemplateIds.add(card.id)
        }
      }
    }

    return NextResponse.json({
      assignments,
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
