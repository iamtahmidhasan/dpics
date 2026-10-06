import { Award, Filter, Sparkles, Trophy, X } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { AchievementCard } from "@/components/achievements/achievement-card"
import { AchievementPagination } from "@/components/achievements/achievement-pagination"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { achievementFiltersFromParams } from "@/lib/achievement-params"
import {
  listAchievementFacets,
  listPublishedAchievements,
} from "@/lib/services/achievement.service"
import { websiteMetadata } from "@/lib/seo"
import { cn } from "cn"

const DESCRIPTION =
  "Celebrate the achievements, awards, hackathon triumphs, and technical excellence of DPI Computing Society members and mentors."

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const params = await searchParams
  const raw = Array.isArray(params.page) ? params.page[0] : params.page
  const pageNum = Number.parseInt(raw ?? "", 10)
  return websiteMetadata({
    title: "Achievements | DPI Computing Society",
    description: DESCRIPTION,
    // Paginated pages self-canonicalize; filtered variants fall back to the base URL.
    path: pageNum > 1 ? `/achievements?page=${pageNum}` : "/achievements",
  })
}

function FilterLink({
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

export default async function PublicAchievementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const [lang] = await Promise.all([getLang()])
  const t = makeT(lang)
  const isBn = lang === "bn"

  const filters = achievementFiltersFromParams(params)
  const [page, facets] = await Promise.all([
    listPublishedAchievements(filters),
    listAchievementFacets(),
  ])

  const buildHref = (overrides: Record<string, string | null | number>) => {
    const query = new URLSearchParams()
    const next = {
      q: filters.q ?? null,
      category: filters.category ?? null,
      tag: filters.tag ?? null,
      ...overrides,
    }

    for (const [key, value] of Object.entries(next)) {
      if (value !== null && value !== undefined && value !== "") {
        query.set(key, String(value))
      }
    }

    const search = query.toString()
    return search ? `/achievements?${search}` : "/achievements"
  }

  const hasFilters = Boolean(filters.q || filters.category || filters.tag)
  const popularTags = facets.tags.slice(0, 10)

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/10 via-primary/5 to-background p-6 md:p-10 shadow-xs">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Trophy className="size-3.5" />
            <span>{t("Hall of Fame & Recognitions", "হল অব ফেম ও গৌরবময় অর্জন")}</span>
          </div>

          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight">
            {t("Society Achievements", "সোসাইটির সাফল্য ও অর্জন")}
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t(
              "Honoring the awards, national hackathon podiums, research milestones, and certifications won by our brilliant students and mentors.",
              "আমাদের মেধাবী শিক্ষার্থী ও মেন্টরদের জাতীয় হ্যাকাথন বিজয়, প্রতিযোগিতা, গবেষণা মাইলফলক ও প্রযুক্তিগত স্বীকৃতির নিদর্শন।"
            )}
          </p>
        </div>

        <div className="pointer-events-none absolute -right-6 -bottom-8 opacity-10 md:opacity-15">
          <Award className="size-64 text-primary" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-8 space-y-4">
        <form action="/achievements" method="get" className="flex gap-2">
          <Input
            type="search"
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder={t("Search achievements by title, organization or skill…", "শিরোনাম, প্রতিষ্ঠান বা স্কিল দিয়ে অর্জন খুঁজুন…")}
            className="flex-1"
          />
          {filters.category && (
            <input type="hidden" name="category" value={filters.category} />
          )}
          {filters.tag && <input type="hidden" name="tag" value={filters.tag} />}
          <Button type="submit" size="default">
            {t("Search", "অনুসন্ধান")}
          </Button>
        </form>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mr-1">
            <Filter className="size-3" />
            {t("Category:", "ক্যাটাগরি:")}
          </span>

          <FilterLink href={buildHref({ category: null, page: null })} active={!filters.category}>
            {t("All", "সব")}
          </FilterLink>

          {facets.categories.map((c) => (
            <FilterLink
              key={c.id}
              href={buildHref({ category: c.slug, page: null })}
              active={filters.category === c.slug || filters.category === c.id}
            >
              {isBn && c.nameBn ? c.nameBn : c.name}
              <span className="ml-1 opacity-60 text-[10px]">({c.count})</span>
            </FilterLink>
          ))}
        </div>

        {/* Tags Bar */}
        {popularTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
            <span className="font-medium mr-1">{t("Popular tags:", "জনপ্রিয় ট্যাগ:")}</span>
            {popularTags.map((tag) => (
              <Link
                key={tag.name}
                href={buildHref({ tag: filters.tag === tag.name ? null : tag.name, page: null })}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] transition-colors",
                  filters.tag === tag.name
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                #{tag.name}
                <span className="ml-1 opacity-70">({tag.count})</span>
              </Link>
            ))}
          </div>
        )}

        {/* Active Filters Summary */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-2.5 text-xs text-muted-foreground">
            <span>{t("Active filters:", "সক্রিয় ফিল্টার:")}</span>
            {filters.q && (
              <Badge variant="secondary" className="gap-1 font-normal">
                {t("Search:", "খোঁজ:")} &ldquo;{filters.q}&rdquo;
                <Link href={buildHref({ q: null, page: null })}>
                  <X className="size-3" />
                </Link>
              </Badge>
            )}
            {filters.category && (
              <Badge variant="secondary" className="gap-1 font-normal">
                {t("Category:", "ক্যাটাগরি:")} {filters.category}
                <Link href={buildHref({ category: null, page: null })}>
                  <X className="size-3" />
                </Link>
              </Badge>
            )}
            {filters.tag && (
              <Badge variant="secondary" className="gap-1 font-normal">
                #{filters.tag}
                <Link href={buildHref({ tag: null, page: null })}>
                  <X className="size-3" />
                </Link>
              </Badge>
            )}
            <Link
              href="/achievements"
              className="text-primary hover:underline ml-auto font-medium"
            >
              {t("Clear all", "সব মুছুন")}
            </Link>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="mt-8">
        {page.achievements.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center bg-card/40">
            <Trophy className="size-10 text-muted-foreground/50" />
            <h3 className="mt-3 font-heading text-lg font-semibold">
              {t("No achievements found", "কোনো অর্জন পাওয়া যায়নি")}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {hasFilters
                ? t("Try adjusting your search query or removing active filters.", "আপনার অনুসন্ধানের শব্দ পরিবর্তন করে বা ফিল্টার মুছে আবার চেষ্টা করুন।")
                : t("Check back soon for inspiring stories and contest recognitions.", "শীঘ্রই নতুন অর্জন ও সাফল্যের খবর দেখার জন্য চোখ রাখুন।")}
            </p>
            {hasFilters && (
              <Link
                href="/achievements"
                className={buttonVariants({ variant: "outline", size: "sm", className: "mt-4" })}
              >
                {t("Reset filters", "ফিল্টার রিসেট")}
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {page.achievements.map((item) => (
              <AchievementCard
                key={item.id}
                achievement={item}
                lang={lang}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {page.totalPages > 1 && (
          <div className="mt-10">
            <AchievementPagination
              page={page.page}
              totalPages={page.totalPages}
              buildHref={(p) => buildHref({ page: p })}
              labels={{
                previous: t("Previous", "পূর্ববর্তী"),
                next: t("Next", "পরবর্তী"),
                page: (cur, tot) =>
                  t(`Page ${cur} of ${tot}`, `পৃষ্ঠা ${cur} / ${tot}`),
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
