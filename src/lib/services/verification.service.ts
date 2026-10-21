import prisma from "@/lib/prisma"
import { EventRegistrationStatus, MembershipStatus, VerificationStatus } from "@/generated/prisma/enums"
import { resolveUserImage } from "@/lib/user-image"

export type CredentialType = "EVENT_PASS" | "MEMBER_ID" | "CERTIFICATE" | "NOT_FOUND"

export type VerificationResult = {
  isValid: boolean
  credentialType: CredentialType
  code: string
  title: string
  titleBn?: string | null
  status: string
  statusLabel: string
  recipientName: string
  recipientAvatar?: string | null
  studentId?: string | null
  department?: string | null
  session?: string | null
  semester?: string | null
  shift?: string | null
  institution?: string | null
  issuedAt?: string | null
  validUntil?: string | null
  issuer: string
  issuerLocation: string
  detailsUrl?: string | null
  metadata: Record<string, unknown>
}

export class VerificationService {
  /**
   * Universal resolution for any credential code (ticket code, member student ID, or certificate ID)
   */
  static async verifyCode(rawCode: string): Promise<VerificationResult> {
    const code = rawCode.trim()
    if (!code) {
      return this.notFoundResult(rawCode)
    }

    // 1. Check Event Ticket Registration
    const ticketMatch = await prisma.eventRegistration.findFirst({
      where: {
        ticketCode: { equals: code, mode: "insensitive" },
      },
      include: {
        event: true,
        user: true,
      },
    })

    if (ticketMatch) {
      const isConfirmedOrAttended =
        ticketMatch.status === EventRegistrationStatus.CONFIRMED ||
        ticketMatch.status === EventRegistrationStatus.ATTENDED

      let avatar: string | null = null
      if (ticketMatch.user?.image) {
        avatar = resolveUserImage(ticketMatch.user.image, ticketMatch.user.selactedImg).avatar
      }

      return {
        isValid: isConfirmedOrAttended,
        credentialType: "EVENT_PASS",
        code: ticketMatch.ticketCode,
        title: ticketMatch.event.title,
        titleBn: ticketMatch.event.titleBn,
        status: ticketMatch.status,
        statusLabel:
          ticketMatch.status === EventRegistrationStatus.ATTENDED
            ? "Attended & Verified"
            : ticketMatch.status === EventRegistrationStatus.CONFIRMED
              ? "Confirmed Entry Pass"
              : ticketMatch.status,
        recipientName: ticketMatch.name,
        recipientAvatar: avatar,
        studentId: ticketMatch.studentId,
        department: ticketMatch.department,
        semester: ticketMatch.semester,
        shift: ticketMatch.shift,
        institution: ticketMatch.institution || "Dhaka Polytechnic Institute",
        issuedAt: (ticketMatch.confirmedAt || ticketMatch.registeredAt).toISOString(),
        validUntil: ticketMatch.event.endDate
          ? ticketMatch.event.endDate.toISOString()
          : ticketMatch.event.startDate.toISOString(),
        issuer: "DPI Computing Society",
        issuerLocation: ticketMatch.event.venue || "Dhaka Polytechnic Institute, Tejgaon, Dhaka",
        detailsUrl: `/events/${ticketMatch.event.slug}`,
        metadata: {
          venue: ticketMatch.event.venue,
          eventDate: ticketMatch.event.startDate.toISOString(),
          ticketCode: ticketMatch.ticketCode,
          registrationId: ticketMatch.id,
        },
      }
    }

    // 2. Check Member ID (studentId, boardOrClassRoll, or User ID)
    const memberMatch = await prisma.member.findFirst({
      where: {
        OR: [
          { studentId: { equals: code, mode: "insensitive" } },
          { boardOrClassRoll: { equals: code, mode: "insensitive" } },
          { userId: code },
        ],
      },
      include: {
        user: true,
      },
    })

    if (memberMatch) {
      const isVerifiedMember =
        memberMatch.status === MembershipStatus.ACTIVE ||
        memberMatch.verificationStatus === VerificationStatus.VERIFIED

      const { avatar } = resolveUserImage(memberMatch.user.image, memberMatch.user.selactedImg)

      return {
        isValid: isVerifiedMember,
        credentialType: "MEMBER_ID",
        code: memberMatch.studentId || memberMatch.boardOrClassRoll || memberMatch.userId,
        title: "Official Society Membership Card",
        titleBn: "সোসাইটির অফিসিয়াল সদস্য কার্ড",
        status: memberMatch.status,
        statusLabel: isVerifiedMember ? "Active Verified Member" : memberMatch.status,
        recipientName: memberMatch.user.name,
        recipientAvatar: avatar,
        studentId: memberMatch.studentId || memberMatch.boardOrClassRoll,
        department: memberMatch.department,
        session: memberMatch.session,
        semester: memberMatch.semester,
        shift: memberMatch.shift,
        institution: "Dhaka Polytechnic Institute",
        issuedAt: (memberMatch.joinedAt || memberMatch.createdAt).toISOString(),
        validUntil: memberMatch.expiresAt ? memberMatch.expiresAt.toISOString() : null,
        issuer: "DPI Computing Society Executive Body",
        issuerLocation: "Dhaka Polytechnic Institute, Dhaka-1208",
        detailsUrl: `/members/${memberMatch.user.id}`,
        metadata: {
          email: memberMatch.user.email,
          bloodGroup: memberMatch.user.bloodGroup,
          studentId: memberMatch.studentId,
          roles: memberMatch.user.roles,
        },
      }
    }

    // 3. Check Media Template Assignment (Certificates, Badges)
    const assignmentMatch = await prisma.mediaTemplateAssignment.findFirst({
      where: {
        OR: [
          { id: code },
          { customData: { path: ["certificateId"], equals: code } },
        ],
      },
      include: {
        template: {
          include: {
            media: true,
          },
        },
        user: {
          include: {
            member: true,
          },
        },
        assignedBy: true,
      },
    })

    if (assignmentMatch) {
      const { avatar } = resolveUserImage(assignmentMatch.user.image, assignmentMatch.user.selactedImg)
      const customData = (assignmentMatch.customData as Record<string, unknown>) || {}

      return {
        isValid: assignmentMatch.status === "ACTIVE",
        credentialType: "CERTIFICATE",
        code: (customData.certificateId as string) || assignmentMatch.id,
        title: assignmentMatch.template.name,
        status: assignmentMatch.status,
        statusLabel: assignmentMatch.status === "ACTIVE" ? "Authentic Certificate" : assignmentMatch.status,
        recipientName: assignmentMatch.user.name,
        recipientAvatar: avatar,
        studentId: assignmentMatch.user.member?.studentId || null,
        department: assignmentMatch.user.member?.department || null,
        session: assignmentMatch.user.member?.session || null,
        institution: "Dhaka Polytechnic Institute",
        issuedAt: assignmentMatch.createdAt.toISOString(),
        validUntil: null,
        issuer: "DPI Computing Society",
        issuerLocation: "Dhaka Polytechnic Institute, Dhaka-1208",
        detailsUrl: null,
        metadata: {
          templateType: assignmentMatch.template.type,
          templateId: assignmentMatch.templateId,
          customData,
        },
      }
    }

    return this.notFoundResult(code)
  }

  private static notFoundResult(code: string): VerificationResult {
    return {
      isValid: false,
      credentialType: "NOT_FOUND",
      code,
      title: "Credential Record Not Found",
      titleBn: "কোনো বৈধ রেকর্ড পাওয়া যায়নি",
      status: "INVALID",
      statusLabel: "Invalid / Not Found",
      recipientName: "Unknown",
      issuer: "DPI Computing Society",
      issuerLocation: "Dhaka Polytechnic Institute",
      metadata: {},
    }
  }
}
