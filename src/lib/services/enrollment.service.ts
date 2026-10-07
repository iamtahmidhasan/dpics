import "server-only"

import prisma from "@/lib/prisma"
import type { EnrollmentStatus, PaymentMethod } from "@/generated/prisma/enums"
import { EmailService } from "@/lib/services/email.service"
import { SITE_URL } from "@/lib/site"

export interface EnrollInput {
  courseId: string
  userId: string
  paymentMethod?: PaymentMethod | null
  senderNumber?: string | null
  transactionId?: string | null
}

export class EnrollmentService {
  /**
   * Enroll in a course (Instant for free, Pending for paid)
   */
  static async enroll({
    courseId,
    userId,
    paymentMethod,
    senderNumber,
    transactionId,
  }: EnrollInput) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        slug: true,
        isFree: true,
        price: true,
        discountPrice: true,
        isPublished: true,
      },
    })

    if (!course) {
      throw new Error("Course not found")
    }

    if (!course.isPublished) {
      throw new Error("This course is currently not open for enrollment")
    }

    // Check if user is already enrolled
    const existing = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    })

    if (existing && existing.status === "ACTIVE") {
      return {
        success: true,
        status: "ACTIVE" as EnrollmentStatus,
        message: "You are already actively enrolled in this course.",
        enrollment: existing,
      }
    }

    if (existing && existing.status === "PENDING") {
      return {
        success: true,
        status: "PENDING" as EnrollmentStatus,
        message: "Your enrollment request is already pending admin verification.",
        enrollment: existing,
      }
    }

    // Free Course flow
    if (course.isFree) {
      const enrollment = await prisma.courseEnrollment.upsert({
        where: {
          courseId_userId: {
            courseId,
            userId,
          },
        },
        create: {
          courseId,
          userId,
          status: "ACTIVE",
          amountPaid: 0,
          approvedAt: new Date(),
        },
        update: {
          status: "ACTIVE",
          amountPaid: 0,
          approvedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      })

      // Dispatch free course enrollment approved email
      try {
        if (enrollment.user?.email) {
          await EmailService.sendTemplatedEmail(
            "COURSE_ENROLLMENT_ACTIVE",
            {
              email: enrollment.user.email,
              name: enrollment.user.name,
              userId: enrollment.user.id,
            },
            {
              courseTitle: course.title,
              courseUrl: `${SITE_URL.origin}/courses/${course.slug}`,
            }
          )
        }
      } catch (err) {
        console.error("[EnrollmentService] Failed to send free course enrollment email:", err)
      }

      return {
        success: true,
        status: "ACTIVE" as EnrollmentStatus,
        message: "Successfully enrolled in free course!",
        enrollment,
      }
    }

    // Paid Course flow
    if (!senderNumber || !senderNumber.trim()) {
      throw new Error("Sender mobile number is required for paid enrollment")
    }

    if (!transactionId || !transactionId.trim()) {
      throw new Error("Transaction ID (TrxID) is required for paid enrollment")
    }

    if (!paymentMethod) {
      throw new Error("Please select a payment method (e.g. bKash, Nagad, Rocket)")
    }

    const payableAmount = course.discountPrice ?? course.price

    const enrollment = await prisma.courseEnrollment.upsert({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
      create: {
        courseId,
        userId,
        status: "PENDING",
        paymentMethod: paymentMethod as PaymentMethod,
        senderNumber: senderNumber.trim(),
        transactionId: transactionId.trim().toUpperCase(),
        amountPaid: payableAmount,
      },
      update: {
        status: "PENDING",
        paymentMethod: paymentMethod as PaymentMethod,
        senderNumber: senderNumber.trim(),
        transactionId: transactionId.trim().toUpperCase(),
        amountPaid: payableAmount,
        enrolledAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    // Dispatch payment submitted confirmation email
    try {
      if (enrollment.user?.email) {
        await EmailService.sendTemplatedEmail(
          "COURSE_ENROLLMENT_SUBMITTED",
          {
            email: enrollment.user.email,
            name: enrollment.user.name,
            userId: enrollment.user.id,
          },
          {
            courseTitle: course.title,
            amountPaid: payableAmount,
            paymentMethod,
            transactionId: transactionId.trim().toUpperCase(),
          }
        )
      }
    } catch (err) {
      console.error("[EnrollmentService] Failed to send submission email:", err)
    }

    return {
      success: true,
      status: "PENDING" as EnrollmentStatus,
      message: "Payment submitted successfully! Your enrollment will be active once verified by admin.",
      enrollment,
    }
  }

  /**
   * Get user enrollment status for course
   */
  static async getUserEnrollment(courseId: string, userId: string) {
    return prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    })
  }

  /**
   * Get all courses user has enrolled in
   */
  static async listUserEnrollments(userId: string) {
    return prisma.courseEnrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            sections: {
              include: {
                lessons: {
                  select: { id: true },
                },
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    })
  }

  /**
   * Admin: List all enrollments with search and status filtering
   */
  static async listAdminEnrollments(params?: {
    status?: EnrollmentStatus
    courseId?: string
    search?: string
  }) {
    const { status, courseId, search } = params || {}

    const where: any = {}
    if (status) where.status = status
    if (courseId) where.courseId = courseId

    if (search && search.trim().length > 0) {
      where.OR = [
        { transactionId: { contains: search.trim(), mode: "insensitive" } },
        { senderNumber: { contains: search.trim() } },
        { user: { name: { contains: search.trim(), mode: "insensitive" } } },
        { user: { email: { contains: search.trim(), mode: "insensitive" } } },
      ]
    }

    return prisma.courseEnrollment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            selactedImg: true,
            phone: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            discountPrice: true,
            isFree: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * Admin: Approve or Reject Enrollment
   */
  static async updateEnrollmentStatus(
    enrollmentId: string,
    status: EnrollmentStatus | string,
    adminId: string,
    adminNote?: string
  ) {
    const updated = await prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: status as EnrollmentStatus,
        adminNote: adminNote || null,
        approvedAt: status === "ACTIVE" ? new Date() : null,
        approvedById: status === "ACTIVE" ? adminId : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    })

    // Dispatch email notification to student
    if (updated.user?.email) {
      try {
        const recipient = {
          email: updated.user.email,
          name: updated.user.name,
          userId: updated.user.id,
        }

        const courseUrl = `${SITE_URL.origin}/courses/${updated.course.slug}`

        if (status === "ACTIVE") {
          await EmailService.sendTemplatedEmail("COURSE_ENROLLMENT_ACTIVE", recipient, {
            courseTitle: updated.course.title,
            courseUrl,
          })
        } else if (status === "REJECTED") {
          await EmailService.sendTemplatedEmail("COURSE_ENROLLMENT_REJECTED", recipient, {
            courseTitle: updated.course.title,
            adminNote: adminNote || "Payment details could not be verified.",
          })
        } else if (status === "CANCELLED") {
          await EmailService.sendTemplatedEmail("COURSE_ENROLLMENT_CANCELLED", recipient, {
            courseTitle: updated.course.title,
            reason: adminNote || "Enrollment cancelled by administration.",
          })
        }
      } catch (err) {
        console.error("[EnrollmentService] Failed to send enrollment status email:", err)
      }
    }

    return updated
  }

  /**
   * Toggle lesson completed status for student
   */
  static async toggleLessonProgress(lessonId: string, userId: string, completed: boolean) {
    return prisma.lessonProgress.upsert({
      where: {
        lessonId_userId: {
          lessonId,
          userId,
        },
      },
      create: {
        lessonId,
        userId,
        completed,
        completedAt: completed ? new Date() : null,
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
      },
    })
  }
}
