import "server-only"

import { Prisma } from "@/generated/prisma/client"
import { Role } from "@/generated/prisma/enums"
import { ApiError } from "@/lib/api-error"
import prisma from "@/lib/prisma"
import { SELF_ASSIGNABLE_ROLES, type SelfAssignableRole } from "@/lib/roles"
import { generateNextStudentId } from "@/lib/services/member-id.service"
import { generateNextInstructorId } from "@/lib/services/instructor-id.service"
import {
  getProfile,
  parseProfileInput,
  type InstructorInput,
  type MemberInput,
  type Profile,
  type ProfileInput,
} from "@/lib/services/profile.service"
import { isRecord, toEnum } from "@/lib/validation"

export type UserInput = NonNullable<ProfileInput["user"]>

export type OnboardingInput = {
  role: SelfAssignableRole
  user: UserInput | null
  member: MemberInput | null
  instructor: InstructorInput | null
}

/**
 * Reads the body sections that match the picked role and validates them with the
 * exact same rules `PATCH /api/profile` applies, so the wizard cannot smuggle
 * in a shape the rest of the app would reject. `user` is optional — a caller
 * that already has a complete profile can claim a role on its own. Everything
 * outside those sections (status, verification, payment, committee roles) stays
 * server managed.
 */
export function parseOnboardingInput(body: unknown): OnboardingInput {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

  const role = toEnum(body.role, "Role", SELF_ASSIGNABLE_ROLES)
  const section = role === Role.MEMBER ? body.member : body.instructor

  if (!isRecord(section)) {
    throw ApiError.badRequest(
      role === Role.MEMBER ? "Member details are required" : "Instructor details are required"
    )
  }

  const payload: Record<string, unknown> = {}

  if (isRecord(body.user)) payload.user = body.user
  payload[role === Role.MEMBER ? "member" : "instructor"] = section

  const input = parseProfileInput(payload)

  return {
    role,
    user: input.user ?? null,
    member: input.member ?? null,
    instructor: input.instructor ?? null,
  }
}

/**
 * Writes the basic information collected during sign-up, claims one society
 * role for an account that has not claimed one yet, and creates the matching
 * record. `Member.status` / `Instructor.status` default to `PENDING`, so an
 * administrator still verifies what was claimed here.
 *
 * `roles` is only ever appended to, and only while the account holds nothing
 * but the default `USER` role. That makes this endpoint safe to replay: a second
 * call cannot swap a role, and `ADMIN` is not in `SELF_ASSIGNABLE_ROLES` at
 * all, so it can never be reached from here.
 */
export async function completeOnboarding(userId: string, input: OnboardingInput): Promise<Profile> {
  if (!userId) throw ApiError.badRequest("User id is required")

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { roles: true } })

      if (!user) throw ApiError.notFound("User not found")

      if (user.roles.some((role) => role !== Role.USER)) {
        throw ApiError.badRequest("This account already has a society role")
      }

      const settings =
        "setting" in tx && tx.setting
          ? await tx.setting.findUnique({
              where: { id: "global" },
              select: {
                isSignupEnabled: true,
                isMemberSignupEnabled: true,
                isInstructorSignupEnabled: true,
                isRegistrationFeeRequired: true,
                registrationFee: true,
                isAutoStudentIdEnabled: true,
                studentIdPrefix: true,
                studentIdBatch: true,
                batchMemberLimit: true,
                isAutoInstructorIdEnabled: true,
                instructorIdPrefix: true,
              },
            })
          : null

      if (input.role === Role.MEMBER && settings && !settings.isMemberSignupEnabled) {
        throw ApiError.badRequest("Member signup is currently closed")
      }

      if (input.role === Role.INSTRUCTOR && settings && !settings.isInstructorSignupEnabled) {
        throw ApiError.badRequest("Instructor signup is currently closed")
      }

      if (
        input.role === Role.MEMBER &&
        settings?.isRegistrationFeeRequired &&
        settings.registrationFee > 0
      ) {
        if (!input.member?.senderNumber?.trim()) {
          throw ApiError.badRequest("Sender number is required")
        }
        if (!input.member?.transactionId?.trim()) {
          throw ApiError.badRequest("Transaction ID is required")
        }
      }

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
            roles: [...user.roles, input.role],
          },
        })
      } else {
        await tx.user.update({
          where: { id: userId },
          data: { roles: [...user.roles, input.role] },
        })
      }

      if (input.member) {
        let studentId = input.member.studentId
        if (settings?.isAutoStudentIdEnabled ?? true) {
          studentId = await generateNextStudentId(
            tx,
            settings?.studentIdBatch,
            settings?.studentIdPrefix
          )
        }

        await tx.member.create({
          data: {
            userId,
            ...input.member,
            studentId,
          },
        })
      }

      if (input.instructor) {
        let instructorId = input.instructor.instructorId
        if (!instructorId && (settings?.isAutoInstructorIdEnabled ?? true)) {
          instructorId = await generateNextInstructorId(
            tx,
            settings?.instructorIdPrefix
          )
        }
        await tx.instructor.create({
          data: {
            userId,
            ...input.instructor,
            instructorId: instructorId || undefined,
          },
        })
      }
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw ApiError.badRequest("One of those values is already taken by another user")
    }

    throw error
  }

  return getProfile(userId)
}