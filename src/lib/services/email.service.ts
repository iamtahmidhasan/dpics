import "server-only"

import {
  Department,
  EmailCategory,
  EmailLogStatus,
  EnrollmentStatus,
  EventRegistrationStatus,
  MembershipStatus,
  Prisma,
  Role,
  Semester,
  Shift,
  VerificationStatus,
} from "@/generated/prisma/client"
import prisma from "@/lib/prisma"
import { SITE_NAME, SITE_URL } from "@/lib/site"
import { DEFAULT_EMAIL_TEMPLATES } from "@/lib/email/default-templates"
import {
  createEmailTransporter,
  formatFromAddress,
  getSmtpConfig,
  invalidateTransporterCache,
} from "@/lib/email/smtp"
import {
  htmlToPlainText,
  interpolateVariables,
  wrapInBrandedLayout,
} from "@/lib/email/template-renderer"

export interface EmailRecipient {
  email: string
  name?: string | null
  userId?: string | null
  data?: Record<string, unknown>
}

export interface BulkAudienceFilter {
  role?: Role
  department?: Department
  semester?: Semester
  shift?: Shift
  session?: string
  membershipStatus?: MembershipStatus
  verificationStatus?: VerificationStatus
  courseId?: string
  courseStatus?: EnrollmentStatus
  eventId?: string
  eventStatus?: EventRegistrationStatus
  isActive?: boolean
  search?: string
}

export class EmailService {
  private static defaultTemplatesEnsured = false

  /**
   * Ensures default templates exist in DB using optimized single-query diff
   */
  static async ensureDefaultTemplates() {
    if (this.defaultTemplatesEnsured) {
      return
    }

    try {
      const existing = await prisma.emailTemplate.findMany({
        select: { key: true },
      })
      const existingKeys = new Set(existing.map((e) => e.key))

      const missing = DEFAULT_EMAIL_TEMPLATES.filter((tpl) => !existingKeys.has(tpl.key))
      if (missing.length > 0) {
        for (const tpl of missing) {
          await prisma.emailTemplate.create({
            data: {
              key: tpl.key,
              name: tpl.name,
              category: tpl.category,
              description: tpl.description,
              subject: tpl.subject,
              bodyHtml: tpl.bodyHtml.trim(),
              variables: tpl.variables,
              isActive: true,
              isSystem: true,
            },
          })
        }
      }
      this.defaultTemplatesEnsured = true
    } catch (err) {
      console.error("[EmailService] Failed to ensure default templates:", err)
    }
  }

  /**
   * Lists all email templates with category filtering
   */
  static async listTemplates(category?: EmailCategory) {
    await this.ensureDefaultTemplates()

    return prisma.emailTemplate.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    })
  }

  /**
   * Gets a single template by ID
   */
  static async getTemplateById(id: string) {
    return prisma.emailTemplate.findUnique({
      where: { id },
    })
  }

  /**
   * Gets a template by key
   */
  static async getTemplateByKey(key: string) {
    return prisma.emailTemplate.findUnique({
      where: { key },
    })
  }

  /**
   * Updates an existing email template
   */
  static async updateTemplate(
    id: string,
    data: {
      subject?: string
      bodyHtml?: string
      isActive?: boolean
      name?: string
      description?: string
    }
  ) {
    return prisma.emailTemplate.update({
      where: { id },
      data,
    })
  }

  /**
   * Resets an email template back to factory default
   */
  static async resetTemplate(id: string) {
    const current = await prisma.emailTemplate.findUnique({ where: { id } })
    if (!current) throw new Error("Template not found")

    const def = DEFAULT_EMAIL_TEMPLATES.find((d) => d.key === current.key)
    if (!def) throw new Error("Default definition not found for this template")

    return prisma.emailTemplate.update({
      where: { id },
      data: {
        subject: def.subject,
        bodyHtml: def.bodyHtml.trim(),
        variables: def.variables,
        isActive: true,
      },
    })
  }

  /**
   * Dispatches a single dynamic templated email with automatic retry on transient connection drops
   */
  static async sendTemplatedEmail(
    templateKey: string,
    recipient: EmailRecipient,
    variables: Record<string, unknown> = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanEmail = recipient.email?.trim().toLowerCase()
      if (!cleanEmail || !cleanEmail.includes("@")) {
        console.warn(`[EmailService] Invalid recipient email: ${recipient.email}`)
        return { success: false, error: "Invalid recipient email address" }
      }

      const config = await getSmtpConfig()

      if (!config.isEmailEnabled) {
        console.log(`[EmailService] Email skipped for ${cleanEmail} (Email disabled in system settings)`)
        return { success: true }
      }

      await this.ensureDefaultTemplates()

      const template = await prisma.emailTemplate.findUnique({
        where: { key: templateKey },
      })

      if (!template) {
        console.warn(`[EmailService] Template ${templateKey} not found`)
        return { success: false, error: `Template ${templateKey} not found` }
      }

      if (!template.isActive) {
        console.log(`[EmailService] Template ${templateKey} is disabled by admin`)
        return { success: true }
      }

      // Add common default variables
      const mergedVariables: Record<string, unknown> = {
        userName: recipient.name || "Member",
        userEmail: cleanEmail,
        siteName: SITE_NAME,
        siteUrl: SITE_URL.origin,
        ...variables,
      }

      const rawSubject = interpolateVariables(template.subject, mergedVariables)
      const interpolatedBody = interpolateVariables(template.bodyHtml, mergedVariables)
      const fullHtml = wrapInBrandedLayout(interpolatedBody, rawSubject)
      const textContent = htmlToPlainText(interpolatedBody)

      const fromAddress = formatFromAddress(config)

      let messageId: string | undefined

      // Attempt 1 with cached/active transporter
      try {
        const { transporter } = await createEmailTransporter()
        const info = await transporter.sendMail({
          from: fromAddress,
          to: cleanEmail,
          subject: rawSubject,
          html: fullHtml,
          text: textContent,
        })
        messageId = info.messageId
      } catch (firstErr) {
        const firstErrMsg = firstErr instanceof Error ? firstErr.message : String(firstErr)
        console.warn(
          `[EmailService] First send attempt failed for ${cleanEmail} (${firstErrMsg}). Invalidating cache and retrying...`
        )

        // Invalidate stale connection cache and retry once
        invalidateTransporterCache()
        await new Promise((res) => setTimeout(res, 400))

        const { transporter } = await createEmailTransporter()
        const info = await transporter.sendMail({
          from: fromAddress,
          to: cleanEmail,
          subject: rawSubject,
          html: fullHtml,
          text: textContent,
        })
        messageId = info.messageId
      }

      // Log successful email
      await prisma.emailLog.create({
        data: {
          to: cleanEmail,
          recipientName: recipient.name || null,
          userId: recipient.userId || null,
          templateKey,
          subject: rawSubject,
          category: template.category,
          status: EmailLogStatus.SENT,
          metadata: { messageId },
          sentAt: new Date(),
        },
      })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send email"
      console.error(`[EmailService] Error sending email ${templateKey} to ${recipient.email}:`, error)

      // Log failure in DB
      try {
        await prisma.emailLog.create({
          data: {
            to: recipient.email || "unknown",
            recipientName: recipient.name || null,
            userId: recipient.userId || null,
            templateKey,
            subject: templateKey,
            status: EmailLogStatus.FAILED,
            errorMessage: message,
          },
        })
      } catch (logErr) {
        console.error("[EmailService] Failed to record email error log:", logErr)
      }

      return { success: false, error: message }
    }
  }

  /**
   * Builds the Prisma where condition for bulk recipient audience filtering
   */
  private static buildAudienceWhere(filter: BulkAudienceFilter): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {}

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive
    }

    if (filter.role) {
      where.roles = { has: filter.role }
    }

    if (filter.search?.trim()) {
      const q = filter.search.trim()
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { member: { studentId: { contains: q, mode: "insensitive" } } },
      ]
    }

    // Member profile filters
    const memberConditions: Prisma.MemberWhereInput = {}
    let hasMemberFilter = false

    if (filter.department) {
      memberConditions.department = filter.department
      hasMemberFilter = true
    }
    if (filter.semester) {
      memberConditions.semester = filter.semester
      hasMemberFilter = true
    }
    if (filter.shift) {
      memberConditions.shift = filter.shift
      hasMemberFilter = true
    }
    if (filter.session?.trim()) {
      memberConditions.session = { contains: filter.session.trim(), mode: "insensitive" }
      hasMemberFilter = true
    }
    if (filter.membershipStatus) {
      memberConditions.status = filter.membershipStatus
      hasMemberFilter = true
    }
    if (filter.verificationStatus) {
      memberConditions.verificationStatus = filter.verificationStatus
      hasMemberFilter = true
    }

    if (hasMemberFilter) {
      where.member = memberConditions
    }

    // Course Enrollment filters
    if (filter.courseId) {
      where.courseEnrollments = {
        some: {
          courseId: filter.courseId,
          ...(filter.courseStatus ? { status: filter.courseStatus } : {}),
        },
      }
    }

    // Event Registration filters
    if (filter.eventId) {
      where.eventRegistrations = {
        some: {
          eventId: filter.eventId,
          ...(filter.eventStatus ? { status: filter.eventStatus } : {}),
        },
      }
    }

    return where
  }

  /**
   * Gets recipient count and a sample list for the chosen audience filters
   */
  static async getRecipientAudience(filter: BulkAudienceFilter, limit = 50) {
    const where = this.buildAudienceWhere(filter)

    const [total, sample] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          roles: true,
          member: {
            select: {
              studentId: true,
              department: true,
              semester: true,
              shift: true,
              session: true,
              status: true,
              verificationStatus: true,
            },
          },
        },
        orderBy: { name: "asc" },
      }),
    ])

    return { total, sample }
  }

  /**
   * Sends bulk emails to filtered users with batch throttling (Gmail safe)
   */
  static async sendBulkCampaign(options: {
    filters: BulkAudienceFilter
    subject: string
    bodyHtml: string
    batchSize?: number
    delayMsBetweenBatches?: number
  }) {
    const {
      filters,
      subject,
      bodyHtml,
      batchSize = 5,
      delayMsBetweenBatches = 300,
    } = options

    const config = await getSmtpConfig()
    if (!config.isEmailEnabled) {
      throw new Error("Email sending is currently disabled in system settings")
    }

    const where = this.buildAudienceWhere(filters)
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        member: {
          select: {
            studentId: true,
            department: true,
            semester: true,
            shift: true,
            session: true,
          },
        },
      },
    })

    const fromAddress = formatFromAddress(config)

    const validUsers = users.filter((u) => u.email && u.email.trim().includes("@"))
    if (validUsers.length === 0) {
      return { total: users.length, sent: 0, failed: users.length, errors: [{ email: "Bulk Batch", error: "No valid email addresses found in matched audience" }] }
    }

    let { transporter } = await createEmailTransporter()

    let sent = 0
    let failed = 0
    const errors: { email: string; error: string }[] = []

    for (let i = 0; i < validUsers.length; i += batchSize) {
      const batch = validUsers.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (u) => {
          const cleanEmail = u.email.trim().toLowerCase()
          const userVariables: Record<string, unknown> = {
            userName: u.name,
            email: cleanEmail,
            studentId: u.member?.studentId || "N/A",
            department: u.member?.department || "N/A",
            semester: u.member?.semester || "N/A",
            shift: u.member?.shift || "N/A",
            session: u.member?.session || "N/A",
            siteName: SITE_NAME,
            siteUrl: SITE_URL.origin,
          }

          const rawSubject = interpolateVariables(subject, userVariables)
          const interpolatedBody = interpolateVariables(bodyHtml, userVariables)
          const fullHtml = wrapInBrandedLayout(interpolatedBody, rawSubject)
          const textContent = htmlToPlainText(interpolatedBody)

          try {
            let info
            try {
              info = await transporter.sendMail({
                from: fromAddress,
                to: cleanEmail,
                subject: rawSubject,
                html: fullHtml,
                text: textContent,
              })
            } catch (retryErr) {
              // On connection drop in bulk batch, refresh transporter and retry once
              invalidateTransporterCache()
              const refreshed = await createEmailTransporter()
              transporter = refreshed.transporter
              info = await transporter.sendMail({
                from: fromAddress,
                to: cleanEmail,
                subject: rawSubject,
                html: fullHtml,
                text: textContent,
              })
            }

            await prisma.emailLog.create({
              data: {
                to: cleanEmail,
                recipientName: u.name,
                userId: u.id,
                subject: rawSubject,
                category: EmailCategory.BULK,
                status: EmailLogStatus.SENT,
                metadata: { messageId: info.messageId },
                sentAt: new Date(),
              },
            })

            sent++
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Sending failed"
            failed++
            errors.push({ email: cleanEmail, error: errMsg })

            await prisma.emailLog.create({
              data: {
                to: cleanEmail,
                recipientName: u.name,
                userId: u.id,
                subject: rawSubject,
                category: EmailCategory.BULK,
                status: EmailLogStatus.FAILED,
                errorMessage: errMsg,
              },
            })
          }
        })
      )

      // Throttle delay between batches to respect Gmail SMTP quotas
      if (i + batchSize < users.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMsBetweenBatches))
      }
    }

    return {
      total: users.length,
      sent,
      failed,
      errors: errors.slice(0, 15),
    }
  }

  /**
   * Queries paginated email dispatch logs
   */
  static async listLogs(params: {
    page?: number
    pageSize?: number
    status?: EmailLogStatus
    category?: EmailCategory
    search?: string
  }) {
    const page = Math.max(1, params.page || 1)
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20))

    const where: Prisma.EmailLogWhereInput = {}
    if (params.status) where.status = params.status
    if (params.category) where.category = params.category
    if (params.search?.trim()) {
      const q = params.search.trim()
      where.OR = [
        { to: { contains: q, mode: "insensitive" } },
        { recipientName: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
        { templateKey: { contains: q, mode: "insensitive" } },
      ]
    }

    const [total, logs] = await Promise.all([
      prisma.emailLog.count({ where }),
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    }
  }
}
