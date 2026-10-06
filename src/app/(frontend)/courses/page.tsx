import {
  Award,
  BookOpen,
  CheckCircle2,
  Code2,
  Filter,
  GraduationCap,
  Layers,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { CourseCard } from "@/components/courses/course-card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { CourseService } from "@/lib/services/course.service"
import { websiteMetadata } from "@/lib/seo"
import { cn } from "cn"

const DESCRIPTION = "Learn web development, competitive programming, and modern engineering skills."

export const metadata: Metadata = websiteMetadata({
  title: "Courses",
  socialTitle: "Courses | DPICS Academy",
  description: DESCRIPTION,
  path: "/courses",
})

/** Filter chips are links, so the whole page stays server rendered. */
function FilterLink({
  href,
  active,
  children,
  className,
}: {
  href: string
  active: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-xs"
          : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      {children}
    </Link>
  )
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const [lang] = await Promise.all([getLang()])
  const t = makeT(lang)

  const q =
    typeof params.q === "string"
      ? params.q.trim()
      : typeof params.search === "string"
        ? params.search.trim()
        : undefined
  const filterType = typeof params.type === "string" ? params.type : undefined
  const isFree = filterType === "free" ? true : filterType === "paid" ? false : undefined
  const level = typeof params.level === "string" ? (params.level as any) : undefined
  const tag = typeof params.tag === "string" ? params.tag : undefined

  const courses = await CourseService.listCourses({
    isPublished: true,
    isFree,
    search: q,
    level,
    tag,
  })

  // Collect unique tags and counts from all published courses for tag facet chips
  const allCourses = await CourseService.listCourses({ isPublished: true })
  const tagCounts: Record<string, number> = {}
  allCourses.forEach((c) => {
    ;(c.tags || []).forEach((tName) => {
      tagCounts[tName] = (tagCounts[tName] || 0) + 1
    })
  })
  const popularTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const buildHref = (overrides: Record<string, string | null>) => {
    const query = new URLSearchParams()

    const next = {
      q: q ?? null,
      type: filterType ?? null,
      level: level ?? null,
      tag: tag ?? null,
      ...overrides,
    }

    for (const [key, value] of Object.entries(next)) {
      if (value) query.set(key, value)
    }

    const searchStr = query.toString()
    return searchStr ? `/courses?${searchStr}` : "/courses"
  }

  const hasFilters = Boolean(q || filterType || level || tag)

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8 space-y-10">
      {/* Academy Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card/90 to-card/60 p-6 md:p-10 shadow-xs">
        <div className="relative z-10 max-w-3xl space-y-4">
          
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
            {t(
              "Master In-Demand Tech Skills & Practical Software Engineering",
              "আধুনিক সফটওয়্যার ইঞ্জিনিয়ারিং ও প্রযুক্তি দক্ষতা অর্জন করুন"
            )}
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            {t(
              "Practical project-based curriculum, interactive coding assignments, video lectures, and direct guidance tailored for polytechnic and computer science students.",
              "হাতে-কলমে প্রজেক্ট-ভিত্তিক সিলেবাস, ইন্টারঅ্যাক্টিভ কোডিং অ্যাসাইনমেন্ট এবং পলিটেকনিক ও সিএস শিক্ষার্থীদের জন্য বিশেষায়িত কোর্স।"
            )}
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
            <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-background/60 p-2.5 backdrop-blur-xs">
              <BookOpen className="size-4 text-primary shrink-0" />
              <div className="text-xs">
                <span className="font-bold font-heading text-foreground block">
                  {allCourses.length}+ {t("Courses", "কোর্স")}
                </span>
                <span className="text-[10px] text-muted-foreground">{t("Curated tracks", "স্ট্রাকচার্ড ট্র্যাক")}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-background/60 p-2.5 backdrop-blur-xs">
              <Code2 className="size-4 text-primary shrink-0" />
              <div className="text-xs">
                <span className="font-bold font-heading text-foreground block">
                  {t("Hands-on", "হ্যান্ডস-অন")}
                </span>
                <span className="text-[10px] text-muted-foreground">{t("Real projects", "রিয়েল প্রজেক্ট")}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-background/60 p-2.5 backdrop-blur-xs">
              <Users className="size-4 text-primary shrink-0" />
              <div className="text-xs">
                <span className="font-bold font-heading text-foreground block">
                  {t("Mentorship", "মেন্টরশিপ")}
                </span>
                <span className="text-[10px] text-muted-foreground">{t("Community support", "সক্রিয় সহায়তা")}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-background/60 p-2.5 backdrop-blur-xs">
              <Award className="size-4 text-primary shrink-0" />
              <div className="text-xs">
                <span className="font-bold font-heading text-foreground block">
                  {t("Certificates", "সার্টিফিকেট")}
                </span>
                <span className="text-[10px] text-muted-foreground">{t("Verified credentials", "যাচাইকৃত সনদ")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Search & Filter Bar */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search Form */}
          <form action="/courses" method="get" className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder={t(
                  "Search courses, topics, or technologies...",
                  "কোর্স, টপিক বা টেকনোলজি খুঁজুন..."
                )}
                aria-label={t("Search courses", "কোর্স খুঁজুন")}
                className="pl-9 text-xs h-9"
              />
            </div>
            {filterType ? <input type="hidden" name="type" value={filterType} /> : null}
            {level ? <input type="hidden" name="level" value={level} /> : null}
            {tag ? <input type="hidden" name="tag" value={tag} /> : null}
            <button
              type="submit"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              {t("Search", "খুঁজুন")}
            </button>
            {hasFilters ? (
              <Link
                href="/courses"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
                aria-label={t("Clear filters", "ফিল্টার মুছুন")}
              >
                <X className="size-4" />
              </Link>
            ) : null}
          </form>

          {/* Pricing Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterLink href={buildHref({ type: null })} active={!filterType}>
              {t("All Courses", "সকল কোর্স")}
            </FilterLink>
            <FilterLink href={buildHref({ type: "free" })} active={filterType === "free"}>
              {t("100% Free", "১০০% ফ্রি")}
            </FilterLink>
            <FilterLink href={buildHref({ type: "paid" })} active={filterType === "paid"}>
              {t("Pro / Paid", "পেইড কোর্স")}
            </FilterLink>
          </div>
        </div>

        {/* Level Filters & Popular Tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
          {/* Level Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground font-mono text-[11px] mr-1">
              {t("Level:", "লেভেল:")}
            </span>
            <FilterLink href={buildHref({ level: null })} active={!level}>
              {t("All", "সব")}
            </FilterLink>
            <FilterLink href={buildHref({ level: "BEGINNER" })} active={level === "BEGINNER"}>
              {t("Beginner", "বিগিনার")}
            </FilterLink>
            <FilterLink
              href={buildHref({ level: "INTERMEDIATE" })}
              active={level === "INTERMEDIATE"}
            >
              {t("Intermediate", "মিডিয়াম")}
            </FilterLink>
            <FilterLink href={buildHref({ level: "ADVANCED" })} active={level === "ADVANCED"}>
              {t("Advanced", "অ্যাডভান্সড")}
            </FilterLink>
          </div>

          {/* Tag Chips */}
          {popularTags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-muted-foreground font-mono text-[11px] mr-1">
                {t("Topics:", "টপিক:")}
              </span>
              {popularTags.map(([tagName]) => {
                const isActive = tag === tagName
                return (
                  <Link
                    key={tagName}
                    href={buildHref({ tag: isActive ? null : tagName })}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-mono transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    #{tagName}
                  </Link>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* Courses Catalog Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-mono">
            {t("Showing", "প্রদর্শিত হচ্ছে")} {courses.length}{" "}
            {t("available courses", "টি কোর্স")}
          </p>

          {hasFilters ? (
            <Link
              href="/courses"
              className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
            >
              <X className="size-3" />
              {t("Reset all filters", "সব ফিল্টার রিসেট করুন")}
            </Link>
          ) : null}
        </div>

        {courses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center space-y-3">
            <GraduationCap className="mx-auto size-12 text-muted-foreground/40" />
            <h3 className="font-heading text-lg font-semibold text-foreground">
              {t("No courses found", "কোনো কোর্স পাওয়া যায়নি")}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {t(
                "We couldn't find any courses matching your criteria. Try adjusting your search query or filters.",
                "আপনার ফিল্টারের সাথে মিলে এমন কোনো কোর্স পাওয়া যায়নি। অনুসন্ধান বা ফিল্টার পরিবর্তন করে দেখুন।"
              )}
            </p>
            <div className="pt-2">
              <Link
                href="/courses"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {t("View all courses", "সকল কোর্স দেখুন")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} lang={lang} />
            ))}
          </div>
        )}
      </section>

      {/* Why Learn with DPICS Academy? Value Proposition Section */}
      <section className="rounded-2xl border border-border bg-card/60 p-6 md:p-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            {t("Why DPICS Academy?", "কেন ডিপিআইসিএস একাডেমি?")}
          </Badge>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
            {t(
              "Built by Engineers, Designed for Student Success",
              "শিক্ষার্থীদের সফলতার জন্য ইঞ্জিনিয়ারদের তৈরি প্ল্যাটফর্ম"
            )}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {t(
              "High quality education shouldn't be expensive or out of reach. We focus on real-world engineering readiness.",
              "উচ্চমানের প্রোগ্রামিং শিক্ষা সবার নাগালে পৌঁছে দিতে এবং প্র্যাকটিক্যাল স্কিল তৈরিতে আমরা প্রতিজ্ঞাবদ্ধ।"
            )}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border/80 bg-background/80 p-4 space-y-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Code2 className="size-5" />
            </div>
            <h3 className="font-heading text-sm font-semibold text-foreground">
              {t("Polytechnic to Industry", "পলিটেকনিক থেকে ইন্ডাস্ট্রি")}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(
                "Bridging the diploma engineering curriculum with current software industry expectations and job market demands.",
                "ডিপ্লোমা সিলেবাসের পাশাপাশি আধুনিক সফটওয়্যার ইন্ডাস্ট্রির চাহিদা মেটানোর উপযোগী কারিকুলাম।"
              )}
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-background/80 p-4 space-y-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Layers className="size-5" />
            </div>
            <h3 className="font-heading text-sm font-semibold text-foreground">
              {t("Production-Grade Projects", "প্রোডাকশন-গ্রেড প্রজেক্ট")}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(
                "Build full-stack applications, deploy them live on the cloud, and build a resume-worthy GitHub portfolio.",
                "শুধু ভিডিও দেখা নয়, রিয়েল অ্যাপ তৈরি ও ক্লাউডে ডিপ্লয় করে চমৎকার গিটহাব পোর্টফোলিও তৈরি করুন।"
              )}
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-background/80 p-4 space-y-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Users className="size-5" />
            </div>
            <h3 className="font-heading text-sm font-semibold text-foreground">
              {t("Vibrant Peer Community", "সক্রিয় কমিউনিটি ও মেন্টর")}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(
                "Direct problem solving support from society executives, senior alumni, and active tech instructors.",
                "সোসাইটির সিনিয়র ও দক্ষ ডেভেলপারদের থেকে সরাসরি প্রবলেম সলভিং ও ক্যারিয়ার গাইডলাইন সহায়তা।"
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
