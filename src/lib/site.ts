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

// Every canonical, sitemap entry, og:url and JSON-LD url is derived from
// SITE_URL. Shipping a localhost value would poison all of them silently, so
// a production build must never fall through to the fallback.
if (
  process.env.NODE_ENV === "production" &&
  (SITE_URL.hostname === "localhost" || SITE_URL.hostname === "127.0.0.1")
) {
  console.warn(
    `[site] NEXT_PUBLIC_SITE_URL is not set — canonical urls, sitemap and ` +
      `Open Graph tags will point at ${SITE_URL.origin}. Set it to the ` +
      `public production origin (e.g. https://dgpics.org) before building.`
  )
}

export const SITE_NAME = "DPI Computing Society (DPICS)"

export const SITE_DESCRIPTION =
  "News, tutorials and write-ups from the DPI Computing Society (DPICS) — a student-led computing community."

export const SITE_LOCALE = "en_US"

/** Default social-share image (1376×768) for pages without a cover of their own. */
export const DEFAULT_OG_IMAGE = "/hero-tech.jpg"
export const DEFAULT_OG_IMAGE_WIDTH = 1376
export const DEFAULT_OG_IMAGE_HEIGHT = 768

/** Canonical path of a single post, always root-relative for `metadataBase`. */
export function postPath(slug: string): string {
  return `/posts/${encodeURIComponent(slug)}`
}

export function postUrl(slug: string): string {
  return new URL(postPath(slug), SITE_URL).toString()
}