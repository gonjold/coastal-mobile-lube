# Coastal Mobile Lube — Codebase Map (Post-A1)

**Audit date:** 2026-05-10
**Branch:** `main`
**HEAD commit:** `747fcd4` — `feat(a1): foundation — monorepo, ops scaffold, auth wiring, migrations`
**Mode:** read-only documentation refresh. No code changes.

This map supersedes `COASTAL-CODEBASE-MAP-2026-04-29.md`. The pre-A1 single-app structure (`src/` at repo root) has been moved into `apps/marketing/src/` as part of PR #8. A second Next 16 app (`apps/ops/`) has been added for the new ops console; a `packages/` workspace holds shared types, UI tokens, and integration skeletons. Cloud Functions, Firestore rules, and migration scripts remain at the repo root and are shared across both apps.

For deep dives on QB, booking, invoicing, customer entity fragmentation, and security — see the 2026-04-29 map. Those concerns remain unchanged at the code level (everything just moved one directory deeper).

---

## 1. Top-Level Structure

```
coastal-mobile-lube/
├── apps/
│   ├── marketing/        # ex-root Next.js app: public site + /admin + /field + /tech
│   │   ├── src/          # was repo-root src/
│   │   ├── public/
│   │   ├── netlify.toml  # publishes to coastal-mobile-lube + redirects to .com
│   │   ├── next.config.ts, postcss.config.mjs
│   │   ├── tsconfig.json
│   │   └── AGENTS.md     # moved from repo root
│   └── ops/              # NEW post-A1: app.coastalmobilelube.com (ops console)
│       ├── app/          # App Router: (auth)/login, (app)/home, api/auth/*
│       ├── components/   # RoleGate.tsx
│       ├── lib/          # firebase, useAuth, team, auth/server
│       ├── styles/globals.css
│       ├── middleware.ts
│       └── netlify.toml
├── packages/
│   ├── shared-types/     # UserRole enum, line-item unions, factory + conversion stubs
│   ├── shared-ui/        # tokens.css + theme.css + Button (Tailwind v4 canonical)
│   ├── firebase-admin/   # skeleton — server SDK helpers land in later sprints
│   └── qbo-client/       # skeleton — typed Intuit OAuth/Estimate/Invoice/Payment wrappers
├── functions/            # 15 Cloud Functions (all in index.js, 2771 lines)
│   ├── index.js
│   ├── lib/              # auth, pdf, disclosures, drive-mirror, fdacs-* helpers
│   └── scripts/          # operational one-offs (find-income-account, etc.)
├── scripts/migrations/   # Phase 1 + A1 migrations + run.ts runner
├── firebase.json, .firebaserc
├── firestore.rules, firestore.indexes.json, storage.rules
├── netlify.toml          # ROOT — used by the marketing Netlify site (base = apps/marketing)
├── package.json          # workspaces: apps/*, packages/*
├── tsconfig.json         # base TS config (strict, ES2022, Bundler resolution)
└── CLAUDE.md             # canonical-dir guard + @AGENTS.md include
```

`apps/marketing/packages/` exists as four empty leaf directories (artifact of an earlier path move) — not tracked, not used, ignore.

The repo retains a large pile of root-level untracked WO-*.md briefs, session checkpoints, and read-only scripts (`coastal-*.sh`). Those are inputs to the dev process, not part of the application surface.

---

## 2. Tech Stack

### 2a. Both Next.js apps (parity required, no drift)
- **Next.js 16.2.1**, App Router. `apps/marketing/AGENTS.md` warns: "This is NOT the Next.js you know" — APIs differ from training data; consult `node_modules/next/dist/docs/` before writing new patterns.
- **React 19.2.4**.
- **Tailwind 4** with `@netlify/plugin-nextjs ^5.15.9` and `@tailwindcss/postcss ^4`.
- **Firebase JS SDK ^12.11.0**, **firebase-admin ^13.7.0**.
- **Lucide-react** icons; `tw-animate-css ^1.4.0`.
- TypeScript 5; Node ≥22 (root `engines.node`).

### 2b. Marketing-only deps (`apps/marketing/package.json`)
The richer dependency set lives here: `@radix-ui/*`, `@dnd-kit/*`, `@tanstack/react-table`, `@zxing/*`, `cmdk`, `echarts`, `framer-motion`, `qr-code-styling`, `signature_pad`, `sonner`, `next-firebase-auth-edge`, `playwright`. None of these belong to ops yet.

### 2c. Ops-only deps (`apps/ops/package.json`)
Minimal: `next`, `react`, `react-dom`, `firebase`, `firebase-admin`, `lucide-react`, `tw-animate-css`, plus workspace links `@coastal/shared-types` and `@coastal/shared-ui`. No Radix, no dnd-kit, no echarts.

### 2d. Backend stack
- **Cloud Functions Gen 2**, region `us-east1`, runtime Node 22 (`firebase-functions ^6.3.0`).
- **nodemailer** (Gmail SMTP) for email; **pdfkit** + new FDACS helpers for invoice/disclosure PDFs.
- **firebase-functions/v2/scheduler** is now imported (lazy require) for `syncTeamConsistency`.

### 2e. Hosting
- **Netlify**: two sites, both pointed at `main`. See §10.
- **Firebase**: shared backend (Functions + Firestore + Storage + Auth) on project `coastal-mobile-lube`.
- **Cloudinary**: cloud `duy2qmmkh` (Coastal-dedicated since `fa860cf`).

---

## 3. apps/marketing — Public Site + Admin + Field + Tech

The pre-A1 `src/` tree, path-moved with no behavioral change. All site map, page, component, hook, and writer details from §3–§13 of `COASTAL-CODEBASE-MAP-2026-04-29.md` apply, with paths shifted from `src/...` to `apps/marketing/src/...`.

### 3a. Top-level layout
- `apps/marketing/src/app/` — App Router pages
- `apps/marketing/src/components/` — shared React components; `components/admin/`, `components/field/`, `components/auth/`, `components/ui/`
- `apps/marketing/src/hooks/` — `useServices.ts`
- `apps/marketing/src/lib/` — see §3c
- `apps/marketing/src/contexts/`, `apps/marketing/src/config/`, `apps/marketing/src/data/`, `apps/marketing/src/types/`
- `apps/marketing/src/scripts/` — TypeScript seed/migration scripts

### 3b. Route groups (top of `apps/marketing/src/app/`)
- Public: `/`, `/about`, `/services`, `/services-overview`, `/marine`, `/rv`, `/fleet`, `/how-it-works`, `/service-areas`, `/contact`, `/faq`, `/book` (+ `/booking` redirect → `/book` per `ea29aa4`), `/privacy`, `/terms`
- QR redirect: `/q/[slug]` (`route.ts`, `force-dynamic`)
- Admin: `/admin/*` — dashboard, schedule, customers, invoicing/invoices, integrations, services, fees, hero-editor, qr, team, login, plus `bookings` route
- Field (admin/tech-facing job UI): `/field/*` — schedule, today, jobs, customers, more
- Tech (Field Manager v1.0+): `/tech/*` — page (FieldManagerDashboard), schedule, jobs, login, unassigned

### 3c. `apps/marketing/src/lib/` highlights
`firebase.ts`, `firebase-admin.ts`, `cloudinary.ts`, `serviceHelpers.ts`, `services.ts`, `formatCurrency.ts`, `hero.ts`, `invoiceFromBooking.ts`, `invoiceNumber.ts`, `customerDedup.ts`, `dashboard-helpers.ts`, `schedule-filters.ts`, `vehicleApi.ts`, `vehicleMakes.ts`, `utils.ts`, plus subdirs `assets/`, `auth/`, `brand/`, `clover/`, `customers/`, `jobs/`, `qr/`, `services/`, `vehicles/`.

`@/lib/clover` is **frozen** — zero new imports across either app.

### 3d. Admin auth guard
`apps/marketing/src/components/AdminAuthGuard.tsx` retains the 4-email allowlist (`jon@jgoldco.com`, `coastalmobilelube@gmail.com`, `jonrgold@gmail.com`, `info@coastalmobilelube.com`) with auto-provisioning to `users/{uid}` on first sign-in. **Allowlist removal deferred to A3** — keep it in place until the ops app fully replaces admin flows.

---

## 4. apps/ops — Operations Console (NEW in A1)

Skeleton drop. Mounts at `app.coastalmobilelube.com` (Let's Encrypt SSL via Netlify). Today's surface is just login → home placeholder. Real ops UI lands in A3.

### 4a. App Router layout
```
apps/ops/app/
├── layout.tsx               # RootLayout: <html data-theme="light">, imports styles/globals.css
├── (auth)/
│   └── login/page.tsx       # Google OAuth via signInWithPopup, posts idToken to /api/auth/login
├── (app)/
│   ├── layout.tsx           # ⚠️ export const dynamic = 'force-dynamic' — REQUIRED
│   └── home/page.tsx        # placeholder behind RoleGate(['owner','admin_only','tech'])
└── api/auth/
    ├── login/route.ts       # verifyIdToken → createSessionCookie → set __session cookie
    └── logout/route.ts      # clears __session cookie
```

The `force-dynamic` export on `(app)/layout.tsx:1` is **load-bearing** — Firebase modules initialize at module load, which clashes with Next 16's static-by-default behavior. Any new layout under `(app)/` must export `dynamic = 'force-dynamic'`.

### 4b. Components
`apps/ops/components/RoleGate.tsx` — `'use client'` wrapper that calls `useAuth()` and renders `children` only when `role` is in the allowed list. Accepts `roles: UserRole[]` and an optional `fallback`. Loading state returns `null`.

### 4c. Lib
- `apps/ops/lib/firebase.ts` — client Firebase init using `NEXT_PUBLIC_FIREBASE_*` env vars; hardcodes `authDomain: 'coastal-mobile-lube.firebaseapp.com'`, `projectId: 'coastal-mobile-lube'`.
- `apps/ops/lib/useAuth.ts` — `'use client'` hook; subscribes to `onAuthStateChanged`, reads `idTokenResult.claims.role`, validates via `isUserRole()` from `@coastal/shared-types`.
- `apps/ops/lib/team.tsx` — `'use client'` `TeamSizeProvider` + `useTeamSize()` context; subscribes to `team/coastal` doc, computes `{size, multiTechActive, loading}` from active members with `role === 'tech'`.
- `apps/ops/lib/auth/server.ts` — server-side `getCurrentUser()` (verifies `__session` cookie via Admin SDK) and `requireRole(allowed)` helper. Reads `FIREBASE_ADMIN_KEY_JSON` (preferred) or `FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY`.

### 4d. Middleware (`apps/ops/middleware.ts`)
- Public paths: `/login`, `/api/auth/login`, `/api/auth/logout`, `/_next/*`, `/static/*`.
- Everything else: redirect to `/login` if `__session` cookie missing.
- Matcher excludes `_next/static`, `_next/image`, `favicon.ico`.

### 4e. Session cookie
- Name: `__session` (Firebase Hosting magic name; opaque to Next).
- TTL: 5 days.
- Production scope: `Domain=.coastalmobilelube.com` so the cookie can be shared with the marketing site if/when ops takes over admin flows. Dev: no Domain.
- `httpOnly`, `secure` in prod, `sameSite=lax`.

### 4f. Ops netlify.toml
```toml
[build]
  command = "npm install && npm run build:ops"
  publish = "apps/ops/.next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```
Workspace install at the repo root (so `@coastal/shared-*` resolve) + the root npm script `build:ops` which runs `next build` inside `apps/ops`.

---

## 5. packages/

All packages: `private: true`, `version: 0.0.1`, `main`/`types` point directly at `./src/index.ts` (no build step yet — TS source is consumed in-place by app `tsc`).

### 5a. `@coastal/shared-types` (`packages/shared-types/src/`)
- `role.ts` — canonical enum `type UserRole = 'owner' | 'admin_only' | 'tech'`, `USER_ROLES` const tuple, `isUserRole(value)` type guard. (Legacy `'admin'` was renamed to `'admin_only'` by `m-a1-01-role-canonicalize`.)
- `lineItems.ts` — discriminated union `AnyLineItem = WizardSelection | FdacsEstimateItem | CustomerEstimateItem | InvoiceLineItem`. Each variant carries a `kind` literal. Captures the four shapes that currently live in different writers; A3 will refactor writers to produce these directly.
- `conversions.ts` — `wizardToFdacs`, `customerEstimateToFdacs`, `fdacsToInvoice`, `customerEstimateToInvoice`. All throw `'not implemented in A1'`. A3 fills these in.
- `factories.ts` — `createBooking(input)` factory skeleton with a tagged union over `'public_wizard' | 'admin_new_booking' | 'admin_new_customer' | 'field_create'`. Throws today; A3 refactors the four current booking writers behind it.
- `index.ts` — barrel export.

### 5b. `@coastal/shared-ui` (`packages/shared-ui/src/`)
- `styles/tokens.css` — `:root` + `[data-theme="dark"]` + `[data-theme="vivid"]` HSL CSS variables (background, foreground, primary, accent, etc.). HSL-as-three-numbers form expects `hsl(var(--primary))` consumers.
- `styles/theme.css` — Tailwind v4 `@theme inline { ... }` block mapping `--color-*` tokens to `hsl(var(--*))`. **This is the canonical Tailwind v4 pattern.** Apps import this AFTER tokens.css and AFTER `@import "tailwindcss"` in their globals.css.
- `components/Button.tsx` — smoke component with `variant: 'primary' | 'secondary' | 'ghost'`. Used by ops login.
- `index.ts` — `export { Button }`, `export type { ButtonProps }`.
- `peerDependencies`: `react: *`, `react-dom: *`.

### 5c. `@coastal/firebase-admin` (`packages/firebase-admin/src/`)
Single-line skeleton — `export const PACKAGE_NAME = '@coastal/firebase-admin';`. Server SDK init helpers + Cloud Function exports land in later sprints.

### 5d. `@coastal/qbo-client` (`packages/qbo-client/src/`)
Same pattern. Typed Intuit OAuth + Estimate/Invoice/Payment/CreditMemo wrappers land in later sprints (these will eventually replace the QB code currently embedded in `functions/index.js`).

---

## 6. functions/ — Cloud Functions Inventory

`functions/index.js` is now 2771 lines (was 1833 at the 04-29 audit). All functions remain on **region `us-east1`, runtime Node 22**. Helpers extracted to `functions/lib/` since the prior map.

| # | Name | Trigger | Lines | Purpose |
|---|---|---|---|---|
| 1 | `onNewBooking` | Firestore `onDocumentCreated bookings/{id}` | 24 | Admin "new booking" email to `jon@jgoldco.com` (BCC SMS gateway). |
| 2 | `sendConfirmationEmail` | onRequest (CORS) | 238 | Customer confirmation w/ `calendarUrl`. Rate-limited 20/hr via `rateLimits/emailsSent`. |
| 3 | `sendBookingConfirmation` | onRequest (CORS) | 384 | Generates `.ics`, emails customer (cc `info@coastalmobilelube.com`). |
| 4 | `decodeVIN` | onRequest | 597 | NHTSA proxy: `decode`, `makes`, `models`. Public booking still calls NHTSA directly. |
| 5 | `sendInvoiceEmail` | onRequest (admin Bearer) | 830 | Generates PDF, emails customer (non-QB path). |
| 6 | `qbOAuthStart` | onRequest | 1048 | Writes state nonce; redirect to Intuit authorize URL. |
| 7 | `qbOAuthCallback` | onRequest | 1078 | Exchanges code → persists tokens to `settings/quickbooks`; redirects to admin. |
| 8 | `sendInvoiceWithQBPayment` | onRequest (admin Bearer) | 1378 | Full QB invoice path; reuses qbCustomerId from invoice or customer doc; sends Pay Now email. |
| 9 | `sendCancellationEmail` | onRequest | 1931 | Customer cancellation email; cc `info@coastalmobilelube.com`, bcc SMS. |
| 10 | `qbWebhook` | onRequest | 2067 | Payment Create event → flips Coastal invoice to paid. **No signature verification** (see 04-29 §7d). |
| 11 | `generateFdacsInvoicePdfOnCreate` | Firestore `onDocumentCreated invoices/{id}` | 2282 | FDACS PDF generator for `source: tech_completion` invoices; writes URL/path back to invoice doc. 1 GiB / 120 s. |
| 12 | `regenerateFdacsInvoicePdf` | onCall | 2323 | Admin-only manual regen for FDACS PDFs. Verifies caller via `users/{uid}.role === 'admin' && isActive`. |
| 13 | `mirrorInvoiceToDriveOnSent` | Firestore `onDocumentUpdated invoices/{id}` | 2568 | When a `tech_completion` invoice flips to `status === 'sent'`, mirrors PDF to the Coastal Operations Shared Drive. Skips if already mirrored. Runs as `DRIVE_MIRROR_RUNTIME_SA`. 512 MiB / 180 s. |
| 14 | `mirrorInvoiceToDriveCallable` | onCall | 2627 | Admin-only manual re-mirror entry point. |
| 15 | `syncTeamConsistency` | onSchedule (NEW in A1) | 2705 | Schedule: every 24 hours from first invocation. Non-deterministic wall-clock anchor (not pinned to a specific hour). To pin to a specific time, edit `functions/index.js` to use a cron expression (e.g., `'0 9 * * *'` for 9 am ET) and redeploy. Timezone `America/New_York`. Reads `users/` collection, computes canonical `team/coastal.members[]` from active users, detects drift (`missing_from_team`, `role_mismatch`, `active_mismatch`, `orphan_in_team`), writes back `members + lastConsistencyCheckAt + lastConsistencyDrift`. |

### 6a. Helpers in `functions/lib/`
- `auth.js` — admin SDK init / role checks for callable functions
- `pdf.js` — pdfkit invoice template (non-FDACS)
- `disclosures.js` — FDACS legal disclosure text constants
- `fdacs-template.js`, `fdacs-helpers.js` — FDACS invoice PDF template + helpers
- `fdacs-email-template.js` — FDACS-compliant customer email body
- `drive-mirror.js` — Google Drive Shared Drive mirroring helper

### 6b. Secrets (`defineSecret` in functions/index.js)
`GMAIL_USER`, `GMAIL_APP_PASSWORD`, `QB_CLIENT_ID`, `QB_CLIENT_SECRET`, `QB_WEBHOOK_VERIFIER_TOKEN` (still deployed but **not read by source** — see 04-29 §7d).

Drive mirror functions use `DRIVE_MIRROR_RUNTIME_SA` as a runtime service account, granted Drive scope separately.

### 6c. Notable QB still-true facts (carry-over)
- `QB_BASE` hardcoded to `sandbox-quickbooks.api.intuit.com`. Production cutover incomplete.
- Single QB Item named "Service" mapped to all line items.
- Resend on QB path creates a NEW QB invoice (no `qbInvoiceId` short-circuit).

---

## 7. scripts/migrations/ — Inventory

Idempotent runner under `scripts/migrations/run.ts` writes a marker doc to `_migrations/{id}` after a successful run; subsequent runs skip migrations whose marker exists.

### 7a. Runner contract
Env vars consumed by `run.ts` and individual migrations:

| Var | Default | Purpose |
|---|---|---|
| `MIGRATION_PROJECT_ID` | `coastal-mobile-lube-staging` | Target Firebase project. |
| `DRY_RUN` | `false` | If `true`, no writes; runner still logs and **does not** write the `_migrations/{id}` marker. |
| `I_KNOW_THIS_IS_PROD` | unset | Required to be `true` when `MIGRATION_PROJECT_ID === 'coastal-mobile-lube'`, else runner exits with code 2. |
| `FIREBASE_ADMIN_KEY` | `~/.coastal-firebase-admin.json` | Path to service account JSON. |
| `OWNER_UID`, `OWNER_EMAIL`, `OWNER_NAME` | n/a | Required by some Phase 1 migrations. |

Run from repo root: `npm run migrate` (= `tsx scripts/migrations/run.ts`).

### 7b. Migration files (run in lexical order)

| File | Phase | Purpose |
|---|---|---|
| `m-1a-01-backfill-assigned-tech.ts` | Phase 1 | Backfill `bookings.assignedTechId` for Phase 1 tech-app rules. |
| `m-1a-02-backfill-service-category.ts` | Phase 1 | Backfill `serviceCategory` field on bookings. |
| `m-1a-03-init-team.ts` | Phase 1 | Seed `team/coastal` doc with first member from `OWNER_*` env. |
| `m-1c-01-vehicles-to-assets.ts` | Phase 1 | Convert booking-embedded vehicle fields into `assets/` collection docs. |
| `m-1c-02-backfill-customer-assets.ts` | Phase 1 | Backfill `customerAsset` linkage on existing bookings. |
| `m-a1-01-role-canonicalize.ts` | A1 | Walk Auth + `users/`; sync custom claim `role` ↔ `users/{uid}.role`; promote allowlisted emails to `owner`; map legacy `'admin'` → `'admin_only'`. |
| `m-a1-02-cleanup-invoice-deliveries.ts` | A1 | Verify-only — confirms `invoiceDeliveries` collection is empty before its rule was removed. Errors out (does not auto-delete) if docs exist. |
| `m-a1-03-storage-rules-signatures.ts` | A1 | Marker-only — verifies `storage.rules` contains the `/signatures/estimates/{estimateId}/{revision}` block. |
| `m-a1-01-audit.ts` | A1 (standalone) | **Read-only audit** of what `m-a1-01-role-canonicalize` would do. Default-export `run()` is a no-op that returns `errors: ['AUDIT_ONLY']` so the runner never writes a marker. Real invocation is the standalone `npx tsx scripts/migrations/m-a1-01-audit.ts > _reports/...txt` shown in its file header. |
| `run.ts` | runner | Above. |
| `README.md` | docs | Run/dry-run instructions. |

Production user-role state after `m-a1-01-role-canonicalize` (per Jon, post-A1):
- 4 `owner` accounts: `jon@jgoldco.com`, `info@coastalmobilelube.com`, `coastalmobilelube@gmail.com`, `jonrgold@gmail.com`
- 1 `tech` account: `jgoldaht@gmail.com`
- Canonical role enum: `'owner' | 'admin_only' | 'tech'`

---

## 8. Root-Level Configs

### 8a. `firebase.json`
Unchanged shape — points `firestore.rules`, `firestore.indexes.json`, `storage.rules`, and `functions/` source. Single codebase `default`.

### 8b. `.firebaserc`
`{ "projects": { "default": "coastal-mobile-lube" } }`.

### 8c. `firestore.rules`
Reform landed mid-Phase-1 + A1. Highlights vs. the 04-29 catch-all-permissive baseline:
- **Catch-all is now `if isAdmin()`** (line 174) — no more "any signed-in user can read everything." `isAdmin()` reads `users/{uid}.role === 'admin' && isActive == true`.
- New custom-claim helpers (`hasOwnerClaim`, `hasAdminOnlyClaim`, `hasTechClaim`, `hasOwnerOrAdminClaim`) read `request.auth.token.role`.
- New explicit blocks for `users/`, `team/`, `cloverPayments/`, `assets/`, `_migrations/`.
- Tech access scoped to `bookings` they're `assignedTechId` for; tech may `create` invoices only when paired with an assigned booking.
- `users/{userId}` allows self-create — needed for the marketing-app allowlist auto-provisioning flow.

### 8d. `firestore.indexes.json`
Still single composite: `qrScans` by `(slug ASC, scannedAt DESC)`. No new indexes since 04-29.

### 8e. `storage.rules`
- `fdacs-pdfs/` — read/write false (Admin SDK only). 7-year retention via GCS lifecycle (set separately).
- `signatures/{bookingId}/{filename}` — auth required, ≤ 2 MB, `image/png`.
- `signatures/estimates/{estimateId}/{revision}` — public read; write requires Firebase custom-token sign-in. Verified by `m-a1-03-storage-rules-signatures`.
- `photos/{bookingId}/{filename}` — auth required, ≤ 5 MB, `image/*`.
- Default deny.

### 8f. `package.json` (root)
Workspaces: `apps/*`, `packages/*`. Scripts: `build:marketing`, `build:ops`, `build:all`, `typecheck:all`, `migrate`. Single dev dep: `tsx ^4.21.0`. Engines: `node >=22`.

### 8g. `tsconfig.json` (root)
Base TS config — `strict`, `target: ES2022`, `module: ESNext`, `moduleResolution: Bundler`, `jsx: preserve`. Each app and package has its own `tsconfig.json` extending this in spirit.

### 8h. Root `netlify.toml`
**Used by the marketing Netlify site.** Sets `base = "apps/marketing"` so the build runs from there. Comment in-file explains: "Marketing site root config. base = apps/marketing so Netlify finds Next."

### 8i. `apps/marketing/netlify.toml`
Includes the `coastal-mobile-lube.netlify.app/* → coastalmobilelube.com/:splat` 301 redirect (`6bf629d`).

### 8j. `apps/ops/netlify.toml`
`base` is implicitly the repo root (it's installed via `npm install` workspaces) and `publish = "apps/ops/.next"`.

---

## 9. CLAUDE.md / AGENTS.md

- **`CLAUDE.md`** — repo-root canonical-dir guard (only `~/coastal-mobile-lube` is active; `~/projects/coastal-mobile-lube` was stale and removed 2026-04-19) + `@AGENTS.md` include.
- **`apps/marketing/AGENTS.md`** — moved from repo root in A1. The "This is NOT the Next.js you know" warning lives here now.
- No `apps/ops/AGENTS.md` — the marketing one applies via Next 16 / React 19 parity.

---

## 10. Deploy Topology

### 10a. Marketing site
- **Netlify site:** `coastal-mobile-lube` (a.k.a. `coastal-mobile-lube.netlify.app`)
- **Custom domain:** `coastalmobilelube.com` (primary). `coastal-mobile-lube.netlify.app` 301-redirects to it.
- **Branch:** `main`
- **Base / publish:** root `netlify.toml` sets `base = apps/marketing`; `publish = .next` resolves to `apps/marketing/.next`.
- **Build command:** `npm install && npm run build` (runs inside `apps/marketing`).
- **Build env vars required:** `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`. (Plus any server-side admin SDK creds for the marketing app's API routes — same env-var names as ops, see §10b.)

### 10b. Ops site (NEW post-A1)
- **Netlify site:** `coastal-ops`
- **Custom domain:** `app.coastalmobilelube.com`. Let's Encrypt SSL.
- **Branch:** `main`
- **Build command:** `npm install && npm run build:ops` (root npm script → `next build` in `apps/ops/`).
- **Publish:** `apps/ops/.next`.
- **Build env vars required:** `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, plus server-side: `FIREBASE_ADMIN_KEY_JSON` (preferred) **or** `FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY`.
- **Firebase Auth authorized domains:** include both `coastal-ops.netlify.app` (Netlify default) and `app.coastalmobilelube.com` (custom).

### 10c. Backend (Firebase)
Shared single project `coastal-mobile-lube`:
- **Functions** — 15 fns deployed via `firebase deploy --only functions`. Region `us-east1`. Node 22.
- **Firestore rules + indexes** — separate deploy: `firebase deploy --only firestore:rules,firestore:indexes`. Netlify deploys do NOT propagate these.
- **Storage rules** — `firebase deploy --only storage`.
- **Auth** — same project, used by both apps. Custom claims (`role`) set by `m-a1-01-role-canonicalize` and surfaced through `useAuth()` in ops, `AdminAuthGuard.tsx` in marketing.

---

## 11. API Routes

### 11a. `apps/marketing/src/app/api/`
- `auth/login/route.ts` — sets `__session` cookie (parallel to ops; both apps need it because the marketing site still hosts admin pages).
- `auth/logout/route.ts` — clears `__session`.
- `admin/team/route.ts` + `admin/team/add/route.ts` + `admin/team/remove/route.ts` + `admin/team/[id]/route.ts` — team management for the ops handover.
- `admin/customers/[id]/route.ts`, `admin/bookings/[id]/route.ts`, `admin/invoices/[id]/route.ts`, `admin/invoices/[id]/retry/route.ts` — admin per-resource mutations.
- `field/customers/route.ts`, `field/customers/[id]/assets/route.ts`, `field/bookings/route.ts` — Field Manager create/list flows.
- `field/jobs/[id]/{schedule,asset,check-in,signature,status,notes,photos,services,customer}/route.ts` — per-job edit affordances added in `a373462` and `1a60c7a`.
- `field/jobs/[id]/services/[itemId]/route.ts` — per-line-item mutations.
- `qbo/email-invoice/[invoiceId]/route.ts` — QBO email-invoice trigger from the admin UI.

### 11b. `apps/ops/app/api/`
Just `auth/login/route.ts` and `auth/logout/route.ts` so far. Real ops API routes land in A3.

---

## 12. Notable Conventions

1. **`AGENTS.md` lives at `apps/marketing/AGENTS.md`**, not at the repo root. The Next 16 warning applies anywhere a Next app is built; ops inherits it by parity.
2. **Framework version parity is a hard rule.** `apps/ops` mirrors `apps/marketing` exactly: Next 16.2.1, React 19.2.4, Tailwind 4. No drift. When upgrading one, upgrade the other in the same PR.
3. **`(app)/` route group MUST export `dynamic = 'force-dynamic'`** in any layout (Firebase module-load init clashes with Next 16's static defaults). Currently set in `apps/ops/app/(app)/layout.tsx:1`.
4. **`@/lib/clover` is frozen.** Zero new imports across either app. Existing imports stay; new payments work goes through `@coastal/qbo-client` once it lands.
5. **`createBooking()` factory is skeleton-only in A1.** Throws today. A3 refactors the four current writers (`apps/marketing/src/components/BookingWizardModal.tsx`, `apps/marketing/src/app/book/BookingForm.tsx`, `apps/marketing/src/components/admin/NewBookingModal.tsx`, `apps/marketing/src/components/admin/NewCustomerModal.tsx`) behind it.
6. **`AdminAuthGuard.tsx` allowlist removal deferred to A3.** Keep both the client-side allowlist and the auto-provisioning behavior in place until ops takes over admin flows end-to-end.
7. **Hex-inline color convention** (`bg-[#0B2040]`, `text-[#E07B2D]`) still applies inside `apps/marketing/src/app/*.tsx`. Do not migrate marketing components to the `@theme` tokens yet — match neighbors. The ops app uses the `bg-primary text-primary-foreground` token form via `shared-ui/styles/theme.css`.
8. **Tailwind v4 canonical pattern**: tokens in `tokens.css` (HSL three-number form), `@theme inline` in `theme.css` mapping to `hsl(var(--*))`. Apps `@import "tailwindcss"` first, then tokens.css, then theme.css, in `apps/{app}/styles/globals.css`.
9. **Custom claims drive `useAuth()` in ops.** `request.auth.token.role` is set by `m-a1-01-role-canonicalize` and refreshed via the `syncTeamConsistency` scheduled job.

---

## 13. Production User Roles Snapshot (post-`m-a1-01-role-canonicalize`)

| Role | Accounts |
|---|---|
| `owner` | `jon@jgoldco.com` (Jon Gold), `info@coastalmobilelube.com` (Jason Binder), `coastalmobilelube@gmail.com` (Coastal Mobile Lube & Tire), `jonrgold@gmail.com` (Jon Gold) |
| `admin_only` | 0 accounts (verified via `m-a1-01-audit.ts` against prod at 2026-05-10T21:52:24Z) |
| `tech` | `jgoldaht@gmail.com` |

Total accounts: 5. All five are already canonical — `claim=role` matches `users/{uid}.role` for every user. The `m-a1-01-role-canonicalize` migration is a no-op against current prod state; re-running would produce 5 × `SKIP_ALREADY_CANONICAL` with 0 claim writes and 0 doc writes.

Note: `info@coastalmobilelube.com` is bound to **Jason Binder's** Auth account (not a shared mailbox login). Be aware when reasoning about who "owner" actually maps to in operational terms.

Canonical enum: `'owner' | 'admin_only' | 'tech'` (defined in `packages/shared-types/src/role.ts:1`).

---

## 14. What Did NOT Change (vs. 2026-04-29 map)

- All booking writers, invoice writers, QB code, customer aggregation logic, and Firestore data model details from §3–§12 of the prior map remain identical at the code level — paths just shifted from `src/...` to `apps/marketing/src/...`.
- The QB sandbox-vs-prod cutover is still WIP. `QB_BASE = "sandbox-quickbooks.api.intuit.com"`.
- `qbWebhook` still does not verify the `QB_WEBHOOK_VERIFIER_TOKEN`.
- The `/admin/pricing` orphan route still exists at `apps/marketing/src/app/admin/pricing/page.tsx` and still writes a schema-incompatible aggregate doc shape. Delete-or-merge is still a pending decision.
- `onNewBooking` still emails `jon@jgoldco.com` rather than `info@coastalmobilelube.com`.

The 2026-04-29 map remains the definitive reference for those carry-over concerns.

---

```
=========================================
COASTAL-CODEBASE-MAP-2026-05-10 — COMPLETE
=========================================
```
