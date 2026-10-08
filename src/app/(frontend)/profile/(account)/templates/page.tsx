import type { Metadata } from "next"
import { requireUser } from "@/lib/session"
import { listUserTemplateAssignments } from "@/lib/services/media-template-assignment.service"
import { listMediaTemplates } from "@/lib/services/media-template.service"
import { UserTemplatesGallery } from "@/components/profile/user-templates-gallery"
import prisma from "@/lib/prisma"

export const metadata: Metadata = {
  title: "My Cards & Certificates",
}

export default async function ProfileTemplatesPage() {
  const session = await requireUser()
  const userId = session.user.id

  // 1. Fetch user's explicit template assignments
  const rawAssignments = await listUserTemplateAssignments(userId)
  const assignments = JSON.parse(JSON.stringify(rawAssignments))

  // 2. Fetch user images
  const [member, userRecord] = await Promise.all([
    prisma.member.findUnique({
      where: { userId },
      select: { id: true, status: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { image: true, selactedImg: true },
    }),
  ])

  const userImages = userRecord?.image || []
  const initialSelectedImageIndex = userRecord?.selactedImg
    ? parseInt(userRecord.selactedImg, 10) || 0
    : 0

  const assignedTemplateIds = new Set(assignments.map((a: any) => a.templateId))

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
          template: JSON.parse(JSON.stringify(card)),
          user: {
            id: session.user.id,
            name: session.user.name || "Member",
            email: session.user.email || "",
          },
          assignedById: null,
          assignedBy: { id: "system", name: "DPICS System" },
          customData: null,
          status: "ACTIVE",
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
        })
        assignedTemplateIds.add(card.id)
      }
    }
  }

  return (
    <UserTemplatesGallery
      initialAssignments={assignments}
      userId={session.user.id}
      userName={session.user.name || "Member"}
      userImages={userImages}
      initialSelectedImageIndex={initialSelectedImageIndex}
    />
  )
}
