"use client"

import { useEffect, useState } from "react"
import { InvitationStatus, Role } from "@/generated/prisma/enums"
import type { ListInvitationsResult } from "@/lib/services/invitation.service"

export interface UseAdminInvitationsParams {
  page: number
  search: string
  status: InvitationStatus | "ALL"
  role: Role | "ALL"
  refreshKey: number
}

export interface UseAdminInvitationsResult {
  data: ListInvitationsResult
  isLoading: boolean
  error: string | null
}

const DEFAULT_INITIAL_DATA: ListInvitationsResult = {
  invitations: [],
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  counts: {
    total: 0,
    pending: 0,
    accepted: 0,
    expired: 0,
    revoked: 0,
  },
}

interface InvitationsState {
  key: string
  data: ListInvitationsResult
  error: string | null
}

export function useAdminInvitations(
  { page, search, status, role, refreshKey }: UseAdminInvitationsParams,
  initialData: ListInvitationsResult = DEFAULT_INITIAL_DATA
): UseAdminInvitationsResult {
  const key = `${page}|${search}|${status}|${role}|${refreshKey}`
  const [state, setState] = useState<InvitationsState>({
    key,
    data: initialData,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "10",
    })

    if (search) params.set("search", search)
    if (status !== "ALL") params.set("status", status)
    if (role !== "ALL") params.set("role", role)

    fetch(`/api/admin/invitations?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json()

        if (!response.ok) {
          throw new Error(body?.error?.message ?? "Request failed")
        }

        return body as ListInvitationsResult
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
  }, [key, page, role, search, status])

  return {
    data: state.data,
    isLoading: state.key !== key,
    error: state.error,
  }
}
