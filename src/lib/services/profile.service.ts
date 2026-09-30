import "server-only"

import { Prisma } from "@/generated/prisma/client"
import {
  Department,
  InstructorStatus,
  MembershipStatus,
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
  MAX_WHATSAPP_LENGTH,
  isRecord,
  toEnum,
  toImages,
  toOptionalText,
  toSelectedImageIndex,
  toText,
  toUrl,
} from "@/lib/validation"

export type MemberProfile = {
  id: string
  status: MembershipStatus
  whatsapp: string
  department: Department
  session: string
  semester: Semester
  shift: Shift
  studentId: string | null
  studentIdCardUrl: string | null
  nidorbirthUrl: string | null
  verificationStatus: VerificationStatus
  verifiedAt: string | null
  hasPaidMembershipFee: boolean
  paymentMethod: string | null
  senderNumber: string | null
  transactionId: string | null
  joinedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export type InstructorProfile = {
  id: string
  instructorId: string | null
  bio: string | null
  expertise: string | null
  status: InstructorStatus
  createdAt: string
}

export type CommitteeRoleSummary = {
  id: string
  roleName: string
  committeeName: string
  isActive: boolean
  startDate: string | null
  endDate: string | null
}

export type Profile = {
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
  member: MemberProfile | null
  instructor: InstructorProfile | null
  committeeRoles: CommitteeRoleSummary[]
}

export type MemberInput = {
  whatsapp: string
  department: Department
  session: string
  semester: Semester
  shift: Shift
  studentId: string | null
  studentIdCardUrl: string | null
  nidorbirthUrl: string | null
}

export type InstructorInput = {
  instructorId: string | null
  bio: string | null
  expertise: string | null
}

export type ProfileInput = {
  user?: {
    name: string
    email: string
    phone: string | null
    images: string[]
    selectedImageIndex: number
  }
  member?: MemberInput
  instructor?: InstructorInput
}

const profileSelect = {
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
  member: {
    select: {
      id: true,
      status: true,
      whatsapp: true,
      department: true,
      session: true,
      semester: true,
      shift: true,
      studentId: true,
      studentIdCardUrl: true,
      nidorbirthUrl: true,
      verificationStatus: true,
      verifiedAt: true,
      hasPaidMembershipFee: true,
      paymentMethod: true,
      senderNumber: true,
      transactionId: true,
      joinedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  },
  instructor: {
    select: {
      id: true,
      instructorId: true,
      bio: true,
      expertise: true,
      status: true,
      createdAt: true,
    },
  },
  committeeRoles: {
    select: {
      id: true,
      isActive: true,
      startDate: true,
      endDate: true,
      role: {
        select: {
          name: true,
          committee: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  },
} as const

type ProfileRow = Prisma.UserGetPayload<{ select: typeof profileSelect }>

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

function toMap(row: ProfileRow): Profile {
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
    member: row.member
      ? {
          id: row.member.id,
          status: row.member.status,
          whatsapp: row.member.whatsapp,
          department: row.member.department,
          session: row.member.session,
          semester: row.member.semester,
          shift: row.member.shift,
          studentId: row.member.studentId,
          studentIdCardUrl: row.member.studentIdCardUrl,
          nidorbirthUrl: row.member.nidorbirthUrl,
          verificationStatus: row.member.verificationStatus,
          verifiedAt: toIso(row.member.verifiedAt),
          hasPaidMembershipFee: row.member.hasPaidMembershipFee,
          paymentMethod: row.member.paymentMethod,
          senderNumber: row.member.senderNumber,
          transactionId: row.member.transactionId,
          joinedAt: toIso(row.member.joinedAt),
          expiresAt: toIso(row.member.expiresAt),
          createdAt: row.member.createdAt.toISOString(),
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
        }
      : null,
    committeeRoles: row.committeeRoles.map((entry) => ({
      id: entry.id,
      roleName: entry.role.name,
      committeeName: entry.role.committee.name,
      isActive: entry.isActive,
      startDate: toIso(entry.startDate),
      endDate: toIso(entry.endDate),
    })),
  }
}

/**
 * Validates the untrusted request body. Only the fields a member is allowed to
 * change on themselves are read; every other column on `User`, `Member` and
 * `Instructor` (roles, status, verification, payment, ...) is server managed.
 */
export function parseProfileInput(body: unknown): ProfileInput {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

  const input: ProfileInput = {}

  if (isRecord(body.user)) {
    const email = toText(body.user.email, "Email", { max: MAX_EMAIL_LENGTH }).toLowerCase()

    if (!EMAIL_PATTERN.test(email)) throw ApiError.badRequest("Email is not valid")

    const images = toImages(body.user.images)

    input.user = {
      name: toText(body.user.name, "Name", { max: MAX_NAME_LENGTH }),
      email,
      phone: toOptionalText(body.user.phone, "Phone", MAX_PHONE_LENGTH),
      images,
      selectedImageIndex: toSelectedImageIndex(body.user.selectedImageIndex, images.length),
    }
  }

  if (isRecord(body.member)) {
    input.member = {
      whatsapp: toText(body.member.whatsapp, "Whatsapp", { max: MAX_WHATSAPP_LENGTH }),
      department: toEnum(body.member.department, "Department", Object.values(Department)),
      session: toText(body.member.session, "Session", { max: MAX_SESSION_LENGTH }),
      semester: toEnum(body.member.semester, "Semester", Object.values(Semester)),
      shift: toEnum(body.member.shift, "Shift", Object.values(Shift)),
      studentId: toOptionalText(body.member.studentId, "Student id", MAX_STUDENT_ID_LENGTH),
      studentIdCardUrl: toUrl(body.member.studentIdCardUrl, "Student id card"),
      nidorbirthUrl: toUrl(body.member.nidorbirthUrl, "Nid or birth certificate"),
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
    }
  }

  if (!input.user && !input.member && !input.instructor) {
    throw ApiError.badRequest("Nothing to update")
  }

  return input
}

export async function getProfile(userId: string): Promise<Profile> {
  if (!userId) throw ApiError.badRequest("User id is required")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  })

  if (!user) throw ApiError.notFound("User not found")

  return toMap(user)
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

export async function updateProfile(userId: string, input: ProfileInput): Promise<Profile> {
  if (!userId) throw ApiError.badRequest("User id is required")

  try {
    await prisma.$transaction(async (tx) => {
      if (input.user) {
        const { name, email, phone, images, selectedImageIndex } = input.user

        await tx.user.update({
          where: { id: userId },
          data: {
            name,
            email,
            phone,
            image: images,
            selactedImg: String(selectedImageIndex),
          },
        })
      }

      // `member` / `instructor` are optional 1:1 profiles, so an absent record
      // is created the first time the user fills the section in.
      if (input.member) {
        await tx.member.upsert({
          where: { userId },
          create: { userId, ...input.member },
          update: input.member,
        })
      }

      if (input.instructor) {
        await tx.instructor.upsert({
          where: { userId },
          create: { userId, ...input.instructor },
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

  return getProfile(userId)
}
