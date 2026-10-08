import "server-only"

import { Prisma } from "@/generated/prisma/client"
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
import { ApiError } from "@/lib/api-error"
import prisma from "@/lib/prisma"
import { ActivityAction, ActivityLogService } from "@/lib/services/activity-log.service"
import { EmailService } from "@/lib/services/email.service"
import { SITE_URL } from "@/lib/site"
import { resolveUserImage } from "@/lib/user-image"
import {
  isRecord,
  toBoolean,
  toDateTime,
  toEnum,
  toEnumList,
  toImages,
  toOptionalEnum,
  toOptionalText,
  toSelectedImageIndex,
  toText,
  toUrl,
} from "@/lib/validation"

export type AdminUserSummary = {
  id: string
  name: string
  email: string
  phone: string | null
  roles: Role[]
  isActive: boolean
  avatar: string | null
  coverImg: string | null
  createdAt: string
  memberStatus: MembershipStatus | null
  instructorStatus: InstructorStatus | null
}

export type AdminUserPage = {
  users: AdminUserSummary[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type AdminMemberDetail = {
  id: string
  status: MembershipStatus
  joinedAt: string | null
  expiresAt: string | null
  studentId: string | null
  boardOrClassRoll: string | null
  department: Department
  session: string
  semester: Semester
  shift: Shift
  studentIdCardUrl: string | null
  nidorbirthUrl: string | null
  verificationStatus: VerificationStatus
  verifiedAt: string | null
  hasPaidMembershipFee: boolean
  paymentMethod: PaymentMethod | null
  senderNumber: string | null
  transactionId: string | null
  createdAt: string
  updatedAt: string
}

export type AdminInstructorDetail = {
  id: string
  instructorId: string | null
  status: InstructorStatus
  createdAt: string
  updatedAt: string
}

export type AdminCommitteeRole = {
  id: string
  roleId: string
  committeeId: string
  roleName: string
  roleSlug: string
  committeeName: string
  committeeSlug: string
  isActive: boolean
  startDate: string | null
  endDate: string | null
}

/** A connected login. Tokens and the password hash are deliberately never read. */
export type AdminAccountSummary = {
  id: string
  providerId: string
  accountId: string
  createdAt: string
  updatedAt: string
}

export type AdminSessionSummary = {
  total: number
  latestCreatedAt: string | null
  latestExpiresAt: string | null
  latestIpAddress: string | null
  latestUserAgent: string | null
}

export type AdminUserDetail = {
  id: string
  name: string
  email: string
  phone: string | null
  roles: Role[]
  isActive: boolean
  emailVerified: boolean
  images: string[]
  selectedImageIndex: number
  avatar: string | null
  address: string | null
  bloodGroup: string | null
  coverImg: string | null
  whatsappNumber: string | null
  bio: string | null
  skills: string[]
  createdAt: string
  updatedAt: string
  member: AdminMemberDetail | null
  instructor: AdminInstructorDetail | null
  committeeRoles: AdminCommitteeRole[]
  accounts: AdminAccountSummary[]
  sessions: AdminSessionSummary
}

export type AdminMemberInput = {
  status: MembershipStatus
  joinedAt: Date | null
  expiresAt: Date | null
  boardOrClassRoll: string | null
  department: Department
  session: string
  semester: Semester
  shift: Shift
  studentId: string | null
  studentIdCardUrl: string | null
  nidorbirthUrl: string | null
  verificationStatus: VerificationStatus
  verifiedAt: Date | null
  hasPaidMembershipFee: boolean
  paymentMethod: PaymentMethod | null
  senderNumber: string | null
  transactionId: string | null
}

export type AdminInstructorInput = {
  instructorId: string | null
  status: InstructorStatus
}

export type AdminUserInput = {
  user?: {
    name: string
    email: string
    phone: string | null
    images: string[]
    selectedImageIndex: number
    roles: Role[]
    isActive: boolean
    emailVerified: boolean
    address?: string | null
    bloodGroup?: string | null
    coverImg?: string | null
    whatsappNumber?: string | null
    bio?: string | null
    skills?: string[]
  }
  member?: AdminMemberInput
  instructor?: AdminInstructorInput
}

const memberSelect = {
  id: true,
  status: true,
  joinedAt: true,
  expiresAt: true,
  studentId: true,
  boardOrClassRoll: true,
  department: true,
  session: true,
  semester: true,
  shift: true,
  studentIdCardUrl: true,
  nidorbirthUrl: true,
  verificationStatus: true,
  verifiedAt: true,
  hasPaidMembershipFee: true,
  paymentMethod: true,
  senderNumber: true,
  transactionId: true,
  createdAt: true,
  updatedAt: true,
} as const

const instructorSelect = {
  id: true,
  instructorId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  roles: true,
  isActive: true,
  emailVerified: true,
  image: true,
  selactedImg: true,
  address: true,
  bloodGroup: true,
  coverImg: true,
  whatsappNumber: true,
  bio: true,
  skills: true,
  createdAt: true,
  updatedAt: true,
  member: { select: memberSelect },
  instructor: { select: instructorSelect },
  committeeRoles: {
    select: {
      id: true,
      roleId: true,
      isActive: true,
      startDate: true,
      endDate: true,
      role: {
        select: {
          committeeId: true,
          name: true,
          slug: true,
          committee: { select: { id: true, name: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  },
  accounts: {
    select: { id: true, providerId: true, accountId: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "asc" },
  },
} as const

type AdminUserRow = Prisma.UserGetPayload<{ select: typeof adminUserSelect }>

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

function toMap(row: AdminUserRow, sessions: AdminSessionSummary): AdminUserDetail {
  const { avatar, selectedImageIndex } = resolveUserImage(row.image, row.selactedImg)

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    roles: row.roles,
    isActive: row.isActive,
    emailVerified: row.emailVerified,
    images: row.image,
    selectedImageIndex: selectedImageIndex ?? 0,
    avatar,
    address: row.address,
    bloodGroup: row.bloodGroup,
    coverImg: row.coverImg || "1",
    whatsappNumber: row.whatsappNumber,
    bio: row.bio,
    skills: row.skills || [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    member: row.member
      ? {
          id: row.member.id,
          status: row.member.status,
          joinedAt: toIso(row.member.joinedAt),
          expiresAt: toIso(row.member.expiresAt),
          studentId: row.member.studentId,
          boardOrClassRoll: row.member.boardOrClassRoll,
          department: row.member.department,
          session: row.member.session,
          semester: row.member.semester,
          shift: row.member.shift,
          studentIdCardUrl: row.member.studentIdCardUrl,
          nidorbirthUrl: row.member.nidorbirthUrl,
          verificationStatus: row.member.verificationStatus,
          verifiedAt: toIso(row.member.verifiedAt),
          hasPaidMembershipFee: row.member.hasPaidMembershipFee,
          paymentMethod: row.member.paymentMethod,
          senderNumber: row.member.senderNumber,
          transactionId: row.member.transactionId,
          createdAt: row.member.createdAt.toISOString(),
          updatedAt: row.member.updatedAt.toISOString(),
        }
      : null,
    instructor: row.instructor
      ? {
          id: row.instructor.id,
          instructorId: row.instructor.instructorId,
          status: row.instructor.status,
          createdAt: row.instructor.createdAt.toISOString(),
          updatedAt: row.instructor.updatedAt.toISOString(),
        }
      : null,
    committeeRoles: row.committeeRoles.map((entry) => ({
      id: entry.id,
      roleId: entry.roleId,
      committeeId: entry.role.committeeId,
      roleName: entry.role.name,
      roleSlug: entry.role.slug,
      committeeName: entry.role.committee.name,
      committeeSlug: entry.role.committee.slug,
      isActive: entry.isActive,
      startDate: toIso(entry.startDate),
      endDate: toIso(entry.endDate),
    })),
    accounts: row.accounts.map((entry) => ({
      id: entry.id,
      providerId: entry.providerId,
      accountId: entry.accountId,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    })),
    sessions,
  }
}

async function getSessionSummary(userId: string): Promise<AdminSessionSummary> {
  const [total, latest] = await Promise.all([
    prisma.session.count({ where: { userId } }),
    prisma.session.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, expiresAt: true, ipAddress: true, userAgent: true },
    }),
  ])

  return {
    total,
    latestCreatedAt: toIso(latest?.createdAt ?? null),
    latestExpiresAt: toIso(latest?.expiresAt ?? null),
    latestIpAddress: latest?.ipAddress ?? null,
    latestUserAgent: latest?.userAgent ?? null,
  }
}

export async function listAdminUsers({
  page = 1,
  pageSize = 20,
  search,
  role,
}: {
  page?: number
  pageSize?: number
  search?: string
  role?: Role
} = {}): Promise<AdminUserPage> {
  const boundedPage = Math.max(1, page)
  const boundedPageSize = Math.max(1, Math.min(pageSize, 100))
  const skip = (boundedPage - 1) * boundedPageSize

  const where: Prisma.UserWhereInput = {}

  if (role) {
    where.roles = { has: role }
  }

  if (search && search.trim().length > 0) {
    const term = search.trim()
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { phone: { contains: term, mode: "insensitive" } },
      { member: { studentId: { contains: term, mode: "insensitive" } } },
      { member: { boardOrClassRoll: { contains: term, mode: "insensitive" } } },
      { instructor: { instructorId: { contains: term, mode: "insensitive" } } },
    ]
  }

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: boundedPageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        roles: true,
        isActive: true,
        image: true,
        selactedImg: true,
        coverImg: true,
        createdAt: true,
        member: { select: { status: true } },
        instructor: { select: { status: true } },
      },
    }),
  ])

  const users: AdminUserSummary[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    roles: row.roles,
    isActive: row.isActive,
    avatar: resolveUserImage(row.image, row.selactedImg).avatar,
    coverImg: row.coverImg || "1",
    createdAt: row.createdAt.toISOString(),
    memberStatus: row.member?.status ?? null,
    instructorStatus: row.instructor?.status ?? null,
  }))

  return {
    users,
    page: boundedPage,
    pageSize: boundedPageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / boundedPageSize)),
  }
}

export async function getAdminUserDetail(id: string): Promise<AdminUserDetail> {
  if (!id) throw ApiError.badRequest("User id is required")

  const [user, sessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: adminUserSelect,
    }),
    getSessionSummary(id),
  ])

  if (!user) throw ApiError.notFound("User not found")

  return toMap(user, sessions)
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_NAME_LENGTH = 100
const MAX_EMAIL_LENGTH = 191
const MAX_PHONE_LENGTH = 20
const MAX_SESSION_LENGTH = 20
const MAX_STUDENT_ID_LENGTH = 30
const MAX_TRANSACTION_ID_LENGTH = 60
const MAX_BIO_LENGTH = 1000
const MAX_ADDRESS_LENGTH = 250

function toSkillsList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      .map((entry) => entry.trim().slice(0, 50))
      .slice(0, 30)
  }
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw
      .split(/[,，]+/)
      .map((s) => s.trim().slice(0, 50))
      .filter((s) => s.length > 0)
      .slice(0, 30)
  }
  return []
}

/**
 * Validates the admin payload. Unlike the self-service profile parser this may
 * also change the server managed columns (roles, activation, membership and
 * verification status, payment fields), but it still reads nothing that is not
 * listed here.
 */
export function parseAdminUserInput(body: unknown): AdminUserInput {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

  const input: AdminUserInput = {}

  if (isRecord(body.user)) {
    const email = toText(body.user.email, "Email", { max: MAX_EMAIL_LENGTH }).toLowerCase()

    if (!EMAIL_PATTERN.test(email)) throw ApiError.badRequest("Email is not valid")

    const images = toImages(body.user.images)
    const roles = toEnumList(body.user.roles, "Roles", Object.values(Role))

    if (roles.length === 0) throw ApiError.badRequest("A user needs at least one role")

    input.user = {
      name: toText(body.user.name, "Name", { max: MAX_NAME_LENGTH }),
      email,
      phone: toOptionalText(body.user.phone, "Phone", MAX_PHONE_LENGTH),
      images,
      selectedImageIndex: toSelectedImageIndex(body.user.selectedImageIndex, images.length),
      roles,
      isActive: toBoolean(body.user.isActive, "Active"),
      emailVerified: toBoolean(body.user.emailVerified, "Email verified"),
      address: toOptionalText(body.user.address, "Address", MAX_ADDRESS_LENGTH),
      bloodGroup: toOptionalText(body.user.bloodGroup, "Blood group", 10),
      coverImg: toOptionalText(body.user.coverImg, "Cover image", 50),
      whatsappNumber: toOptionalText(body.user.whatsappNumber, "WhatsApp number", MAX_PHONE_LENGTH),
      bio: toOptionalText(body.user.bio, "Bio", MAX_BIO_LENGTH),
      skills: toSkillsList(body.user.skills),
    }
  }

  if (isRecord(body.member)) {
    input.member = {
      status: toEnum(body.member.status, "Membership status", Object.values(MembershipStatus)),
      joinedAt: toDateTime(body.member.joinedAt, "Joined at"),
      expiresAt: toDateTime(body.member.expiresAt, "Expires at"),
      boardOrClassRoll: toOptionalText(body.member.boardOrClassRoll, "Board / Class roll", 30),
      department: toEnum(body.member.department, "Department", Object.values(Department)),
      session: toText(body.member.session, "Session", { max: MAX_SESSION_LENGTH }),
      semester: toEnum(body.member.semester, "Semester", Object.values(Semester)),
      shift: toEnum(body.member.shift, "Shift", Object.values(Shift)),
      studentId: toOptionalText(body.member.studentId, "Student id", MAX_STUDENT_ID_LENGTH),
      studentIdCardUrl: toUrl(body.member.studentIdCardUrl, "Student id card"),
      nidorbirthUrl: toUrl(body.member.nidorbirthUrl, "Nid or birth certificate"),
      verificationStatus: toEnum(
        body.member.verificationStatus,
        "Verification status",
        Object.values(VerificationStatus)
      ),
      verifiedAt: toDateTime(body.member.verifiedAt, "Verified at"),
      hasPaidMembershipFee: toBoolean(body.member.hasPaidMembershipFee, "Membership fee paid"),
      paymentMethod: toOptionalEnum(
        body.member.paymentMethod,
        "Payment method",
        Object.values(PaymentMethod)
      ),
      senderNumber: toOptionalText(body.member.senderNumber, "Sender number", MAX_PHONE_LENGTH),
      transactionId: toOptionalText(
        body.member.transactionId,
        "Transaction id",
        MAX_TRANSACTION_ID_LENGTH
      ),
    }
  }

  if (isRecord(body.instructor)) {
    input.instructor = {
      instructorId: toOptionalText(
        body.instructor.instructorId,
        "Instructor id",
        MAX_STUDENT_ID_LENGTH
      ),
      status: toEnum(
        body.instructor.status,
        "Instructor status",
        Object.values(InstructorStatus)
      ),
    }
  }

  if (!input.user && !input.member && !input.instructor) {
    throw ApiError.badRequest("Nothing to update")
  }

  return input
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

export async function updateAdminUser(
  id: string,
  input: AdminUserInput,
  actingAdmin: { id: string; name?: string | null; email?: string | null; roles?: Role[] | null } | string
): Promise<AdminUserDetail> {
  if (!id) throw ApiError.badRequest("User id is required")

  // Resolve acting admin details
  let actingUser: { id: string; name?: string | null; email?: string | null; roles: Role[] }
  if (typeof actingAdmin === "object" && actingAdmin !== null && "id" in actingAdmin) {
    actingUser = {
      id: actingAdmin.id,
      name: actingAdmin.name,
      email: actingAdmin.email,
      roles: (actingAdmin.roles as Role[]) || [],
    }
  } else {
    const dbActor = await prisma.user.findUnique({
      where: { id: String(actingAdmin) },
      select: { id: true, name: true, email: true, roles: true },
    })
    actingUser = {
      id: String(actingAdmin),
      name: dbActor?.name,
      email: dbActor?.email,
      roles: (dbActor?.roles as Role[]) || [],
    }
  }

  const isActorSuperAdmin = actingUser.roles.includes(Role.SUPER_ADMIN)

  // Fetch previous state for change detection and security verification
  const previous = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      roles: true,
      isActive: true,
      member: {
        select: {
          studentId: true,
          department: true,
          semester: true,
          status: true,
          verificationStatus: true,
          hasPaidMembershipFee: true,
        },
      },
      instructor: {
        select: {
          instructorId: true,
          status: true,
        },
      },
    },
  })

  if (!previous) throw ApiError.notFound("User not found")

  const isTargetSuperAdmin = previous.roles.includes(Role.SUPER_ADMIN)

  // 1. Super Admin Protection: Only a Super Admin can modify a Super Admin user
  if (isTargetSuperAdmin && !isActorSuperAdmin) {
    throw ApiError.forbidden("Only a Super Admin can modify or manage another Super Admin")
  }

  // 2. Super Admin Role Guard: Only Super Admins can assign or revoke the SUPER_ADMIN role
  if (input.user && !isActorSuperAdmin) {
    const wasSuperAdmin = previous.roles.includes(Role.SUPER_ADMIN)
    const willBeSuperAdmin = input.user.roles.includes(Role.SUPER_ADMIN)
    if (wasSuperAdmin !== willBeSuperAdmin) {
      throw ApiError.forbidden("Only a Super Admin can assign or remove the Super Admin role")
    }
  }

  // 3. Self-protection: An admin must not be able to lock themselves out of the panel.
  if (id === actingUser.id && input.user) {
    if (isActorSuperAdmin && !input.user.roles.includes(Role.SUPER_ADMIN)) {
      throw ApiError.badRequest("You cannot remove your own Super Admin access")
    }
    if (!input.user.roles.includes(Role.ADMIN) && !input.user.roles.includes(Role.SUPER_ADMIN)) {
      throw ApiError.badRequest("You cannot remove your own admin access")
    }
    if (!input.user.isActive) {
      throw ApiError.badRequest("You cannot deactivate your own account")
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (input.user) {
        const {
          name,
          email,
          phone,
          images,
          selectedImageIndex,
          roles,
          isActive,
          emailVerified,
          address,
          bloodGroup,
          coverImg,
          whatsappNumber,
          bio,
          skills,
        } = input.user

        await tx.user.update({
          where: { id },
          data: {
            name,
            email,
            phone,
            image: images,
            selactedImg: String(selectedImageIndex),
            roles,
            isActive,
            emailVerified,
            address: address !== undefined ? address : undefined,
            bloodGroup: bloodGroup !== undefined ? bloodGroup : undefined,
            coverImg: coverImg !== undefined ? coverImg : undefined,
            whatsappNumber: whatsappNumber !== undefined ? whatsappNumber : undefined,
            bio: bio !== undefined ? bio : undefined,
            skills: skills !== undefined ? skills : undefined,
          },
        })
      }

      // `member` / `instructor` are optional 1:1 profiles, so an absent record
      // is created the first time an admin fills the section in.
      if (input.member) {
        const member = input.member

        // Keep `verifiedAt` meaningful without forcing the admin to set it.
        const verifiedAt =
          member.verificationStatus === VerificationStatus.VERIFIED && !member.verifiedAt
            ? new Date()
            : member.verifiedAt

        await tx.member.upsert({
          where: { userId: id },
          create: { userId: id, ...member, verifiedAt },
          update: { ...member, verifiedAt },
        })
      }

      if (input.instructor) {
        await tx.instructor.upsert({
          where: { userId: id },
          create: { userId: id, ...input.instructor },
          update: input.instructor,
        })
      }
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw ApiError.badRequest("One of those values is already taken by another user")
    }

    throw error
  }

  // Dispatch status emails based on transitions
  if (previous?.email) {
    const userEmail = input.user?.email || previous.email
    const userName = input.user?.name || previous.name
    const recipient = { email: userEmail, name: userName, userId: id }

    try {
      // 1. Member Status and Verification changed
      if (input.member) {
        const prevVerification = previous.member?.verificationStatus
        const nextVerification = input.member.verificationStatus
        const prevMemberStatus = previous.member?.status
        const nextMemberStatus = input.member.status

        const isBecomingVerifiedOrActive =
          (nextVerification === VerificationStatus.VERIFIED &&
            prevVerification !== VerificationStatus.VERIFIED) ||
          (nextMemberStatus === MembershipStatus.ACTIVE &&
            prevMemberStatus !== MembershipStatus.ACTIVE)

        if (isBecomingVerifiedOrActive) {
          await EmailService.sendTemplatedEmail("MEMBERSHIP_VERIFIED", recipient, {
            studentId: input.member.studentId || previous.member?.studentId || "N/A",
            department: input.member.department || previous.member?.department || "N/A",
            portalUrl: `${SITE_URL.origin}/profile`,
          })
        } else if (
          nextVerification === VerificationStatus.REJECTED &&
          prevVerification !== VerificationStatus.REJECTED
        ) {
          await EmailService.sendTemplatedEmail("MEMBERSHIP_REJECTED", recipient, {
            rejectionReason: "Student ID details or verification documents could not be verified.",
            supportEmail: "info@dgpics.org",
          })
        } else if (
          nextMemberStatus === MembershipStatus.SUSPENDED &&
          prevMemberStatus !== MembershipStatus.SUSPENDED
        ) {
          await EmailService.sendTemplatedEmail("MEMBERSHIP_SUSPENDED", recipient, {
            suspensionReason: "Administrative policy review.",
          })
        } else if (
          nextMemberStatus === MembershipStatus.CANCELLED &&
          prevMemberStatus !== MembershipStatus.CANCELLED
        ) {
          await EmailService.sendTemplatedEmail("MEMBERSHIP_SUSPENDED", recipient, {
            suspensionReason: "Membership has been cancelled by administration.",
          })
        } else if (
          nextMemberStatus === MembershipStatus.EXPIRED &&
          prevMemberStatus !== MembershipStatus.EXPIRED
        ) {
          await EmailService.sendTemplatedEmail("MEMBERSHIP_EXPIRED", recipient, {
            studentId: input.member.studentId || previous.member?.studentId || "N/A",
            renewalUrl: `${SITE_URL.origin}/profile`,
          })
        }

        // Fee Payment Confirmation check
        if (
          input.member.hasPaidMembershipFee === true &&
          !previous.member?.hasPaidMembershipFee
        ) {
          await EmailService.sendTemplatedEmail("MEMBERSHIP_FEE_CONFIRMED", recipient, {
            studentId: input.member.studentId || previous.member?.studentId || "N/A",
            department: input.member.department || previous.member?.department || "N/A",
            paymentMethod: input.member.paymentMethod || "CASH",
            transactionId: input.member.transactionId || "N/A",
          })
        }
      }

      // 2. Instructor Status changed
      if (input.instructor) {
        const prevInstructorStatus = previous.instructor?.status
        const nextInstructorStatus = input.instructor.status

        if (
          nextInstructorStatus === InstructorStatus.ACTIVE &&
          prevInstructorStatus !== InstructorStatus.ACTIVE
        ) {
          await EmailService.sendTemplatedEmail("INSTRUCTOR_APPROVED", recipient, {
            instructorId: input.instructor.instructorId || previous.instructor?.instructorId || "N/A",
          })
        } else if (
          nextInstructorStatus === InstructorStatus.REJECTED &&
          prevInstructorStatus !== InstructorStatus.REJECTED
        ) {
          await EmailService.sendTemplatedEmail("INSTRUCTOR_REJECTED", recipient, {
            reason: "Qualifications or teaching requirements could not be confirmed.",
          })
        }
      }

      // 3. User Activation Status changed
      if (input.user && input.user.isActive !== undefined) {
        if (previous.isActive && !input.user.isActive) {
          await EmailService.sendTemplatedEmail("ACCOUNT_DEACTIVATED", recipient)
        } else if (!previous.isActive && input.user.isActive) {
          await EmailService.sendTemplatedEmail("ACCOUNT_REACTIVATED", recipient)
        }
      }
    } catch (emailErr) {
      console.error("[admin-user.service] Error triggering status email:", emailErr)
    }
  }

  // Audit trail logging
  ActivityLogService.log({
    actor: actingUser,
    action: ActivityAction.UPDATE,
    actionName: "USER_UPDATED",
    entity: "User",
    entityId: id,
    description: `Updated profile, roles, or status for ${previous?.name || id}`,
    oldData: previous,
    newData: input,
  })

  return getAdminUserDetail(id)
}

export async function deleteAdminUser(
  id: string,
  actingAdmin: { id: string; name?: string | null; email?: string | null; roles?: Role[] | null } | string
): Promise<void> {
  if (!id) throw ApiError.badRequest("User id is required")

  const actingId = typeof actingAdmin === "object" ? actingAdmin?.id : actingAdmin
  if (id === actingId) {
    throw ApiError.badRequest("You cannot delete your own account")
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, roles: true },
  })

  if (!user) throw ApiError.notFound("User not found")

  // Resolve acting user roles
  let isActorSuperAdmin = false
  if (typeof actingAdmin === "object" && actingAdmin?.roles) {
    isActorSuperAdmin = (actingAdmin.roles as Role[]).includes(Role.SUPER_ADMIN)
  } else if (actingId) {
    const actor = await prisma.user.findUnique({
      where: { id: actingId },
      select: { roles: true },
    })
    isActorSuperAdmin = actor?.roles.includes(Role.SUPER_ADMIN) ?? false
  }

  // Super Admin protection: Only a Super Admin can delete a Super Admin
  if (user.roles.includes(Role.SUPER_ADMIN) && !isActorSuperAdmin) {
    throw ApiError.forbidden("Only a Super Admin can delete another Super Admin account")
  }

  await prisma.user.delete({
    where: { id },
  })

  // Audit trail logging
  ActivityLogService.log({
    actor: typeof actingAdmin === "object" ? actingAdmin : { id: actingId },
    action: ActivityAction.DELETE,
    actionName: "USER_DELETED",
    entity: "User",
    entityId: id,
    description: `Deleted account for user ${user.name} (${user.email})`,
    oldData: user,
  })
}