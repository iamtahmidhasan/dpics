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
  isRecord,
  toEnum,
  toImages,
  toOptionalEnum,
  toOptionalText,
  toSelectedImageIndex,
  toText,
  toUrl,
} from "@/lib/validation"

export type MemberProfile = {
  id: string
  status: MembershipStatus
  boardOrClassRoll: string | null
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
  address: string | null
  bloodGroup: string | null
  coverImg: string | null
  whatsappNumber: string | null
  bio: string | null
  skills: string[]
  createdAt: string
  member: MemberProfile | null
  instructor: InstructorProfile | null
  committeeRoles: CommitteeRoleSummary[]
}

export type MemberInput = {
  boardOrClassRoll?: string | null
  department: Department
  session: string
  semester: Semester
  shift: Shift
  studentId: string | null
  studentIdCardUrl: string | null
  nidorbirthUrl: string | null
  paymentMethod?: PaymentMethod | null
  senderNumber?: string | null
  transactionId?: string | null
}

export type InstructorInput = {
  instructorId: string | null
}

export type ProfileInput = {
  user?: {
    name: string
    email: string
    phone: string | null
    images: string[]
    selectedImageIndex: number
    address?: string | null
    bloodGroup?: string | null
    coverImg?: string | null
    whatsappNumber?: string | null
    bio?: string | null
    skills?: string[]
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
  address: true,
  bloodGroup: true,
  coverImg: true,
  whatsappNumber: true,
  bio: true,
  skills: true,
  createdAt: true,
  member: {
    select: {
      id: true,
      status: true,
      boardOrClassRoll: true,
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
    address: row.address,
    bloodGroup: row.bloodGroup,
    coverImg: row.coverImg || "1",
    whatsappNumber: row.whatsappNumber,
    bio: row.bio,
    skills: row.skills || [],
    createdAt: row.createdAt.toISOString(),
    member: row.member
      ? {
          id: row.member.id,
          status: row.member.status,
          boardOrClassRoll: row.member.boardOrClassRoll,
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
      boardOrClassRoll: toOptionalText(body.member.boardOrClassRoll, "Board / Class roll", 30),
      department: toEnum(body.member.department, "Department", Object.values(Department)),
      session: toText(body.member.session, "Session", { max: MAX_SESSION_LENGTH }),
      semester: toEnum(body.member.semester, "Semester", Object.values(Semester)),
      shift: toEnum(body.member.shift, "Shift", Object.values(Shift)),
      studentId: toOptionalText(body.member.studentId, "Student id", MAX_STUDENT_ID_LENGTH),
      studentIdCardUrl: toUrl(body.member.studentIdCardUrl, "Student id card"),
      nidorbirthUrl: toUrl(body.member.nidorbirthUrl, "Nid or birth certificate"),
      paymentMethod:
        "paymentMethod" in body.member
          ? toOptionalEnum(
              body.member.paymentMethod,
              "Payment method",
              Object.values(PaymentMethod)
            )
          : undefined,
      senderNumber:
        "senderNumber" in body.member
          ? toOptionalText(body.member.senderNumber, "Sender number", MAX_PHONE_LENGTH)
          : undefined,
      transactionId:
        "transactionId" in body.member
          ? toOptionalText(
              body.member.transactionId,
              "Transaction id",
              MAX_TRANSACTION_ID_LENGTH
            )
          : undefined,
    }
  }

  if (isRecord(body.instructor)) {
    input.instructor = {
      instructorId: toOptionalText(
        body.instructor.instructorId,
        "Instructor id",
        MAX_STUDENT_ID_LENGTH
      ),
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
        const {
          name,
          email,
          phone,
          images,
          selectedImageIndex,
          address,
          bloodGroup,
          coverImg,
          whatsappNumber,
          bio,
          skills,
        } = input.user

        await tx.user.update({
          where: { id: userId },
          data: {
            name,
            email,
            phone,
            image: images,
            selactedImg: String(selectedImageIndex),
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
