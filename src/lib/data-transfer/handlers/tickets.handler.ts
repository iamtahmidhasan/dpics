import prisma from "@/lib/prisma"
import {
  Department,
  EventRegistrationStatus,
  PaymentMethod,
  Semester,
  Shift,
} from "@/generated/prisma/enums"
import type { ImportOptions, ImportResult } from "../types"

function normalizeDepartment(val: unknown): Department | null {
  if (!val) return null
  const s = String(val).trim().toUpperCase().replace(/[-\s]+/g, "_")
  if (s in Department) return s as Department
  if (s === "CST" || s.includes("COMPUTER")) return Department.COMPUTER_SCIENCE_AND_TECHNOLOGY
  if (s === "CIVIL") return Department.CIVIL_TECHNOLOGY
  if (s === "ELECTRICAL") return Department.ELECTRICAL_TECHNOLOGY
  if (s === "ELECTRONICS") return Department.ELECTRONICS_TECHNOLOGY
  if (s === "MECHANICAL") return Department.MECHANICAL_TECHNOLOGY
  if (s === "POWER") return Department.POWER_TECHNOLOGY
  if (s === "RAC") return Department.RAC_TECHNOLOGY
  if (s === "ARCHITECTURE") return Department.ARCHITECTURE_TECHNOLOGY
  if (s === "FOOD") return Department.FOOD_TECHNOLOGY
  if (s === "CHEMICAL") return Department.CHEMICAL_TECHNOLOGY
  if (s === "TELECOMMUNICATION") return Department.TELECOMMUNICATION_TECHNOLOGY
  if (s === "AUTOMOBILE") return Department.AUTOMOBILE_TECHNOLOGY
  if (s === "CONSTRUCTION") return Department.CONSTRUCTION_TECHNOLOGY
  if (s === "ENVIRONMENTAL") return Department.ENVIRONMENTAL_TECHNOLOGY
  if (s === "GRAPHIC" || s.includes("GRAPHIC")) return Department.GRAPHIC_DESIGN_TECHNOLOGY
  if (s === "SURVEYING") return Department.SURVEYING_TECHNOLOGY
  return null
}

function normalizeSemester(val: unknown): Semester | null {
  if (!val) return null
  const s = String(val).trim().toUpperCase().replace(/[-\s]+/g, "_")
  if (s in Semester) return s as Semester
  if (s === "1" || s === "1ST" || s === "FIRST") return Semester.FIRST
  if (s === "2" || s === "2ND" || s === "SECOND") return Semester.SECOND
  if (s === "3" || s === "3RD" || s === "THIRD") return Semester.THIRD
  if (s === "4" || s === "4TH" || s === "FOURTH") return Semester.FOURTH
  if (s === "5" || s === "5TH" || s === "FIFTH") return Semester.FIFTH
  if (s === "6" || s === "6TH" || s === "SIXTH") return Semester.SIXTH
  if (s === "7" || s === "7TH" || s === "SEVENTH") return Semester.SEVENTH
  if (s === "8" || s === "8TH" || s === "EIGHTH") return Semester.EIGHTH
  return null
}

function normalizeShift(val: unknown): Shift | null {
  if (!val) return null
  const s = String(val).trim().toUpperCase()
  if (s in Shift) return s as Shift
  if (s === "1" || s === "1ST" || s === "FIRST" || s === "MORNING") return Shift.MORNING
  if (s === "2" || s === "2ND" || s === "SECOND" || s === "DAY") return Shift.DAY
  return null
}

export async function exportTickets(): Promise<Record<string, unknown>[]> {
  const registrations = await prisma.eventRegistration.findMany({
    orderBy: { registeredAt: "desc" },
    include: {
      event: { select: { slug: true, title: true } },
      user: { select: { email: true } },
    },
  })

  return registrations.map((r) => ({
    ticketCode: r.ticketCode,
    eventSlug: r.event.slug,
    eventTitle: r.event.title,
    userEmail: r.user?.email || "",
    name: r.name,
    email: r.email,
    phone: r.phone,
    studentId: r.studentId || "",
    department: r.department || "",
    semester: r.semester || "",
    shift: r.shift || "",
    institution: r.institution || "",
    status: r.status,
    paymentMethod: r.paymentMethod || "",
    senderNumber: r.senderNumber || "",
    transactionId: r.transactionId || "",
    amountPaid: r.amountPaid,
    notes: r.notes || "",
    registeredAt: r.registeredAt.toISOString(),
    confirmedAt: r.confirmedAt ? r.confirmedAt.toISOString() : "",
  }))
}

export async function importTickets(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    entity: "tickets",
    format: "csv",
    totalRows: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    dryRun: !!options.dryRun,
    errors: [],
  }

  // Pre-fetch events for lookup
  const events = await prisma.event.findMany({
    select: { id: true, slug: true },
  })
  const eventMap = new Map(events.map((e) => [e.slug.toLowerCase(), e.id]))

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1

    const eventSlug = String(row.eventSlug || "").trim().toLowerCase()
    const eventId = eventMap.get(eventSlug)

    if (!eventId) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: eventSlug || "unknown",
        message: `Event with slug '${eventSlug}' not found`,
      })
      continue
    }

    const name = String(row.name || "").trim()
    const email = String(row.email || "").trim().toLowerCase()
    const phone = String(row.phone || "").trim()

    if (!name || !email || !phone) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: email || "unknown",
        message: "Name, email, and phone are required for ticket attendee",
      })
      continue
    }

    let ticketCode = String(row.ticketCode || "").trim().toUpperCase()
    if (!ticketCode) {
      // Auto-generate ticket code: TC-XXXXXX
      ticketCode = `TC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    }

    const statusStr = String(row.status || "").trim().toUpperCase()
    const status = statusStr in EventRegistrationStatus
      ? (statusStr as EventRegistrationStatus)
      : EventRegistrationStatus.CONFIRMED

    const paymentMethodStr = String(row.paymentMethod || "").trim().toUpperCase()
    const paymentMethod = paymentMethodStr in PaymentMethod ? (paymentMethodStr as PaymentMethod) : null

    const department = normalizeDepartment(row.department)
    const semester = normalizeSemester(row.semester)
    const shift = normalizeShift(row.shift)

    const amountPaid = Number(row.amountPaid) || 0
    const studentId = row.studentId ? String(row.studentId).trim() : null
    const institution = row.institution ? String(row.institution).trim() : null
    const senderNumber = row.senderNumber ? String(row.senderNumber).trim() : null
    const transactionId = row.transactionId ? String(row.transactionId).trim() : null
    const notes = row.notes ? String(row.notes).trim() : null

    // Link user if registered
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (options.dryRun) {
      const existing = await prisma.eventRegistration.findUnique({ where: { ticketCode } })
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
      const existing = await prisma.eventRegistration.findUnique({ where: { ticketCode } })

      if (existing) {
        if (options.mode === "create_only") {
          result.skipped++
          continue
        }

        await prisma.eventRegistration.update({
          where: { id: existing.id },
          data: {
            eventId,
            userId: user?.id || existing.userId,
            name,
            email,
            phone,
            studentId,
            department,
            semester,
            shift,
            institution,
            status,
            paymentMethod,
            senderNumber,
            transactionId,
            amountPaid,
            notes,
            confirmedAt: status === EventRegistrationStatus.CONFIRMED ? new Date() : existing.confirmedAt,
          },
        })
        result.updated++
      } else {
        await prisma.eventRegistration.create({
          data: {
            ticketCode,
            eventId,
            userId: user?.id || null,
            name,
            email,
            phone,
            studentId,
            department,
            semester,
            shift,
            institution,
            status,
            paymentMethod,
            senderNumber,
            transactionId,
            amountPaid,
            notes,
            confirmedAt: status === EventRegistrationStatus.CONFIRMED ? new Date() : null,
          },
        })
        result.created++
      }
    } catch (err: unknown) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: ticketCode,
        message: err instanceof Error ? err.message : "Database error",
      })
    }
  }

  result.success = result.failed === 0
  return result
}
