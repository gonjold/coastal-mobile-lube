# WO-QR-02: QR Code Style Customization

## Goal

Extend the QR code system with style presets and an advanced customization panel. Each QR code saves its own style config so regenerating or viewing later produces the same output. Default stays as the current "Coastal Brand" look so existing codes don't change.

## Critical Rules

- Do NOT rewrite any existing files end-to-end. Surgical edits only.
- No em dashes in code, comments, or copy.
- No emojis anywhere.
- TypeScript everywhere.
- Style config saved to Firestore per-code. Preview updates live.
- Existing codes without style config fall back to the default preset — do NOT break backward compatibility.

---

## Phase 0: Pre-flight reads (REQUIRED before any changes)

Read these in full and report back:

1. `src/lib/qr/generate.ts` (current generator logic, confirm current hardcoded values)
2. `src/app/admin/qr/new/page.tsx` (form + live preview — where presets/advanced panel will inject)
3. `src/app/admin/qr/[id]/page.tsx` (detail page — regeneration needs to use saved style)
4. `src/app/admin/qr/page.tsx` (list page — no changes expected, just confirm nothing breaks)
5. `src/app/q/[slug]/route.ts` (redirect handler — should be untouched)
6. Whatever file defines the Firestore document shape for `qrCodes` (TypeScript interface/type)

Report findings, especially:
- Current hardcoded style values in `generate.ts` (dot color, corner color, dot style, corner type, logo size %)
- Type/interface for `QRCode` Firestore doc
- Whether there's already a shared type file for QR types (e.g. `src/lib/qr/types.ts`)

Then proceed.

---

## Phase 1: Style config types and presets

Create or extend `src/lib/qr/types.ts`:

```ts
export type DotStyle = 'rounded' | 'dots' | 'square' | 'classy-rounded' | 'extra-rounded';

export interface QRStyleConfig {
  preset: 'coastal-brand' | 'classic' | 'minimal' | 'inverted' | 'custom';
  dotColor: string;        // hex, e.g. '#0B2040'
  cornerColor: string;     // hex, e.g. '#E07B2D'
  backgroundColor: string; // hex, default '#FFFFFF'
  dotStyle: DotStyle;
  showLogo: boolean;
}

export const DEFAULT_QR_STYLE: QRStyleConfig = {
  preset: 'coastal-brand',
  dotColor: '#0B2040',
  cornerColor: '#E07B2D',
  backgroundColor: '#FFFFFF',
  dotStyle: 'rounded',
  showLogo: true,
};

export const QR_PRESETS: Record<Exclude<QRStyleConfig['preset'], 'custom'>, QRStyleConfig> = {
  'coastal-brand': {
    preset: 'coastal-brand',
    dotColor: '#0B2040',
    cornerColor: '#E07B2D',
    backgroundColor: '#FFFFFF',
    dotStyle: 'rounded',
    showLogo: true,
  },
  classic: {
    preset: 'classic',
    dotColor: '#0B2040',
    cornerColor: '#0B2040',
    backgroundColor: '#FFFFFF',
    dotStyle: 'rounded',
    showLogo: true,
  },
  minimal: {
    preset: 'minimal',
    dotColor: '#0B2040',
    cornerColor: '#0B2040',
    backgroundColor: '#FFFFFF',
    dotStyle: 'square',
    showLogo: false,
  },
  inverted: {
    preset: 'inverted',
    dotColor: '#FFFFFF',
    cornerColor: '#E07B2D',
    backgroundColor: '#0B2040',
    dotStyle: 'rounded',
    showLogo: true,
  },
};

export const PRESET_LABELS: Record<Exclude<QRStyleConfig['preset'], 'custom'>, string> = {
  'coastal-brand': 'Coastal Brand',
  classic: 'Classic',
  minimal: 'Minimal',
  inverted: 'Inverted',
};

export const PRESET_DESCRIPTIONS: Record<Exclude<QRStyleConfig['preset'], 'custom'>, string> = {
  'coastal-brand': 'Navy dots with orange corners and Coastal logo',
  classic: 'All navy with logo — clean and professional',
  minimal: 'All navy, no logo — best for small print and high scan distance',
  inverted: 'White on navy — for dark backgrounds and signage',
};
```

Add `styleConfig: QRStyleConfig` as an optional field on the existing `QRCode` Firestore type. Optional so existing docs don't fail type-check.

---

## Phase 2: Update generate.ts to accept style config

Surgically edit `src/lib/qr/generate.ts`.

Change the function signature:

```ts
async function generateQR(opts: {
  url: string;
  logoUrl?: string;
  size?: number;
  style?: QRStyleConfig;
}): Promise<{ png: Blob; svg: string }>
```

If `style` is not provided, fall back to `DEFAULT_QR_STYLE`.

Map style config to `qr-code-styling` options:
- `dotColor` → `dotsOptions.color`
- `cornerColor` → `cornersSquareOptions.color` AND `cornersDotOptions.color` (both corner parts)
- `backgroundColor` → `backgroundOptions.color`
- `dotStyle` → `dotsOptions.type`
- `showLogo === false` → set `image: undefined` and remove `imageOptions`

Error correction stays at `H`. Logo margin stays at 4px. Logo size stays at 22% of QR area.

Show me the before/after diff. Do NOT rewrite the file.

---

## Phase 3: Preset selector UI in new QR page

Surgically edit `src/app/admin/qr/new/page.tsx`.

Add state for `styleConfig`, initialized to `DEFAULT_QR_STYLE`.

Add a **Preset selector** row above the existing form fields. Layout: 4 preset cards in a 2x2 grid on mobile, 4-across on desktop. Each card shows:
- Mini QR preview thumbnail (120x120) rendered with that preset's config pointing at `https://example.com`
- Preset label (bold)
- Description (small gray text)
- Selected state: navy border, subtle background tint
- Unselected: light gray border, white background

Clicking a preset updates `styleConfig` to that preset's values.

Add an **"Advanced" toggle** below the preset selector. When expanded, shows:
- Dot color picker (HTML color input with hex display)
- Corner color picker
- Background color picker
- Dot style dropdown (Rounded / Dots / Square / Classy Rounded / Extra Rounded)
- Show logo toggle switch

Changing any advanced value sets `preset: 'custom'` and updates the style config.

The live preview on the right must re-render whenever style config changes.

Show me the insertion points and the added component blocks. Do NOT rewrite the file.

---

## Phase 4: Save style config on create

In the same `new/page.tsx`, update the Firestore write on submit to include `styleConfig` in the new `qrCodes` doc.

The download PNG generation must also pass the current `styleConfig` to `generateQR()`.

---

## Phase 5: Detail page — show current style, allow editing

Surgically edit `src/app/admin/qr/[id]/page.tsx`.

Read `styleConfig` from the Firestore doc. If missing, use `DEFAULT_QR_STYLE`.

Pass `styleConfig` to the preview `generateQR()` call so the detail page preview matches what was saved.

Pass `styleConfig` to the Download PNG and Download SVG actions.

Add a collapsible **"Style" section** to the detail page (below the stats, above the charts). When expanded:
- Same preset selector + advanced panel as the new page
- Shows current saved values
- "Save Style" button (navy primary) — writes updated `styleConfig` to Firestore and triggers a preview regeneration
- "Reset to Coastal Brand" ghost button

Do NOT auto-save on style change — require explicit save to avoid accidental overwrites.

Show me insertion points and added blocks. Do NOT rewrite the file.

---

## Phase 6: Shared PresetSelector + AdvancedStylePanel components

To avoid duplicating the preset UI in two files, extract:

### `src/components/qr/PresetSelector.tsx`
Props: `value: QRStyleConfig`, `onChange: (config: QRStyleConfig) => void`

Renders the 4 preset cards with mini-QR thumbnails.

### `src/components/qr/AdvancedStylePanel.tsx`
Props: `value: QRStyleConfig`, `onChange: (config: QRStyleConfig) => void`

Renders the advanced color/style controls inside a collapsible disclosure.

Both pages (`new` and `[id]`) import and use these components.

The mini-QR thumbnail generation inside `PresetSelector` can use the same `generateQR()` helper, but cache results per preset in a `useMemo` keyed on preset name so we don't regenerate on every render.

---

## Phase 7: List page — subtle style indicator (optional but nice)

Surgically edit `src/app/admin/qr/page.tsx`.

In the QR codes table, add a small colored dot indicator next to each row's name showing its preset (navy circle for coastal-brand/classic/minimal, navy-with-orange-ring for inverted, gray for custom). Tooltip on hover shows preset label.

Skip if it complicates the existing table. Flag and move on if tricky.

---

## Phase 8: Build, commit, push, deploy

```bash
npm run build
```

Fix any TypeScript errors before proceeding.

```bash
git add src/
git commit -m "Add QR code style presets and advanced customization"
git push origin main
npx netlify-cli deploy --prod
```

Do NOT use `git add -A`.
Do NOT pass `--dir` flag.

---

## Phase 9: Post-deploy verification

1. Visit `/admin/qr/new`. Should see 4 preset cards at top with mini-QR thumbnails.
2. Click each preset. Live preview should update to match.
3. Expand Advanced panel. Change dot color to red. Preset should switch to "Custom". Preview updates.
4. Create a QR with "Minimal" preset. Download PNG — confirm no logo, all navy, square dots.
5. Revisit the detail page for the new QR. Style section should show Minimal as selected.
6. Open an existing QR code created before this update (if any). Should render with Coastal Brand defaults (backward compat check).
7. On the existing code, change style to Inverted, click Save Style. Refresh. Preview should persist as inverted.
8. Re-download PNG from detail page. Confirm matches saved style.

Report results.

---

## Deferred to V3

- Custom background image / gradient
- Frame/border around the QR
- Per-code logo upload (already partially built — revisit if needed)
- Preset save-as-custom (user-defined presets beyond the 4 built-ins)

---

## Known risks

- Changing preset on an existing QR does NOT change the code's scannability — the underlying data is the destination URL, which is unchanged. But if a user reprints a code with new styling, they should verify it still scans reliably before mass-producing. Note this somewhere in the UI copy on the detail page: "Style changes don't affect scanability but always test a fresh print before distributing."
- Inverted preset (white dots on navy) is less universally scannable on older phones. Keep it as an option but don't make it default.
- If `qr-code-styling` rejects certain dot style + logo combinations, fall back gracefully and flag in console.
