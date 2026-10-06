import { EventStatus, EventType } from "@/generated/prisma/enums"
import type { EventListFilters } from "@/lib/services/event.service"

const STATUS_VALUES = Object.values(EventStatus) as EventStatus[]
const TYPE_VALUES = Object.values(EventType) as EventType[]

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

export function toEventCategoryFilter(value: string | string[] | undefined | null): string | null {
  const val = firstValue(value).trim()
  const lower = val.toLowerCase()
  return lower.length > 0 && lower !== "all" && lower !== "none" ? val : null
}

export function toEventStatusFilter(value: string | string[] | undefined | null): EventStatus | null {
  const val = firstValue(value).trim()
  if (val.toLowerCase() === "all" || val.toLowerCase() === "none") return null
  return asEnum(val, STATUS_VALUES)
}

export function toEventTypeFilter(value: string | string[] | undefined | null): EventType | null {
  const val = firstValue(value).trim()
  if (val.toLowerCase() === "all" || val.toLowerCase() === "none") return null
  return asEnum(val, TYPE_VALUES)
}

export function eventFiltersFromSearch(searchParams: URLSearchParams): EventListFilters {
  const timeframe = searchParams.get("timeframe")?.toLowerCase()
  const isFeatured = searchParams.get("isFeatured")

  return {
    page: asPositiveInt(searchParams.get("page") ?? ""),
    pageSize: asPositiveInt(searchParams.get("pageSize") ?? ""),
    category: toEventCategoryFilter(searchParams.get("category")),
    tag: searchParams.get("tag") || null,
    q: searchParams.get("q") || null,
    status: toEventStatusFilter(searchParams.get("status")),
    type: toEventTypeFilter(searchParams.get("type")),
    timeframe:
      timeframe === "upcoming" || timeframe === "past" || timeframe === "all"
        ? (timeframe as "upcoming" | "past" | "all")
        : null,
    isFeatured: isFeatured === "true" ? true : isFeatured === "false" ? false : undefined,
  }
}

export function eventFiltersFromParams(
  searchParams: Record<string, string | string[] | undefined>
): EventListFilters {
  const timeframe = firstValue(searchParams.timeframe).toLowerCase()
  const isFeatured = firstValue(searchParams.isFeatured)

  return {
    page: asPositiveInt(firstValue(searchParams.page)),
    pageSize: asPositiveInt(firstValue(searchParams.pageSize)),
    category: toEventCategoryFilter(searchParams.category),
    tag: firstValue(searchParams.tag) || null,
    q: firstValue(searchParams.q) || null,
    status: toEventStatusFilter(searchParams.status),
    type: toEventTypeFilter(searchParams.type),
    timeframe:
      timeframe === "upcoming" || timeframe === "past" || timeframe === "all"
        ? (timeframe as "upcoming" | "past" | "all")
        : null,
    isFeatured: isFeatured === "true" ? true : isFeatured === "false" ? false : undefined,
  }
}
