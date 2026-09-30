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
