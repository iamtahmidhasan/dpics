import { PostCategory, PostStatus } from "@/generated/prisma/enums"
import type { PostListFilters } from "@/lib/services/post.service"

const POST_CATEGORY_VALUES = Object.values(PostCategory) as PostCategory[]
const POST_STATUS_VALUES = Object.values(PostStatus) as PostStatus[]

function firstValue(value: string | string[] | undefined | null): string {
  if (Array.isArray(value)) return value[0] ?? ""
  if (typeof value !== "string") return ""

  return value
}

function asPositiveInt(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

/**
 * Read filters are lenient on purpose: they arrive from a url, so an unknown
 * category or status is ignored rather than turned into a 400. Writes go
 * through the strict parsers in the service.
 */
function asEnum<T extends string>(
  value: string,
  values: readonly T[]
): T | null {
  const upper = value.trim().toUpperCase()

  return values.includes(upper as T) ? (upper as T) : null
}

export function toPostCategoryFilter(
  value: string | string[] | undefined | null
): PostCategory | null {
  return asEnum(firstValue(value), POST_CATEGORY_VALUES)
}

export function toPostStatusFilter(
  value: string | string[] | undefined | null
): PostStatus | null {
  return asEnum(firstValue(value), POST_STATUS_VALUES)
}

/** From `URLSearchParams`, for route handlers. */
export function postFiltersFromSearch(searchParams: URLSearchParams): PostListFilters {
  return {
    page: asPositiveInt(searchParams.get("page") ?? ""),
    pageSize: asPositiveInt(searchParams.get("pageSize") ?? ""),
    category: toPostCategoryFilter(searchParams.get("category")),
    tag: searchParams.get("tag") || null,
    q: searchParams.get("q") || null,
    status: toPostStatusFilter(searchParams.get("status")),
  }
}

/** From a page's `searchParams`, for server components. */
export function postFiltersFromParams(
  searchParams: Record<string, string | string[] | undefined>
): PostListFilters {
  return {
    page: asPositiveInt(firstValue(searchParams.page)),
    pageSize: asPositiveInt(firstValue(searchParams.pageSize)),
    category: toPostCategoryFilter(searchParams.category),
    tag: firstValue(searchParams.tag) || null,
    q: firstValue(searchParams.q) || null,
    status: toPostStatusFilter(searchParams.status),
  }
}

/** The status filter used by the author facing list. */
export function postFiltersForAuthor(
  searchParams: Record<string, string | string[] | undefined>
): PostListFilters {
  const filters = postFiltersFromParams(searchParams)

  return { ...filters, category: null, tag: null }
}