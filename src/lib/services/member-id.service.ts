import "server-only"

import { Prisma } from "@/generated/prisma/client"
import { ApiError } from "@/lib/api-error"
import prisma from "@/lib/prisma"
import { getSettings } from "@/lib/services/settings.service"

export type BatchMemberStats = {
  prefix: string
  batch: string
  totalMembers: number
  limit: number
  nextAvailableId: string | null
  isLimitReached: boolean
}

/**
 * Finds the first available gap or next sequence integer in `[xxxx]` format (from 0001).
 * If 0001 and 0003 exist (because 0002 was removed), 0002 is assigned to the new member.
 * Enforces the `batchMemberLimit` if configured (> 0).
 */
export async function generateNextStudentId(
  tx?: Prisma.TransactionClient,
  customBatch?: string,
  customPrefix?: string
): Promise<string> {
  const db = tx ?? prisma
  const settings =
    "setting" in db && db.setting
      ? (await db.setting.findUnique({ where: { id: "global" } })) ?? (await getSettings())
      : await getSettings()

  const prefix = (customPrefix || settings.studentIdPrefix || "DPICS")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
  const batch = (customBatch || settings.studentIdBatch || "24")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "")
  const fullPrefix = `${prefix}${batch}`

  const members = await db.member.findMany({
    where: {
      studentId: {
        startsWith: fullPrefix,
      },
    },
    select: {
      studentId: true,
    },
  })

  const usedNumbers = new Set<number>()
  for (const m of members) {
    if (!m.studentId) continue
    const suffix = m.studentId.slice(fullPrefix.length)
    if (/^\d+$/.test(suffix)) {
      const num = Number.parseInt(suffix, 10)
      if (num > 0) {
        usedNumbers.add(num)
      }
    }
  }

  const limit = settings.batchMemberLimit

  if (limit > 0 && usedNumbers.size >= limit) {
    throw ApiError.badRequest(
      `Member limit for batch ${batch} has been reached (${limit} members max)`
    )
  }

  // Find lowest positive integer hole starting from 1 (0001)
  let candidate = 1
  while (usedNumbers.has(candidate)) {
    candidate++
  }

  if (limit > 0 && candidate > limit) {
    throw ApiError.badRequest(
      `Member limit for batch ${batch} has been reached (${limit} members max)`
    )
  }

  if (candidate > 9999) {
    throw ApiError.badRequest(
      `Maximum student ID limit (9999) for batch ${batch} has been reached`
    )
  }

  const seq = String(candidate).padStart(4, "0")

  return `${fullPrefix}${seq}`
}

/**
 * Returns summary statistics and preview for the given or current batch.
 */
export async function getBatchMemberStats(
  customBatch?: string,
  customPrefix?: string
): Promise<BatchMemberStats> {
  const settings = await getSettings()

  const prefix = (customPrefix || settings.studentIdPrefix || "DPICS")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
  const batch = (customBatch || settings.studentIdBatch || "24")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "")
  const fullPrefix = `${prefix}${batch}`

  const members = await prisma.member.findMany({
    where: {
      studentId: {
        startsWith: fullPrefix,
      },
    },
    select: {
      studentId: true,
    },
  })

  const usedNumbers = new Set<number>()
  for (const m of members) {
    if (!m.studentId) continue
    const suffix = m.studentId.slice(fullPrefix.length)
    if (/^\d+$/.test(suffix)) {
      const num = Number.parseInt(suffix, 10)
      if (num > 0) {
        usedNumbers.add(num)
      }
    }
  }

  const limit = settings.batchMemberLimit
  const isLimitReached = limit > 0 && usedNumbers.size >= limit

  let nextAvailableId: string | null = null
  if (!isLimitReached) {
    let candidate = 1
    while (usedNumbers.has(candidate)) {
      candidate++
    }
    if ((limit <= 0 || candidate <= limit) && candidate <= 9999) {
      nextAvailableId = `${fullPrefix}${String(candidate).padStart(4, "0")}`
    }
  }

  return {
    prefix: fullPrefix,
    batch,
    totalMembers: usedNumbers.size,
    limit,
    nextAvailableId,
    isLimitReached,
  }
}
