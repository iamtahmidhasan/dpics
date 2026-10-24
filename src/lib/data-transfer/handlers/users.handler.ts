import prisma from "@/lib/prisma"
import {
  Department,
  InstructorStatus,
  MembershipStatus,
  PaymentMethod,
  Role,
  Semester,
  Shift,
  VerificationStatus,
} from "@/generated/prisma/enums"
import {
  parseArrayField,
  parseBooleanField,
  serializeArrayField,
} from "../csv-utils"
import type { ImportOptions, ImportResult } from "../types"

// Enum normalization helpers
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

export async function exportUsers(): Promise<Record<string, unknown>[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      member: true,
      instructor: true,
    },
  })

  return users.map((u) => ({
    name: u.name,
    email: u.email,
    phone: u.phone || "",
    roles: u.roles.join(","),
    isActive: u.isActive,
    image: serializeArrayField(u.image, true),
    selactedImg: u.selactedImg || "0",
    coverImg: u.coverImg || "1",
    address: u.address || "",
    bloodGroup: u.bloodGroup || "",
    whatsappNumber: u.whatsappNumber || "",
    bio: u.bio || "",
    skills: u.skills.join(","),
    // Member details
    studentId: u.member?.studentId || "",
    boardOrClassRoll: u.member?.boardOrClassRoll || "",
    department: u.member?.department || "",
    session: u.member?.session || "",
    semester: u.member?.semester || "",
    shift: u.member?.shift || "",
    memberStatus: u.member?.status || "",
    studentIdCardUrl: u.member?.studentIdCardUrl || "",
    nidorbirthUrl: u.member?.nidorbirthUrl || "",
    verificationStatus: u.member?.verificationStatus || "",
    hasPaidMembershipFee: u.member?.hasPaidMembershipFee ?? false,
    paymentMethod: u.member?.paymentMethod || "",
    senderNumber: u.member?.senderNumber || "",
    transactionId: u.member?.transactionId || "",
    // Instructor details
    instructorId: u.instructor?.instructorId || "",
    instructorStatus: u.instructor?.status || "",
    createdAt: u.createdAt.toISOString(),
  }))
}

export async function importUsers(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    entity: "users",
    format: "csv",
    totalRows: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    dryRun: !!options.dryRun,
    errors: [],
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1
    const email = String(row.email || "").trim().toLowerCase()
    const name = String(row.name || "").trim()

    if (!email || !email.includes("@")) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: email || "unknown",
        message: "Valid email is required",
      })
      continue
    }

    if (!name) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: email,
        message: "Name is required",
      })
      continue
    }

    // Parse roles
    const rawRoles = parseArrayField(row.roles)
    const validRoles: Role[] = []
    for (const r of rawRoles) {
      const upper = r.toUpperCase()
      if (upper in Role) {
        validRoles.push(upper as Role)
      }
    }
    if (validRoles.length === 0) {
      validRoles.push(Role.USER)
    }

    const phone = row.phone ? String(row.phone).trim() : null
    const isActive = parseBooleanField(row.isActive, true)
    const address = row.address ? String(row.address).trim() : null
    const bloodGroup = row.bloodGroup ? String(row.bloodGroup).trim() : null
    const whatsappNumber = row.whatsappNumber ? String(row.whatsappNumber).trim() : null
    const bio = row.bio ? String(row.bio).trim() : null
    const skills = parseArrayField(row.skills)

    // Images
    const image = parseArrayField(row.image, true)
    const selactedImg = row.selactedImg ? String(row.selactedImg).trim() : "0"
    const coverImg = row.coverImg ? String(row.coverImg).trim() : "1"

    // Member profile parsing
    const studentId = row.studentId ? String(row.studentId).trim() : null
    const boardOrClassRoll = row.boardOrClassRoll ? String(row.boardOrClassRoll).trim() : null
    const department = normalizeDepartment(row.department)
    const session = row.session ? String(row.session).trim() : null
    const semester = normalizeSemester(row.semester)
    const shift = normalizeShift(row.shift)

    const memberStatusStr = String(row.memberStatus || "").trim().toUpperCase()
    const memberStatus = memberStatusStr in MembershipStatus ? (memberStatusStr as MembershipStatus) : MembershipStatus.ACTIVE

    const studentIdCardUrl = row.studentIdCardUrl ? String(row.studentIdCardUrl).trim() : null
    const nidorbirthUrl = row.nidorbirthUrl ? String(row.nidorbirthUrl).trim() : null
    const verificationStatusStr = String(row.verificationStatus || "").trim().toUpperCase()
    const verificationStatus = verificationStatusStr in VerificationStatus ? (verificationStatusStr as VerificationStatus) : VerificationStatus.PENDING
    const hasPaidMembershipFee = parseBooleanField(row.hasPaidMembershipFee, false)
    const paymentMethodStr = String(row.paymentMethod || "").trim().toUpperCase()
    const paymentMethod = paymentMethodStr in PaymentMethod ? (paymentMethodStr as PaymentMethod) : null
    const senderNumber = row.senderNumber ? String(row.senderNumber).trim() : null
    const transactionId = row.transactionId ? String(row.transactionId).trim() : null

    // Instructor profile parsing
    const instructorId = row.instructorId ? String(row.instructorId).trim() : null
    const instructorStatusStr = String(row.instructorStatus || "").trim().toUpperCase()
    const instructorStatus = instructorStatusStr in InstructorStatus ? (instructorStatusStr as InstructorStatus) : InstructorStatus.ACTIVE

    const hasMemberData = studentId || department || session || semester || shift || studentIdCardUrl || nidorbirthUrl

    if (options.dryRun) {
      const existing = await prisma.user.findUnique({ where: { email } })
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
      const existing = await prisma.user.findUnique({
        where: { email },
        include: { member: true, instructor: true },
      })

      if (existing) {
        if (options.mode === "create_only") {
          result.skipped++
          continue
        }

        // Update user
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            name,
            phone: phone || existing.phone,
            roles: validRoles,
            isActive,
            image: image.length > 0 ? image : existing.image,
            selactedImg: selactedImg || existing.selactedImg,
            coverImg: coverImg || existing.coverImg,
            address: address !== null ? address : existing.address,
            bloodGroup: bloodGroup !== null ? bloodGroup : existing.bloodGroup,
            whatsappNumber: whatsappNumber !== null ? whatsappNumber : existing.whatsappNumber,
            bio: bio !== null ? bio : existing.bio,
            skills: skills.length > 0 ? skills : existing.skills,
          },
        })

        // Update / create member if applicable
        if (hasMemberData) {
          if (existing.member) {
            await prisma.member.update({
              where: { id: existing.member.id },
              data: {
                studentId: studentId || existing.member.studentId,
                boardOrClassRoll: boardOrClassRoll || existing.member.boardOrClassRoll,
                department: department || existing.member.department,
                session: session || existing.member.session,
                semester: semester || existing.member.semester,
                shift: shift || existing.member.shift,
                status: memberStatus,
                studentIdCardUrl: studentIdCardUrl || existing.member.studentIdCardUrl,
                nidorbirthUrl: nidorbirthUrl || existing.member.nidorbirthUrl,
                verificationStatus: verificationStatus || existing.member.verificationStatus,
                hasPaidMembershipFee,
                paymentMethod: paymentMethod || existing.member.paymentMethod,
                senderNumber: senderNumber || existing.member.senderNumber,
                transactionId: transactionId || existing.member.transactionId,
              },
            })
          } else {
            // Create member profile with defaults for non-nullable department/session/semester/shift
            await prisma.member.create({
              data: {
                userId: existing.id,
                studentId,
                boardOrClassRoll,
                department: department || Department.COMPUTER_SCIENCE_AND_TECHNOLOGY,
                session: session || "2024-25",
                semester: semester || Semester.FIRST,
                shift: shift || Shift.MORNING,
                status: memberStatus,
                studentIdCardUrl,
                nidorbirthUrl,
                verificationStatus,
                hasPaidMembershipFee,
                paymentMethod,
                senderNumber,
                transactionId,
              },
            })
          }
        }

        // Update / create instructor
        if (instructorId) {
          if (existing.instructor) {
            await prisma.instructor.update({
              where: { id: existing.instructor.id },
              data: {
                instructorId,
                status: instructorStatus,
              },
            })
          } else {
            await prisma.instructor.create({
              data: {
                userId: existing.id,
                instructorId,
                status: instructorStatus,
              },
            })
          }
        }

        result.updated++
      } else {
        // Create new user
        const createdUser = await prisma.user.create({
          data: {
            name,
            email,
            phone,
            roles: validRoles,
            isActive,
            image,
            selactedImg,
            coverImg,
            address,
            bloodGroup,
            whatsappNumber,
            bio,
            skills,
            createdAt: new Date(),
          },
        })

        if (hasMemberData) {
          await prisma.member.create({
            data: {
              userId: createdUser.id,
              studentId,
              boardOrClassRoll,
              department: department || Department.COMPUTER_SCIENCE_AND_TECHNOLOGY,
              session: session || "2024-25",
              semester: semester || Semester.FIRST,
              shift: shift || Shift.MORNING,
              status: memberStatus,
              studentIdCardUrl,
              nidorbirthUrl,
              verificationStatus,
              hasPaidMembershipFee,
              paymentMethod,
              senderNumber,
              transactionId,
            },
          })
        }

        if (instructorId) {
          await prisma.instructor.create({
            data: {
              userId: createdUser.id,
              instructorId,
              status: instructorStatus,
            },
          })
        }

        result.created++
      }
    } catch (err: unknown) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: email,
        message: err instanceof Error ? err.message : "Unknown database error",
      })
    }
  }

  result.success = result.failed === 0
  return result
}
