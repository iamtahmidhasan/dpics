import "server-only"

import crypto from "node:crypto"
import {
  Department,
  InvitationStatus,
  Prisma,
  Role,
  Semester,
  Shift,
} from "@/generated/prisma/client"
import prisma from "@/lib/prisma"
import { ApiError } from "@/lib/api-error"
import { getUserRoles, isSuperAdmin } from "@/lib/roles"
import { ActivityAction, ActivityLogService, type ActivityLogActor } from "@/lib/services/activity-log.service"
import { EmailService } from "@/lib/services/email.service"
import { SITE_NAME, SITE_URL } from "@/lib/site"

export interface CreateInvitationInput {
  email: string
  name?: string | null
  role: Role
  expiryDays?: number
  customMessage?: string | null
  sendEmail?: boolean
}

export interface CreateBulkInvitationsInput {
  emails: string[]
  role: Role
  expiryDays?: number
  customMessage?: string | null
  sendEmail?: boolean
}

export interface BulkInvitationItemResult {
  email: string
  status: "SENT" | "CREATED" | "SKIPPED_EXISTING_USER" | "SKIPPED_ACTIVE_INVITE" | "FAILED"
  inviteUrl?: string
  reason?: string
}

export interface CreateBulkInvitationsResult {
  totalProcessed: number
  successCount: number
  skippedCount: number
  failedCount: number
  results: BulkInvitationItemResult[]
}

export interface ListInvitationsParams {
  page?: number
  pageSize?: number
  search?: string | null
  status?: InvitationStatus | "ALL" | null
  role?: Role | "ALL" | null
}

export interface InvitationSummary {
  id: string
  email: string
  name: string | null
  role: Role
  token: string
  status: InvitationStatus
  invitedById: string | null
  invitedByName: string | null
  invitedByEmail: string | null
  expiresAt: string
  acceptedAt: string | null
  acceptedById: string | null
  resendCount: number
  lastResentAt: string | null
  customMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface InvitationCounts {
  total: number
  pending: number
  accepted: number
  expired: number
  revoked: number
}

export interface ListInvitationsResult {
  invitations: InvitationSummary[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  counts: InvitationCounts
}

export const DEFAULT_INVITATION_PAGE_SIZE = 10

function formatRoleLabel(role: Role): string {
  switch (role) {
    case Role.SUPER_ADMIN:
      return "Super Administrator"
    case Role.ADMIN:
      return "Administrator"
    case Role.INSTRUCTOR:
      return "Instructor"
    case Role.MEMBER:
      return "Society Member"
    case Role.USER:
    default:
      return "General User"
  }
}

function formatExpiryDuration(expiryDays: number): string {
  if (expiryDays === 1) return "24 hours"
  return `${expiryDays} days`
}

export class InvitationService {
  /**
   * Creates a new user invitation, writes audit log, and optionally sends invitation email
   */
  static async createInvitation(
    input: CreateInvitationInput,
    actor: ActivityLogActor
  ): Promise<{
    invitation: InvitationSummary
    inviteUrl: string
    emailSent: boolean
  }> {
    const email = input.email.trim().toLowerCase()
    if (!email || !email.includes("@")) {
      throw ApiError.badRequest("Please provide a valid recipient email address")
    }

    const role = input.role || Role.USER

    // RBAC: Only Super Admins can invite new Admins or Super Admins
    if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
      if (!isSuperAdmin(actor)) {
        throw ApiError.forbidden("Only Super Administrators can invite administrators")
      }
    }

    // Check if user is already registered in the platform
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    })

    if (existingUser) {
      throw ApiError.badRequest(
        `A user account with email "${email}" is already registered on the platform (${existingUser.name || "Active Account"}).`
      )
    }

    // Check if an active pending invitation already exists
    const activeInvite = await prisma.invitation.findFirst({
      where: {
        email,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    })

    if (activeInvite) {
      throw ApiError.conflict(
        `An active pending invitation for "${email}" already exists (expires ${new Date(
          activeInvite.expiresAt
        ).toLocaleDateString()}). You can resend or revoke it from the Invitations tab.`
      )
    }

    const expiryDays = Math.max(1, Math.min(30, Number(input.expiryDays) || 7))
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
    const token = crypto.randomBytes(32).toString("hex")
    const cleanMessage = input.customMessage?.trim() || null

    const created = await prisma.invitation.create({
      data: {
        email,
        name: input.name?.trim() || null,
        role,
        token,
        status: InvitationStatus.PENDING,
        invitedById: actor.id,
        invitedByName: actor.name || "Administrator",
        invitedByEmail: actor.email,
        expiresAt,
        customMessage: cleanMessage,
      },
    })

    await ActivityLogService.log({
      action: ActivityAction.CREATE,
      actionName: "INVITATION_SENT",
      entity: "Invitation",
      entityId: created.id,
      description: `Sent invitation to ${email} for role ${role}`,
      actor,
      newData: {
        email,
        name: created.name,
        role,
        expiresAt: expiresAt.toISOString(),
      },
    })

    const inviteUrl = `${SITE_URL.origin}/invite/${token}`
    let emailSent = false

    const sendEmail = input.sendEmail !== false
    if (sendEmail) {
      try {
        const customMessageBlock = cleanMessage
          ? `<div style="background-color: #f1f5f9; border-left: 4px solid #0284c7; padding: 14px 16px; margin: 18px 0; border-radius: 4px; font-style: italic; color: #334155;">"${cleanMessage}"</div>`
          : ""

        const sendResult = await EmailService.sendTemplatedEmail(
          "USER_INVITATION",
          {
            email,
            name: created.name || "Member",
          },
          {
            recipientName: created.name || "there",
            recipientEmail: email,
            invitedByName: actor.name || "DPI Computing Society Admin",
            roleName: formatRoleLabel(role),
            inviteUrl,
            customMessageBlock,
            expiresIn: formatExpiryDuration(expiryDays),
            siteName: SITE_NAME,
            siteUrl: SITE_URL.origin,
          },
          { hideLogo: true }
        )

        emailSent = Boolean(sendResult.success)
      } catch (err) {
        console.error("[InvitationService] Failed to dispatch invitation email:", err)
      }
    }

    return {
      invitation: {
        id: created.id,
        email: created.email,
        name: created.name,
        role: created.role,
        token: created.token,
        status: created.status,
        invitedById: created.invitedById,
        invitedByName: created.invitedByName,
        invitedByEmail: created.invitedByEmail,
        expiresAt: created.expiresAt.toISOString(),
        acceptedAt: null,
        acceptedById: null,
        resendCount: created.resendCount,
        lastResentAt: null,
        customMessage: created.customMessage,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
      inviteUrl,
      emailSent,
    }
  }

  /**
   * Lists invitations with filters, search, metrics, and pagination
   */
  static async listInvitations(params: ListInvitationsParams = {}): Promise<ListInvitationsResult> {
    const page = Math.max(1, params.page || 1)
    const pageSize = Math.max(1, Math.min(100, params.pageSize || DEFAULT_INVITATION_PAGE_SIZE))

    // Sweep: update status of expired pending invitations in background
    await prisma.invitation.updateMany({
      where: {
        status: InvitationStatus.PENDING,
        expiresAt: { lte: new Date() },
      },
      data: {
        status: InvitationStatus.EXPIRED,
      },
    })

    const where: Prisma.InvitationWhereInput = {}

    if (params.status && params.status !== "ALL") {
      where.status = params.status
    }

    if (params.role && params.role !== "ALL") {
      where.role = params.role
    }

    if (params.search && params.search.trim()) {
      const term = params.search.trim()
      where.OR = [
        { email: { contains: term, mode: "insensitive" } },
        { name: { contains: term, mode: "insensitive" } },
        { invitedByName: { contains: term, mode: "insensitive" } },
        { invitedByEmail: { contains: term, mode: "insensitive" } },
      ]
    }

    const [total, rows, pendingCount, acceptedCount, expiredCount, revokedCount, allCount] =
      await Promise.all([
        prisma.invitation.count({ where }),
        prisma.invitation.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.invitation.count({ where: { status: InvitationStatus.PENDING } }),
        prisma.invitation.count({ where: { status: InvitationStatus.ACCEPTED } }),
        prisma.invitation.count({ where: { status: InvitationStatus.EXPIRED } }),
        prisma.invitation.count({ where: { status: InvitationStatus.REVOKED } }),
        prisma.invitation.count(),
      ])

    const invitations: InvitationSummary[] = rows.map((item) => ({
      id: item.id,
      email: item.email,
      name: item.name,
      role: item.role,
      token: item.token,
      status: item.status,
      invitedById: item.invitedById,
      invitedByName: item.invitedByName,
      invitedByEmail: item.invitedByEmail,
      expiresAt: item.expiresAt.toISOString(),
      acceptedAt: item.acceptedAt?.toISOString() || null,
      acceptedById: item.acceptedById,
      resendCount: item.resendCount,
      lastResentAt: item.lastResentAt?.toISOString() || null,
      customMessage: item.customMessage,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }))

    return {
      invitations,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
      counts: {
        total: allCount,
        pending: pendingCount,
        accepted: acceptedCount,
        expired: expiredCount,
        revoked: revokedCount,
      },
    }
  }

  /**
   * Resends invitation email, resets expiry if expired, and increments counter
   */
  static async resendInvitation(
    id: string,
    actor: ActivityLogActor
  ): Promise<{ success: boolean; emailSent: boolean; message: string }> {
    const invite = await prisma.invitation.findUnique({
      where: { id },
    })

    if (!invite) {
      throw ApiError.notFound("Invitation not found")
    }

    if (invite.status === InvitationStatus.ACCEPTED) {
      throw ApiError.badRequest("This invitation has already been accepted.")
    }

    if (invite.status === InvitationStatus.REVOKED) {
      throw ApiError.badRequest(
        "This invitation was revoked. Please create a new invitation instead."
      )
    }

    const now = new Date()
    const isExpired = invite.status === InvitationStatus.EXPIRED || invite.expiresAt <= now
    const newExpiresAt = isExpired
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      : invite.expiresAt

    const updated = await prisma.invitation.update({
      where: { id },
      data: {
        status: InvitationStatus.PENDING,
        expiresAt: newExpiresAt,
        resendCount: { increment: 1 },
        lastResentAt: now,
      },
    })

    await ActivityLogService.log({
      action: ActivityAction.OTHER,
      actionName: "INVITATION_RESENT",
      entity: "Invitation",
      entityId: id,
      description: `Resent invitation to ${updated.email} (Resend #${updated.resendCount})`,
      actor,
    })

    const inviteUrl = `${SITE_URL.origin}/invite/${updated.token}`
    let emailSent = false

    try {
      const customMessageBlock = updated.customMessage
        ? `<div style="background-color: #f1f5f9; border-left: 4px solid #0284c7; padding: 14px 16px; margin: 18px 0; border-radius: 4px; font-style: italic; color: #334155;">"${updated.customMessage}"</div>`
        : ""

      const sendResult = await EmailService.sendTemplatedEmail(
        "USER_INVITATION",
        {
          email: updated.email,
          name: updated.name || "Member",
        },
        {
          recipientName: updated.name || "there",
          recipientEmail: updated.email,
          invitedByName: actor.name || "DPI Computing Society Admin",
          roleName: formatRoleLabel(updated.role),
          inviteUrl,
          customMessageBlock,
          expiresIn: "7 days",
          siteName: SITE_NAME,
          siteUrl: SITE_URL.origin,
        },
        { hideLogo: true }
      )

      emailSent = Boolean(sendResult.success)
    } catch (err) {
      console.error("[InvitationService] Failed to resend email:", err)
    }

    return {
      success: true,
      emailSent,
      message: emailSent
        ? "Invitation email resent successfully!"
        : "Invitation updated, but email could not be delivered. You may copy the invite link manually.",
    }
  }

  /**
   * Extends the expiration date of an invitation
   */
  static async extendInvitation(
    id: string,
    days: number,
    actor: ActivityLogActor
  ): Promise<InvitationSummary> {
    const invite = await prisma.invitation.findUnique({
      where: { id },
    })

    if (!invite) {
      throw ApiError.notFound("Invitation not found")
    }

    if (invite.status === InvitationStatus.ACCEPTED) {
      throw ApiError.badRequest("Cannot extend an already accepted invitation.")
    }

    const addDays = Math.max(1, Math.min(30, days || 7))
    const currentExpiry = new Date(invite.expiresAt).getTime()
    const baseTime = Math.max(Date.now(), currentExpiry)
    const newExpiresAt = new Date(baseTime + addDays * 24 * 60 * 60 * 1000)

    const updated = await prisma.invitation.update({
      where: { id },
      data: {
        expiresAt: newExpiresAt,
        status: InvitationStatus.PENDING,
      },
    })

    await ActivityLogService.log({
      action: ActivityAction.UPDATE,
      actionName: "INVITATION_EXTENDED",
      entity: "Invitation",
      entityId: id,
      description: `Extended invitation for ${updated.email} by ${addDays} days`,
      actor,
      newData: { expiresAt: newExpiresAt.toISOString() },
    })

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      token: updated.token,
      status: updated.status,
      invitedById: updated.invitedById,
      invitedByName: updated.invitedByName,
      invitedByEmail: updated.invitedByEmail,
      expiresAt: updated.expiresAt.toISOString(),
      acceptedAt: updated.acceptedAt?.toISOString() || null,
      acceptedById: updated.acceptedById,
      resendCount: updated.resendCount,
      lastResentAt: updated.lastResentAt?.toISOString() || null,
      customMessage: updated.customMessage,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    }
  }

  /**
   * Revokes an active invitation
   */
  static async revokeInvitation(id: string, actor: ActivityLogActor): Promise<{ success: boolean }> {
    const invite = await prisma.invitation.findUnique({
      where: { id },
    })

    if (!invite) {
      throw ApiError.notFound("Invitation not found")
    }

    if (invite.status === InvitationStatus.ACCEPTED) {
      throw ApiError.badRequest("Cannot revoke an already accepted invitation.")
    }

    await prisma.invitation.update({
      where: { id },
      data: { status: InvitationStatus.REVOKED },
    })

    await ActivityLogService.log({
      action: ActivityAction.STATUS_CHANGE,
      actionName: "INVITATION_REVOKED",
      entity: "Invitation",
      entityId: id,
      description: `Revoked invitation for ${invite.email}`,
      actor,
    })

    return { success: true }
  }

  /**
   * Deletes an invitation record
   */
  static async deleteInvitation(id: string, actor: ActivityLogActor): Promise<{ success: boolean }> {
    const invite = await prisma.invitation.findUnique({
      where: { id },
    })

    if (!invite) {
      throw ApiError.notFound("Invitation not found")
    }

    await prisma.invitation.delete({
      where: { id },
    })

    await ActivityLogService.log({
      action: ActivityAction.DELETE,
      actionName: "INVITATION_DELETED",
      entity: "Invitation",
      entityId: id,
      description: `Deleted invitation record for ${invite.email}`,
      actor,
    })

    return { success: true }
  }

  /**
   * Retrieves invitation details by token (for public acceptance page)
   */
  static async getInvitationByToken(token: string) {
    if (!token || typeof token !== "string") {
      return null
    }

    const invite = await prisma.invitation.findUnique({
      where: { token },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        invitedByName: true,
        expiresAt: true,
        customMessage: true,
        acceptedAt: true,
      },
    })

    if (!invite) return null

    // If still marked PENDING but passed expiry, update in DB
    if (invite.status === InvitationStatus.PENDING && invite.expiresAt <= new Date()) {
      await prisma.invitation.update({
        where: { token },
        data: { status: InvitationStatus.EXPIRED },
      })
      return { ...invite, status: InvitationStatus.EXPIRED }
    }

    return invite
  }

  /**
   * Accepts invitation and binds the role to the authenticated user account
   */
  static async acceptInvitation(
    token: string,
    user: { id: string; email: string; name?: string | null; roles?: unknown }
  ): Promise<{ success: boolean; role: Role; message: string }> {
    const invite = await prisma.invitation.findUnique({
      where: { token },
    })

    if (!invite) {
      throw ApiError.notFound("Invitation not found")
    }

    if (invite.status === InvitationStatus.ACCEPTED) {
      throw ApiError.badRequest("This invitation has already been accepted.")
    }

    if (invite.status === InvitationStatus.REVOKED) {
      throw ApiError.badRequest("This invitation was revoked by an administrator.")
    }

    if (invite.status === InvitationStatus.EXPIRED || invite.expiresAt <= new Date()) {
      if (invite.status !== InvitationStatus.EXPIRED) {
        await prisma.invitation.update({
          where: { id: invite.id },
          data: { status: InvitationStatus.EXPIRED },
        })
      }
      throw ApiError.badRequest(
        "This invitation link has expired. Please contact an administrator to request a new invitation."
      )
    }

    // Strict Email Matching
    const currentEmail = user.email.trim().toLowerCase()
    const targetEmail = invite.email.trim().toLowerCase()

    if (currentEmail !== targetEmail) {
      throw ApiError.badRequest(
        `Email mismatch: This invitation was issued for ${invite.email}, but you are currently signed in as ${user.email}. Please sign in with ${invite.email} to accept this invitation.`
      )
    }

    // Grant Role to user if not already present
    const existingRoles = getUserRoles(user)
    const updatedRoles = Array.from(new Set([...existingRoles, invite.role]))

    await prisma.user.update({
      where: { id: user.id },
      data: {
        roles: updatedRoles,
      },
    })

    // If role is MEMBER and user doesn't have a Member profile yet, create a baseline record
    if (invite.role === Role.MEMBER) {
      const existingMember = await prisma.member.findUnique({
        where: { userId: user.id },
      })

      if (!existingMember) {
        await prisma.member.create({
          data: {
            userId: user.id,
            department: Department.COMPUTER_SCIENCE_AND_TECHNOLOGY,
            session: "2025-2026",
            semester: Semester.FIRST,
            shift: Shift.DAY,
          },
        })
      }
    }

    // Mark invitation as ACCEPTED
    await prisma.invitation.update({
      where: { id: invite.id },
      data: {
        status: InvitationStatus.ACCEPTED,
        acceptedAt: new Date(),
        acceptedById: user.id,
      },
    })

    await ActivityLogService.log({
      action: ActivityAction.STATUS_CHANGE,
      actionName: "INVITATION_ACCEPTED",
      entity: "Invitation",
      entityId: invite.id,
      description: `User ${user.email} accepted invitation for role ${invite.role}`,
      actor: {
        id: user.id,
        name: user.name || "User",
        email: user.email,
        roles: updatedRoles,
      },
    })

    return {
      success: true,
      role: invite.role,
      message: `Invitation accepted successfully! You now have ${formatRoleLabel(invite.role)} privileges.`,
    }
  }

  /**
   * Creates invitations in bulk for a list of emails with conflict handling and email dispatching
   */
  static async createBulkInvitations(
    input: CreateBulkInvitationsInput,
    actor: ActivityLogActor
  ): Promise<CreateBulkInvitationsResult> {
    const rawEmails = Array.isArray(input.emails) ? input.emails : []
    const cleanEmails = Array.from(
      new Set(
        rawEmails
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e.length > 3 && e.includes("@") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      )
    )

    if (cleanEmails.length === 0) {
      throw ApiError.badRequest("Please provide at least one valid recipient email address")
    }

    const role = input.role || Role.USER

    // RBAC: Only Super Admins can assign ADMIN or SUPER_ADMIN
    if (role === Role.SUPER_ADMIN || role === Role.ADMIN) {
      if (!isSuperAdmin(actor)) {
        throw ApiError.forbidden(
          `Only Super Administrators can assign the ${formatRoleLabel(role)} role`
        )
      }
    }

    const expiryDays = Math.max(1, Math.min(30, Number(input.expiryDays) || 7))
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
    const cleanMessage = input.customMessage?.trim() || null
    const sendEmail = input.sendEmail !== false

    // Batch check: existing users and active pending invites
    const [existingUsers, activeInvites] = await Promise.all([
      prisma.user.findMany({
        where: { email: { in: cleanEmails } },
        select: { email: true },
      }),
      prisma.invitation.findMany({
        where: {
          email: { in: cleanEmails },
          status: InvitationStatus.PENDING,
          expiresAt: { gt: new Date() },
        },
        select: { email: true },
      }),
    ])

    const existingUsersSet = new Set(existingUsers.map((u) => u.email.toLowerCase()))
    const activeInvitesSet = new Set(activeInvites.map((i) => i.email.toLowerCase()))

    const results: BulkInvitationItemResult[] = []
    let successCount = 0
    let skippedCount = 0
    let failedCount = 0

    const customMessageBlock = cleanMessage
      ? `<div style="background-color: #f1f5f9; border-left: 4px solid #0284c7; padding: 14px 16px; margin: 18px 0; border-radius: 4px; font-style: italic; color: #334155;">"${cleanMessage}"</div>`
      : ""

    for (const email of cleanEmails) {
      if (existingUsersSet.has(email)) {
        results.push({
          email,
          status: "SKIPPED_EXISTING_USER",
          reason: "An active user account is already registered with this email",
        })
        skippedCount++
        continue
      }

      if (activeInvitesSet.has(email)) {
        results.push({
          email,
          status: "SKIPPED_ACTIVE_INVITE",
          reason: "An active pending invitation already exists for this email",
        })
        skippedCount++
        continue
      }

      try {
        const token = crypto.randomBytes(32).toString("hex")
        await prisma.invitation.create({
          data: {
            email,
            role,
            token,
            status: InvitationStatus.PENDING,
            invitedById: actor.id,
            invitedByName: actor.name || "Administrator",
            invitedByEmail: actor.email,
            expiresAt,
            customMessage: cleanMessage,
          },
        })

        const inviteUrl = `${SITE_URL.origin}/invite/${token}`

        if (sendEmail) {
          try {
            await EmailService.sendTemplatedEmail(
              "USER_INVITATION",
              { email, name: "Member" },
              {
                recipientName: "there",
                recipientEmail: email,
                invitedByName: actor.name || "DPI Computing Society Admin",
                roleName: formatRoleLabel(role),
                inviteUrl,
                customMessageBlock,
                expiresIn: formatExpiryDuration(expiryDays),
                siteName: SITE_NAME,
                siteUrl: SITE_URL.origin,
              },
              { hideLogo: true }
            )
          } catch (emailErr) {
            console.error(`[InvitationService] Failed to send email to ${email}:`, emailErr)
          }
        }

        results.push({
          email,
          status: sendEmail ? "SENT" : "CREATED",
          inviteUrl,
        })
        successCount++
      } catch (err) {
        console.error(`[InvitationService] Bulk create error for ${email}:`, err)
        results.push({
          email,
          status: "FAILED",
          reason: err instanceof Error ? err.message : "Creation failed",
        })
        failedCount++
      }
    }

    await ActivityLogService.log({
      action: ActivityAction.BULK_ACTION,
      actionName: "INVITATIONS_BULK_SENT",
      entity: "Invitation",
      description: `Bulk created ${successCount} invitations for role ${role} (${skippedCount} skipped, ${failedCount} failed)`,
      actor,
      newData: {
        totalEmails: cleanEmails.length,
        successCount,
        skippedCount,
        failedCount,
        role,
      },
    })

    return {
      totalProcessed: cleanEmails.length,
      successCount,
      skippedCount,
      failedCount,
      results,
    }
  }
}
