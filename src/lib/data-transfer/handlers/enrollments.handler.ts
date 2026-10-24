import prisma from "@/lib/prisma"
import { EnrollmentStatus, PaymentMethod } from "@/generated/prisma/enums"
import type { ImportOptions, ImportResult } from "../types"

export async function exportEnrollments(): Promise<Record<string, unknown>[]> {
  const enrollments = await prisma.courseEnrollment.findMany({
    orderBy: { enrolledAt: "desc" },
    include: {
      course: { select: { slug: true, title: true } },
      user: { select: { email: true, name: true } },
    },
  })

  return enrollments.map((e) => ({
    courseSlug: e.course.slug,
    courseTitle: e.course.title,
    userEmail: e.user.email,
    userName: e.user.name,
    status: e.status,
    paymentMethod: e.paymentMethod || "",
    senderNumber: e.senderNumber || "",
    transactionId: e.transactionId || "",
    amountPaid: e.amountPaid,
    adminNote: e.adminNote || "",
    enrolledAt: e.enrolledAt.toISOString(),
    approvedAt: e.approvedAt ? e.approvedAt.toISOString() : "",
  }))
}

export async function importEnrollments(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    entity: "enrollments",
    format: "csv",
    totalRows: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    dryRun: !!options.dryRun,
    errors: [],
  }

  // Pre-fetch courses for lookup
  const courses = await prisma.course.findMany({
    select: { id: true, slug: true },
  })
  const courseMap = new Map(courses.map((c) => [c.slug.toLowerCase(), c.id]))

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1

    const courseSlug = String(row.courseSlug || "").trim().toLowerCase()
    const userEmail = String(row.userEmail || "").trim().toLowerCase()

    if (!courseSlug || !userEmail) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: `${courseSlug}:${userEmail}`,
        message: "courseSlug and userEmail are required",
      })
      continue
    }

    const courseId = courseMap.get(courseSlug)
    if (!courseId) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: courseSlug,
        message: `Course with slug '${courseSlug}' not found`,
      })
      continue
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    })
    if (!user) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: userEmail,
        message: `User with email '${userEmail}' not found`,
      })
      continue
    }

    const statusStr = String(row.status || "").trim().toUpperCase()
    const status = statusStr in EnrollmentStatus ? (statusStr as EnrollmentStatus) : EnrollmentStatus.ACTIVE

    const paymentMethodStr = String(row.paymentMethod || "").trim().toUpperCase().replace(/[-\s]+/g, "_")
    const paymentMethod = paymentMethodStr in PaymentMethod ? (paymentMethodStr as PaymentMethod) : null

    const senderNumber = row.senderNumber ? String(row.senderNumber).trim() : null
    const transactionId = row.transactionId ? String(row.transactionId).trim() : null
    const amountPaid = Number(row.amountPaid) || 0
    const adminNote = row.adminNote ? String(row.adminNote).trim() : null

    if (options.dryRun) {
      const existing = await prisma.courseEnrollment.findUnique({
        where: { courseId_userId: { courseId, userId: user.id } },
      })
      if (existing) {
        if (options.mode === "upsert") {
          result.updated++
        } else {
          result.skipped++
        }
      } else {
        result.created++
      }
      continue
    }

    try {
      const existing = await prisma.courseEnrollment.findUnique({
        where: { courseId_userId: { courseId, userId: user.id } },
      })

      if (existing) {
        if (options.mode === "create_only") {
          result.skipped++
          continue
        }

        await prisma.courseEnrollment.update({
          where: { id: existing.id },
          data: {
            status,
            paymentMethod,
            senderNumber,
            transactionId,
            amountPaid,
            adminNote,
            approvedAt: status === EnrollmentStatus.ACTIVE ? new Date() : existing.approvedAt,
            approvedById: status === EnrollmentStatus.ACTIVE ? options.actor?.id || null : existing.approvedById,
          },
        })
        result.updated++
      } else {
        await prisma.courseEnrollment.create({
          data: {
            courseId,
            userId: user.id,
            status,
            paymentMethod,
            senderNumber,
            transactionId,
            amountPaid,
            adminNote,
            approvedAt: status === EnrollmentStatus.ACTIVE ? new Date() : null,
            approvedById: status === EnrollmentStatus.ACTIVE ? options.actor?.id || null : null,
          },
        })
        result.created++
      }
    } catch (err: unknown) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: `${courseSlug}:${userEmail}`,
        message: err instanceof Error ? err.message : "Database error",
      })
    }
  }

  result.success = result.failed === 0
  return result
}
