import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth, type AuthSession } from "@/lib/auth"
import { ApiError } from "@/lib/api-error"
import { isAdmin, isRole, type Role } from "@/lib/roles"

export { ADMIN_ROLE, ROLES, getUserRoles, hasRole, isAdmin } from "@/lib/roles"

/** Read the current session from the request cookies. Null when signed out. */
export async function getSession(): Promise<AuthSession | null> {
  return auth.api.getSession({ headers: await headers() })
}

export { isRole }
export type { Role }

/** Server component guard: signed in users only. */
export async function requireUser(): Promise<AuthSession> {
  const session = await getSession()

  if (!session?.user) redirect("/sign-in")

  return session
}

/** Server component guard: ADMIN role only. */
export async function requireAdmin(): Promise<AuthSession> {
  const session = await requireUser()

  if (!isAdmin(session.user)) redirect("/dashboard")

  return session
}

/** Route handler guard: throws a 401/403 `ApiError` instead of redirecting. */
export async function requireAdminApi(): Promise<AuthSession> {
  const session = await getSession()

  if (!session?.user) throw ApiError.unauthorized()

  if (!isAdmin(session.user)) throw ApiError.forbidden("Admin access required")

  return session
}
