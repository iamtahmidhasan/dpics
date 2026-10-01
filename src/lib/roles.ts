import { Role } from "@/generated/prisma/enums"

export type { Role }

export const ROLES = Object.values(Role) as Role[]

export const ADMIN_ROLE = Role.ADMIN

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value)
}

/** Normalises the `roles` column of a user into a trusted `Role[]`. */
export function getUserRoles(user: { roles?: unknown } | null | undefined): Role[] {
  const roles = user?.roles

  if (!Array.isArray(roles)) return []

  return roles.filter(isRole)
}

export function hasRole(
  user: { roles?: unknown } | null | undefined,
  role: Role
): boolean {
  return getUserRoles(user).includes(role)
}

export function isAdmin(user: { roles?: unknown } | null | undefined): boolean {
  return hasRole(user, ADMIN_ROLE)
}

/**
 * The roles an account may pick for itself during sign-up. `ADMIN` is absent on
 * purpose: it can only ever be granted by somebody who already holds it.
 */
export const SELF_ASSIGNABLE_ROLES = [Role.MEMBER, Role.INSTRUCTOR] as const

export type SelfAssignableRole = (typeof SELF_ASSIGNABLE_ROLES)[number]

export function isSelfAssignableRole(value: unknown): value is SelfAssignableRole {
  return typeof value === "string" && (SELF_ASSIGNABLE_ROLES as readonly string[]).includes(value)
}

/** True once the account holds a society facing role, so onboarding is finished. */
export function isOnboarded(user: { roles?: unknown } | null | undefined): boolean {
  return getUserRoles(user).some((role) => role === Role.MEMBER || role === Role.INSTRUCTOR)
}

/**
 * Roles allowed to write posts. `ADMIN` is included because admins moderate
 * posts from the admin panel and can publish without going through review.
 */
export const POST_WRITER_ROLES = [Role.MEMBER, Role.INSTRUCTOR, Role.ADMIN] as const

export type PostWriterRole = (typeof POST_WRITER_ROLES)[number]

/** True when the account may open `/profile/write` and call the author APIs. */
export function canWritePosts(user: { roles?: unknown } | null | undefined): boolean {
  return getUserRoles(user).some((role) =>
    (POST_WRITER_ROLES as readonly Role[]).includes(role)
  )
}
