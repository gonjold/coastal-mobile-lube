# WO-LOGO-01: Unified Brand Logo System

## Goal

Establish the Fiverr-drawn Coastal logo as the single canonical brand asset across the entire site. Replace all existing scattered logo references with a centralized `<BrandLogo />` component backed by constants. Set up Cloudinary-derived variants (white/knockout for dark backgrounds, optimized favicon, OG social image) using Cloudinary's on-the-fly transformation URLs — no new uploads required, all derivatives generated from the existing SVG.

## Critical Rules

- Do NOT rewrite any existing files end-to-end. Surgical edits only.
- New files (component, constants) are fine to create fresh.
- No em dashes in code, comments, or copy.
- No emojis anywhere.
- TypeScript everywhere.
- Match existing Coastal design system: navy `#0B2040`, orange `#E07B2D`, Plus Jakarta Sans.

---

## Phase 0: Pre-flight reads (REQUIRED before any changes)

Read these in full and report back before making any changes:

1. `src/app/layout.tsx` (root layout, favicon references)
2. `public/` directory — list all existing favicon, apple-touch-icon, manifest.json, and any logo files
3. Grep for existing logo usage across the codebase:
   ```bash
   grep -r "Coastal_logo_bh3biu" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js"
   grep -r "cloudinary.*Coastal" src/ --include="*.tsx" --include="*.ts"
   grep -r "logo" src/ --include="*.tsx" --include="*.ts" -l
   ```
4. `src/lib/qr/coastal-logo.ts` (confirm current QR logo reference)
5. Any existing `BrandLogo`, `Logo`, or `SiteLogo` component
6. `src/components/Header.tsx` or wherever the public site header lives
7. `src/app/admin/components/AdminSidebar.tsx` or wherever admin sidebar lives (check how it renders the Coastal logo in the top-left)
8. Any existing `next/image` imports using Cloudinary URLs for the logo

Report findings as a table: file path, current logo reference (full URL or import), and what variant context it's used in (header / sidebar / footer / email / OG / favicon / etc).

Then proceed.

---

## Phase 1: Constants file

Create `src/lib/brand/logos.ts`:

```ts
/**
 * Canonical Coastal brand logo assets.
 * All variants derived from the primary SVG via Cloudinary transformations.
 * Never hardcode logo URLs elsewhere — always import from this file.
 */

const CLOUDINARY_BASE = 'https://res.cloudinary.com/dgcdcqjrz/image/upload';
const LOGO_PUBLIC_ID = 'v1775916096/Coastal_logo_bh3biu';

export const BRAND_LOGOS = {
  // Full color logo on transparent background. Default for light UI.
  primary: `${CLOUDINARY_BASE}/${LOGO_PUBLIC_ID}.svg`,

  // Same logo rendered as PNG at 2x resolution for email, social, print fallbacks.
  primaryPng: `${CLOUDINARY_BASE}/f_png,w_1200,q_auto/${LOGO_PUBLIC_ID}.png`,

  // White knockout version — for navy sidebar, dark hero sections, footer.
  // Uses Cloudinary colorize transformation to force all non-transparent pixels white.
  white: `${CLOUDINARY_BASE}/e_grayscale,e_colorize:100,co_white/${LOGO_PUBLIC_ID}.png`,

  // Favicon-optimized 512x512 PNG with transparent background, centered.
  favicon512: `${CLOUDINARY_BASE}/w_512,h_512,c_pad,b_transparent,f_png/${LOGO_PUBLIC_ID}.png`,

  // Apple touch icon 180x180 on navy background (iOS doesn't respect transparency).
  appleTouchIcon: `${CLOUDINARY_BASE}/w_180,h_180,c_pad,b_rgb:0B2040,f_png/${LOGO_PUBLIC_ID}.png`,

  // Open Graph social share image — 1200x630 on navy with logo centered.
  ogImage: `${CLOUDINARY_BASE}/w_1200,h_630,c_pad,b_rgb:0B2040,f_jpg,q_auto/${LOGO_PUBLIC_ID}.jpg`,
} as const;

export const BRAND_NAME = 'Coastal Mobile Lube & Tire';
export const BRAND_TAGLINE = 'Automotive • Marine • Fleet';
```

---

## Phase 2: BrandLogo React component

Create `src/components/brand/BrandLogo.tsx`:

```tsx
import Image from 'next/image';
import { BRAND_LOGOS, BRAND_NAME } from '@/lib/brand/logos';

type LogoVariant = 'primary' | 'white' | 'png';

interface BrandLogoProps {
  variant?: LogoVariant;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
}

const VARIANT_MAP: Record<LogoVariant, string> = {
  primary: BRAND_LOGOS.primary,
  white: BRAND_LOGOS.white,
  png: BRAND_LOGOS.primaryPng,
};

export function BrandLogo({
  variant = 'primary',
  width = 200,
  height = 80,
  className,
  priority = false,
  alt = BRAND_NAME,
}: BrandLogoProps) {
  return (
    <Image
      src={VARIANT_MAP[variant]}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      unoptimized
    />
  );
}
```

Notes:
- `unoptimized` is set because Cloudinary already serves optimized assets. Next/image would re-process unnecessarily.
- The oval logo has roughly a 2.5:1 aspect ratio. Default 200x80 reflects that.

---

## Phase 3: Audit and swap existing usages

Using the grep output from Phase 0, surgically edit every file that references the logo directly. Replace raw `<img src="https://res.cloudinary.com/...">` or `<Image src="https://res.cloudinary.com/...">` patterns with `<BrandLogo variant="primary" />` (or `variant="white"` where context is dark).

Guidelines for picking variant:
- Public site header on white/light background: `variant="primary"`
- Admin sidebar (navy background): `variant="white"`
- Footer on navy/dark: `variant="white"`
- Email signatures / print: `variant="png"` (SVG doesn't render in all email clients)
- Hero sections on navy: `variant="white"`

For each file changed, show me the before/after diff of just the changed lines. Do NOT rewrite the files.

---

## Phase 4: Favicon and manifest update

### `public/` directory

Check what exists in `public/`. If `favicon.ico` and/or `apple-touch-icon.png` are present, leave them (they'll be overridden by metadata below). Do NOT attempt to generate or replace physical files in `/public`.

### `src/app/layout.tsx`

Surgically update the `metadata` export to reference the Cloudinary-derived variants:

```ts
export const metadata: Metadata = {
  // ... existing fields stay intact ...
  icons: {
    icon: [
      { url: BRAND_LOGOS.favicon512, sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: BRAND_LOGOS.appleTouchIcon, sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    // ... existing openGraph fields stay intact ...
    images: [
      { url: BRAND_LOGOS.ogImage, width: 1200, height: 630, alt: 'Coastal Mobile Lube & Tire' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [BRAND_LOGOS.ogImage],
  },
};
```

Import `BRAND_LOGOS` at the top of the file. Show me the before/after diff. Do NOT rewrite the file.

If existing `metadata` already has `icons` / `openGraph` / `twitter` defined with other values, REPLACE the image URLs only — keep titles, descriptions, and other fields intact.

---

## Phase 5: QR system logo confirmation

Verify `src/lib/qr/coastal-logo.ts` exports the same URL as `BRAND_LOGOS.primary`. If it's hardcoded, refactor it to import from the new constants file:

```ts
// src/lib/qr/coastal-logo.ts
import { BRAND_LOGOS } from '@/lib/brand/logos';

export const COASTAL_LOGO_URL = BRAND_LOGOS.primary;
```

This ensures any future logo change propagates to QR codes automatically.

---

## Phase 6: Build, commit, push, deploy

```bash
npm run build
```

Fix any TypeScript errors before proceeding.

```bash
git add src/
git commit -m "Centralize brand logo system with BrandLogo component and Cloudinary variants"
git push origin main
npx netlify-cli deploy --prod
```

Do NOT use `git add -A`.
Do NOT pass `--dir` flag.

---

## Phase 7: Post-deploy verification

Visit these URLs and confirm each loads a valid image:

1. `https://res.cloudinary.com/dgcdcqjrz/image/upload/v1775916096/Coastal_logo_bh3biu.svg` — original SVG loads
2. `https://res.cloudinary.com/dgcdcqjrz/image/upload/e_grayscale,e_colorize:100,co_white/v1775916096/Coastal_logo_bh3biu.png` — white knockout variant loads
3. `https://res.cloudinary.com/dgcdcqjrz/image/upload/w_512,h_512,c_pad,b_transparent,f_png/v1775916096/Coastal_logo_bh3biu.png` — favicon 512 loads
4. `https://res.cloudinary.com/dgcdcqjrz/image/upload/w_180,h_180,c_pad,b_rgb:0B2040,f_png/v1775916096/Coastal_logo_bh3biu.png` — apple touch icon loads
5. `https://res.cloudinary.com/dgcdcqjrz/image/upload/w_1200,h_630,c_pad,b_rgb:0B2040,f_jpg,q_auto/v1775916096/Coastal_logo_bh3biu.jpg` — OG image loads

Then hit the live site and verify:

6. `https://coastalmobilelube.com` — header logo renders correctly
7. Admin sidebar (after login) — logo renders in white on navy
8. Right-click the page → view page source → confirm OG meta tags point to Cloudinary OG URL
9. Browser tab favicon updates (may need hard refresh to bust cache)

Then regenerate a test QR code at `/admin/qr/new` and confirm the embedded logo matches the canonical.

Report any variant that doesn't render or renders incorrectly.

---

## Deferred to V2 (do NOT build now)

- Icon-only mark (stylized "C" or simplified silhouette) — needs a real designer, AI-generated versions compromise brand consistency
- Horizontal wordmark-only lockup — defer until there's a specific use case demanding it
- Monochrome print variant for invoices — defer until invoice PDFs are prioritized

---

## Known risks

- Cloudinary transformations can be cached aggressively. If a variant URL renders blank on first load, wait 30 seconds and refresh — the first request triggers generation.
- If the `e_colorize` transformation doesn't produce a pure white knockout (the logo has gradients which can muddy the result), we may need to commission a true white variant from a designer. Verify Phase 7 step 2 carefully — flag if it looks wrong.
- Favicon browser caching is notoriously sticky. Users on devices that previously loaded the site may see the old icon for days. This is a browser issue, not a deploy issue.
