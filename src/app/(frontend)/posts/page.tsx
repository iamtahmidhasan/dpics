import { Filter, X } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { EmptyState } from "@/components/posts/empty-state"
import { PostCard } from "@/components/posts/post-card"
import { PostPagination } from "@/components/posts/post-pagination"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { postFiltersFromParams } from "@/lib/post-params"
import { listPostFacets, listPublishedPosts } from "@/lib/services/post.service"
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site"
import { cn } from "cn"

export const metadata: Metadata = {
  title: { default: "Blog", absolute: "Blog" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/posts" },
  openGraph: {
    type: "website",
    url: "/posts",
    siteName: SITE_NAME,
    title: "Blog",
    description: SITE_DESCRIPTION,
  },
}

/** Filter chips are links, so the whole page stays server rendered. */
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
        "rounded-full border px-2.5 py-1 text-[0.6875rem] font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </Link>
  )
}

export default async function PostsPage({ searchParams }: PageProps<"/posts">) {
  const params = await searchParams
  const [lang] = await Promise.all([getLang()])
  const t = makeT(lang)

  const filters = postFiltersFromParams(params)
  const [page, facets] = await Promise.all([listPublishedPosts(filters), listPostFacets()])

  const buildHref = (overrides: Record<string, string | null>) => {
    const query = new URLSearchParams()

    const next = {
      q: filters.q ?? null,
      category: filters.category ?? null,
      tag: filters.tag ?? null,
      ...overrides,
    }

    for (const [key, value] of Object.entries(next)) {
      if (value) query.set(key, value)
    }

    const search = query.toString()

    return search ? `/posts?${search}` : "/posts"
  }

  const hasFilters = Boolean(filters.q || filters.category || filters.tag)
  const popularTags = facets.tags.slice(0, 12)

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8">
      <header className="space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold">{t("Blog", "ব্লগ")}</h1>
        <p className="text-muted-foreground text-sm">{SITE_DESCRIPTION}</p>
      </header>

      <div className="mt-6 space-y-4">
        <form action="/posts" method="get" className="flex gap-1.5">
          <Input
            type="search"
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder={t("Search posts", "পোস্ট খুঁজুন")}
            aria-label={t("Search posts", "পোস্ট খুঁজুন")}
            className="max-w-xs"
          />
          {filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}
          {filters.tag ? <input type="hidden" name="tag" value={filters.tag} /> : null}
          <button type="submit" className={buttonVariants({ variant: "outline" })}>
            <Filter className="size-3.5" />
            {t("Search", "খুঁজুন")}
          </button>
          {hasFilters ? (
            <Link
              href="/posts"
              className={buttonVariants({ variant: "ghost" })}
              aria-label={t("Clear filters", "ফিল্টার মুছুন")}
            >
              <X className="size-3.5" />
            </Link>
          ) : null}
        </form>

        {facets.categories.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterLink href={buildHref({ category: null })} active={!filters.category}>
              {t("All", "সব")}
            </FilterLink>
            {facets.categories.map((cat) => {
              const catLabel = lang === "bn" && cat.nameBn ? cat.nameBn : cat.name
              return (
                <FilterLink
                  key={cat.id}
                  href={buildHref({ category: cat.slug })}
                  active={filters.category === cat.slug || filters.category === cat.id}
                >
                  {catLabel}
                  <span className="ml-1 opacity-60">{cat.count}</span>
                </FilterLink>
              )
            })}
          </div>
        ) : null}

        {popularTags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {popularTags.map(({ tag, count }) => (
              <Link key={tag} href={buildHref({ tag })}>
                <Badge
                  variant={filters.tag === tag ? "default" : "secondary"}
                  className="text-[0.625rem] font-normal"
                >
                  #{tag}
                  <span className="ml-0.5 opacity-60">{count}</span>
                </Badge>
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        {page.posts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.posts.map((post) => (
              <PostCard key={post.id} post={post} lang={lang} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={t("No posts found", "কোনো পোস্ট পাওয়া যায়নি")}
            description={
              hasFilters
                ? t("Try a different search or clear the filters.", "অন্য কিছু খুঁজুন বা ফিল্টার মুছে দিন।")
                : t("Nothing has been published here yet.", "এখানে এখনও কিছু প্রকাশিত হয়নি।")
            }
            actionHref={hasFilters ? "/posts" : undefined}
            actionLabel={hasFilters ? t("Clear filters", "ফিল্টার মুছুন") : undefined}
          />
        )}
      </div>

      <PostPagination
        className="mt-6"
        page={page.page}
        totalPages={page.totalPages}
        buildHref={(nextPage) => {
          const query = new URLSearchParams()

          if (filters.q) query.set("q", filters.q)
          if (filters.category) query.set("category", filters.category)
          if (filters.tag) query.set("tag", filters.tag)
          if (nextPage > 1) query.set("page", String(nextPage))

          const search = query.toString()

          return search ? `/posts?${search}` : "/posts"
        }}
        labels={{
          previous: t("Previous", "আগের"),
          next: t("Next", "পরের"),
          page: (current, total) => t(`Page ${current} of ${total}`, `পৃষ্ঠা ${current} / ${total}`),
        }}
      />
    </div>
  )
}
