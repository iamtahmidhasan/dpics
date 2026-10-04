import { PostStatus } from "@/generated/prisma/enums"
import type { AchievementListFilters } from "@/lib/services/achievement.service"

const STATUS_VALUES = Object.values(PostStatus) as PostStatus[]

function firstValue(value: string | string[] | undefined | null): string {
  if (Array.isArray(value)) return value[0] ?? ""
  if (typeof value !== "string") return ""
  return value
}

function asPositiveInt(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function asEnum<T extends string>(value: string, values: readonly T[]): T | null {
  const upper = value.trim().toUpperCase()
  return values.includes(upper as T) ? (upper as T) : null
}

export function toAchievementCategoryFilter(value: string | string[] | undefined | null): string | null {
  const val = firstValue(value).trim()
  const lower = val.toLowerCase()
  return lower.length > 0 && lower !== "all" && lower !== "none" ? val : null
}

export function toAchievementStatusFilter(value: string | string[] | undefined | null): PostStatus | null {
  const val = firstValue(value).trim()
  if (val.toLowerCase() === "all" || val.toLowerCase() === "none") return null
  return asEnum(val, STATUS_VALUES)
}

export function achievementFiltersFromSearch(searchParams: URLSearchParams): AchievementListFilters {
  return {
    page: asPositiveInt(searchParams.get("page") ?? ""),
    pageSize: asPositiveInt(searchParams.get("pageSize") ?? ""),
    category: toAchievementCategoryFilter(searchParams.get("category")),
    tag: searchParams.get("tag") || null,
    q: searchParams.get("q") || null,
    status: toAchievementStatusFilter(searchParams.get("status")),
    authorId: searchParams.get("authorId") || null,
  }
}

export function achievementFiltersFromParams(
  searchParams: Record<string, string | string[] | undefined>
): AchievementListFilters {
  return {
    page: asPositiveInt(firstValue(searchParams.page)),
    pageSize: asPositiveInt(firstValue(searchParams.pageSize)),
    category: toAchievementCategoryFilter(searchParams.category),
    tag: firstValue(searchParams.tag) || null,
    q: firstValue(searchParams.q) || null,
    status: toAchievementStatusFilter(searchParams.status),
    authorId: firstValue(searchParams.authorId) || null,
  }
}
