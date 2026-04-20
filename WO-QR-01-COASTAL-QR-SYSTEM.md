# WO-QR-01: Coastal QR Code Management System (V1)

## Goal

Build a branded QR code generator and tracker into the Coastal admin portal. Codes redirect through `go.coastalmobilelube.com`, scans log to Firestore, admin dashboard shows per-campaign performance. Replaces paid services like Bitly and Beaconstac with owned infrastructure.

## Critical Rules

- Do NOT rewrite any existing files end-to-end. Surgical edits only on existing code.
- New files (routes, components, utilities) are fine to create fresh.
- No em dashes in code, comments, or copy.
- No emojis anywhere.
- Match existing admin design system: navy `#0B2040`, orange `#E07B2D`, Plus Jakarta Sans.
- Use TypeScript everywhere.
- Match the component and layout patterns from `/admin/customers/`.

---

## Phase 0: Pre-flight reads (REQUIRED before any changes)

Read these files in full and report back what you found before making any changes:

1. `src/app/admin/layout.tsx` (or wherever the admin sidebar lives)
2. `src/app/admin/page.tsx` (dashboard)
3. `src/app/admin/customers/page.tsx` (list page pattern reference)
4. `src/app/admin/customers/[id]/page.tsx` (detail page pattern reference)
5. `src/lib/firebase.ts` or wherever Firebase client initializes
6. `firestore.rules`
7. `firestore.indexes.json` if present
8. `netlify.toml`
9. `middleware.ts` if present (check if it blocks any routes)
10. `package.json`
11. `tailwind.config.ts`
12. Any existing Cloudinary logo URLs already used on the site (we need the Coastal logo URL)

Report findings, then proceed.

---

## Phase 1: Dependencies

```bash
npm install qr-code-styling
```

---

## Phase 2: Firestore schema

### Collection: `qrCodes`

Fields:
- `slug`: string (unique, URL-safe, 2-32 chars, lowercase)
- `name`: string (display name)
- `destination`: string (full URL to redirect to)
- `campaign`: string (optional tag)
- `active`: boolean
- `logoUrl`: string | null (null = use account default Coastal logo)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp
- `createdBy`: string (user uid)
- `scanCount`: number (denormalized counter)
- `lastScannedAt`: Timestamp | null

### Collection: `qrScans`

Fields:
- `slug`: string
- `qrCodeId`: string (reference)
- `scannedAt`: Timestamp (server timestamp)
- `userAgent`: string
- `referrer`: string | null
- `country`: string | null
- `region`: string | null
- `city`: string | null
- `ipHash`: string | null (last octet masked for privacy)

### Firestore rules (SURGICAL append)

Append these blocks to `firestore.rules`:

```
match /qrCodes/{id} {
  allow read, write: if request.auth != null && isAdmin(request.auth.uid);
}
match /qrScans/{id} {
  allow create: if true;
  allow read: if request.auth != null && isAdmin(request.auth.uid);
  allow update, delete: if false;
}
```

If `isAdmin` helper does not exist, match the pattern used in existing rules.

### Firestore indexes (`firestore.indexes.json`)

Add compound index on `qrScans`:
- `slug` ASC, `scannedAt` DESC

---

## Phase 3: Shared utilities

### `src/lib/qr/slugs.ts`

- `generateSlug(name: string): string` (slugify, lowercase, strip specials, trim to 32 chars)
- `isValidSlug(slug: string): boolean` (regex `^[a-z0-9-]{2,32}$`)
- `isSlugAvailable(slug: string): Promise<boolean>` (Firestore check against `qrCodes`)

### `src/lib/qr/generate.ts`

Function that generates a QR code as both PNG blob and SVG string.

Config:
- Error correction level: `H`
- Dot color: `#0B2040`
- Background: `#FFFFFF`
- Dot style: `rounded`
- Corner square type: `extra-rounded`
- Corner square color: `#E07B2D`
- Logo embedded at center, 22% of QR area, 4px white margin around logo

Signature:
```ts
async function generateQR(opts: {
  url: string;
  logoUrl?: string;
  size?: number; // default 1200
}): Promise<{ png: Blob; svg: string }>
```

Uses `qr-code-styling` library.

### `src/lib/qr/coastal-logo.ts`

Export the default Coastal logo URL as a constant:
```ts
export const COASTAL_LOGO_URL = '[Cloudinary URL for Coastal logo - use existing if found during pre-flight, otherwise placeholder and flag to Jon]';
```

---

## Phase 4: Public redirect handler

### `src/app/q/[slug]/route.ts`

GET handler that:

1. Extracts `slug` from params.
2. Queries `qrCodes` collection for matching slug.
3. If not found or `active === false`: 302 redirect to `https://coastalmobilelube.com`.
4. If found: fire-and-forget scan log (do NOT await), then 302 redirect to `destination`.
5. Scan log writes to `qrScans`:
   - Extract user-agent from `request.headers.get('user-agent')`
   - Extract referrer from `request.headers.get('referer')`
   - Extract geo from Netlify headers: `x-nf-geo` is base64-encoded JSON with country/region/city
   - Extract IP from `x-forwarded-for`, take first entry, hash last octet (e.g. `192.168.1.xxx` -> `192.168.1.xxx-hashed`)
6. In a separate fire-and-forget transaction: increment `scanCount` and update `lastScannedAt` on the `qrCodes` doc.

Critical: do NOT await the scan logging. Redirect latency must stay under 100ms. Use `queueMicrotask` or just call without await.

### Middleware check

If `middleware.ts` exists and enforces auth on all routes, add an explicit exclusion for `/q/*` paths. Show me the before/after snippet. Do NOT rewrite the file.

---

## Phase 5: Admin QR list page

### `src/app/admin/qr/page.tsx`

Layout matching `/admin/customers/page.tsx`:

- Header row: "QR Codes" (h1, navy, Plus Jakarta Sans 700), "+ New QR Code" button (orange, white text, right-aligned)
- Search input (filter by name or campaign, client-side for V1)
- Table with columns:
  - Name
  - Slug (monospace font, smaller)
  - Campaign (badge style)
  - Destination (truncated with tooltip on hover)
  - Scans (right-aligned, bold)
  - Last Scanned (relative time: "2h ago")
  - Status (Active/Paused badge)
  - Actions (three-dot menu: View, Edit, Pause/Resume, Copy URL, Download PNG, Delete)
- Empty state when no codes: centered card with "No QR codes yet. Create your first one to start tracking scans." and a primary CTA button.
- Real-time Firestore listener so scan counts update live.

---

## Phase 6: New QR code page

### `src/app/admin/qr/new/page.tsx`

Two-column layout: form on left, live preview on right.

Form fields:
- **Name** (required): "Van Wrap - Jason's Truck"
- **Slug** (required): auto-suggested from name, user-editable. Live validation showing "Available" (green) or "Already taken" (red). Shows final URL: `go.coastalmobilelube.com/q/[slug]`
- **Destination URL** (required): validated as full URL (must include `https://`)
- **Campaign** (optional): text input with autocomplete from existing campaigns
- **Custom logo** (optional): file upload. Empty = uses Coastal default.

Buttons:
- "Cancel" (ghost style, returns to list)
- "Create & Download PNG" (orange primary)

On submit:
1. Create Firestore doc in `qrCodes`.
2. Generate PNG at 1200x1200.
3. Trigger browser download of PNG with filename `coastal-qr-{slug}.png`.
4. Redirect to `/admin/qr/{id}` detail page.

Preview pane (right side):
- Live QR code rendered as user types (updates on slug + destination change)
- Shows final short URL below the code
- Small disclaimer: "Preview only. Final PNG downloads at print resolution."

---

## Phase 7: QR detail page

### `src/app/admin/qr/[id]/page.tsx`

Top section (two columns):
- Left: Large QR preview (400x400 display)
- Right: Name (editable inline on click), slug (read-only, monospace), destination URL (editable inline), active toggle switch, campaign tag, "Copy URL" button (copies `https://go.coastalmobilelube.com/q/{slug}`)

Stats row (4 cards):
- Total Scans
- Scans This Week
- Scans Today
- Last Scanned (relative time)

Charts section:
- ECharts line chart: scans per day, last 30 days, navy line color, subtle grid
- ECharts pie chart: device breakdown from parsed userAgent (iOS / Android / Desktop / Other). Navy + orange + grays.

Recent scans table:
- Last 50 scans
- Columns: Time (relative), Device, Location (city/country if available), Referrer (truncated)

Actions bar:
- Download PNG (1200x1200)
- Download SVG
- Pause / Resume toggle
- Delete (opens confirm modal)

---

## Phase 8: Sidebar nav (SURGICAL EDIT)

In the admin sidebar file (identified in pre-flight):

Add a new nav entry between existing entries. Suggested position: after "Invoicing".

Config:
- Label: `QR Codes`
- Icon: `QrCode` from `lucide-react`
- Href: `/admin/qr`
- Active state matching existing pattern

Do NOT rewrite the sidebar file. Show me the exact before/after diff of just the added lines.

---

## Phase 9: Dashboard widget (SURGICAL EDIT)

In `src/app/admin/page.tsx`:

Add a small stat card to the existing dashboard stat grid:
- Label: "QR Scans (7d)"
- Value: count from `qrScans` where `scannedAt` > 7 days ago
- Clickable, links to `/admin/qr`
- Matches visual style of existing dashboard cards

Do NOT rewrite the dashboard file. Show me the exact insertion point and the added block.

---

## Phase 10: Build, commit, push, deploy

```bash
npm run build
```

Fix any TypeScript or build errors before proceeding.

```bash
git add src/ firestore.rules firestore.indexes.json package.json package-lock.json
git commit -m "Add QR code management system (V1)"
git push origin main
npx netlify-cli deploy --prod
```

Do NOT use `git add -A`.
Do NOT pass `--dir` flag to Netlify deploy.

---

## Phase 11: Post-deploy verification

1. Visit `/admin/qr` on the live site. Should load with empty state.
2. Create a test code: slug `test`, destination `https://coastalmobilelube.com`.
3. Visit `https://coastalmobilelube.com/q/test` (main domain until subdomain is set up). Should redirect.
4. Check Firestore `qrScans` collection. Should have one doc.
5. Refresh `/admin/qr/{id}`. Scan count should show 1.
6. Toggle active off. Visit `/q/test` again. Should redirect to homepage instead.

Report results back.

---

## Phase 12: Subdomain config (Jon handles, not CC)

After deploy is verified, these steps are manual:

1. Netlify: Site settings > Domain management > Add custom domain > `go.coastalmobilelube.com`
2. Porkbun DNS: Add CNAME record
   - Host: `go`
   - Answer: (Netlify site domain shown in UI, e.g. `coastal-mobile-lube.netlify.app`)
   - TTL: 600
3. Wait 5-10 minutes for SSL auto-provisioning.
4. Test: `https://go.coastalmobilelube.com/q/test` should hit the redirect.

---

## V2 deferred (do NOT build now)

- A/B testing / multiple destinations per code
- Password-protected codes
- Scheduled expiration
- Bulk CSV generation
- Custom landing pages inside app
- Print-ready PDF export with bleed marks
- GA4 server-side event via Measurement Protocol

---

## Known risks and gotchas

- `qrScans` collection will grow fast. No TTL for V1. Plan aggregation strategy for V2 if volume exceeds 100k docs.
- Middleware must NOT block `/q/*` paths. Test immediately after deploy.
- Scan logging must be fire-and-forget. Never await. Redirect latency is the whole product.
- If `isAdmin` helper is not defined in Firestore rules, match the pattern used by existing protected collections.
- If Coastal logo URL is not found during pre-flight, use a placeholder and flag it. Jon will upload to Cloudinary.
- `qr-code-styling` uses DOM APIs. If SSR complains, wrap generation logic in `'use client'` components only.
