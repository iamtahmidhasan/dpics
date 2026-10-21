import type { Metadata } from "next"
import Link from "next/link"
import { Code2, FolderGit2, Plus, Search, Sparkles } from "lucide-react"

import { ProjectCard } from "@/components/projects/project-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import prisma from "@/lib/prisma"
import { websiteMetadata } from "@/lib/seo"
import { ProjectService } from "@/lib/services/project.service"
import { COMMON_TECH_STACK } from "@/lib/project-constants"

export const metadata: Metadata = websiteMetadata({
  title: "Student Projects & Portfolios | DPI Computing Society",
  description:
    "Explore innovative software, IoT hardware, and robotics projects engineered by Dhaka Polytechnic Institute Computing Society students.",
  path: "/projects",
})

type Props = {
  searchParams: Promise<{
    page?: string
    q?: string
    category?: string
    techStack?: string
  }>
}

export default async function ProjectsPage({ searchParams }: Props) {
  const params = await searchParams
  const lang = await getLang()
  const t = makeT(lang)

  const page = parseInt(params.page || "1", 10)
  const search = params.q || undefined
  const category = params.category || undefined
  const techStack = params.techStack || undefined

  const [categories, data] = await Promise.all([
    prisma.category.findMany({
      where: { type: "PROJECT", isActive: true },
      select: { id: true, name: true, nameBn: true, slug: true },
      orderBy: { name: "asc" },
    }),
    ProjectService.listProjects({
      page,
      pageSize: 12,
      search,
      category,
      techStack,
    }),
  ])

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 md:py-16 space-y-10">
      {/* Hero Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-border/60 pb-8">
        <div className="space-y-3 max-w-2xl">
          <Badge
            variant="outline"
            className="gap-1.5 border-primary/30 bg-primary/10 text-primary text-xs px-3 py-1"
          >
            <FolderGit2 className="size-3.5" />
            {t("Student Engineering Showcase", "শিক্ষার্থীদের প্রজেক্ট প্রদর্শনী")}
          </Badge>

          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {t("Projects & Portfolios", "প্রজেক্ট ও পোর্টফোলিও")}
          </h1>

          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t(
              "Discover web platforms, robotics systems, IoT prototypes, and open-source contributions crafted by student engineers of Dhaka Polytechnic Institute.",
              "ঢাকা পলিটেকনিক ইনস্টিটিউটের শিক্ষার্থীদের তৈরি ওয়েব প্ল্যাটফর্ম, রোবটিক্স সিস্টেম, আইওটি প্রোটোটাইপ ও ওপেন সোর্স প্রজেক্ট ঘুরে দেখুন।"
            )}
          </p>
        </div>

        {/* Submit Action */}
        <div className="shrink-0">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/profile/projects" />}
            className="gap-2 font-semibold shadow-md"
          >
            <Plus className="size-4" />
            {t("Submit Your Project", "আপনার প্রজেক্ট জমা দিন")}
          </Button>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="space-y-4">
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <Button
            size="sm"
            variant={!category ? "default" : "outline"}
            nativeButton={false}
            render={<Link href="/projects" />}
            className="h-8 text-xs shrink-0"
          >
            {t("All Projects", "সকল প্রজেক্ট")}
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={category === cat.slug ? "default" : "outline"}
              nativeButton={false}
              render={<Link href={`/projects?category=${encodeURIComponent(cat.slug)}`} />}
              className="h-8 text-xs shrink-0"
            >
              {lang === "bn" && cat.nameBn ? cat.nameBn : cat.name}
            </Button>
          ))}
        </div>

        {/* Popular Tech Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          <span className="text-muted-foreground shrink-0 font-medium text-[11px]">
            {t("Filter by Tech:", "টেকনোলজি অনুযায়ী:")}
          </span>
          {COMMON_TECH_STACK.slice(0, 8).map((tech) => (
            <Link
              key={tech}
              href={`/projects?techStack=${encodeURIComponent(tech)}`}
              className={`rounded-full px-3 py-1 text-xs transition-colors shrink-0 ${
                techStack === tech
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted/70 hover:bg-muted text-foreground/80 border border-border/50"
              }`}
            >
              {tech}
            </Link>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {data.projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center space-y-4">
          <Code2 className="size-12 mx-auto text-muted-foreground/40" />
          <div className="space-y-1">
            <h3 className="font-heading text-lg font-bold">
              {t("No projects found", "কোনো প্রজেক্ট পাওয়া যায়নি")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {t(
                "No published student projects match your current filter criteria. Try clearing filters or submit the first one!",
                "নির্বাচিত ফিল্টারের সাথে কোনো প্রজেক্ট মেলেনি। অন্য ফিল্টার চেষ্টা করুন অথবা প্রথম প্রজেক্টটি আপনিই জমা দিন!"
              )}
            </p>
          </div>
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/projects" />}
            variant="outline"
          >
            {t("Clear All Filters", "ফিল্টার রিসেট করুন")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Button
              key={pageNum}
              size="sm"
              variant={pageNum === data.page ? "default" : "outline"}
              nativeButton={false}
              render={<Link href={`/projects?page=${pageNum}`} />}
              className="size-8 p-0 text-xs"
            >
              {pageNum}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
