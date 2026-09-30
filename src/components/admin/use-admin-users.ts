"use client"

import { useEffect, useState } from "react"

import type { UserListResult } from "@/lib/services/user.service"

export type UseAdminUsersParams = {
  page: number
  search: string
  role: string
  refreshKey: number
}

export type UseAdminUsersResult = {
  data: UserListResult
  isLoading: boolean
  error: string | null
}

type UsersState = {
  key: string
  data: UserListResult
  error: string | null
}

/**
 * Client side paging/searching on top of the admin only
 * `GET /api/admin/users` endpoint.
 */
export function useAdminUsers(
  { page, search, role, refreshKey }: UseAdminUsersParams,
  initialData: UserListResult
): UseAdminUsersResult {
  const key = `${page}|${search}|${role}|${refreshKey}`
  const [state, setState] = useState<UsersState>({
    key,
    data: initialData,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({ page: String(page) })

    if (search) params.set("search", search)
    if (role) params.set("role", role)

    fetch(`/api/admin/users?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json()

        if (!response.ok) {
          throw new Error(body?.error?.message ?? "Request failed")
        }

        return body as UserListResult
      })
      .then((data) => {
        setState({ key, data, error: null })
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return

        const message = cause instanceof Error ? cause.message : "Request failed"

        setState((previous) => ({ ...previous, key, error: message }))
      })

    return () => controller.abort()
  }, [key, page, role, search])

  return {
    data: state.data,
    isLoading: state.key !== key,
    error: state.error,
  }
}
