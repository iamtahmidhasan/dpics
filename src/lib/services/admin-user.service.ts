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
import { resolveUserImage } from "@/lib/user-image"
import {
  EMAIL_PATTERN,
  MAX_BIO_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_EXPERTISE_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PHONE_LENGTH,
  MAX_SESSION_LENGTH,
  MAX_STUDENT_ID_LENGTH,
  MAX_TRANSACTION_ID_LENGTH,
  MAX_WHATSAPP_LENGTH,
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

export type AdminMemberDetail = {
  id: string
  status: MembershipStatus
  joinedAt: string | null
  expiresAt: string | null
  studentId: string | null
  whatsapp: string
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
  bio: string | null
  expertise: string | null
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
  whatsapp: string
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
  bio: string | null
  expertise: string | null
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
  whatsapp: true,
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
  bio: true,
  expertise: true,
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
    // Never select accessToken / refreshToken / idToken / password.
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
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    member: row.member
      ? {
          id: row.member.id,
          status: row.member.status,
          joinedAt: toIso(row.member.joinedAt),
          expiresAt: toIso(row.member.expiresAt),
          studentId: row.member.studentId,
          whatsapp: row.member.whatsapp,
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
          bio: row.instructor.bio,
          expertise: row.instructor.expertise,
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
    accounts: row.accounts.map((account) => ({
      id: account.id,
      providerId: account.providerId,
      accountId: account.accountId,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
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
      // Never expose the session token, only harmless request metadata.
      select: { createdAt: true, expiresAt: true, ipAddress: true, userAgent: true },
    }),
  ])

  return {
    total,
    latestCreatedAt: latest ? latest.createdAt.toISOString() : null,
    latestExpiresAt: latest ? latest.expiresAt.toISOString() : null,
    latestIpAddress: latest?.ipAddress ?? null,
    latestUserAgent: latest?.userAgent ?? null,
  }
}

/** Every column an admin may read about a user, with secrets left out. */
export async function getAdminUserDetail(id: string): Promise<AdminUserDetail> {
  if (!id) throw ApiError.badRequest("User id is required")

  const user = await prisma.user.findUnique({ where: { id }, select: adminUserSelect })

  if (!user) throw ApiError.notFound("User not found")

  const sessions = await getSessionSummary(id)

  return toMap(user, sessions)
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
    }
  }

  if (isRecord(body.member)) {
    input.member = {
      status: toEnum(body.member.status, "Membership status", Object.values(MembershipStatus)),
      joinedAt: toDateTime(body.member.joinedAt, "Joined at"),
      expiresAt: toDateTime(body.member.expiresAt, "Expires at"),
      whatsapp: toText(body.member.whatsapp, "Whatsapp", { max: MAX_WHATSAPP_LENGTH }),
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
      bio: toOptionalText(body.instructor.bio, "Bio", MAX_BIO_LENGTH),
      expertise: toOptionalText(body.instructor.expertise, "Expertise", MAX_EXPERTISE_LENGTH),
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
  actingAdminId: string
): Promise<AdminUserDetail> {
  if (!id) throw ApiError.badRequest("User id is required")

  // An admin must not be able to lock themselves out of the panel.
  if (id === actingAdminId && input.user) {
    if (!input.user.roles.includes(Role.ADMIN)) {
      throw ApiError.badRequest("You cannot remove your own admin access")
    }

    if (!input.user.isActive) {
      throw ApiError.badRequest("You cannot deactivate your own account")
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (input.user) {
        const { name, email, phone, images, selectedImageIndex, roles, isActive, emailVerified } =
          input.user

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

  return getAdminUserDetail(id)
}

export async function deleteAdminUser(id: string, actingAdminId: string): Promise<void> {
  if (!id) throw ApiError.badRequest("User id is required")

  if (id === actingAdminId) {
    throw ApiError.badRequest("You cannot delete your own admin account")
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  })

  if (!user) {
    throw ApiError.notFound("User not found")
  }

  await prisma.$transaction(async (tx) => {
    await tx.userCommitteeRole.deleteMany({ where: { userId: id } })
    await tx.member.deleteMany({ where: { userId: id } })
    await tx.instructor.deleteMany({ where: { userId: id } })
    await tx.session.deleteMany({ where: { userId: id } })
    await tx.account.deleteMany({ where: { userId: id } })
    await tx.user.delete({ where: { id } })
  })
}