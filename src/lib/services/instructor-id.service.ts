import "server-only"

import { Prisma } from "@/generated/prisma/client"
import { ApiError } from "@/lib/api-error"
import prisma from "@/lib/prisma"
import { getSettings } from "@/lib/services/settings.service"

export type InstructorStats = {
  prefix: string
  totalInstructors: number
  nextAvailableId: string | null
}

/**
 * Finds the first available gap or next sequence integer in `[xxxx]` format (from 0001) for instructors.
 * Follows the same gap-filling and sequence rules as Member studentId.
 */
export async function generateNextInstructorId(
  tx?: Prisma.TransactionClient,
  customPrefix?: string
): Promise<string> {
  const db = tx ?? prisma
  const settings =
    "setting" in db && db.setting
      ? (await db.setting.findUnique({ where: { id: "global" } })) ?? (await getSettings())
      : await getSettings()

  const rawPrefix = (customPrefix || settings.instructorIdPrefix || "INS")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
  const prefix = rawPrefix || "INS"

  const instructors = await db.instructor.findMany({
    where: {
      instructorId: {
        startsWith: prefix,
      },
    },
    select: {
      instructorId: true,
    },
  })

  const usedNumbers = new Set<number>()
  for (const inst of instructors) {
    if (!inst.instructorId) continue
    const suffix = inst.instructorId.slice(prefix.length)
    // Suffix may be "0001" or "-0001" or "_0001"
    const cleaned = suffix.replace(/^[-_]/, "")
    if (/^\d+$/.test(cleaned)) {
      const num = Number.parseInt(cleaned, 10)
      if (num > 0) {
        usedNumbers.add(num)
      }
    }
  }

  // Find lowest positive integer hole starting from 1 (0001)
  let candidate = 1
  while (usedNumbers.has(candidate)) {
    candidate++
  }

  if (candidate > 9999) {
    throw ApiError.badRequest(
      `Maximum instructor ID limit (9999) for prefix ${prefix} has been reached`
    )
  }

  const seq = String(candidate).padStart(4, "0")
  return `${prefix}${seq}`
}

/**
 * Returns summary statistics and preview for instructors.
 */
export async function getInstructorStats(
  customPrefix?: string
): Promise<InstructorStats> {
  const settings = await getSettings()

  const rawPrefix = (customPrefix || settings.instructorIdPrefix || "INS")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
  const prefix = rawPrefix || "INS"

  const instructors = await prisma.instructor.findMany({
    where: {
      instructorId: {
        startsWith: prefix,
      },
    },
    select: {
      instructorId: true,
    },
  })

  const usedNumbers = new Set<number>()
  for (const inst of instructors) {
    if (!inst.instructorId) continue
    const suffix = inst.instructorId.slice(prefix.length)
    const cleaned = suffix.replace(/^[-_]/, "")
    if (/^\d+$/.test(cleaned)) {
      const num = Number.parseInt(cleaned, 10)
      if (num > 0) {
        usedNumbers.add(num)
      }
    }
  }

  let candidate = 1
  while (usedNumbers.has(candidate)) {
    candidate++
  }

  const nextAvailableId = candidate <= 9999 ? `${prefix}${String(candidate).padStart(4, "0")}` : null

  return {
    prefix,
    totalInstructors: instructors.length,
    nextAvailableId,
  }
}
