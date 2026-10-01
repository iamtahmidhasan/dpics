"use client"

import { useEffect, useState } from "react"

import { PostStatus } from "@/generated/prisma/enums"
import type { AdminPostSummary } from "@/lib/services/post.service"
import type { PostPage } from "@/lib/services/post.service"

export type AdminPostCounts = Record<PostStatus, number> & { total: number }

export type AdminPostsPayload = PostPage<AdminPostSummary> & { counts: AdminPostCounts }

export type UseAdminPostsParams = {
  page: number
  search: string
  status: string
  category: string
  refreshKey: number
}

type AdminPostsState = {
  key: string
  data: AdminPostsPayload
  error: string | null
}

/**
 * Client side filtering on top of the admin only `GET /api/admin/posts`
 * endpoint. Mirrors `useAdminUsers` so both admin tables behave the same.
 */
export function useAdminPosts(
  { page, search, status, category, refreshKey }: UseAdminPostsParams,
  initialData: AdminPostsPayload
): { data: AdminPostsPayload; isLoading: boolean; error: string | null } {
  const key = `${page}|${search}|${status}|${category}|${refreshKey}`
  const [state, setState] = useState<AdminPostsState>({
    key,
    data: initialData,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({ page: String(page) })

    if (search) params.set("q", search)
    if (status && status !== "ALL") params.set("status", status)
    if (category && category !== "ALL") params.set("category", category)

    fetch(`/api/admin/posts?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json()

        if (!response.ok) {
          throw new Error(body?.error?.message ?? "Request failed")
        }

        return body as AdminPostsPayload
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
  }, [category, key, page, search, status])

  return {
    data: state.data,
    isLoading: state.key !== key,
    error: state.error,
  }
}
