import "server-only"

import prisma from "@/lib/prisma"
import { resolveUserImage } from "@/lib/user-image"
import { makeT } from "@/lib/i18n"
import { departmentLabel, semesterLabel, shiftLabel } from "@/lib/profile-labels"
import { SITE_NAME, SITE_URL } from "@/lib/site"
import type { TemplateType } from "./types"

export interface ResolveDataContext {
  userId?: string
  memberId?: string
  eventId?: string
  ticketCode?: string
  courseEnrollmentId?: string
  achievementId?: string
  customData?: Record<string, string>
}

/**
 * Resolves database entities into normalized key-value pairs for dynamic template rendering.
 */
export async function resolveTemplateData(
  type: TemplateType,
  context: ResolveDataContext = {}
): Promise<Record<string, string>> {
  const siteOrigin = SITE_URL.origin || "https://dgpics.org"
  const tEn = makeT("en")

  const result: Record<string, string> = {
    // Default Organization variables
    "dpics.name": SITE_NAME || "DPI Computing Society",
    "dpics.shortName": "DPICS",
    "dpics.website": siteOrigin,
    "dpics.logo": `${siteOrigin}/DPICS_logo_vector.svg`,
  }

  // Inject any custom passed data
  if (context.customData) {
    Object.assign(result, context.customData)
  }

  // 1. Resolve Member / User Data
  if (context.memberId || context.userId) {
    const user = await prisma.user.findFirst({
      where: context.userId
        ? { id: context.userId }
        : { member: { id: context.memberId } },
      include: {
        member: true,
      },
    })

    if (user) {
      const { avatar } = resolveUserImage(user.image, user.selactedImg)
      const member = user.member

      result["member.name"] = user.name || "Member"
      result["member.email"] = user.email || ""
      result["member.phone"] = user.phone || ""
      result["member.bloodGroup"] = user.bloodGroup || "—"
      result["member.photo"] =
        avatar ||
        "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20fill%3D%22%23cbd5e1%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23e2e8f0%22%2F%3E%3Ccircle%20cx%3D%22100%22%20cy%3D%2275%22%20r%3D%2235%22%20fill%3D%22%2394a3b8%22%2F%3E%3Cpath%20d%3D%22M40%20170%20C40%20130%2C%2070%20120%2C%20100%20120%20C130%20120%2C%20160%20130%2C%20160%20170%20Z%22%20fill%3D%22%2394a3b8%22%2F%3E%3C%2Fsvg%3E"
      
      const profileUrl = `${siteOrigin}/u/${user.id}`
      result["member.profileUrl"] = profileUrl
      result["member.qrCode"] = profileUrl

      if (member) {
        result["member.studentId"] = member.studentId || "—"
        result["member.boardRoll"] = member.boardOrClassRoll || "—"
        result["member.session"] = member.session || "—"
        result["member.department"] = departmentLabel(tEn)(member.department)
        result["member.semester"] = semesterLabel(tEn)(member.semester)
        result["member.shift"] = shiftLabel(tEn)(member.shift)
        
        if (member.joinedAt) {
          result["member.joinDate"] = new Intl.DateTimeFormat("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(new Date(member.joinedAt))
        } else {
          result["member.joinDate"] = "—"
        }

        if (member.expiresAt) {
          result["member.validUntil"] = new Intl.DateTimeFormat("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(new Date(member.expiresAt))
        } else {
          result["member.validUntil"] = "31 Dec 2026"
        }
      }
    }
  }

  // 2. Resolve Event Data
  if (context.ticketCode || context.eventId) {
    const registration = context.ticketCode
      ? await prisma.eventRegistration.findUnique({
          where: { ticketCode: context.ticketCode },
          include: { event: true, user: true },
        })
      : null

    if (registration) {
      result["event.title"] = registration.event.title
      result["event.attendeeName"] = registration.name
      result["event.ticketCode"] = registration.ticketCode
      result["event.venue"] = registration.event.venue || "DPI Campus"
      result["event.date"] = new Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(registration.event.startDate))
      result["event.qrCode"] = `${siteOrigin}/verify/ticket/${registration.ticketCode}`
    } else if (context.eventId) {
      const event = await prisma.event.findUnique({ where: { id: context.eventId } })
      if (event) {
        result["event.title"] = event.title
        result["event.venue"] = event.venue || "DPI Campus"
        result["event.date"] = new Intl.DateTimeFormat("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(event.startDate))
      }
    }
  }

  // 3. Resolve Achievement Data
  if (context.achievementId) {
    const achievement = await prisma.achievement.findUnique({
      where: { id: context.achievementId },
      include: { author: true },
    })
    if (achievement) {
      result["achievement.title"] = achievement.title
      result["achievement.winnerName"] = achievement.author.name
    }
  }

  return result
}
