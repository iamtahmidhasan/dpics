import "server-only"

import { Prisma } from "@/generated/prisma/client"
import { Role } from "@/generated/prisma/enums"
import { ApiError } from "@/lib/api-error"
import prisma from "@/lib/prisma"
import { SELF_ASSIGNABLE_ROLES, type SelfAssignableRole } from "@/lib/roles"
import {
  getProfile,
  parseProfileInput,
  type InstructorInput,
  type MemberInput,
  type Profile,
} from "@/lib/services/profile.service"
import { isRecord, toEnum } from "@/lib/validation"

export type OnboardingInput = {
  role: SelfAssignableRole
  member: MemberInput | null
  instructor: InstructorInput | null
}

/**
 * Reads the body section that matches the picked role and validates it with the
 * exact same rules `PATCH /api/profile` applies, so the wizard cannot smuggle
 * in a shape the rest of the app would reject. Everything outside that section
 * (status, verification, payment, committee roles) stays server managed.
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

  const input = parseProfileInput(role === Role.MEMBER ? { member: section } : { instructor: section })

  return { role, member: input.member ?? null, instructor: input.instructor ?? null }
}

/**
 * Claims one society role for an account that has not claimed one yet and
 * creates the matching record. `Member.status` / `Instructor.status` default to
 * `PENDING`, so an administrator still verifies what was claimed here.
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

      await tx.user.update({
        where: { id: userId },
        data: { roles: [...user.roles, input.role] },
      })

      if (input.member) {
        await tx.member.create({ data: { userId, ...input.member } })
      }

      if (input.instructor) {
        await tx.instructor.create({ data: { userId, ...input.instructor } })
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