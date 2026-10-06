import type { Metadata } from "next"

import {
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_WIDTH,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site"

/**
 * Absolute URL for a root-relative path, resolved against `SITE_URL`.
 * Uses the URL resolver (never string concatenation), so the result never
 * contains a double slash: `new URL("/about", …)` replaces the base path.
 */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString()
}

/**
 * schema.org `BreadcrumbList` describing a visible breadcrumb trail.
 * `items` is ordered root-first; entries without a `path` are the current page.
 */
export function breadcrumbJsonLd(items: { name: string; path?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  }
}

type WebsiteMetadataOptions = {
  /** Page topic only — the helper renders `<title>` as "<title> | <site name>". */
  title: string
  description: string
  /** Root-relative path for canonical + og:url, page-aware (e.g. "/events?page=2"). */
  path: string
  /** Overrides the social title (defaults to `<title> | <site name>`). */
  socialTitle?: string
  /** Page-specific og:image; falls back to the site-wide default. */
  image?: string
}

/**
 * Complete metadata for a public (indexable) page: absolute title (immune to
 * the root title template), canonical, full Open Graph and Twitter blocks.
 * A child `openGraph` object replaces the root one wholesale in Next, so every
 * field a share needs must be present here.
 */
export function websiteMetadata({
  title,
  description,
  path,
  socialTitle,
  image,
}: WebsiteMetadataOptions): Metadata {
  const social = socialTitle ?? `${title} | ${SITE_NAME}`
  const url = absoluteUrl(path)
  const images = image
    ? [{ url: image, alt: social }]
    : [
        {
          url: DEFAULT_OG_IMAGE,
          width: DEFAULT_OG_IMAGE_WIDTH,
          height: DEFAULT_OG_IMAGE_HEIGHT,
          alt: social,
        },
      ]

  return {
    title: { absolute: social },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: social,
      description,
      url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: social,
      description,
      images: [image ?? DEFAULT_OG_IMAGE],
    },
  }
}

/** `noindex` marker for app/utility pages that must stay out of the index. */
export const NOINDEX: Metadata["robots"] = { index: false, follow: true }

