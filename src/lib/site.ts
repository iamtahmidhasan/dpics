/**
 * Absolute site coordinates. `metadataBase`, canonical urls, the sitemap and
 * the JSON-LD blocks all resolve against this, so a relative og:image or
 * canonical href still ends up as a full url in the rendered head.
 */
function resolveSiteUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.BETTER_AUTH_URL?.trim() || ""

  // A malformed env value must not take the whole build down: fall back to a
  // parseable placeholder and let Next warn about the missing metadataBase.
  try {
    return new URL(raw || "http://localhost:3000")
  } catch {
    return new URL("http://localhost:3000")
  }
}

export const SITE_URL = resolveSiteUrl()

export const SITE_NAME = "DPI Computing Society"

export const SITE_DESCRIPTION =
  "News, tutorials and write-ups from the DPI Computing Society — a student-led computing community."

export const SITE_LOCALE = "en_US"

/** Canonical path of a single post, always root-relative for `metadataBase`. */
export function postPath(slug: string): string {
  return `/posts/${encodeURIComponent(slug)}`
}

export function postUrl(slug: string): string {
  return new URL(postPath(slug), SITE_URL).toString()
}