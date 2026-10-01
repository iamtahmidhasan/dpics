import { CalendarDays, Clock3, Home } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { BilingualPostContent } from "@/components/posts/bilingual-post-content"
import { PostCard } from "@/components/posts/post-card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { deriveExcerpt, headingAnchors, stripMarkdown } from "@/lib/markdown"
import { MAX_POST_SEO_DESCRIPTION_LENGTH } from "@/lib/post-constants"
import {
  getPublishedPostBySlug,
  listPublishedPosts,
} from "@/lib/services/post.service"
import { postPath, SITE_NAME, SITE_URL } from "@/lib/site"
import { cn } from "cn"

type PostPageProps = PageProps<"/posts/[slug]">

/** A published post either renders or 404s, so it is safe to cache. */
export const revalidate = 300

export async function generateStaticParams() {
  const page = await listPublishedPosts({ page: 1, pageSize: 50 })

  return page.posts.map((post) => ({ slug: post.slug }))
}

function buildDescription(post: {
  excerpt: string | null
  excerptBn: string | null
  content: string
  contentBn: string | null
  seoDescription: string | null
}, isBn: boolean): string {
  if (post.seoDescription?.trim()) return post.seoDescription.trim()
  if (isBn && post.excerptBn?.trim()) return post.excerptBn.trim()
  if (!isBn && post.excerpt?.trim()) return post.excerpt.trim()
  const contentToDerive = isBn && post.contentBn ? post.contentBn : post.content
  return deriveExcerpt(contentToDerive, null, MAX_POST_SEO_DESCRIPTION_LENGTH) || ""
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const post = await getPublishedPostBySlug(slug)
    const title = post.seoTitle?.trim() || post.title
    const description = buildDescription(post, false)
    const url = postPath(post.slug)
    const image = post.ogImage ?? post.coverImage

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
        locale: "en_US",
        publishedTime: post.publishedAt ?? undefined,
        modifiedTime: post.updatedAt,
        authors: [post.author.name],
        tags: post.tags,
        images: image ? [{ url: image, alt: post.title }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: image ? [image] : undefined,
      },
    }
  } catch {
    return { title: "Post not found" }
  }
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const { slug } = await params
  const [lang] = await Promise.all([getLang()])
  const t = makeT(lang)
  const isBn = lang === "bn"

  let post: Awaited<ReturnType<typeof getPublishedPostBySlug>>

  try {
    post = await getPublishedPostBySlug(slug)
  } catch {
    notFound()
  }

  const displayTitle = isBn && post.titleBn ? post.titleBn : post.title
  const description = buildDescription(post, isBn)
  const categoryName = post.category
    ? isBn && post.category.nameBn
      ? post.category.nameBn
      : post.category.name
    : null

  const headings = headingAnchors(isBn && post.contentBn ? post.contentBn : post.content).filter(
    (heading) => heading.depth >= 2 && heading.depth <= 3
  )
  const publishedAt = post.publishedAt ?? post.createdAt
  const dateFormatter = new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-US", {
    dateStyle: "long",
  })

  // The related block is whatever else is published, most recent first.
  const related = await listPublishedPosts({
    page: 1,
    pageSize: 4,
    category: post.category?.slug ?? post.categoryId ?? undefined,
  })
  const relatedPosts = related.posts.filter((item) => item.id !== post.id).slice(0, 3)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: displayTitle,
    description,
    image: post.ogImage ?? post.coverImage ?? undefined,
    datePublished: publishedAt,
    dateModified: post.updatedAt,
    inLanguage: isBn ? "bn-BD" : "en-US",
    wordCount: stripMarkdown(post.content).split(/\s+/).filter(Boolean).length,
    timeRequired: `PT${post.readingMinutes}M`,
    author: {
      "@type": "Person",
      name: post.author.name,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL.toString(),
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": new URL(postPath(post.slug), SITE_URL).toString(),
    },
    keywords: post.tags.length > 0 ? post.tags.join(", ") : undefined,
    articleSection: categoryName ?? undefined,
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mb-4">
        <Link
          href="/posts"
          className={cn(buttonVariants({ variant: "ghost", size: "xs" }), "text-muted-foreground")}
        >
          <Home className="size-3" />
          {t("All posts", "সব পোস্ট")}
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <article className="min-w-0">
          <header className="space-y-3">
            {post.category && categoryName ? (
              <Link href={`/posts?category=${post.category.slug}`}>
                <Badge variant="secondary" className="text-[0.625rem]">
                  {categoryName}
                </Badge>
              </Link>
            ) : null}

            <h1 className="font-heading text-3xl leading-tight font-semibold text-balance">
              {displayTitle}
            </h1>

            {description ? (
              <p className="text-muted-foreground text-base/relaxed">{description}</p>
            ) : null}

            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Avatar className="size-6">
                  {post.author.avatar ? (
                    <AvatarImage src={post.author.avatar} alt={post.author.name} />
                  ) : null}
                  <AvatarFallback>{post.author.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-foreground font-medium">{post.author.name}</span>
              </div>

              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                <time dateTime={publishedAt}>{dateFormatter.format(new Date(publishedAt))}</time>
              </span>

              <span className="inline-flex items-center gap-1">
                <Clock3 className="size-3.5" />
                {t(`${post.readingMinutes} min read`, `${post.readingMinutes} মিনিটের পড়া`)}
              </span>
            </div>
          </header>

          {post.coverImage ? (
            <div className="bg-muted relative mt-6 aspect-video overflow-hidden rounded-lg border">
              <Image
                src={post.coverImage}
                alt={displayTitle}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 720px"
                className="object-cover"
              />
            </div>
          ) : null}

          <BilingualPostContent
            content={post.content}
            contentBn={post.contentBn}
            initialLang={lang}
          />

          {post.tags.length > 0 ? (
            <div className="mt-8 flex flex-wrap items-center gap-1.5 border-t pt-6">
              {post.tags.map((tag) => (
                <Link key={tag} href={`/posts?tag=${encodeURIComponent(tag)}`}>
                  <Badge variant="secondary" className="text-[0.625rem] font-normal">
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : null}
        </article>

        {headings.length > 1 ? (
          <aside className="hidden lg:block">
            <nav aria-label={t("On this page", "এই পাতায়")} className="sticky top-6">
              <p className="mb-2 text-[0.6875rem] font-medium tracking-wide uppercase">
                {t("On this page", "এই পাতায়")}
              </p>
              <ul className="space-y-1 border-l">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      className={cn(
                        "-ml-px block border-l border-transparent py-0.5 text-xs/relaxed text-muted-foreground transition-colors hover:border-primary hover:text-foreground",
                        heading.depth === 3 ? "pl-6" : "pl-3"
                      )}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        ) : null}
      </div>

      {relatedPosts.length > 0 ? (
        <section className="mt-12 space-y-4 border-t pt-8">
          <h2 className="font-heading text-lg font-semibold">{t("Related posts", "সম্পর্কিত পোস্ট")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((item) => (
              <PostCard key={item.id} post={item} lang={lang} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
