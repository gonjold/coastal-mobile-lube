# Coastal Mobile Lube — Codebase Map (Post-A3b-1)

**Audit date:** 2026-05-13
**Branch:** `main`
**HEAD commit:** `1e3a9ca` — `feat(a3b-1): owner admin migration — ops routes, real dashboard, modal ports, migrations (#12)`
**Mode:** read-only documentation refresh. No code changes.

This map supersedes `COASTAL-CODEBASE-MAP-2026-05-12.md`. Since the prior map landed, one thing happened on `main`:

1. **A3b-1 sprint merged** (`1e3a9ca`, 2026-05-12T19:47:53Z). 15 squashed commits, +3,747/−458, 64 files. A3b-1 ships:
   - Five new ops routes (`/customers`, `/jobs`, `/invoices`, `/schedule`, `/team`) with list + detail pages where applicable.
   - The home dashboard wired to **real Firestore data** (A3a's stubData deleted).
   - Five more UI primitives + `EditableCell` ported to `@coastal/shared-ui` (now 13 primitives + 1 composition).
   - EST-anchored date utilities moved to `@coastal/shared-ui/src/lib/dates.ts`.
   - Canonical `Invoice` + `BookingShape` types and field-mapping helpers moved to `@coastal/shared-types`.
   - Four admin modals mounted in ops via a new `AdminModalContext`: `NewBookingModal` (simplified), `NewCustomerModal` (rewritten per Decision 4 to write to `customers`, not bookings), `CustomerMergeModal` (stub), `FixInvoiceDialog` (stub).
   - Two production migrations: `m-a3-01-status-canonicalize` (no-op as expected) and `m-a3-02-service-category-backfill` (18 docs backfilled; division-first heuristic).
   - GCS backup bucket created: `gs://coastal-mobile-lube-firestore-backups` (us-east1, uniform access).

Marketing `/admin/*` remains live and untouched (parallel-live per the walkthrough constraint). Frozen-files audit clean post-merge. For deep dives on QB, booking, invoicing, customer entity fragmentation, security — see `COASTAL-CODEBASE-MAP-2026-04-29.md`. For PWA infrastructure (A2) — see `COASTAL-CODEBASE-MAP-2026-05-11.md` §4.

---

## 1. Top-Level Structure

```
coastal-mobile-lube/
├── apps/
│   ├── marketing/        # Next.js: public site + /admin + /field + /tech (parallel-live with ops)
│   │   ├── src/
│   │   │   ├── app/                # App Router pages
│   │   │   ├── components/         # 16 root-level + admin/, auth/, booking/, brand/,
│   │   │   │                       #   field/, field/edit/, field/forms/, qr/, tech/, ui/
│   │   │   ├── hooks/, lib/, contexts/, config/, data/, types/, scripts/
│   │   ├── public/
│   │   ├── netlify.toml, next.config.ts, postcss.config.mjs, AGENTS.md, tsconfig.json
│   └── ops/              # app.coastalmobilelube.com — A1 + A2 + A3a + A3b-1
│       ├── app/
│       │   ├── (auth)/login, api/auth/*, api/__outbox-test
│       │   ├── (app)/layout.tsx                # ⚠️ AdminModalProvider mounts here (A3b-1)
│       │   ├── (app)/home/page.tsx             # ⚠️ real-data dashboard (A3b-1)
│       │   ├── (app)/customers/page.tsx        # NEW (A3b-1)
│       │   ├── (app)/customers/[id]/page.tsx   # NEW (A3b-1)
│       │   ├── (app)/jobs/page.tsx             # NEW (A3b-1)
│       │   ├── (app)/jobs/[id]/page.tsx        # NEW (A3b-1)
│       │   ├── (app)/invoices/page.tsx         # NEW (A3b-1)
│       │   ├── (app)/invoices/[id]/page.tsx    # NEW (A3b-1)
│       │   ├── (app)/schedule/page.tsx         # NEW (A3b-1)
│       │   ├── (app)/team/page.tsx             # NEW (A3b-1)
│       │   ├── sw.ts, manifest.ts, layout.tsx
│       ├── components/   # RoleGate, PWA, layout/, dashboard/, modals/ (A3b-1)
│       ├── lib/          # firebase, useAuth, team, auth/server, outbox, mutate, online,
│       │                 #   sidebarConfig, paletteCommands, AdminModalContext (A3b-1),
│       │                 #   queries/{bookings,invoices,users,customers,dashboard} (A3b-1)
│       ├── public/, styles/globals.css, middleware.ts, netlify.toml, next.config.ts
├── packages/
│   ├── shared-types/     # role, lineItems, conversions, factories,
│   │                     #   invoice (NEW A3b-1), booking-helpers (NEW A3b-1)
│   ├── shared-ui/        # ⚠️ EXPANDED in A3b-1 — see §5b
│   │   ├── src/components/ui/      # 13 primitives (alert/badge/button/card/command/
│   │   │                            #   dialog/dropdown-menu/input/kbd/label/select/sheet/tooltip)
│   │   ├── src/components/admin/   # EditableCell (NEW A3b-1)
│   │   ├── src/lib/                # utils.ts + dates.ts (NEW A3b-1)
│   │   ├── src/styles/             # tokens.css + theme.css
│   │   └── src/index.ts            # barrel
│   ├── firebase-admin/   # skeleton
│   └── qbo-client/       # skeleton
├── functions/            # 15 Cloud Functions (UNCHANGED in A3b-1)
├── scripts/migrations/   # 11 migrations (TWO NEW A3b-1: m-a3-01, m-a3-02) + run.ts
├── firebase.json, .firebaserc
├── firestore.rules, firestore.indexes.json, storage.rules (UNCHANGED in A3b-1)
├── netlify.toml          # ROOT — used by marketing Netlify site
├── package.json          # workspaces: apps/*, packages/*
├── tsconfig.json
└── CLAUDE.md             # canonical-dir guard + @AGENTS.md include
```

**File counts (orientation):**
- `apps/marketing/src/**` — ~113 directories, **44 files** importing from `@coastal/shared-ui` or `@coastal/shared-types` (was 39 pre-A3b-1).
- `apps/ops/{app,components,lib,styles}/**` — 49 `.ts`/`.tsx` files (was 32 pre-A3b-1; A3b-1 added 17).
- `packages/shared-ui/src/**` — 19 files (was 13 pre-A3b-1).
- `packages/shared-types/src/**` — 7 files (was 5 pre-A3b-1).

---

## 2. Tech Stack

Unchanged in A3b-1 with the exception of `packages/shared-ui/package.json` gaining `sonner` as an explicit dependency (was an implicit peer via marketing's hoist; commit `5a95a26`).

### 2a. Both Next.js apps (parity required, no drift)
- **Next.js 16.2.1**, App Router. `apps/marketing/AGENTS.md` warns: "This is NOT the Next.js you know."
- **React 19.2.4**.
- **Tailwind 4** with `@netlify/plugin-nextjs ^5.15.9` and `@tailwindcss/postcss ^4`.
- **Firebase JS SDK ^12.11.0**, **firebase-admin ^13.7.0**.
- **Lucide-react** icons; `tw-animate-css ^1.4.0`.
- TypeScript 5; Node ≥22.

### 2b. Marketing-only deps — unchanged.

### 2c. Ops-only deps — unchanged from A2.

### 2d. Shared-ui deps — A3b-1 update
```json
"dependencies": {
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "cmdk": "^1.1.1",
  "lucide-react": "^1.14.0",
  "radix-ui": "^1.4.3",
  "sonner": "^2.0.7",            // ← NEW in A3b-1 — explicit dep (EditableCell uses toast)
  "tailwind-merge": "^3.6.0"
}
"peerDependencies": { "react": "*", "react-dom": "*" }
```

### 2e. Backend stack — unchanged.

### 2f. Hosting — unchanged.

---

## 3. apps/marketing — Public Site + Admin + Field + Tech

A3b-1 touched marketing in three import-only-or-fewer ways: **(a)** 13 marketing files updated to import the 5 newly-ported primitives + `EditableCell` from `@coastal/shared-ui` instead of `@/components/ui/*` (5 of those marketing primitive files deleted); **(b)** 5 marketing files updated to import EST date helpers from `@coastal/shared-ui` instead of `@/lib/dashboard-helpers`; **(c)** `admin/page.tsx` updated to import the canonical `Invoice` type from `@coastal/shared-types`, the ad-hoc local Invoice shape removed.

`apps/marketing/src/lib/dashboard-helpers.ts` was trimmed in A3b-1 — the EST/date helpers moved to shared-ui, the marketing-only `fmtMoney` and `fmtRelativeTime` remained.

Marketing `/admin/*` routes are otherwise **unchanged and live** (parallel-live with ops per walkthrough constraint). Jason's workflow on `coastalmobilelube.com/admin/*` is uninterrupted.

### 3a. Top-level layout — unchanged.

### 3b. Route groups — unchanged.

### 3c. `apps/marketing/src/lib/` highlights
Same set as pre-A3b-1, with `dashboard-helpers.ts` trimmed (now only `fmtMoney` + `fmtRelativeTime`).

`@/lib/clover` is **frozen** — zero new imports. Production count: 2 references (`apps/marketing/src/components/field/JobPaymentSection.tsx` + one build-output map). Confirmed unchanged post-A3b-1.

### 3d. components/ui/ — additional deletions in A3b-1

A3a deleted 7 primitives from `apps/marketing/src/components/ui/` (button, card, input, badge, dialog, sheet, command). A3b-1 deleted **5 more**:

| Deleted from marketing in A3b-1 | Now lives at |
|---|---|
| `alert.tsx` | `packages/shared-ui/src/components/ui/alert.tsx` |
| `dropdown-menu.tsx` | `packages/shared-ui/src/components/ui/dropdown-menu.tsx` |
| `label.tsx` | `packages/shared-ui/src/components/ui/label.tsx` |
| `select.tsx` | `packages/shared-ui/src/components/ui/select.tsx` |
| `tooltip.tsx` | `packages/shared-ui/src/components/ui/tooltip.tsx` |

Also deleted from marketing: `apps/marketing/src/components/admin/EditableCell.tsx` (moved to `packages/shared-ui/src/components/admin/EditableCell.tsx`).

What **remains** under `apps/marketing/src/components/ui/` (6 files — none used by /admin):
`avatar.tsx`, `popover.tsx`, `scroll-area.tsx`, `separator.tsx`, `skeleton.tsx`, `tabs.tsx`.

These migrate when ops surfaces consume them (A3c ports `tabs` for the unified `/jobs/[id]` per mockup-03; the others are not consumed by current ops routes).

### 3e. Admin auth guard — UNCHANGED in A3b-1
`apps/marketing/src/components/AdminAuthGuard.tsx` md5: `789588f1e553ce08f659625481c5fa14` — matches baseline. **A3b-2 deletes this file** per the walkthrough cutover plan.

### 3f. Marketing cookie-domain — unchanged.

---

## 4. apps/ops — Operations Console (A1 + A2 + A3a + A3b-1)

A3b-1 transforms ops from "shell + stub home" into a functional owner-side admin surface. The home dashboard reads real Firestore data; five new routes ship list + detail pages; create modals are mounted; the `+ New` dropdown + palette quick actions work.

### 4a. App Router layout — UPDATED IN A3b-1

```
apps/ops/app/
├── layout.tsx                       # unchanged
├── manifest.ts, sw.ts               # A2 unchanged
├── (auth)/login/page.tsx            # unchanged
├── (app)/
│   ├── layout.tsx                   # ⚠️ A3b-1: wraps tree in <AdminModalProvider>;
│   │                                  mounts 4 modals + sonner <Toaster />;
│   │                                  retains `export const dynamic = 'force-dynamic'` (C1).
│   ├── home/page.tsx                # ⚠️ A3b-1: client component, fetchDashboard() + 4 KPI cards
│   │                                  + 3 panels w/ empty states; uses getLongDateLabel() for header.
│   ├── customers/page.tsx           # NEW (A3b-1) — list, search, EditableCells for name/phone/email
│   ├── customers/[id]/page.tsx      # NEW (A3b-1) — split detail: contact, vehicles, recent bookings,
│   │                                  lifetime stats, internal notes; edit/save/cancel pattern
│   ├── jobs/page.tsx                # NEW (A3b-1) — list, filter chips (active/completed/cancelled/all),
│   │                                  EditableCells for date/window/status, search
│   ├── jobs/[id]/page.tsx           # NEW (A3b-1) — owner-only split detail: customer, vehicle, services,
│   │                                  schedule, status/assignment, estimate (if locked), related invoice
│   │                                  (if linked), notes, activity (commsLog); A3c adds role-conditional
│   │                                  tech sections per mockup-03
│   ├── invoices/page.tsx            # NEW (A3b-1) — list, status filter chips (all/draft/sent/paid/
│   │                                  overdue), EditableCell for dueDate, search
│   ├── invoices/[id]/page.tsx       # NEW (A3b-1) — detail: bill-to, line items, totals
│   │                                  (qb-authoritative when set), schedule, related booking, QB card
│   │                                  (qboFinalizeStatus + payment link), notes; edit/save/cancel
│   ├── schedule/page.tsx            # NEW (A3b-1) — Mon–Sun week view, EST-anchored, prev/today/next nav,
│   │                                  click-through to /jobs/[id]; empty days show "No jobs scheduled"
│   └── team/page.tsx                # NEW (A3b-1) — list from users, EditableCell selects for
│                                      role (owner|admin_only|tech) + isActive
└── api/                             # unchanged (auth/login, auth/logout, __outbox-test)
```

**`force-dynamic` invariant preserved.** Final layout count under `apps/ops/app/` is still exactly 2 (`app/layout.tsx` + `app/(app)/layout.tsx`). C1 holds.

#### Route → query/edit summary (A3b-1 surfaces)

| Route | Query functions used | Editable fields (inline) | Stub-disabled in A3b-1 |
|---|---|---|---|
| `/home` | `fetchDashboard()` composing `fetch{RevenueMTD,RevenuePreviousMonth,BookingsThisWeek,AROutstanding,PipelineSum,JobsInFlight,EstimatesAwaiting,ARPastDue,TechMap}` | none (read-only dashboard) | — |
| `/customers` | `buildMergedCustomerList()` | name, phone, email (EditableCell) | "+ New customer" button on this page |
| `/customers/[id]` | `fetchCustomerDetail(id)` | name, phone, email, address, notes (edit mode) | — |
| `/jobs` | direct `onSnapshot(bookings, orderBy createdAt desc)` | confirmedDate, timeWindow, status (EditableCell) | "+ New booking" on this page |
| `/jobs/[id]` | direct `getDoc(bookings/[id])` + tech users + linked invoice | confirmedDate, timeWindow, arrivalWindow, status, assignedTechId, vehicle year/make/model/VIN, notes (edit mode) | — |
| `/invoices` | direct `onSnapshot(invoices, orderBy createdAt desc)` | dueDate (EditableCell) | "+ New invoice" (A3b-1.5) |
| `/invoices/[id]` | direct `getDoc(invoices/[id])` | customer name/phone/email, issue/due/paid dates, status, notes (edit mode); **Retry QB stub-disabled** | "Retry QB" button (A3b-1.5) |
| `/schedule` | direct `onSnapshot(bookings)` then group by EST date | none (click-through to /jobs/[id]) | "+ New booking" on this page |
| `/team` | direct `onSnapshot(users, orderBy createdAt desc)` | role, isActive (EditableCell selects) | — |

**Use the top-bar `+ New` dropdown or ⌘K palette to create things.** Per-page "+ New …" buttons are stub-disabled with title="…lands in STEP 13" tooltips — intentional, because the canonical entry point is the top bar / palette. A3b-1.5 wires them up so all entry points work.

### 4b. Components — UPDATED IN A3b-1

**Existing (A1 + A2 + A3a) — unchanged:**
- `RoleGate`, `OfflineBanner`, `InstallPrompt`, `UpdateToast`
- `layout/{ClientLayoutProvider,Sidebar}` (Sidebar config flipped in 4c)

**Updated in A3b-1:**
- `layout/TopBar.tsx` — adds `+ New` `DropdownMenu` with New booking / New customer entries (Invoice entry stub-disabled "A3c").
- `layout/CommandPalette.tsx` — wires quick-action commands to `useAdminModal().openModal(...)`.
- `dashboard/{KpiCard,JobsInFlight,EstimatesAwaiting,ARPastDue}.tsx` — all rewired to consume real query results, not `stubData`. KpiCard gains optional `emptyHint` prop. Each panel implements an empty state.

**New in A3b-1 — `apps/ops/components/modals/`:**
- **`NewBookingModal.tsx`** (170 LOC) — `'use client'`, shared-ui `Dialog`. Captures customer name/phone/email/address, vehicle year/make/model/VIN as plain inputs (NO VIN decode, NO vehicleApi lookup), service free-text + category dropdown (`auto|marine|fleet|rv`), preferred date, time-window dropdown, notes. Writes to `bookings` with `source:'admin-manual'`, `status:'pending'`. **Marketing's 1095-LOC NewBookingModal stays untouched in marketing for Jason; full port → A3b-1.5.**
- **`NewCustomerModal.tsx`** (150 LOC) — rewritten per walkthrough Decision 4. Writes to **`customers`** collection (not `bookings`). Captures first/last name, phone, email, address, type (`Residential|Commercial`), vehicle (text), notes. Writes include `phoneNormalized` (digits-only) for the dedupe-by-phone path.
- **`CustomerMergeModal.tsx`** — A3b-1 stub. Uses shared-ui `Dialog`. Explains the full merge wizard ships in A3c and provides a button that opens `coastalmobilelube.com/admin/customers` in a new tab.
- **`FixInvoiceDialog.tsx`** — A3b-1 stub. Uses shared-ui `Dialog` + `Alert`. Reads `prefill.invoiceId` and provides a button that opens `coastalmobilelube.com/admin/invoicing?fix=<id>` in a new tab. **Marketing's full FixInvoiceDialog with auth-cookie-backed retry stays as the canonical retry surface until A3c lands the ops retry endpoint.**

### 4c. Lib — UPDATED IN A3b-1

**Existing (A1 + A2 + A3a) — unchanged:**
- `firebase.ts` — A2 offline persistence (`persistentLocalCache` + `persistentMultipleTabManager`) at line 32. **This is the canonical offline mechanism for ops; see §13 note #18.**
- `useAuth.ts`, `team.tsx`, `auth/server.ts`, `outbox.ts`, `mutate.ts`, `online.ts` — all unchanged.

**Updated in A3b-1:**
- **`sidebarConfig.ts`** — flips `available: true` on Customers, Schedule, Jobs, Invoices, Team. Settings + Estimates + Quick Quotes + Reports remain stubs with `availableIn` set.
- **`paletteCommands.ts`** — derives nav commands from sidebar (auto-enabled by the above) AND appends 3 quick-action commands: `open-booking-modal`, `open-customer-modal`, `open-merge-modal`.

**New in A3b-1:**
- **`AdminModalContext.tsx`** — provider + `useAdminModal()` hook. Tracks `activeModal: 'booking' | 'customer' | 'merge' | 'fix-invoice' | null` and a `prefill: ModalPrefill | null` object. Provider mounts in `(app)/layout.tsx`.
- **`queries/bookings.ts`** — `fetchBookingsThisWeek`, `fetchJobsInFlight`, `fetchEstimatesAwaiting`, `fetchPipelineSum`. `BookingDoc` extends shared-types `BookingShape` so the field-mapping helpers type-check at call sites.
- **`queries/invoices.ts`** — `fetchRevenueMTD`, `fetchRevenuePreviousMonth`, `fetchAROutstanding`, `fetchARPastDue`. Money read prefers `qbTotalAmount` (qb-authoritative) over local `total` when present.
- **`queries/users.ts`** — `fetchTechMap()` returning `Map<uid, { initials, displayName }>` for `role in ['tech','owner']`.
- **`queries/customers.ts`** — `buildMergedCustomerList()` merging bookings-derived customers with `customers/{id}` docs (deduped by phone digits or lowercase email); `fetchCustomerDetail(id)` for the detail page (handles both customers/{id} and bookings-derived dedupe-keys).
- **`queries/dashboard.ts`** — composes all of the above into `fetchDashboard()` returning `{ kpis, panels }`.

**Deleted in A3b-1:**
- `stubData.ts` — A3a's typed stub fixtures. Removed in lockstep with the home dashboard going live on real data. No callers remain.

### 4d. Data state — UPDATED IN A3b-1

The home dashboard reads **real Firestore data** as of `1e3a9ca`. `stubData.ts` is gone. Production data is small (18 bookings, 30 invoices, 5 users); empty states are the common case and every KPI + panel implements one. See `apps/ops/app/(app)/home/page.tsx` for the wiring.

### 4e. Middleware — unchanged.

### 4f. Session cookie — unchanged.

### 4g. PWA assets — unchanged.

### 4h. Service worker — unchanged.

### 4i. Next config — unchanged.

### 4j. Ops netlify.toml — unchanged.

### 4k. PWA + layout constraints (binding) — unchanged
C1 (force-dynamic), C2 (no tailwind.config.*), C3 (relative manifest URLs), C4 (@source directive in both apps' globals.css). All four hold post-A3b-1.

---

## 5. packages/

### 5a. `@coastal/shared-types` (`packages/shared-types/src/`) — EXPANDED IN A3b-1

Pre-A3b-1: `role`, `lineItems`, `conversions`, `factories`. Five files.

A3b-1 additions:

- **`invoice.ts`** — canonical `Invoice` + `InvoiceLineItem`. Lifted verbatim from `apps/marketing/src/app/admin/invoicing/page.tsx:48-124` with one superset addition: `qboFinalizeStatus?: string` (was only on the ad-hoc dashboard shape; merged into canonical so both sites compile). Includes all FDACS Phase B/C fields, QB-authoritative fields, deletion + test markers, estimate consent / re-auth events, etc.
- **`booking-helpers.ts`** — `BookingShape` interface (minimal subset the helpers need) + helpers: `formatBookingVehicle`, `formatBookingService`, `getBookingCustomerName`, `getBookingCustomerPhone`, `getBookingCustomerEmail`, `getBookingLocation`, `getBookingArrivalTime`. The latter has an inlined `ARRIVAL_SLOT_LABELS` map so shared-types stays dependency-free (does NOT depend on shared-ui).
- **`index.ts`** — re-exports the above with `export type { Invoice, InvoiceLineItem } from './invoice'` and `export * from './booking-helpers'`.

The full `Booking` type still lives in `apps/marketing/src/app/admin/shared.ts:20`. **A3c canonicalizes it into shared-types** per the walkthrough.

### 5b. `@coastal/shared-ui` (`packages/shared-ui/src/`) — EXPANDED IN A3b-1

A3a put 7 primitives + `kbd` here; A3b-1 adds 5 more primitives, 1 composition, and a date-utility module.

**Directory layout post-A3b-1:**
```
packages/shared-ui/
├── package.json                # +sonner ^2.0.7 (A3b-1)
├── tsconfig.json
└── src/
    ├── index.ts                # barrel: `./components/ui` + `./lib/utils` + `./lib/dates`
    │                            #         + { default as EditableCell } from components/admin
    ├── components/
    │   ├── ui/
    │   │   ├── index.ts        # re-exports 13 primitives
    │   │   ├── alert.tsx       # NEW (A3b-1)
    │   │   ├── badge.tsx       # A3a
    │   │   ├── button.tsx      # A3a
    │   │   ├── card.tsx        # A3a
    │   │   ├── command.tsx     # A3a
    │   │   ├── dialog.tsx      # A3a
    │   │   ├── dropdown-menu.tsx  # NEW (A3b-1)
    │   │   ├── input.tsx       # A3a
    │   │   ├── kbd.tsx         # A3a (new in A3a, not from marketing)
    │   │   ├── label.tsx       # NEW (A3b-1)
    │   │   ├── select.tsx      # NEW (A3b-1)
    │   │   ├── sheet.tsx       # A3a
    │   │   └── tooltip.tsx     # NEW (A3b-1)
    │   └── admin/
    │       └── EditableCell.tsx   # NEW (A3b-1) — composition consuming Input + Select
    ├── lib/
    │   ├── utils.ts            # cn() helper, A3a
    │   └── dates.ts            # NEW (A3b-1) — EST-anchored date utilities
    └── styles/
        ├── tokens.css          # A3a
        └── theme.css           # A3a
```

**`lib/dates.ts` exports:**
- `dateToESTISO(d)` / `getTodayESTISO(now?)` — ISO yyyy-mm-dd anchored to America/New_York.
- `getLongDateLabel(now?)` — "Monday, October 12" style header date.
- `getWeekBoundsESTISO(now?)` — `{ weekStartISO, weekEndISO }` Mon–Sun. **Retained for marketing back-compat.**
- `getCurrentWeekRange(now?)` / `getCurrentMonthRange(now?)` / `getPreviousMonthRange(now?)` — `{ start, end }` shape consumed by the ops query layer.
- `bookingStartHour(b)` — hour 0–23 from confirmedArrivalWindow regex or timeWindow slot map.
- `fmtBookingDate(dateStr?, now?)` — "Today" / "Tomorrow" / "Oct 12" relative formatter.
- `formatBookingTimeLabel(b)` — first AM/PM token from confirmedArrivalWindow OR slot-key → "7:00 AM" map.

Marketing's `dashboard-helpers.ts` retains only `fmtMoney` and `fmtRelativeTime` after the move.

**EditableCell** (`components/admin/EditableCell.tsx`) — exported as default; re-exported from barrel via `{ default as EditableCell }`. Types: `EditableCellType = 'text' | 'email' | 'tel' | 'date' | 'select'`. Imports `Input` and `Select*` from sibling primitives via relative paths; uses `sonner` toast (which is why sonner is now an explicit dep — see §2d).

**Convention reminder (C4):** Any new component in shared-ui must rely only on classes the `@source "../../../packages/shared-ui/src/**/*.{ts,tsx}"` glob will pick up. The glob covers all `.ts`/`.tsx` under `packages/shared-ui/src/`, including the new `components/admin/EditableCell.tsx` and the 5 new primitives. No globals.css edits were needed in A3b-1.

### 5c. `@coastal/firebase-admin` — unchanged.
### 5d. `@coastal/qbo-client` — unchanged.

---

## 6. functions/ — Cloud Functions Inventory

**Frozen-files audit (2026-05-13):**

| File | md5 | Status post-A3b-1 |
|---|---|---|
| `functions/index.js` | `18123ddd59f4022bf4f1ccceee6d6e88` | ✓ unchanged from baseline |
| `firestore.rules` | `69a8b00b67cc3c4eccc000353584c889` | ✓ unchanged |
| `firestore.indexes.json` | `528e66e04a9ad90bab45afbcb69ddd75` | ✓ unchanged ⚠️ see §8d note |
| `storage.rules` | `07af5b77bf9764fa169c389283254c75` | ✓ unchanged |

`git diff 79d78e1..HEAD -- functions/ firestore.rules storage.rules` returns **empty**. A3b-1 was UI + query-layer + migrations only — no backend touches.

Functions inventory unchanged: 15 functions, region `us-east1`, runtime Node 22 (`firebase-functions ^6.3.0`). Helper inventory in `functions/lib/` unchanged. Known QB caveats (qbWebhook lacks verifier check, QB_BASE points at sandbox, single Item mapping, resend creates new QB invoice, etc.) all carry forward.

---

## 7. scripts/migrations/ — Inventory

**Updated in A3b-1.** Two new migration files; both ran on production 2026-05-12T17:24Z.

Current list (11 files + `run.ts` + `README.md`):
- `m-1a-01-backfill-assigned-tech` (Phase 1)
- `m-1a-02-backfill-service-category` (Phase 1; **targets jobs collection, not bookings — different from m-a3-02**)
- `m-1a-03-init-team` (Phase 1)
- `m-1c-01-vehicles-to-assets` (Phase 1)
- `m-1c-02-backfill-customer-assets` (Phase 1)
- `m-a1-01-audit` (A1, audit-only — runner attempts but the file exits early)
- `m-a1-01-role-canonicalize` (A1)
- `m-a1-02-cleanup-invoice-deliveries` (A1)
- `m-a1-03-storage-rules-signatures` (A1)
- **`m-a3-01-status-canonicalize` (NEW A3b-1)** — canonicalizes Booking + Invoice `status` enums; idempotent; no-op against current prod per zero-drift inventory; ships as future-proofing.
- **`m-a3-02-service-category-backfill` (NEW A3b-1)** — backfills `bookings.serviceCategory`. **Division-first** derivation order: `b.division` → `selectedServices[0].category` → marine/fleet/RV signals → `'auto'` fallback.

### 7a. Production run results (2026-05-12T17:24Z)

| Migration | scanned | updated | skipped | errors | Marker doc |
|---|---:|---:|---:|---:|---|
| `m-a3-01-status-canonicalize` | 48 | 0 | 48 | 0 | `_migrations/m-a3-01-status-canonicalize` (ranAt 2026-05-12T17:24:25.976Z) |
| `m-a3-02-service-category-backfill` | 18 | 18 | 0 | 0 | `_migrations/m-a3-02-service-category-backfill` (ranAt 2026-05-12T17:24:27.396Z) |

m-a3-02 backfill result: 17 → `'auto'`, 1 → `'rv'` (booking `otlh1FVBjYrPoorR26XG`). The 1-RV case would have been miscategorized as `'auto'` under the original heuristic; the division-first patch caught it before the real run. See commit `0bc8de3`.

Production user-role state (unchanged from 2026-05-11):
- 4 `owner` accounts: `jon@jgoldco.com`, `info@coastalmobilelube.com`, `coastalmobilelube@gmail.com`, `jonrgold@gmail.com`
- 1 `tech` account: `jgoldaht@gmail.com`
- 0 `admin_only` accounts

---

## 8. Root-Level Configs

### 8a. `firebase.json` — unchanged.
### 8b. `.firebaserc` — unchanged. Default project `coastal-mobile-lube`. **No staging alias exists** (confirmed via WO-A3b-1 staging probe — `coastal-mobile-lube-staging` returns `CONSUMER_INVALID` from Firestore).
### 8c. `firestore.rules` — UNCHANGED.

### 8d. `firestore.indexes.json` — UNCHANGED ⚠️ but production has drifted

The committed file still lists only the qrScans index. Production composite indexes (per `gcloud firestore indexes composite list`, 2026-05-13):

| Index ID | Collection group | Fields | State |
|---|---|---|---|
| `CICAgOjXh4EK` | qrScans | (slug ASC, scannedAt DESC, __name__ DESC) | READY ← in committed file |
| `CICAgJim14AK` | invoices | (status ASC, paidDate ASC, __name__ ASC) | READY ← **NOT in committed file** |
| `CICAgJiUpoMK` | bookings | (assignedTechId ASC, status ASC, confirmedDate ASC, __name__ ASC) | READY ← **NOT in committed file** |

The two new indexes were auto-created (likely via the Firebase Console error-link flow) during preview smoke when the dashboard / list queries hit composite-index requirements. **Action item for A3b-1.5 or A3b-2**: capture both indexes into `firestore.indexes.json` so deploys to a fresh project recreate them. Until then, `firebase deploy --only firestore:indexes` would not recreate the production state on a new project.

### 8e. `storage.rules` — UNCHANGED.
### 8f. `package.json` (root) — unchanged. Workspaces, scripts, engines all same.
### 8g. `tsconfig.json` (root) — unchanged.
### 8h. Root `netlify.toml` — unchanged.
### 8i. `apps/marketing/netlify.toml` — unchanged.
### 8j. `apps/ops/netlify.toml` — unchanged.
### 8k. `.gitignore` — unchanged.

---

## 9. CLAUDE.md / AGENTS.md

- **`CLAUDE.md`** — repo-root canonical-dir guard + `@AGENTS.md` include. Unchanged.
- **`apps/marketing/AGENTS.md`** — Next 16 warning lives here. Unchanged.
- No `apps/ops/AGENTS.md`. Ops conventions live in this map (C1–C4 + new note #18 in §13).

---

## 10. Deploy Topology

### 10a. Marketing site
- **Netlify site:** `coastal-mobile-lube` / **Custom domain:** `coastalmobilelube.com`
- **Build:** `npm install && npm run build` from `base = apps/marketing`.
- **STATUS POST-A3b-1:** Marketing builds continue to succeed locally and serve from cache in production. The "Marketing has been failing on Netlify on every push since A3a" open issue from the 2026-05-12 map is **resolved** by the `79d78e1` netlify monorepo install fix (which predates A3b-1). New A3b-1 marketing changes (44 files post-A3b-1) deploy via that fix path.

### 10b. Ops site
- **Netlify site:** `coastal-ops` / **Custom domain:** `app.coastalmobilelube.com`
- **Build:** `npm install && npm run build:ops`. Publishes `apps/ops/.next`.
- **STATUS POST-A3b-1:** Live. Owner can sign in and navigate `/home`, `/customers`, `/customers/[id]`, `/jobs`, `/jobs/[id]`, `/invoices`, `/invoices/[id]`, `/schedule`, `/team`. `+ New` top-bar and ⌘K palette quick actions open modals that write.
- **Headers + env vars** — unchanged from A2/A3a.

### 10c. Backend (Firebase) — UPDATED
Shared single project `coastal-mobile-lube`. **There is no separate staging Firebase project** (per A3b-1 STEP 15 probe). Single-project canonical.
- **Functions** — 15 fns, region `us-east1`, Node 22. Unchanged.
- **Firestore rules + indexes** — separate `firebase deploy --only firestore:rules,firestore:indexes`. **Production indexes drifted from committed list** — see §8d.
- **Storage rules** — unchanged.
- **Auth** — same.
- **GCS — NEW in A3b-1.** Bucket `coastal-mobile-lube-firestore-backups` (us-east1, uniform-bucket-level-access enabled, public-access-prevention inherited, soft-delete 7 days). Pre-A3b-1-migration export at `gs://coastal-mobile-lube-firestore-backups/a3b-1-pre-migration-20260512-132355/`. **Reusable for future migrations** — the bucket is now the canonical pre-migration backup target for this project.

---

## 11. Critical learning: Tailwind v4 `@source` pattern

Unchanged. C4 still applies. A3b-1 added EditableCell + 5 primitives under `packages/shared-ui/src/`; the existing `@source "**/*.{ts,tsx}"` glob in both apps' globals.css covers them without edits.

---

## 12. API Routes

### 12a. `apps/marketing/src/app/api/` — 24 routes (unchanged in A3b-1)
Marketing's `/api/admin/{customers,bookings,invoices,team}/[id]/route.ts` handlers remain the authoritative server-side write surface. **Ops does not yet have analogous routes** — see §13 note #18.

### 12b. `apps/ops/app/api/` — 3 routes (unchanged in A3b-1)
- `auth/login/route.ts`, `auth/logout/route.ts`, `__outbox-test/route.ts`.

A3b-1 did NOT add any ops API routes. Ops writes go direct to Firestore via the client SDK; Firestore's `persistentLocalCache` handles offline behavior. The `apps/ops/lib/mutate.ts` wrapper (A2) remains reserved for HTTP-routed writes when ops grows its own API surface (A3c+).

---

## 13. Notable Conventions

1. **`AGENTS.md` lives at `apps/marketing/AGENTS.md`**, not at the repo root.
2. **Framework version parity is a hard rule.** Same versions across apps/ops and apps/marketing.
3. **C1 — `(app)/` route group MUST export `dynamic = 'force-dynamic'`** on line 1 of `(app)/layout.tsx`. Still 2 total layout.tsx files under `apps/ops/app/`.
4. **C2 — No `tailwind.config.*`.** Tailwind v4 CSS-first via `@theme`.
5. **C3 — Manifest URLs are relative-only.**
6. **C4 — `@source` directive required in both apps' globals.css.**
7. **`@/lib/clover` is frozen.** Zero new imports across either app post-A3b-1 (count: 2, matches baseline).
8. **`createBooking()` factory is skeleton-only.** Still throws. A3c refactors the four current writers behind it.
9. **`AdminAuthGuard.tsx` is deleted in A3b-2** per the walkthrough cutover plan. md5 unchanged in A3b-1.
10. **Hex-inline color convention** applies inside `apps/marketing/src/app/*.tsx`. **A3a + A3b-1's ops components use theme tokens only — no hex literals.** Convention reinforced by A3b-1.
11. **Tailwind v4 canonical pattern:** tokens in `packages/shared-ui/src/styles/tokens.css` (HSL), `@theme inline` in `packages/shared-ui/src/styles/theme.css`. Unchanged.
12. **Custom claims drive `useAuth()` in ops.** Unchanged.
13. **Service worker is generated.** Unchanged.
14. **`mutate()` has no production callers yet.** Reserved for HTTP-routed writes — see note #18 below.
15. **Netlify edge headers do NOT apply to Next-Lambda-served routes.** Unchanged.
16. **Shared-ui is the new home for cross-app primitives.** A3b-1 follows this convention for the 5 ported primitives + EditableCell. Future primitive moves follow the same pattern.
17. **Stub data is isolated.** `apps/ops/lib/stubData.ts` **was deleted in A3b-1** in lockstep with the home dashboard going live on real data. Reinstating any stub data is a regression.
18. **NEW (A3b-1, binding) — Firestore `persistentLocalCache` is the canonical offline mechanism for ops.** Configured in `apps/ops/lib/firebase.ts:32` via `initializeFirestore({ localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`. Ops writes go through Firestore SDK directly (`updateDoc` / `addDoc` / `setDoc`); the SDK queues writes when offline and replays them on reconnect. The `apps/ops/lib/mutate.ts` IndexedDB-outbox wrapper is **reserved for HTTP-routed writes** (the marketing-style pattern). When ops grows API routes in A3c+, those routes will use `mutate()`; until then, do not wrap Firestore client writes in `mutate()` — the signatures don't match and the outbox doesn't know how to replay Firestore mutations.
19. **NEW (A3b-1) — AdminModalContext is the only modal entry point in ops.** All four modals (booking, customer, merge, fix-invoice) are mounted once in `apps/ops/app/(app)/layout.tsx`. Open them via `const { openModal } = useAdminModal(); openModal('booking', prefill?)`. Do not mount modals in route pages.

---

## 14. Production User Roles Snapshot

Unchanged since 2026-05-10:

| Role | Accounts |
|---|---|
| `owner` | `jon@jgoldco.com` (Jon Gold), `info@coastalmobilelube.com` (Jason Binder), `coastalmobilelube@gmail.com` (Coastal Mobile Lube & Tire), `jonrgold@gmail.com` (Jon Gold) |
| `admin_only` | 0 accounts |
| `tech` | `jgoldaht@gmail.com` |

Total accounts: 5. Canonical enum: `'owner' | 'admin_only' | 'tech'`.

---

## 15. What Did NOT Change (vs. 2026-05-12 map)

- Cloud Functions: same 15 fns, same md5.
- `firestore.rules`, `firestore.indexes.json` (committed file), `storage.rules` — md5 match.
- `firebase.json`, `.firebaserc`, `netlify.toml` (root + both apps).
- Migration runner `scripts/migrations/run.ts` — unchanged.
- `packages/firebase-admin/`, `packages/qbo-client/` — still skeletons.
- `apps/ops/middleware.ts` — unchanged.
- `apps/ops/app/sw.ts`, `apps/ops/app/manifest.ts` — unchanged.
- `apps/ops/app/(auth)/login/page.tsx` — unchanged.
- `apps/ops/components/{RoleGate,OfflineBanner,InstallPrompt,UpdateToast}.tsx` — unchanged.
- `apps/ops/lib/{firebase,useAuth,team,auth/server,outbox,mutate,online}.ts` — unchanged.
- QB sandbox-vs-prod cutover (still `QB_BASE = sandbox-quickbooks.api.intuit.com`).
- `qbWebhook` does not verify `QB_WEBHOOK_VERIFIER_TOKEN`.

---

## 16. A3b-1 — Ratified Deviations Carried Forward

22 deviations surfaced during A3b-1 execution; all ratified by Jon. The 3 with ongoing implications:

1. **`mutate()` coverage (#14a) — ACCEPTED.** Firestore `persistentLocalCache` is the canonical offline mechanism for ops. `mutate()` reserved for HTTP-routed writes (A3c+). See §13 note #18.
2. **/customers cross-source merge lives in ops (#8a) — A3c canonicalization target.** Ops `buildMergedCustomerList()` reads cross-source; marketing `/admin/customers` does its own in-page merge. Parallel-live side effect. A3b-2 cutover makes the question moot.
3. **Modal + invoice-create gaps (#10a, #13a) — A3b-1.5 mini-sprint.** Full NewBookingModal (VIN decode, services hook), inline create-invoice form, full CustomerMergeModal wizard, full FixInvoiceDialog with ops retry route. Plus the in-list "+ New …" buttons currently stub-disabled.

Full deviation table: `_reports/a3b1-final-report-20260512T173145Z.md`.

---

## 17. What's Deferred / Open Issues

### A3b-1.5 mini-sprint (next, lands before A3b-2 cutover)
- **Modal gap-fill** per ratified deviations: full NewBookingModal port, inline create-invoice form, full CustomerMergeModal wizard, full FixInvoiceDialog with ops retry route. Wire the per-page "+ New …" buttons so all entry points work.
- **`firestore.indexes.json` capture** for the two production composite indexes drifted in §8d (invoices status+paidDate; bookings assignedTechId+status+confirmedDate).
- **From preview smoke**: customer-vehicles CRUD UX in `/customers/[id]` (currently read-only, derived from attached bookings); VIN in `/jobs/[id]` display mode (currently only shown in edit mode); mileage field on `/jobs/[id]` (not currently present, needed for service-history view).

### Carry into A3b-2 (cutover)
- Delete marketing `/admin/*` routes.
- Delete `apps/marketing/src/components/AdminAuthGuard.tsx` + its 4-email allowlist.
- Replace user-doc `isAdmin()` readers with `hasOwnerClaim()` everywhere (Firestore rules + any stragglers).
- Configure marketing 308 redirects on `/admin/*` → `app.coastalmobilelube.com`.
- Type-narrow `AppUser.role`.

### Carry into A3c (tech-side)
- Migrate `/tech/*` to ops, `/today` mobile day-screen per mockup-02.
- Unified `/jobs/[id]` per mockup-03 (role-conditional sections — A3b-1's owner-only version expands).
- `createBooking()` factory adopted by all booking writers.
- `useTeamSize()` threading.
- Marketing `/field/*` 308 redirects.
- `tabs` primitive port (consumed by mockup-03).
- Canonicalize `buildMergedCustomerList` into shared-types (currently in ops).
- Canonicalize full `Booking` type into shared-types.

### Backlog (no sprint owner yet)
- Owner mobile polish pass (walkthrough Decision 6 punt).
- Theme variant selector UI (Settings page territory, A4).
- Logout cookie Domain hardcode (both apps still emit `domain: '.coastalmobilelube.com'`; harmless cleanup target).

---

## 18. A3b-1 Shipped — Provenance

- **Shipped to production:** 2026-05-12T19:47:53Z (squash-merge of PR #12 → `main`).
- **Squash commit:** `1e3a9ca51c9aa575cb3f0b8ff90e3fbf441fd7a6` ("feat(a3b-1): owner admin migration — ops routes, real dashboard, modal ports, migrations (#12)").
- **PR:** https://github.com/gonjold/coastal-mobile-lube/pull/12 (MERGED).
- **Diff stat at merge:** 64 files changed, +3,757 / −458.
- **Migrations applied to production:** `m-a3-01-status-canonicalize` (no-op), `m-a3-02-service-category-backfill` (18 docs backfilled) — marker docs at `_migrations/{id}` confirmed.
- **Pre-migration GCS backup:** `gs://coastal-mobile-lube-firestore-backups/a3b-1-pre-migration-20260512-132355/` (retained; restore path documented in final report).
- **Frozen-files audit:** clean. md5s match baseline for AdminAuthGuard, BookingWizardModal, functions/index.js, firestore.rules, storage.rules.
- **Clover refs:** 2 → 2 (unchanged).
- **Smoke verified:** Netlify preview signed-off by Jon prior to merge.

---

```
=========================================
COASTAL-CODEBASE-MAP-2026-05-13 — COMPLETE
A3b-1 SHIPPED TO PRODUCTION
=========================================
```
