import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth, type AuthSession } from "@/lib/auth"
import { ApiError } from "@/lib/api-error"
import { canWritePosts, isAdmin, isRole, type Role } from "@/lib/roles"

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

/** Server component guard: signed in and allowed to write posts. */
export async function requirePostWriter(): Promise<AuthSession> {
  const session = await requireUser()

  if (!canWritePosts(session.user)) redirect("/dashboard")

  return session
}

/** Route handler guard: throws a 401 `ApiError` instead of redirecting. */
export async function requireUserApi(): Promise<AuthSession> {
  const session = await getSession()

  if (!session?.user) throw ApiError.unauthorized()

  return session
}

/** Route handler guard: throws a 401/403 `ApiError` instead of redirecting. */
export async function requireAdminApi(): Promise<AuthSession> {
  const session = await getSession()

  if (!session?.user) throw ApiError.unauthorized()

  if (!isAdmin(session.user)) throw ApiError.forbidden("Admin access required")

  return session
}

/**
 * Route handler guard for the author facing post endpoints. `ADMIN` passes here
 * too, so admins can keep working on their own posts from the front end; the
 * service still blocks them from touching anybody else's.
 */
export async function requirePostWriterApi(): Promise<AuthSession> {
  const session = await getSession()

  if (!session?.user) throw ApiError.unauthorized()

  if (!canWritePosts(session.user)) throw ApiError.forbidden("Only society members can write posts")

  return session
}
