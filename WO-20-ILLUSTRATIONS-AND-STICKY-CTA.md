# WO-20: Remove Cartoon Illustrations + Add Always-Visible Quote CTA

**Project:** Coastal Mobile Lube & Tire
**Scope:** `/how-it-works`, `/services`, and homepage floating CTA.
**Estimated time:** 30-45 min (probably faster on 4.7)
**Prerequisite:** WO-22d deployed.

---

## CONTEXT

Two visual fixes in one pass:

1. **Cartoon vehicle illustrations on `/how-it-works` and `/services` look amateurish.** Replace with clean photo placeholder boxes (to be filled by AI-generated environmental photos in WO-21). Placeholders should visually communicate "photo goes here" cleanly — not empty boxes, but styled skeleton blocks with proper sizing and positioning.

2. **Homepage floating "Need a price?" quote CTA is scroll-triggered** — only appears after the user scrolls past the hero. It should be always-visible on homepage, from first paint, so users never have to hunt for it.

---

## SCOPE

### IN
- `/how-it-works` page and its components
- `/services` page (Automotive services page) and its components
- Homepage floating quote CTA component
- Any SVG cartoon files imported specifically for these pages (leave the files, just stop using them)

### OUT
- Homepage itself (no cartoons there, leave it alone)
- `/services-overview`, `/fleet`, `/marine`, `/rv`, `/about`, `/contact`, `/book` — none of these get touched
- Admin portal
- No new copy changes
- No new dependencies

---

## STEPS

### Step 0: Pre-flight inventory

1. Read the `/how-it-works` page file in full.
2. Read the `/services` page file in full.
3. Read the homepage floating quote CTA component (likely `QuoteFAB`, `FloatingQuoteBar`, or similar based on checkpoint notes).
4. Identify every cartoon/illustration SVG used on `/how-it-works` and `/services` — note the filename and where it's rendered.
5. Identify how the floating quote CTA is currently triggered (scroll listener? Intersection Observer?).
6. Print a short summary before editing.

---

### Step 1: Replace cartoons with photo placeholder boxes

For every cartoon illustration on `/how-it-works` and `/services`:

- Remove the SVG import and rendering
- Replace with a styled placeholder `<div>` that's the exact size the final photo will occupy

**Placeholder styling:**

```tsx
<div 
  data-photo-placeholder="how-it-works-step-1"
  className="relative w-full aspect-[4/3] bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden"
>
  <div className="flex flex-col items-center gap-2 text-slate-400">
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
    </svg>
    <span className="text-xs uppercase tracking-wider">Photo</span>
  </div>
</div>
```

**Key requirements:**

- `data-photo-placeholder` attribute with a unique identifier per placeholder — WO-21's AI image generator will target these
- Aspect ratio matches what the photo should be (4:3 for most, 16:9 for hero-style shots, square for equipment close-ups — use your judgment based on context)
- Rounded corners match the surrounding design system (`rounded-2xl` for large blocks, `rounded-xl` for smaller)
- Subtle dashed border + icon + "Photo" label so it's visually clear these are placeholders, not broken images
- Responsive: full width on mobile, proper sizing on tablet/desktop per the existing layout

**Unique identifiers to use (adjust based on actual placements you find):**

`/how-it-works`:
- `how-it-works-step-1` (you call or book)
- `how-it-works-step-2` (technician arrives)
- `how-it-works-step-3` (service happens, you never left your day)
- `how-it-works-where-we-set-up` (or one per location if there are multiple)
- `how-it-works-whats-in-the-van` (or one per equipment item if there are multiple)

`/services` (Automotive):
- `services-hero` if there's a hero illustration
- `services-category-oil-changes`, `services-category-brakes`, etc. if each category has an illustration
- `services-tire-store-coming-soon` for the new tire store callout

Use whatever naming is clearest for the WO-21 image generation to target. Document the list in the final commit so WO-21 has a reference.

---

### Step 2: Leave SVG files in place

Do NOT delete the cartoon SVG files from the repo. Just remove their imports from the pages. They can be deleted in a cleanup commit later once the real photos are in.

---

### Step 3: Make homepage floating Quote CTA always-visible

Find the component that controls the floating "Need a price? Ask us." pill on the homepage.

- Remove any scroll listener, Intersection Observer, or visibility state that delays its appearance
- Render it visible from first paint
- Keep its current positioning (`fixed bottom-6 right-6` or wherever it lives)
- Keep its animation (if any) for initial entry — just remove the scroll trigger
- Keep its existing click behavior (opens quote form, scrolls to quote section, whatever it currently does)

The pill should:
- Be visible as soon as the page loads (including above the fold)
- Remain visible throughout the page (no hide-on-scroll)
- On mobile: do NOT conflict with the existing mobile sticky bar (Call / Quote / Book). If there's a conflict, hide the floating pill on mobile (it's redundant with the sticky bar) and keep it desktop-only: `hidden md:flex`

---

### Step 4: Visual polish sweep of the pages touched

Since you're already in these files:

- Verify placeholders fit cleanly into existing layouts (don't break grid/flex spacing)
- If removing a cartoon left awkward whitespace, adjust the surrounding container's padding/margin to compensate
- Verify `/how-it-works` still reads well end-to-end
- Verify `/services` category cards still look good with placeholders instead of cartoons

Do NOT touch:
- Any copy
- Any navigation, headers, or footers
- Any other page

---

### Step 5: Build, commit, push, deploy

1. `npm run build` — confirm zero errors.
2. `git add src/`
3. `git commit -m "WO-20: replace cartoons with photo placeholders + always-visible quote CTA"`
4. `git push`
5. `npx netlify-cli deploy --prod`

---

## ACCEPTANCE CRITERIA

### /how-it-works
- [ ] No cartoon vehicle illustrations visible anywhere on the page
- [ ] Each former illustration spot now shows a styled placeholder box with "Photo" label
- [ ] Placeholders have unique `data-photo-placeholder` identifiers
- [ ] Page layout reads cleanly, no awkward whitespace
- [ ] Mobile responsive (placeholders full width, readable)

### /services (Automotive)
- [ ] No cartoon illustrations visible
- [ ] Placeholders in every former illustration spot
- [ ] Page layout reads cleanly

### Homepage
- [ ] Floating "Need a price? Ask us." pill is visible from first paint (above the fold)
- [ ] Pill stays visible throughout the page (no hide-on-scroll)
- [ ] Pill does not conflict with the mobile sticky bar (either hide on mobile or verify no overlap)
- [ ] No other homepage changes

### Every Page
- [ ] Build passes
- [ ] No console errors
- [ ] No broken imports

---

## DOCUMENT FOR WO-21

In the commit message body or in a new file `src/lib/photoPlaceholders.md`, list every `data-photo-placeholder` identifier added, along with:
- The page it lives on
- The aspect ratio
- A one-sentence description of what photo should go there

Example:
```
how-it-works-step-1 | /how-it-works | 4:3 | Customer on phone booking or tapping book on their laptop, at home
how-it-works-step-2 | /how-it-works | 4:3 | Branded Coastal van pulling into a driveway, tech getting out
how-it-works-step-3 | /how-it-works | 4:3 | Tech performing oil change on a driveway, customer inside doing their thing
```

This makes WO-21 trivial to execute — the AI image generator just reads this file and generates per-spec.

---

## DO NOT

- Do NOT touch the homepage beyond the floating CTA change
- Do NOT delete the cartoon SVG files
- Do NOT change any copy
- Do NOT rewrite entire files — surgical edits only
- Do NOT add any new dependencies
- Do NOT touch admin portal or booking wizard

---

## ROLLBACK

```bash
git revert HEAD
git push
npx netlify-cli deploy --prod
```
