import {
  Award,
  Building2,
  CalendarDays,
  ExternalLink,
  Home,
  Share2,
  Trophy,
} from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import {
  BilingualAchievementContent,
  BilingualAchievementExcerpt,
  BilingualAchievementTitle,
} from "@/components/achievements/bilingual-achievement-content"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import {
  getPublishedAchievementBySlug,
  listPublishedAchievements,
} from "@/lib/services/achievement.service"
import { SITE_NAME, SITE_URL } from "@/lib/site"
import { cn } from "cn"

type AchievementPageProps = {
  params: Promise<{ slug: string }>
}

export const revalidate = 300

export async function generateStaticParams() {
  try {
    const page = await listPublishedAchievements({ page: 1, pageSize: 50 })
    return page.achievements.map((item) => ({ slug: item.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: AchievementPageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const achievement = await getPublishedAchievementBySlug(slug)
    const title = `${achievement.title} | ${SITE_NAME}`
    const description =
      achievement.excerpt ||
      `${achievement.title} awarded by ${achievement.organization || "DPI Computing Society"}.`
    const url = `${SITE_URL}/achievements/${achievement.slug}`
    const image = achievement.coverImage

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: "article",
        url,
        siteName: SITE_NAME,
        title,
        description,
        publishedTime: achievement.publishedAt ?? undefined,
        modifiedTime: achievement.updatedAt,
        authors: [achievement.author.name],
        tags: achievement.tags,
        images: image ? [{ url: image, alt: achievement.title }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: image ? [image] : undefined,
      },
    }
  } catch {
    return { title: "Achievement not found" }
  }
}

export default async function AchievementDetailPage({ params }: AchievementPageProps) {
  const { slug } = await params
  const [lang] = await Promise.all([getLang()])
  const t = makeT(lang)
  const isBn = lang === "bn"

  let achievement
  try {
    achievement = await getPublishedAchievementBySlug(slug)
  } catch {
    notFound()
  }

  const timestamp = achievement.eventDate ?? achievement.publishedAt ?? achievement.createdAt
  const dateLabel = new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(timestamp))

  const authorInitials = (achievement.author.name || "?").trim().charAt(0).toUpperCase()
  const authorIdentifier = achievement.author.studentId || achievement.author.instructorId

  const categoryName = achievement.category
    ? isBn && achievement.category.nameBn
      ? achievement.category.nameBn
      : achievement.category.name
    : null

  const displayOrg = isBn && achievement.organizationBn ? achievement.organizationBn : achievement.organization

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Achievement",
    name: achievement.title,
    description: achievement.excerpt,
    datePublished: achievement.publishedAt,
    image: achievement.coverImage,
    author: {
      "@type": "Person",
      name: achievement.author.name,
    },
    recognizedBy: achievement.organization
      ? {
          "@type": "Organization",
          name: achievement.organization,
        }
      : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground flex items-center gap-1">
            <Home className="size-3.5" />
            <span>{t("Home", "হোম")}</span>
          </Link>
          <span>/</span>
          <Link href="/achievements" className="hover:text-foreground">
            {t("Achievements", "অর্জনসমূহ")}
          </Link>
          <span>/</span>
          <span className="truncate text-foreground font-medium max-w-[200px] sm:max-w-xs">
            {isBn && achievement.titleBn ? achievement.titleBn : achievement.title}
          </span>
        </nav>

        {/* Hero Card / Details */}
        <article className="space-y-8">
          <header className="space-y-4">
            {/* Meta Tags Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {achievement.isFeatured && (
                <Badge className="bg-primary text-primary-foreground text-xs">
                  <Trophy className="size-3 mr-1" />
                  {t("Featured Recognition", "ফিচার্ড স্বীকৃতি")}
                </Badge>
              )}
              {categoryName && (
                <Badge variant="secondary" className="text-xs">
                  {categoryName}
                </Badge>
              )}
              {displayOrg && (
                <div className="flex items-center gap-1 rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs text-foreground font-medium">
                  <Building2 className="size-3.5 text-primary" />
                  <span>{displayOrg}</span>
                </div>
              )}
            </div>

            {/* Title & Excerpt */}
            <BilingualAchievementTitle
              title={achievement.title}
              titleBn={achievement.titleBn}
            />

            <BilingualAchievementExcerpt
              excerpt={achievement.excerpt}
              excerptBn={achievement.excerptBn}
            />

            {/* Author info & Date strip */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border/70 py-3.5">
              <Link
                href={`/profile/${achievement.author.id}`}
                className="group flex items-center gap-3"
              >
                <Avatar className="size-10 border border-primary/20">
                  {achievement.author.avatar && (
                    <AvatarImage src={achievement.author.avatar} alt={achievement.author.name} />
                  )}
                  <AvatarFallback className="font-semibold">{authorInitials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold group-hover:text-primary transition-colors">
                    {achievement.author.name}
                  </span>
                  {authorIdentifier && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {authorIdentifier}
                    </span>
                  )}
                </div>
              </Link>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-primary/70" />
                  <time dateTime={timestamp}>{dateLabel}</time>
                </div>

                {achievement.certificateUrl && (
                  <a
                    href={achievement.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }), "h-8 gap-1.5 text-xs")}
                  >
                    <ExternalLink className="size-3.5" />
                    <span>{t("View Certificate", "সার্টিফিকেট দেখুন")}</span>
                  </a>
                )}
              </div>
            </div>
          </header>

          {/* Cover Image */}
          {achievement.coverImage && (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 shadow-md">
              <Image
                src={achievement.coverImage}
                alt={achievement.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
              />
            </div>
          )}

          {/* Main Content Body */}
          <div className="prose prose-neutral dark:prose-invert max-w-none pt-2">
            <BilingualAchievementContent
              content={achievement.content}
              contentBn={achievement.contentBn}
            />
          </div>

          {/* Image Gallery */}
          {achievement.images.length > 0 && (
            <div className="space-y-3 border-t border-border/70 pt-6">
              <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
                <Award className="size-5 text-primary" />
                {t("Photo Gallery & Evidence", "ফটো গ্যালারি ও চিত্রসমূহ")}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {achievement.images.map((imgUrl, i) => (
                  <a
                    key={i}
                    href={imgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-video overflow-hidden rounded-xl border border-border/70 bg-muted/40 transition-transform hover:scale-[1.02]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt={`Gallery image ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                      <ExternalLink className="size-5 text-white" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Tags Footer */}
          {achievement.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-border/70 pt-6">
              <span className="text-xs font-medium text-muted-foreground mr-1">{t("Tags:", "ট্যাগ:")}</span>
              {achievement.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/achievements?tag=${encodeURIComponent(tag)}`}
                  className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </article>
      </div>
    </>
  )
}
