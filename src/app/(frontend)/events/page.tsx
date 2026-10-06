import { Calendar, Filter, Sparkles, Tag, X } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { EventCard } from "@/components/events/event-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { eventFiltersFromParams } from "@/lib/event-params"
import { listPublishedEvents } from "@/lib/services/event.service"
import prisma from "@/lib/prisma"
import { websiteMetadata } from "@/lib/seo"
import { cn } from "cn"

const DESCRIPTION =
  "Explore upcoming workshops, coding hackathons, seminars, and tech sessions hosted by DPI Computing Society."

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const params = await searchParams
  const raw = Array.isArray(params.page) ? params.page[0] : params.page
  const pageNum = Number.parseInt(raw ?? "", 10)
  return websiteMetadata({
    title: "Events | DPI Computing Society",
    description: DESCRIPTION,
    // Paginated pages self-canonicalize; filtered variants fall back to the base URL.
    path: pageNum > 1 ? `/events?page=${pageNum}` : "/events",
  })
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </Link>
  )
}

export default async function PublicEventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const [lang] = await Promise.all([getLang()])
  const t = makeT(lang)
  const isBn = lang === "bn"

  const filters = eventFiltersFromParams(params)
  const [pageData, categories] = await Promise.all([
    listPublishedEvents(filters),
    prisma.category.findMany({
      where: { type: "EVENT", isActive: true },
      select: { id: true, name: true, nameBn: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ])

  const currentTimeframe = filters.timeframe || "upcoming"

  const buildHref = (overrides: Record<string, string | null | number>) => {
    const query = new URLSearchParams()
    const next = {
      timeframe: filters.timeframe ?? "upcoming",
      category: filters.category ?? null,
      type: filters.type ?? null,
      q: filters.q ?? null,
      ...overrides,
    }

    for (const [key, value] of Object.entries(next)) {
      if (value !== null && value !== undefined && value !== "") {
        query.set(key, String(value))
      }
    }

    const search = query.toString()
    return search ? `/events?${search}` : "/events"
  }

  const hasActiveFilters = Boolean(
    filters.q || filters.category || filters.type || (filters.timeframe && filters.timeframe !== "upcoming")
  )

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/10 via-primary/5 to-background p-6 md:p-10 shadow-xs">
        <div className="relative z-10 max-w-2xl space-y-3">
          <Badge
            variant="outline"
            className="gap-1.5 border-primary/30 bg-primary/10 text-primary text-xs"
          >
            <Sparkles className="size-3 text-primary" />
            {t({ en: "Computing Society Events", bn: "কম্পিউটিং সোসাইটি ইভেন্টস" })}
          </Badge>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {t({ en: "Learn, Compete & Network", bn: "শিখুন, প্রতিযোগিতা করুন ও নেটওয়ার্ক গড়ে তুলুন" })}
          </h1>

          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t({
              en: "Hands-on workshops, programming contests, tech talks and bootcamps to elevate your career and skills.",
              bn: "আপনার দক্ষতা এবং ক্যারিয়ার এগিয়ে নিতে হ্যান্ডস-অন ওয়ার্কশপ, প্রোগ্রামিং কনটেস্ট, টেক টক এবং বুটক্যাম্প।",
            })}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Timeframe Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/40 p-1">
            <Link
              href={buildHref({ timeframe: "upcoming", page: 1 })}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                currentTimeframe === "upcoming"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t({ en: "Upcoming", bn: "আসন্ন ইভেন্ট" })}
            </Link>

            <Link
              href={buildHref({ timeframe: "past", page: 1 })}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                currentTimeframe === "past"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t({ en: "Past Events", bn: "অতীতের ইভেন্ট" })}
            </Link>

            <Link
              href={buildHref({ timeframe: "all", page: 1 })}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                currentTimeframe === "all"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t({ en: "All Events", bn: "সকল ইভেন্ট" })}
            </Link>
          </div>

          {/* Search Input */}
          <form
            method="get"
            action="/events"
            className="relative flex w-full sm:w-72 items-center"
          >
            {filters.timeframe && (
              <input type="hidden" name="timeframe" value={filters.timeframe} />
            )}
            {filters.category && (
              <input type="hidden" name="category" value={filters.category} />
            )}
            {filters.type && <input type="hidden" name="type" value={filters.type} />}

            <Input
              name="q"
              defaultValue={filters.q || ""}
              placeholder={t({ en: "Search events...", bn: "ইভেন্ট খুঁজুন..." })}
              className="pr-8 text-xs h-9"
            />
            {filters.q && (
              <Link
                href={buildHref({ q: null, page: 1 })}
                className="absolute right-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </Link>
            )}
          </form>
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-medium text-muted-foreground mr-1 flex items-center gap-1">
              <Tag className="size-3" />
              {t({ en: "Category:", bn: "ক্যাটাগরি:" })}
            </span>

            <FilterPill
              href={buildHref({ category: null, page: 1 })}
              active={!filters.category}
            >
              {t({ en: "All", bn: "সকল" })}
            </FilterPill>

            {categories.map((cat) => (
              <FilterPill
                key={cat.id}
                href={buildHref({ category: cat.slug, page: 1 })}
                active={filters.category === cat.slug}
              >
                {isBn && cat.nameBn ? cat.nameBn : cat.name}
              </FilterPill>
            ))}

            {hasActiveFilters && (
              <Link
                href="/events"
                className="ml-auto inline-flex items-center gap-1 text-xs text-destructive hover:underline"
              >
                <X className="size-3" />
                {t({ en: "Clear Filters", bn: "ফিল্টার মুছুন" })}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Events Grid */}
      <div className="mt-8">
        {pageData.events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <Calendar className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {t({ en: "No events found", bn: "কোনো ইভেন্ট পাওয়া যায়নি" })}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {hasActiveFilters
                ? t({
                    en: "Try clearing search keywords or category filters.",
                    bn: "অনুসন্ধান ফিল্টার মুছে পুনরায় চেষ্টা করুন।",
                  })
                : t({
                    en: "New workshops and competitions will be announced soon. Stay tuned!",
                    bn: "শীঘ্রই নতুন ওয়ার্কশপ ও প্রতিযোগিতার তারিখ ঘোষণা করা হবে!",
                  })}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href="/events" />}
                className="mt-4 text-xs"
              >
                {t({ en: "Reset Filters", bn: "ফিল্টার রিসেট করুন" })}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pageData.events.map((event) => (
              <EventCard key={event.id} event={event} lang={lang} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pageData.totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {Array.from({ length: pageData.totalPages }).map((_, idx) => {
            const pageNum = idx + 1
            const isActive = pageNum === pageData.page
            return (
              <Link
                key={pageNum}
                href={buildHref({ page: pageNum })}
                className={cn(
                  "flex size-8 items-center justify-center rounded-md border text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground font-bold"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {pageNum}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
