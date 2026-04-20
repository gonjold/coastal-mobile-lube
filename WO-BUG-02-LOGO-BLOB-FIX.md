# WO-BUG-02: Logo White-Knockout Blob Fix

## Goal

Fix the blobs showing up across the site where logos should be rendering. The Cloudinary `e_colorize` white-knockout transformation is collapsing the logo into a featureless white oval. Fix by swapping all `variant="white"` uses to `variant="primary"` — the primary logo has enough contrast to sit on navy backgrounds without the transformation.

## Critical Rules

- Surgical edits only. Do NOT rewrite files.
- No em dashes, no emojis, TypeScript.
- Do NOT touch `src/lib/brand/logos.ts` — the `white` variant stays defined for potential future use, we just stop referencing it.

## Phase 0: Pre-flight (keep brief)

Grep to confirm the 4 known locations plus any I missed:

```bash
grep -rn "variant=\"white\"" src/ --include="*.tsx" --include="*.ts"
grep -rn "BRAND_LOGOS.white" src/ --include="*.tsx" --include="*.ts"
```

Known targets from the last session's WO-LOGO-01 audit:
- `src/components/Footer.tsx` (footer on navy)
- `src/app/page.tsx:760` (CTA section watermark)
- `src/app/about/page.tsx:82` (about hero watermark)
- `src/app/page.tsx:236` (hero CSS backgroundImage using BRAND_LOGOS.white inline)

Report what grep finds. If it matches the 4 known locations, proceed. If more or fewer, flag before editing.

## Phase 1: Fix

For each `variant="white"` instance: change to `variant="primary"`.

For the CSS backgroundImage in `src/app/page.tsx:236` (which uses the raw URL, not the component): change `BRAND_LOGOS.white` → `BRAND_LOGOS.primary`.

Show me the before/after diff for each file.

## Phase 2: Build, commit, push, deploy

```bash
npm run build
git add src/
git commit -m "Fix logo blob bug by using primary variant on navy backgrounds"
git push origin main
npx netlify-cli deploy --prod
```

Do NOT use `git add -A`. Do NOT pass `--dir` flag.

## Phase 3: Verification

Jon will visual-check:
1. Homepage hero watermark (no more blob, should be faint Coastal logo texture)
2. Homepage CTA section watermark
3. About page hero watermark
4. Footer on homepage (logo reads with white text + gold accents on navy bg)

Report when deploy is live and Jon will verify on live site.
