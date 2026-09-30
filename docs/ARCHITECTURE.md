# DPI Computing Society — Architecture

> Audit date: 2026-09-30 · Source of truth: the code in this repository.
> This document describes how the application is actually built today, including
> known gaps found during the audit (see [§14](#14-known-gaps--audit-findings)).

## 1. Overview

A membership platform for the **DPI Computing Society** — a student-led computing
community. Visitors can sign up (email/password or Google), claim a **Member** or
**Instructor** role through a multi-step onboarding wizard, manage their profile,
and administrators can verify members, manage payments, and administer accounts.

The product is a single **Next.js 16 (App Router)** application that serves both
the public/member UI and a JSON API, backed by **PostgreSQL** through **Prisma 7**,
with **Better Auth** handling authentication (credentials + Google OAuth).

### Goals reflected in the design

- **Server-first rendering** — pages are React Server Components by default; only
  interactive islands opt into `"use client"`.
- **Centralized, server-side authorization** — every protected surface calls a
  shared guard from `src/lib/session.ts`; privilege fields are never client-writable.
- **Server-managed status fields** — membership/verification/payment state can only
  be changed through admin paths, never by self-service payloads.
- **Bilingual UI (en / bn)** — a lightweight cookie-based i18n layer, no i18n framework.
- **Strict, dependency-light validation** — hand-rolled validators in
  `src/lib/validation.ts` (no zod) that throw typed `ApiError`s.

## 2. Tech stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js `16.3.6`, App Router | `src/app/`, route groups, typed `RouteContext` |
| UI | React `19.2.8` | RSC by default, `"use client"` islands |
| Language | TypeScript `5` (strict) | `moduleResolution: bundler`, path alias `@/* → ./src/*` |
| Styling | Tailwind CSS `4` + `shadcn` (style `base-mira`) | tokens in `src/app/globals.css`, `tw-animate-css` |
| Component primitives | `@base-ui/react`, shadcn/ui components | `src/components/ui/*` |
| Icons | `lucide-react` | |
| Animation | `framer-motion` | signup wizard transitions |
| Theming | `next-themes` | class strategy, system default |
| Database | PostgreSQL via Prisma `7.10` | generator `prisma-client`, output `src/generated/prisma` (gitignored) |
| DB driver | `@prisma/adapter-pg` + `pg` | driver adapter, connection string from `DATABASE_URL` |
| Auth | Better Auth `1.7.6` | Prisma adapter, email/password + Google social |
| Package manager | pnpm `12.6.0` | `pnpm-workspace.yaml` disables post-install builds for prisma/sharp/etc. |
| Lint | ESLint 9 + `eslint-config-next` | flat config `eslint.config.mjs` |
| Validation | custom (`src/lib/validation.ts`) | **no zod** |
| Tests | **none** | no test script/framework configured |

Scripts: `pnpm dev` · `pnpm build` · `pnpm start` · `pnpm lint`.

## 3. High-level architecture

```
┌────────────────────────────── Browser ──────────────────────────────┐
│  Server Components (pages/layouts)   Client islands (forms, tables) │
│        │ SSR HTML                             │ fetch()            │
│        │                                      ▼                    │
│        │                        /api/* Route Handlers (JSON)       │
└────────┼──────────────────────────────────────┼─────────────────────┘
         ▼                                      ▼
┌────────────────────────── Next.js server ──────────────────────────┐
│  src/lib/session.ts      guards: requireUser / requireAdmin        │
│                          (redirect)  ·  *Api variants (401/403)    │
│  src/lib/auth.ts         Better Auth config + DB hooks             │
│  src/lib/services/*      business logic, validation, transactions  │
│  src/lib/validation.ts   untrusted input → typed values / ApiError │
│  src/lib/api-error.ts    ApiError → { error: { code, message } }   │
└────────────┬─────────────────────────────────────┬─────────────────┘
             ▼                                     ▼
   PrismaClient (src/lib/prisma.ts)      Better Auth handler
   PrismaPg driver adapter               /api/auth/[...all]
             │                                     │
             └──────────────┬──────────────────────┘
                            ▼
                     PostgreSQL
        (user · session · account · verification ·
         member · instructor · committee* · enums)
```

Two request paths exist:

1. **Page load (RSC)** — layout/page calls a guard, then a service function
   directly; data never round-trips through the public API.
2. **Client fetch** — a `"use client"` component or hook calls `/api/...`,
   whose handler guards the session, delegates to a service, and returns JSON.

## 4. Directory layout

```
c:\code\dpi-computing-socity\
├── docs/                      ARCHITECTURE / PRD / DESIGN / RULES / TASKS / MEMORY
├── prisma/
│   ├── schema.prisma          data model + enums (source of truth)
│   ├── migrations/            3 migrations (auth models, init, removeduser_role)
├── prisma.config.ts           Prisma 7 CLI config (dotenv + DATABASE_URL)
├── prisma7.config.ts          ⚠ leftover duplicate of prisma.config.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx         root layout: fonts, ThemeProvider, LanguageProvider
│   │   ├── globals.css        Tailwind 4 + shadcn design tokens
│   │   ├── not-found.tsx
│   │   ├── (frontend)/        public + member UI (Header/Footer chrome)
│   │   │   ├── page.tsx       landing (placeholder: Sign up / Sign in buttons)
│   │   │   ├── sign-in/  sign-up/  dashboard/   (dashboard = placeholder)
│   │   │   └── profile/       general · member · instructor (sidebar layout)
│   │   ├── (admin)/admin/     admin panel (requireAdmin layout, noindex)
│   │   │   ├── users/  users/[id]/
│   │   └── api/
│   │       ├── auth/[...all]/ Better Auth catch-all
│   │       ├── onboarding/    POST — claim role + create profile
│   │       ├── profile/       GET/PATCH — own profile
│   │       └── admin/users/   GET · /users/[id] GET/PATCH (admin only)
│   ├── components/
│   │   ├── ui/                shadcn/Base UI primitives (button, card, table…)
│   │   ├── Header/ Footer/    site chrome (Desktop/Mobile nav)
│   │   ├── signup/            4-step onboarding wizard
│   │   ├── profile/           profile views/forms + useProfile hook
│   │   ├── admin/             sidebar, users table/forms + useAdminUsers hook
│   │   ├── login-form.tsx  form-fields.tsx  picture-picker.tsx
│   │   ├── theme-provider.tsx / theme-switcher.tsx
│   │   └── language-provider.tsx / language-switcher.tsx
│   ├── lib/
│   │   ├── prisma.ts          singleton PrismaClient (PrismaPg adapter)
│   │   ├── auth.ts            Better Auth server config
│   │   ├── auth-client.ts     better-auth/react client
│   │   ├── session.ts         session read + route/page guards
│   │   ├── roles.ts           role helpers + self-assignable rules
│   │   ├── api-error.ts       ApiError + toErrorResponse (server-only)
│   │   ├── validation.ts      validators for all untrusted input
│   │   ├── i18n.ts            Lang type, makeT(en, bn)
│   │   ├── i18n-server.ts     read `lang` cookie (server-only)
│   │   ├── profile-labels.ts  bilingual enum labels
│   │   ├── user-image.ts      image-list normalization / avatar resolution
│   │   └── services/          onboarding · profile · user · admin-user
│   └── generated/prisma/      Prisma client output (gitignored)
├── components.json            shadcn config (style base-mira, rsc: true)
├── next.config.ts             empty (defaults)
└── tsconfig.json              strict, @/* alias
```

**Layering rule:** `app/**` (routing) → `lib/services/*` (logic + validation) →
`lib/prisma.ts` (persistence). Services are marked `server-only` and are never
imported by client components (they export *types* only, which are erased).

## 5. Routing & rendering model

Route groups give the two shells different chrome and different guards:

| Route | Group chrome | Guard |
| --- | --- | --- |
| `/` | Header + Footer | public |
| `/sign-in`, `/sign-up` | Header + Footer | public (`sign-up` resumes wizard for un-onboarded sessions) |
| `/dashboard` | Header + Footer | client-side only (`useSession` redirect) — see §14 |
| `/profile`, `/profile/member`, `/profile/instructor` | sidebar layout | `requireUser` (+ `hasRole` redirect for member/instructor) |
| `/admin`, `/admin/users`, `/admin/users/[id]` | admin shell | `requireAdmin` in `(admin)/admin/layout.tsx`, `metadata.robots = noindex` |
| `/api/auth/*` | — | Better Auth |
| `/api/onboarding`, `/api/profile` | — | `requireUserApi` |
| `/api/admin/users*` | — | `requireAdminApi` |

There is **no `middleware.ts`** — protection is enforced per layout / per route
handler, which means every new page must call a guard itself.

## 6. Data model

Defined in `prisma/schema.prisma`; migrations under `prisma/migrations/`.

```
User 1──1 Member            (optional, claimed at onboarding)
User 1──1 Instructor        (optional)
User 1──* Session           (Better Auth)
User 1──* Account           (Better Auth: credentials / google)
User *──* UserCommitteeRole *──1 CommitteeRole *──1 Committee
Verification                (Better Auth one-time codes)
```

### `User`

- `roles Role[] @default([USER])` — system roles: `USER`, `MEMBER`, `INSTRUCTOR`, `ADMIN`.
- `image String[]` + `selactedImg String? @default("0")` — a member keeps several
  pictures and picks one by index (⚠ schema typo `selactedImg` is load-bearing;
  `src/lib/user-image.ts` normalizes/resolves it everywhere).
- `phone String? @unique`, `isActive Boolean @default(true)`, `emailVerified`.
- `email` carries `@@unique([email])`.

### `Member` (1:1)

- Academic profile: `department` (17-value enum), `session`, `semester`, `shift`,
  `whatsapp`, optional `studentId`, document URLs (`studentIdCardUrl`, `nidorbirthUrl`).
- Workflow state (server-managed): `status: MembershipStatus`
  (`PENDING/ACTIVE/SUSPENDED/EXPIRED/REJECTED/CANCELLED`),
  `verificationStatus: VerificationStatus`, `verifiedAt/verifiedById`,
  `hasPaidMembershipFee` + `paymentMethod` (`BKASH/NAGAD/ROCKET/HAND_TO_HAND/CASH`),
  `senderNumber`, `transactionId`.
- Indexes on `department`, `session`, `semester`, `status`, `transactionId`.

### `Instructor` (1:1)

- `instructorId?`, `bio?`, `expertise?`, `status: InstructorStatus`
  (`PENDING/ACTIVE/SUSPENDED/REJECTED`).

### Committee models (schema-ready, not yet wired)

`Committee` → `CommitteeRole` → `UserCommitteeRole` represent society committee
positions (start/end dates, `isActive`, unique `(userId, roleId)`). **No service,
API, or UI consumes them yet.**

## 7. Authentication (Better Auth)

Configured in `src/lib/auth.ts`; client in `src/lib/auth-client.ts`; served by
`src/app/api/auth/[...all]/route.ts` via `toNextJsHandler`.

- **Providers:** email/password (`enabled: true`) and Google social
  (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`), `baseURL` from `BETTER_AUTH_URL`.
- **Adapter:** `prismaAdapter(prisma, { provider: "postgresql" })`.
- **Additional fields** registered on `user.additionalFields`:
  - `roles`, `isActive`, `phone` — declared `input: false` so sign-up /
    update-user payloads **cannot** self-grant roles, deactivate checks, or set phone.
  - `selactedImg` — `input: true`, the only client-writable extra.
- **`databaseHooks.user.create/update.before`** reconcile Better Auth's single
  `image: string` with this schema's `image: String[]`: values are widened to a
  list (`normalizeImageList`) and `selactedImg` is clamped to a valid index.
  Updates skip the rewrite when `image` is absent so partial updates don't wipe
  existing pictures.
- **Session reads:** `getSession()` in `src/lib/session.ts` calls
  `auth.api.getSession({ headers })` from cookies.

### Guards (`src/lib/session.ts`)

| Helper | Used by | On failure |
| --- | --- | --- |
| `requireUser()` | RSC pages/layouts | `redirect("/sign-in")` |
| `requireAdmin()` | admin layout/pages | `redirect("/dashboard")` |
| `requireUserApi()` | API handlers | throws `ApiError` 401 |
| `requireAdminApi()` | admin API handlers | throws `ApiError` 401 / 403 |

### Role rules (`src/lib/roles.ts`)

- `getUserRoles` normalizes the column into a trusted `Role[]` (filters junk).
- `SELF_ASSIGNABLE_ROLES = [MEMBER, INSTRUCTOR]` — `ADMIN` is **never**
  self-assignable; it can only be granted by an existing admin.
- `isOnboarded(user)` — true once the account holds `MEMBER` or `INSTRUCTOR`.

## 8. Authorization model

Three concentric layers:

1. **Field level** — Better Auth `input: false` blocks privilege fields in auth payloads.
2. **Endpoint level** — every handler/service entry validates identity:
   - onboarding appends a role **only** while the account is still pure `USER`
     (transaction + re-read), so the endpoint is replay-safe and can't swap roles;
   - admin updates refuse self-demotion and self-deactivation
     (`admin-user.service.ts`: "You cannot remove your own admin access");
   - profile/onboarding payloads never accept `status`, `verification*`,
     `payment*`, `roles`, or `isActive` — those are admin-only (`admin-user.service.ts`).
3. **Presentation level** — sidebars/nav render by role, but this is cosmetic;
   the real enforcement is layers 1–2 plus the layout guards.

Unique-constraint violations (`P2002`) are mapped to a friendly 400 so raw DB
errors never reach clients.

## 9. API surface

All handlers follow the same shape: guard → parse/validate → service → JSON,
wrapped in `try { … } catch { return toErrorResponse(error) }`.

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET/POST /api/auth/[...all]` | Better Auth | sign-in/up/out, session, OAuth callbacks |
| `POST /api/onboarding` | user | claim `MEMBER`/`INSTRUCTOR`, write user details + create profile record |
| `GET /api/profile` | user | own profile (`Profile` DTO incl. member/instructor/committee summaries) |
| `PATCH /api/profile` | user | update own basic info + member/instructor details (upsert) |
| `GET /api/admin/users` | admin | paginated list (`page`, `pageSize≤100`, `search`, `role`) |
| `GET /api/admin/users/[id]` | admin | full detail (member, instructor, committee roles, account providers, session summary) |
| `PATCH /api/admin/users/[id]` | admin | edit user/roles/isActive + member/instructor (upsert, auto `verifiedAt`) |

**Error envelope** (`src/lib/api-error.ts`):

```json
{ "error": { "code": "FORBIDDEN", "message": "Admin access required" } }
```

Codes: `UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`, `NOT_FOUND`, and a generic
`INTERNAL_SERVER_ERROR` for anything unexpected (stack logged server-side only).

**Validation** (`src/lib/validation.ts`): bounded `toText`, `toUrl` (root-relative
or http(s) only — never `javascript:`/`data:`), `toEnum`/`toEnumList`,
`toBoolean`, `toDateTime`, `toImages` (≤5 unique urls), `toSelectedImageIndex`,
plus shared length constants. Called from `parse*Input` functions in services,
so client and server can never diverge on accepted shapes.

## 10. Client data layer

No SWR/React Query — small purpose-built hooks with `AbortController` cleanup:

- `useProfile(initialData, refreshKey)` → `GET /api/profile`; the profile form
  bumps `refreshKey` after a successful `PATCH` (+ `router.refresh()`), so the
  view re-reads stored values.
- `useAdminUsers({ page, search, role, refreshKey }, initialData)` →
  `GET /api/admin/users` with a composite cache key; `isLoading` is derived from
  key mismatch.

Both seed initial data from the server render (RSC prefetch) and only re-fetch
on interaction, keeping first paint server-rendered.

## 11. UI, theming & i18n

- **Design tokens:** Tailwind 4 CSS-variable tokens (`--background`,
  `--primary`, `--radius`, sidebar/chart scales) declared in
  `src/app/globals.css` via `@theme inline`; shadcn style `base-mira`, base color
  neutral, Lucide icons.
- **Theming:** `ThemeProvider` (`next-themes`, `attribute="class"`,
  `defaultTheme="system"`) wraps the whole tree in the root layout.
- **Fonts:** Inter (`--font-inter`), Hind Siliguri for Bengali, Geist Mono;
  root `<html lang>` and `data-lang` are set server-side from the cookie.
- **i18n:** `Lang = "en" | "bn"`, persisted in the `lang` cookie (1 year,
  `samesite=lax`). `makeT(lang)` returns a `t(en, bn)` function (also accepts a
  `LocalizedText` object). Server code reads it via `getLang()`
  (`src/lib/i18n-server.ts`); client components use `useLanguage()` from
  `LanguageProvider`, which also updates `document.documentElement.lang`.
  Enum labels are centralized bilingually in `src/lib/profile-labels.ts`.

## 12. Key flows

### Sign-up / onboarding (4-step wizard)

`/sign-up` → `SignupWizard` (`src/components/signup/`), animated with framer-motion:

1. **Account** — `signUp.email(...)` or `signIn.social({ provider: "google" })`
   via Better Auth. Skipped (starts at step 1) when a session exists that
   `isOnboarded(...) === false` — e.g. Google sign-in or a mid-flow refresh.
2. **Basic info** — name/email/phone/pictures (`ProfileStep`, seeded from the
   created account).
3. **Role** — pick `MEMBER` or `INSTRUCTOR` (`RoleStep`).
4. **Details** — role-specific form → `POST /api/onboarding` with
   `{ role, user, ...details }` → redirect `/dashboard`.

Server-side, `completeOnboarding` runs one transaction: re-read roles → reject if
a society role already exists → update `User` (+ append role) → create the
`Member`/`Instructor` row (defaults `PENDING`, so an admin still verifies).

### Profile editing

RSC page loads `getProfile()` → `ProfileView` (client) renders sections →
`PATCH /api/profile` → service upserts `Member`/`Instructor` inside a
transaction → hook refresh + `router.refresh()`.

### Admin user management

`/admin` overview renders `getUserCounts()` server-side; `/admin/users` SSRs page 1
then hands off to `UsersTable` + `useAdminUsers` for search/filter/paging;
`/admin/users/[id]` combines an overview card, editable forms, and a sign-out
button, writing through `PATCH /api/admin/users/[id]`.

## 13. Configuration & environment

`.env` (gitignored via `.env*`):

| Variable | Used by |
| --- | --- |
| `DATABASE_URL` | `src/lib/prisma.ts` (PrismaPg), `prisma.config.ts` (CLI/migrations) |
| `BETTER_AUTH_SECRET` | Better Auth session signing |
| `BETTER_AUTH_URL` | Better Auth `baseURL` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google social provider |

- Prisma client generation: generator `prisma-client` → `src/generated/prisma`
  (gitignored; run `prisma generate` after clone). Migrations: `prisma migrate`.
- `next.config.ts` is intentionally empty; `tsconfig` is strict with the `@/*` alias.

## 14. Known gaps & audit findings

Findings from this audit — none are blockers, but they should shape the roadmap:

1. **No `middleware.ts`** — route protection depends on each layout/page calling
   a guard. `/dashboard` is only protected **client-side** (`useSession` +
   `router.push`), so its first paint leaks shell markup to signed-out users.
   Prefer `requireUser()` there (or a middleware for defense in depth).
2. **`isActive` is not enforced at the session level** — deactivating an account
   in the admin panel does not invalidate its sessions or block API calls; guards
   check role only. Enforce `user.isActive` in `requireUser*`/`requireAdmin*`
   (and ideally revoke sessions on deactivation).
3. **Schema typo `selactedImg`** is persisted in the database and throughout the
   codebase; renaming needs a migration + coordinated code change.
4. **Committee models are unused** — schema/migrations exist, but no service,
   endpoint, or UI reads them yet.
5. **No tests** — no test script, framework, or CI; the validation layer and
   onboarding/admin transactions are the highest-value first targets.
6. **No rate limiting / bot protection** on custom endpoints (`/api/onboarding`,
   `/api/profile`); Better Auth covers its own routes. Consider per-IP limits.
7. **`prisma7.config.ts` duplicates `prisma.config.ts`** — leftover generated
   file; remove to avoid tooling confusion.
8. **Placeholder surfaces** — `/` (two buttons) and `/dashboard` (welcome card)
   are scaffolds; the README is still the create-next-app default, and the other
   `docs/*.md` files are empty.
9. **Duplicated fetch-hook logic** — `useProfile` and `useAdminUsers` repeat the
   same fetch/abort/error pattern; a shared `useApi` helper would reduce drift.
10. **`email` uniqueness** is declared only via `@@unique([email])` while `phone`
    uses field-level `@unique` — functionally consistent, but worth tidying for
    readability.

## 15. Conventions

- Server-only modules (`services/*`, `session.ts`, `api-error.ts`,
  `i18n-server.ts`) start with `import "server-only"`.
- Route handlers never leak exceptions: guard → parse → service → `toErrorResponse`.
- Every untrusted input goes through `src/lib/validation.ts` `parse*` functions;
  services assume already-validated typed input.
- User-facing strings in components use `t("English", "বাংলা")`; enum labels live
  in `profile-labels.ts`.
- New admin-only fields belong in the admin service only: the self-service
  `ProfileInput` must never accept server-managed state.
- Prefer RSC data loading; add a client hook only when the UI re-fetches after
  user interaction.





