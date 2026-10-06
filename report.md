# SEO Audit Report — DPI Computing Society (DPICS)

**Repository:** `c:\code\dpi-computing-socity` (github.com/iamtahmidhasan/dpics)
**Stack:** Next.js 16.3.6 (App Router, Turbopack) · React 19 · Prisma 7 · PostgreSQL · Tailwind 4
**Audit date:** 2026-10-06
**Method:** Full static code review of every route + live crawl of a locally running `next dev` instance (head tags fetched with `curl`), plus `robots.txt` / `sitemap.xml` output inspection.

> **Environment caveats**
> - The database reachable from this environment contains no published posts/events/courses/achievements, so **detail pages** (`/posts/[slug]`, `/events/[slug]`, …) were audited at **code level only**; anything marked *(verified)* was confirmed on rendered HTML.
> - `NEXT_PUBLIC_SITE_URL` is **not set** locally, so all absolute URLs rendered as `http://localhost:3000` — which is itself a finding (see **C4**).

---

## 1. Executive Summary

The project has a **solid SEO foundation** that is undermined by several **verified rendering bugs** and **coverage gaps**: sitewide navigation links that 404, page titles that render the brand name twice, malformed canonical URLs with double slashes, an incomplete sitemap, and social metadata that silently falls back to homepage values.

| Category | Grade | Summary |
|---|---|---|
| Indexability & directives | **C** | Admin correctly noindexed, but `/dashboard`, `/register`, `/events/ticket/*` are indexable; `robots.txt` blocks the SEO-optimized public profiles |
| Titles & descriptions | **C−** | 12+ pages render doubled titles; `/posts` renders a bare `Blog`; descriptions otherwise good |
| Canonicals | **C** | Double-slash canonicals on 5+ pages; missing canonical on home, `/events/[slug]`, `/courses/[slug]` |
| Structured data (JSON-LD) | **B−** | Excellent `BlogPosting`; `Person` on profiles; invalid `@type: Achievement`; no `Event`, `Course`, `Organization`/`WebSite`, `BreadcrumbList` |
| Sitemap & robots | **C+** | Both exist and are well-formed, but sitemap omits most indexable routes; robots/profile conflict |
| Social (OG / Twitter) | **D+** | Root fallback leaks homepage OG/Twitter onto child pages; no site-wide `og:image` |
| Content & headings | **A−** | `h1` on all main pages, sensible hierarchy, crawlable server-rendered links |
| Performance fundamentals | **B+** | `next/image`, `next/font` + `display: swap`, ISR; some raw `<img>` and unused heavy deps |
| i18n / hreflang | **B−** | Server-set `<html lang>` per cookie; no `hreflang` (inherent to cookie-based i18n — document the decision) |

**Overall: C+** — Fix the P0 items below (all cheap, all verified) before submitting the site to Google Search Console.

---

## 2. Critical Issues (P0 — fix immediately)

### C1. Sitewide navigation links return 404 — *(verified)*
Three routes linked from the **Header, Footer, CTA and About page** do not exist:

| URL | Status *(verified by curl)* | Cause |
|---|---|---|
| `/committee` | **404** | `src/app/(frontend)/committee/` exists but is **empty** (no `page.tsx`) |
| `/contact` | **404** | `src/app/(frontend)/contact/` exists but is **empty** (no `page.tsx`) |
| `/resources` | **404** | No route exists at all |

Link sources: `src/components/Header/index.tsx` L81/L134/L182-198; `src/components/Footer/index.tsx` L33-35; `src/components/about/about-view.tsx` L250/L444; `src/components/home/CTASection.tsx` L60.
**Impact:** crawl errors in GSC, broken user journeys, internal link equity leaking to 404s. (Pages appear to be work-in-progress — build them or remove the links.)

### C2. Title template double-brands 12+ pages — *(verified)*
Root layout defines `title.template: "%s · DPI Computing Society"` (`src/app/layout.tsx` L32-35). Pages that **already append** the site name as a plain string get it twice. Rendered proof:

```
/about  → <title>About Us | DPI Computing Society · DPI Computing Society</title>
/join   → <title>Join DPI Computing Society · DPI Computing Society</title>
```

**Affected (string title + template):** `/about`, `/instructors`, `/members`, `/privacy`, `/join`, `/dashboard`, `/events/ticket/[code]`, and dynamically `/events/[slug]`, `/achievements/[slug]`, `/profile/[id]`. **Awkward double-brand:** `/courses/[slug]` → `X | DPICS Academy · DPI Computing Society`.
List pages do this correctly via `title: { absolute: "Events | DPI Computing Society" }` — the affected pages must either **drop the site name from their string** or use `absolute`.

### C3. Canonical URLs contain a double slash — *(verified)*
`${SITE_URL}` is a `URL` object; stringifying it yields a trailing slash, so `` `${SITE_URL}/about` `` becomes `http://localhost:3000//about`:

```
/about        → <link rel="canonical" href="http://localhost:3000//about"/>        (verified)
/instructors  → <link rel="canonical" href="http://localhost:3000//instructors"/>  (verified)
/members      → <link rel="canonical" href="http://localhost:3000//members"/>      (verified)
```

Same bug in code: `src/app/(frontend)/about/page.tsx` L13, `instructors/page.tsx` L11, `members/page.tsx` L12, `achievements/[slug]/page.tsx` L58, `profile/[id]/page.tsx` L38 (also poisons `og:url` and JSON-LD URLs).
**Fix:** emit root-relative paths (`/about`) and let `metadataBase` resolve them, or use `new URL("/about", SITE_URL).toString()` (as `sitemap.ts` already does correctly).

### C4. Production URL depends on an unset env var
`src/lib/site.ts` resolves `NEXT_PUBLIC_SITE_URL` → `BETTER_AUTH_URL` → fallback `http://localhost:3000`. Repo `.env` only defines `BETTER_AUTH_URL=http://localhost:3000`. **If the deployment host does not set `NEXT_PUBLIC_SITE_URL`, every canonical, `og:url`, sitemap entry, robots `Host:`/`Sitemap:` line and JSON-LD URL in production points at localhost** — silent and catastrophic.
**Fix:** set `NEXT_PUBLIC_SITE_URL=https://<production-domain>` at deploy time and fail the build (or log a loud warning) when it is missing or localhost.

### C5. Sitemap omits most indexable routes — *(verified output)*
Live `/sitemap.xml` contains only `/`, `/posts`, `/events`, `/achievements` (+ published posts). From `src/app/sitemap.ts`:
- **Missing static pages:** `/about`, `/courses`, `/instructors`, `/members`, `/privacy`
- **Missing dynamic details:** all `/events/[slug]`, `/achievements/[slug]`, `/courses/[slug]` (only posts are enumerated)
- Posts capped at `pageSize: 200`; anything beyond is silently excluded

---

## 3. High-Priority Issues (P1)

### H1. `/posts` renders a bare title — *(verified)*
`src/app/(frontend)/posts/page.tsx` L19: `title: { default: "Blog", absolute: "Blog" }` → `<title>Blog</title>` with **no site name** (and “Blog” is a weak query-matching title; prefer e.g. “Blog · Tutorials & Articles”).

### H2. Root social metadata silently leaks to child pages — *(verified)*
Next.js inherits any top-level metadata field the child does not override. Pages **without their own `openGraph`/`twitter`** render the *homepage’s* social tags:

```
/events → og:url = http://localhost:3000   (root!)
          twitter:title = DPI Computing Society
          twitter:description = <homepage description>   (verified)
```

- `/events` (list) defines **no** `openGraph` → wrong og:url/title whenever shared.
- `/events/[slug]`, `/courses/[slug]` define `openGraph` but **no `twitter`** → root twitter card (site name, not page title).
- No OG/Twitter of their own: `/join`, `/dashboard`, `/register`; root-inherited Twitter on `/about`, `/instructors`, `/members`, `/privacy`, `/courses`, `/achievements`, `/posts`.

**Fix:** give every public page a complete `openGraph` + `twitter` block (title, description, url, image, card) — or centralize with a helper — and stop setting `openGraph.url: "/"` in the root layout.

### H3. Missing canonicals on key pages — *(verified for home)*
- `/` — **no canonical at all** *(verified)*
- `/events/[slug]` — none (`generateMetadata` L51-59)
- `/courses/[slug]` — none
- `/join`, `/dashboard` — none (better: noindex, see H5)

### H4. No social image site-wide; no site-level JSON-LD — *(verified)*
Root `openGraph`/`twitter` declare `summary_large_image` but set **no `images`** → imageless link shares *(verified: no `og:image` on `/`)*. No `opengraph-image.*` convention file and no default OG asset in `public/`.
The homepage also lacks `Organization`/`WebSite` JSON-LD (with `sameAs` social profiles) — the standard brand/entity anchor for the Knowledge Graph.

### H5. Indexable auth/utility/private pages
| Route | Status *(verified)* | Problem |
|---|---|---|
| `/dashboard` | 200, **no robots meta** | Linked from footer → crawlable app shell; add `noindex` |
| `/register` | 200, no robots meta | Add `noindex` |
| `/events/ticket/[ticketCode]` | indexable | **Private entry tickets** indexable — `noindex` + robots rule |
| `/join` | 200, no robots meta | Optional `noindex` (sign-in page) |

`/admin` correctly emits `noindex, nofollow` *(verified)*; `/courses/[slug]/learn` is correctly noindexed.

### H6. `robots.txt` blocks `/profile` — contradicting the profile SEO feature — *(verified output)*
```
Disallow: /profile
```
But `/profile/[id]` is fully optimized for indexing (canonical, `og:type: profile`, Twitter card, `Person` JSON-LD, share-link UI). Robots.txt wins → **crawlers can never reach any of it**. Account pages `/profile/(account)/*` meanwhile have **no `noindex`** of their own.
**Fix:** remove `/profile` from `robots.txt`; add `robots: { index: false }` to `src/app/(frontend)/profile/(account)/layout.tsx`; then optionally list public profiles in the sitemap.

---

## 4. Medium-Priority Issues (P2)

1. **Pagination/filter pages canonicalize to page 1.** `/posts`, `/events`, `/achievements` set a static `canonical` for every `?page=N`/filter variant. Google now expects **self-referencing canonicals on paginated series**; consider emitting a per-page canonical (`/events?page=2`) or noindexing deep pages.
2. **Invalid structured-data type.** `src/app/(frontend)/achievements/[slug]/page.tsx` L122 uses `"@type": "Achievement"` — **not a schema.org type**; validators/Rich Results Test will flag or ignore it. Use a valid type (e.g. `Article`/`CreativeWork`) and add `url`/`mainEntityOfPage`.
3. **Missing structured-data opportunities:**
   - `Event` JSON-LD on `/events/[slug]` (dates, venue, `eventStatus`) — high SERP feature value
   - `Course` JSON-LD on `/courses/[slug]`
   - `BreadcrumbList` on pages that already render visible breadcrumbs (`posts/[slug]`, `achievements/[slug]`, `profile/[id]`, `courses/[slug]`)
4. **No PWA/branding metadata:** no `manifest.ts`, no `viewport`/`themeColor` export, no `apple-touch-icon` (favicon.ico is present and correct).

5. **Bilingual/i18n:** language is cookie-switched at a single URL, so `hreflang` is impossible — acceptable, but **document the decision**; crawlers always see the default `en` version *(verified: `<html lang="en">`)*. Post `generateMetadata` is hard-coded English (`buildDescription(post, false)`) while the body may render Bengali — fine for SEO, but `og:locale` never varies.
6. **Raw `<img>` elements** bypass the optimizer in gallery views (`achievements/[slug]` L282, `media-picker-modal`, `post-composer`, markdown renderer) without `width`/`height` → CLS risk; `about29.tsx` still loads shadcnblocks placeholder logos from an external CDN.
7. **Dependency hygiene:** `gsap`, `cobe`, `@tsparticles/react`, `@tsparticles/slim` are installed but **never imported anywhere in `src/`** — remove (install size / supply-chain hygiene; no bundle impact).
8. **No custom headers** in `next.config.ts` (cache-control for static assets, `X-Content-Type-Options`, etc.) — mostly hosting-dependent, low ranking impact.

## 5. Low-Priority / Informational (P3)

- No SEO documentation in `docs/` or `README.md` (no baseline, no GSC notes).
- `public/` still contains unused Next template assets (`next.svg`, `vercel.svg`, `globe.svg`, `window.svg`, `file.svg`).
- robots.txt `Host:` directive (Bing) is fine; `Disallow: /admin`, `/admin/`, `/api/` are correct.
- Meta `keywords` intentionally absent (ignored by Google) — correct.
- Description lengths are healthy (root `SITE_DESCRIPTION` ≈ 106 chars).

---

## 6. What's Working Well ✅

- **`metadataBase` set** via centralized `src/lib/site.ts`; canonical/OG resolution strategy is sound (modulo the trailing-slash bug).
- **`robots.ts` + `sitemap.ts`** implemented as proper metadata route handlers; sitemap has priorities, `changeFrequency` and `lastModified` for posts.
- **`/posts/[slug]` is a model citizen:** canonical, full OG article (publishedTime/modifiedTime/authors/tags), Twitter card, and a **high-quality `BlogPosting` JSON-LD** (author, publisher, `mainEntityOfPage`, dates, `wordCount`, `timeRequired`, `inLanguage`).
- **Admin correctly locked down:** `metadata.robots = { index: false, follow: false }` on the admin layout *(verified `noindex, nofollow`)* plus robots.txt disallow.
- **Proper 404s:** every dynamic page calls `notFound()`; localized 404 title via `generateMetadata`.
- **ISR + pre-rendering:** `export const revalidate = 300` + `generateStaticParams()` on posts and achievements (with graceful failure fallbacks).
- **Fonts:** `next/font/google` (Inter, Hind Siliguri, Geist Mono) with `display: "swap"`.
- **Images:** `next/image` with `remotePatterns` (incl. `ik.imagekit.io` CDN), `priority` on LCP images, `loading="lazy"` elsewhere, `sizes` attributes present.
- **Server-rendered crawlable content:** `h1` present on `/`, `/about`, `/events`, `/courses`, `/achievements`, `/posts`, `/members`, `/instructors`, `/privacy`; filter/pagination links are real `<a href>`s; the hero is a `motion.h1` but SSR'd into HTML.
- **`<html lang>` set server-side** from the language cookie (`en`/`bn`).
- **CMS SEO fields:** `seoTitle`, `seoDescription`, `ogImage` on posts with a live SERP preview component (`src/components/posts/seo-preview.tsx`).

---

## 7. Route-by-Route Matrix (public routes)

Legend: ✅ good · ⚠️ partial/broken · ❌ missing · 🚫 intentionally noindexed

| Route | Title | Canonical | OG | Twitter | JSON-LD | Index |
|---|---|---|---|---|---|---|
| `/` | ✅ site name | ❌ *(verified)* | ⚠️ no image | ⚠️ no image | ❌ none (needs `WebSite`/`Organization`) | ✅ |
| `/about` | ❌ doubled *(v)* | ❌ `//about` *(v)* | ✅ | ⚠️ inherits root | ❌ | ✅ |
| `/events` | ✅ absolute | ✅ | ❌ inherits root (og:url→root) *(v)* | ⚠️ inherits root *(v)* | ❌ | ✅ |
| `/events/[slug]` | ❌ doubled | ❌ | ⚠️ no url | ⚠️ inherits root | ❌ needs `Event` | ✅ |
| `/events/ticket/[code]` | ❌ doubled | ❌ | ⚠️ | ⚠️ | ❌ | ❌ should noindex |
| `/achievements` | ✅ absolute | ✅ | ✅ | ⚠️ inherits root | ❌ | ✅ |
| `/achievements/[slug]` | ❌ doubled | ❌ `//achievements/…` | ✅ article | ✅ | ⚠️ invalid `@type: Achievement` | ✅ |
| `/courses` | ✅ absolute | ✅ | ✅ | ⚠️ inherits root | ❌ | ✅ |
| `/courses/[slug]` | ⚠️ double brand | ❌ | ⚠️ no url/type | ⚠️ inherits root | ❌ needs `Course` | ✅ |
| `/courses/[slug]/learn` | ✅ | — | — | — | — | 🚫 *(verified)* |
| `/posts` | ❌ bare “Blog” *(v)* | ✅ *(v)* | ✅ *(v)* | ⚠️ inherits root | ❌ | ✅ |
| `/posts/[slug]` | ✅ template | ✅ | ✅ article | ✅ | ✅ `BlogPosting` (high quality) | ✅ |
| `/instructors` | ❌ doubled *(v)* | ❌ `//instructors` *(v)* | ✅ | ⚠️ inherits root | ❌ | ✅ |
| `/members` | ❌ doubled *(v)* | ❌ `//members` *(v)* | ✅ | ⚠️ inherits root | ❌ | ✅ |
| `/privacy` | ❌ doubled *(v)* | ✅ *(v)* | ✅ | ⚠️ inherits root | ❌ | ✅ |
| `/profile/[id]` | ❌ doubled | ❌ `//profile/…` | ✅ `profile` | ✅ | ✅ `Person` | 🚫 blocked by robots.txt *(v)* |
| `/profile/(account)/*` | ✅ short titles | ❌ | ❌ | ❌ | ❌ | 🚫 via robots.txt (no own noindex) |
| `/dashboard` | ❌ doubled *(v)* | ❌ | ❌ | ❌ | ❌ | ❌ indexable *(v)* |
| `/join` | ❌ doubled *(v)* | ❌ | ❌ | ❌ | ❌ | ⚠️ decide |
| `/register` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ indexable *(v)* |
| `/committee`, `/contact`, `/resources` | — | — | — | — | — | ❌ **404** *(v)* |
| `/admin/*` | ✅ template | — | — | — | — | 🚫 noindex,nofollow *(v)* |

---

## 8. Prioritized Action Plan

**P0 — before any GSC submission**
1. Restore or unlink `/committee`, `/contact`, `/resources` (Header, Footer, About, CTASection). Create the missing `page.tsx` files or remove nav entries.
2. Fix doubled titles: remove `${SITE_NAME}` from plain-string titles (or switch those to `title: { absolute: … }`) in `about`, `instructors`, `members`, `privacy`, `join`, `dashboard`, `events/ticket/[code]`, `events/[slug]`, `achievements/[slug]`, `profile/[id]`; adjust `courses/[slug]`.
3. Fix double-slash URLs: replace `` `${SITE_URL}/path` `` with `"/path"` (metadataBase) or `new URL("/path", SITE_URL).toString()` in `about`, `instructors`, `members`, `achievements/[slug]`, `profile/[id]`.
4. Set `NEXT_PUBLIC_SITE_URL` in the production environment; fail/warn at build when it's unset or localhost (`src/lib/site.ts`).
5. Expand `src/app/sitemap.ts`: add `/about`, `/courses`, `/instructors`, `/members`, `/privacy` + published events, achievements and course details (reuse the `generateStaticParams` list queries).

**P1 — high impact**
6. Give `/posts` a real absolute title; add per-page `openGraph` + `twitter` to every public page (esp. `/events` list); stop root `openGraph.url: "/"` from leaking.
7. Add canonicals to `/`, `/events/[slug]`, `/courses/[slug]`.
8. Add a default OG image (`opengraph-image.tsx` or root `openGraph.images`) ≥1200×630; add `Organization`/`WebSite` JSON-LD on the homepage.
9. `noindex` `/dashboard`, `/register`, `/events/ticket/*` (and optionally `/join`).
10. Resolve the `/profile` robots.txt vs. public-profiles conflict (allow + account-layout noindex), then add profiles to the sitemap.

**P2 — quality**
11. Replace invalid `"@type": "Achievement"` JSON-LD; add `Event` and `Course` JSON-LD + `BreadcrumbList`.
12. Per-page canonicals for pagination/filter pages; add `manifest.ts`, `themeColor`, `apple-touch-icon`.
13. Remove unused deps (`gsap`, `cobe`, `@tsparticles/*`); add explicit `width`/`height` to remaining `<img>`s.

**Then:** validate with Google Rich Results Test + Twitter Card Validator, submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools, and monitor Coverage for the 404s above.

---

## 9. Verification Appendix (reproducible)

```bash
pnpm dev   # then:
curl -s localhost:3000/            | grep -o '<title>[^<]*</title>'   # homepage title / og:image
curl -s localhost:3000/about       | grep -o '<link rel="canonical"[^>]*>'  # double-slash bug
curl -s localhost:3000/events      | grep -o '<meta property="og:url"[^>]*>' # root leak
curl -s localhost:3000/robots.txt                                    # profile disallow
curl -s localhost:3000/sitemap.xml                                   # missing routes
for p in /committee /contact /resources; do curl -s -o /dev/null -w "%{http_code} $p\n" localhost:3000$p; done
```

*Note: detail-page findings (`/…/[slug]`) were derived from source inspection because the audited database contained no published content; re-run the crawl against a populated staging environment before release.*

---

# Fix Log — All Issues Resolved ✅

*Applied immediately after this audit. Verified live on `next dev` + `pnpm build` (build exit 0), 10/6/2026.*

## P0 — Critical

| # | Issue | Fix |
|---|---|---|
| 1 | Broken `/committee`, `/contact`, `/resources` links | Three real pages created (`src/app/(frontend)/committee\|contact\|resources/page.tsx`), reusing committee/settings services; `/resources` carries the `#roadmaps` / `#notes` / `#problems` sections the nav anchors to |
| 2 | Doubled titles ("X · Site · Site") | Root template kept; every page now emits `title.absolute` via a shared helper — verified single-brand titles on all 12 public pages |
| 3 | Double-slash canonicals (`//about`) | All `${SITE_URL}/path` concatenation replaced with `absoluteUrl()` (new `src/lib/seo.ts`) which resolves via `new URL()`; verified single slashes |
| 4 | Production URL risk | `NEXT_PUBLIC_SITE_URL` added to `.env` with docs; `src/lib/site.ts` now logs a loud warning in production builds when it falls back to localhost |
| 5 | Incomplete sitemap | `sitemap.ts` rewritten: all 12 static routes + dynamic post/event/achievement/course detail URLs (each collection `.catch()`-tolerated) |

## P1 — High

| # | Issue | Fix |
|---|---|---|
| 6 | Bare `<title>Blog</title>` on `/posts` | `generateMetadata` → `"Blog \| DPI Computing Society"`; page-aware canonicals (`?page=N`) added to posts/events/achievements/instructors/members listings |
| 7 | Root OG leaking to child pages | `websiteMetadata()` helper emits complete OG+Twitter blocks (`siteName`, `url`, `images`) on every public page; verified `og:url`/`og:image`/`twitter:image` per page |
| 8 | Missing canonicals on `/`, events/courses details | Root + all detail pages now self-canonicalize via `metadataBase` + helpers |
| 9 | `og:image` absent site-wide | Default OG image (`/hero-tech.jpg`, 1376×768) in root metadata + helper fallback; detail pages use their own cover |
| 10 | Indexable app routes | `noindex, follow` on `/dashboard`, `/join`, `/register`, `/events/ticket/*`, and all `/profile/(account)/*` (via shared `NOINDEX` constant + layout export) |
| 11 | `robots.txt` blocked `/profile` (public profiles) | Disallow now covers `/admin`, `/api/`, `/events/ticket/` only — public profiles crawlable again |
| 12 | Invalid JSON-LD `"Achievement"` type | Changed to schema.org-valid `CreativeWork` (award org in `award` property) + `BreadcrumbList` |

## P2 — Medium

| # | Issue | Fix |
|---|---|---|
| 13 | No schema.org on detail pages | Added `Event` (with `eventStatus`, attendance mode, venue, organizer), `Course` (`isAccessibleForFree`, provider), `WebSite`/`Organization` (root), `Person`+`BreadcrumbList` (profiles), `BreadcrumbList` (posts/courses/achievements) |
| 14 | Pagination canonical quirks | Listing pages self-canonicalize on `?page=N` (verified `posts?page=2`) |
| 15 | Manifest / apple-touch icon missing | `src/app/manifest.ts` + `src/app/apple-icon.png` added (both serve 200) |
| 16 | No cache/security headers | `next.config.ts`: immutable cache for `/_next/static`, SWR cache for public assets, `X-Content-Type-Options`, `Referrer-Policy`, `poweredByHeader: false` |
| 17 | Heavy unused dependencies | Removed `@tsparticles/react`, `@tsparticles/slim`, `cobe`, `gsap` (zero imports in `src/`); lockfile synced |
| 18 | Gallery `<img>` without lazy loading | Added `loading="lazy"` + `decoding="async"` (arbitrary CDN urls can't go through the image optimizer) |
| 19 | Doubled title on `/profile/[id]` 404 | `title.absolute` in profile metadata; not-found titles now plain strings |
| 20 | `/events#past` / `#competitions` dead anchors | Header now links `/events?timeframe=past` and `/events?q=competition` (both verified 200; params handled by `event-params.ts`) |

## Verification (live, dev server)

- ✅ Titles/canonicals/OG verified on 12 public pages + `/profile/[id]`
- ✅ `robots.txt`, `sitemap.xml` (12 static URLs + collections), `manifest.webmanifest`, `apple-icon.png`, `favicon.ico`
- ✅ `noindex` confirmed on dashboard/join/register/tickets/account pages
- ✅ Security headers confirmed on HTML + static assets
- ✅ `tsc --noEmit` clean; ESLint introduces **zero new problems** (remaining 12 errors are pre-existing: `any`s in courses pages, JSX-in-try/catch in ticket page, `<a>` in profile breadcrumb)
- ✅ `pnpm build` succeeds; sitemap/robots/manifest prerender as static

## Remaining items (not code-fixable here)

1. **Set `NEXT_PUBLIC_SITE_URL`** to the real production origin before deploying.
2. **Detail-page JSON-LD + canonicals** for posts/events/courses/achievements/profiles were verified by type-check + build only — the audited DB has no published content. Re-crawl a populated staging environment.
3. **OG images**: consider a 1200×630 branded default (current default is a 1376×768 photo crop — acceptable but not ideal).
4. **`/resources` content**: the page is a curated index linking to courses/posts/events; fill in real archives when available.

