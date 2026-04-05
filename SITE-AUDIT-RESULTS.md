# Coastal Mobile Lube — Comprehensive Site Audit

**Date:** 2026-04-04
**Next.js Version:** 16.2.1 (Turbopack)
**Audited by:** Claude Code

---

## 1. ROUTE INVENTORY

### Public Routes (10 routes)

| Route | File | Status |
|-------|------|--------|
| `/` | `src/app/page.tsx` | PASS |
| `/about` | `src/app/about/page.tsx` | PASS |
| `/book` | `src/app/book/page.tsx` | PASS |
| `/contact` | `src/app/contact/page.tsx` | PASS |
| `/faq` | `src/app/faq/page.tsx` | PASS |
| `/fleet` | `src/app/fleet/page.tsx` | PASS |
| `/marine` | `src/app/marine/page.tsx` | PASS |
| `/rv` | `src/app/rv/page.tsx` | PASS |
| `/service-areas` | `src/app/service-areas/page.tsx` | PASS |
| `/services` | `src/app/services/page.tsx` | PASS |

### Admin Routes (7 routes)

| Route | File | Status |
|-------|------|--------|
| `/admin` | `src/app/admin/page.tsx` | PASS |
| `/admin/login` | `src/app/admin/login/page.tsx` | PASS |
| `/admin/schedule` | `src/app/admin/schedule/page.tsx` | PASS |
| `/admin/customers` | `src/app/admin/customers/page.tsx` | PASS |
| `/admin/invoicing` | `src/app/admin/invoicing/page.tsx` | PASS |
| `/admin/pricing` | `src/app/admin/pricing/page.tsx` | PASS |
| `/admin/services` | `src/app/admin/services/page.tsx` | WARNING — not linked in admin sidebar nav |

### Layouts (3)

| Layout | File | Notes |
|--------|------|-------|
| Root | `src/app/layout.tsx` | Global layout with Header/Footer, mobile sticky bar |
| Admin | `src/app/admin/layout.tsx` | Sidebar nav, AdminAuthGuard |
| Contact | `src/app/contact/layout.tsx` | Metadata-only layout |

**Result: PASS** — All routes exist and are reachable. One warning: `/admin/services` is not in the admin sidebar navigation.

---

## 2. BUILD CHECK

| Check | Result |
|-------|--------|
| Compilation | PASS (1389ms) |
| TypeScript | PASS (1666ms) |
| Static generation | PASS (24/24 pages, 218ms) |
| Warnings | 0 |
| Errors | 0 |

**Result: PASS** — Clean build with zero warnings and zero errors.

---

## 3. CONTENT SCAN

### 3a. Em Dashes (—)

**Result: PASS** — All em dashes are inside JSX comments only (`{/* ... */}`), not in user-visible text.

| File | Line | Context |
|------|------|---------|
| `src/app/page.tsx` | 181 | `{/* Oval badge watermark --- massive brand stamp */}` |
| `src/app/page.tsx` | 236 | `{/* Booking Widget --- clean white */}` |
| `src/app/layout.tsx` | 168 | `{/* Mobile Sticky Bottom Bar --- visible on all pages */}` |
| `src/app/about/page.tsx` | 69 | `{/* Section 1 --- Hero */}` |
| `src/app/about/page.tsx` | 121 | `{/* Section 2 --- Van Wrap Showcase */}` |
| `src/app/about/page.tsx` | 142 | `{/* Section 3 --- The Story */}` |
| `src/app/about/page.tsx` | 213 | `{/* Section 4 --- Value Props */}` |
| `src/app/about/page.tsx` | 248 | `{/* Section 5 --- Three Verticals */}` |
| `src/app/about/page.tsx` | 287 | `{/* Section 6 --- CTA */}` |
| `src/app/faq/FAQContent.tsx` | 112 | `{/* All FAQ Items --- single continuous list */}` |

### 3b. AI-Sounding Phrases

**Result: PASS** — Zero instances of 'leverage', 'utilize', 'comprehensive', 'cutting-edge', 'seamless', 'elevate', or 'empower' found in any public-facing copy.

### 3c. Pricing

**Result: PASS** — All basic oil change references show $89.95. Other prices are correct for their respective services.

| File | Line | Price | Context |
|------|------|-------|---------|
| `src/app/page.tsx` | 52 | $89.95 | Basic oil change — correct |
| `src/app/page.tsx` | 88 | $149.95 | Fleet Program card — correct (different service) |
| `src/app/page.tsx` | 618 | $0 | Marketing copy ("$0 Surprise fees") |
| `src/app/faq/FAQContent.tsx` | 22 | $89.95 | FAQ answer — correct |
| `src/app/services/ServicesContent.tsx` | 10-102 | Various | Full catalog, oil starts at $89.95 — correct |
| `src/app/rv/RVContent.tsx` | 12-70 | Various | RV pricing, oil starts at $89.95 — correct |
| `src/app/marine/MarineContent.tsx` | 12-97 | Various | Marine pricing, starts at $129.95 — correct (marine-specific) |

### 3d. Business Hours

**Result: PASS** — All references are correct (Mon-Fri 8AM-5PM, Sat-Sun Closed).

| File | Line | Hours |
|------|------|-------|
| `src/app/contact/page.tsx` | 259-260 | Mon-Fri 8AM-5PM, Sat-Sun Closed — correct |
| `src/app/faq/FAQContent.tsx` | 49-50 | Mon-Fri 8AM-5PM, Sat-Sun Closed — correct |
| `src/app/layout.tsx` | 93-100 | JSON-LD: Mon-Fri 08:00-17:00 — correct |

### 3e. Phone Number

**Result: PASS** — All references are 813-722-LUBE (or tel:8137225823 / +1-813-722-5823).

### 3f. Hardcoded Service Data (pricingCatalog imports)

**Result: WARNING** — Only 1 public file imports from pricingCatalog. However, 3 pages have prices hardcoded directly in JSX.

| File | Source | Status |
|------|--------|--------|
| `src/app/book/BookingForm.tsx:14` | `import { getCatalogByDivision } from "@/data/pricingCatalog"` | WARNING — uses static import |
| `src/app/services/ServicesContent.tsx` | Prices hardcoded in JSX | WARNING — no dynamic source |
| `src/app/rv/RVContent.tsx` | Prices hardcoded in JSX | WARNING — no dynamic source |
| `src/app/marine/MarineContent.tsx` | Prices hardcoded in JSX | WARNING — no dynamic source |
| `src/app/page.tsx` | `bookingServices` array hardcoded at line 11 | WARNING — no dynamic source |

---

## 4. LINK CHECK

**Result: WARNING** — 1 dead link found.

| File | Line | href | Issue |
|------|------|------|-------|
| `src/app/page.tsx` | 693 | `href="#"` | FAIL — "Leave us a review on Google" points nowhere. Needs actual Google review URL. |

All other internal links verified against existing routes — no broken links. Anchor links (`#rv-quote`, `#fleet-quote`, `#marine-quote`) all have matching `id` attributes on their respective pages.

---

## 5. IMAGE CHECK

**Result: PASS** — No broken images, no placeholder URLs, no missing alt text issues.

| Check | Count | Status |
|-------|-------|--------|
| Missing alt text | 3 instances of `alt=""` | PASS — all are decorative images with `aria-hidden="true"` (correct a11y pattern) |
| Broken local paths | 0 | PASS — `/images/ase-badge.png` exists in `/public/images/` |
| Placeholder URLs | 0 | PASS |
| External images | All Cloudinary (same account `dgcdcqjrz`) | PASS |

**Note:** No Next.js `<Image>` components are used anywhere — all images use plain `<img>` tags. This means no automatic image optimization (lazy loading, WebP conversion, responsive sizes).

---

## 6. SEO CHECK

**Result: WARNING** — Multiple SEO gaps found.

### Per-Page SEO Matrix

| Page | Title | Description | OG Tags | Canonical | JSON-LD |
|------|-------|-------------|---------|-----------|---------|
| `/` (Home) | FAIL* | FAIL* | FAIL* | FAIL | FAIL |
| `/about` | PASS | PASS | FAIL | FAIL | FAIL |
| `/book` | PASS | PASS | FAIL | FAIL | FAIL |
| `/contact` | PASS | PASS | FAIL | FAIL | FAIL |
| `/faq` | PASS | PASS | FAIL | FAIL | PASS (FAQPage schema) |
| `/fleet` | PASS | PASS | FAIL | FAIL | FAIL |
| `/marine` | PASS | PASS | FAIL | FAIL | FAIL |
| `/rv` | PASS | PASS | FAIL | FAIL | FAIL |
| `/service-areas` | PASS | PASS | FAIL | FAIL | FAIL |
| `/services` | PASS | PASS | FAIL | FAIL | FAIL |

*Home page is `"use client"` and cannot export metadata — relies entirely on root layout defaults.

### Root Layout SEO (applies to all pages as fallback)
- Title template: `%s | Coastal Mobile Lube & Tire` — PASS
- Default description — PASS
- OG tags (og:title, og:description, og:image, og:url) — PASS
- Twitter card — PASS
- JSON-LD (Organization, LocalBusiness, 3x Service) — PASS
- Canonical URL — FAIL (not set)
- Sitemap (`src/app/sitemap.ts`) — PASS
- Robots (`src/app/robots.ts`) — PASS

### Key SEO Issues

1. **No page-specific OG tags** — Every page shares the root layout's generic OG URL/title/image. Social media shares of `/fleet` or `/marine` will show the home page preview.
2. **No canonical URLs anywhere** — Risk of duplicate content issues in search engines.
3. **No page-specific JSON-LD** — Only root layout (Organization/LocalBusiness) and FAQ page (FAQPage) have structured data. Services, fleet, marine, RV pages could benefit from Service schemas with pricing.
4. **Home page cannot export metadata** — It's a client component (`"use client"`).

---

## 7. MOBILE / RESPONSIVE CHECK

**Result: PASS** (with minor notes)

| File | Line | Issue | Severity |
|------|------|-------|----------|
| `src/app/page.tsx` | 670 | Review cards `w-[350px]` — 7px wider than 375px viewport with padding. Mitigated by marquee animation + `overflow-hidden`. | LOW |
| `src/app/services/ServicesContent.tsx` | 322 | Table `min-w-[480px]` — requires horizontal scroll on mobile. Mitigated by `overflow-x-auto` wrapper. | LOW |
| `src/app/page.tsx` | 186 | Watermark `min-w-[500px]` — absolute positioned + parent `overflow-hidden`. | NONE |
| `src/app/about/page.tsx` | 76 | Watermark `w-[350px]` — hidden on mobile via `hidden lg:block`. | NONE |

**Overall:** Site uses responsive Tailwind patterns correctly (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`, etc.). Mobile hamburger drawer, sticky bottom bar, and responsive grids are all properly implemented. No hardcoded inline `width:` styles that would break mobile.

---

## 8. FIRESTORE INTEGRATION

**Result: FAIL** — Split-brain data architecture. Only 1 page uses Firestore-backed `useServices` hook.

### Service Data Source Per Page

| Page | Data Source | Status |
|------|-------------|--------|
| `/` (Homepage) | Hardcoded `bookingServices` array at line 11 | FAIL — static |
| `/services` | Prices hardcoded in JSX | FAIL — static |
| `/marine` | Prices hardcoded in JSX | FAIL — static |
| `/rv` | Prices hardcoded in JSX | FAIL — static |
| `/fleet` | No pricing data (feature descriptions only) | N/A |
| `/book` (BookingForm) | `import { getCatalogByDivision } from "@/data/pricingCatalog"` | FAIL — static catalog |
| `/about` | No service data | N/A |
| `/faq` | Hardcoded Q&A text | N/A |
| `/contact` | No service data | N/A |
| `/service-areas` | No service data | N/A |
| `/admin/services` | `useServices()` hook — Firestore `onSnapshot` | PASS — live data |
| `/admin/pricing` | `pricingCatalog` import (Firestore as optional override) | WARNING — mixed |
| `/admin/invoicing` | `getAllItems()` from `pricingCatalog` | FAIL — static |

### Key Problem

The admin `/admin/services` page manages data in Firestore, but **no public page reads from Firestore**. Price changes made through the admin panel will NOT appear on the public website. The public pages either hardcode prices in JSX or read from the static `pricingCatalog.ts` file.

---

## 9. ADMIN ROUTES

**Result: PASS** — All admin pages exist and have valid imports.

| Route | File | Imports Valid | Status |
|-------|------|---------------|--------|
| `/admin` | `src/app/admin/page.tsx` | PASS | Dashboard page |
| `/admin/login` | `src/app/admin/login/page.tsx` | PASS | Google Sign-In |
| `/admin/schedule` | `src/app/admin/schedule/page.tsx` | PASS | Booking management |
| `/admin/customers` | `src/app/admin/customers/page.tsx` | PASS | Customer list |
| `/admin/invoicing` | `src/app/admin/invoicing/page.tsx` | PASS | Invoice management |
| `/admin/pricing` | `src/app/admin/pricing/page.tsx` | PASS | Pricing editor |
| `/admin/services` | `src/app/admin/services/page.tsx` | PASS | Service management |

### Admin Shared Components

| File | Status |
|------|--------|
| `src/app/admin/shared.ts` | PASS |
| `src/app/admin/Toast.tsx` | PASS |
| `src/app/admin/CommsLog.tsx` | PASS |
| `src/app/admin/NotificationButtons.tsx` | PASS — hardcodes Cloud Function URL at line 15 |
| `src/app/admin/AdminSignOutButton.tsx` | WARNING — appears unused (layout has inline sign-out) |

### Admin Navigation Issue

The admin sidebar (`layout.tsx` lines 11-17) links to: Dashboard, Schedule, Customers, Invoicing, Pricing. **Missing:** `/admin/services` is not in the nav — users cannot reach it without knowing the URL directly.

---

## 10. CLOUD FUNCTIONS

**File:** `functions/index.js` (323 lines, plain JS)

### Exported Functions

| Function | Type | Line | Status |
|----------|------|------|--------|
| `onNewBooking` | Firestore trigger (`onDocumentCreated`) | 9 | PASS |
| `sendConfirmationEmail` | HTTP endpoint (`onRequest`) | 205 | WARNING |

### sendInvoiceEmail

**Result: FAIL** — `sendInvoiceEmail` does NOT exist. The invoicing page only updates Firestore status to "sent" — it does not actually send emails.

### CORS

| Function | CORS | Status |
|----------|------|--------|
| `onNewBooking` | N/A (Firestore trigger) | PASS |
| `sendConfirmationEmail` | `cors: true` (allows all origins) | WARNING — should restrict to app domain |

### Error Handling

| Function | Pattern | Status |
|----------|---------|--------|
| `onNewBooking` | try/catch around `sendMail()`, logs error but silently succeeds | WARNING — email failures are swallowed |
| `sendConfirmationEmail` | try/catch, returns `{ success: false, error }` | WARNING — always returns HTTP 200 even on failure, no input validation |

### Security Concerns

| Issue | Severity | Details |
|-------|----------|---------|
| No auth on `sendConfirmationEmail` | HIGH | Anyone who knows the URL can trigger emails to any address |
| No rate limiting | MEDIUM | HTTP endpoint has no rate limiting |
| Hardcoded admin URL | LOW | Email body hardcodes `https://coastal-mobile-lube.netlify.app/admin` |

### Secrets

- `GMAIL_USER` and `GMAIL_APP_PASSWORD` via `defineSecret` — PASS (properly using Firebase secrets)
- Region: `us-east1` — PASS

---

## Summary

| # | Check | Result | Critical Issues |
|---|-------|--------|-----------------|
| 1 | Route Inventory | **PASS** | `/admin/services` not in sidebar nav |
| 2 | Build Check | **PASS** | Clean build, 0 warnings, 0 errors |
| 3 | Content Scan | **WARNING** | Prices hardcoded in JSX on 4 pages instead of dynamic source |
| 4 | Link Check | **WARNING** | 1 dead link (`href="#"` for Google review on homepage) |
| 5 | Image Check | **PASS** | No Next.js Image optimization used (all plain `<img>`) |
| 6 | SEO Check | **WARNING** | No per-page OG tags, no canonical URLs, minimal JSON-LD |
| 7 | Mobile/Responsive | **PASS** | Minor: pricing table requires horizontal scroll on mobile |
| 8 | Firestore Integration | **FAIL** | Split-brain: admin writes to Firestore, public pages use static data |
| 9 | Admin Routes | **PASS** | All pages exist and render correctly |
| 10 | Cloud Functions | **FAIL** | `sendInvoiceEmail` missing; `sendConfirmationEmail` has no auth |

### Top Priority Fixes

1. **Firestore split-brain** — Public pages don't read from Firestore. Admin price changes don't propagate to the website.
2. **sendInvoiceEmail missing** — Invoicing page marks emails as "sent" but doesn't actually send them.
3. **sendConfirmationEmail has no authentication** — Anyone can trigger emails via the HTTP endpoint.
4. **SEO gaps** — No per-page OG tags, no canonical URLs. Social shares show generic info.
5. **Dead Google review link** — `src/app/page.tsx:693` needs an actual URL.
