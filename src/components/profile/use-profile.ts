"use client"

import { useEffect, useState } from "react"

import type { Profile } from "@/lib/services/profile.service"

export type UseProfileResult = {
  data: Profile
  isLoading: boolean
  error: string | null
}

type ProfileState = {
  key: number
  data: Profile
  error: string | null
}

/**
 * Re-reads the signed in user's own profile from `GET /api/profile` whenever
 * `refreshKey` changes, so a successful save reflects the stored values.
 */
export function useProfile(initialData: Profile, refreshKey: number): UseProfileResult {
  const [state, setState] = useState<ProfileState>({
    key: refreshKey,
    data: initialData,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    fetch("/api/profile", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json()

        if (!response.ok) {
          throw new Error(body?.error?.message ?? "Request failed")
        }

        return body as Profile
      })
      .then((data) => {
        setState({ key: refreshKey, data, error: null })
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return

        const message = cause instanceof Error ? cause.message : "Request failed"

        setState((previous) => ({ ...previous, key: refreshKey, error: message }))
      })

    return () => controller.abort()
  }, [refreshKey])

  return {
    data: state.data,
    isLoading: state.key !== refreshKey,
    error: state.error,
  }
}
