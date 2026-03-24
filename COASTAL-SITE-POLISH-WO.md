# WORK ORDER: Site-Wide Design Polish — Visual Hierarchy, Rhythm, and Trust

## CONTEXT

The site looks clean but feels flat and disjointed. Every section is white cards on white background with gray text and orange buttons. There's no visual rhythm, no scroll checkpoints, and no clear differentiation between sections. This WO fixes that with a comprehensive design pass grounded in what the best mobile service business websites (YourMechanic, RepairSmith, Wrench, TaskRabbit) do to convert.

**This is a CSS/design-layer WO. Do NOT change page content, copy, or functionality. Do NOT change Firebase logic, form submissions, or routing. Only change styling, spacing, backgrounds, and visual presentation.**

**Stack:** Next.js 16, TypeScript, Tailwind CSS v4
**Design system:** Navy #0B2040, Orange #E07B2D, Blue #1A5FAC, Surface #FAFBFC

---

## PHASE 1: GLOBAL CHANGES (apply to all pages)

### 1A. Reduce Section Padding Globally
Find all sections with `padding: 80px 24px` or similar large vertical padding and reduce to:
- Desktop: `padding: 56px 24px` (was 80px)
- Mobile (<768px): `padding: 40px 16px`

This tightens the entire site and eliminates the "floating in whitespace" feeling.

### 1B. Page Header Tightening
On every page, the gap between the eyebrow/title/subtitle and the first content section is too large. Reduce the margin/padding between the page header block and the first content block by roughly 30-40%. The title should feel connected to the content below it, not separated by a void.

### 1C. Navigation Simplification
In the Header component, reduce the nav to 6 items max:
- **Services** (keep)
- **Fleet** (keep)
- **Marine** (keep)
- **About** (keep)
- **Contact** (keep)
- Remove "Areas" and "FAQ" from the main nav

"Areas" and "FAQ" are still accessible from the footer. The nav should be scannable in under 2 seconds.

Update both desktop nav AND mobile hamburger drawer.

### 1D. Card Standardization
Find all card-like containers across all pages. Ensure they ALL use this exact treatment:
- Background: `#fff`
- Border: `1px solid #e8e8e8` (slightly more visible than #eee)
- Border-radius: `12px`
- Padding: `24px` (desktop), `20px` (mobile)
- Box-shadow: `0 1px 3px rgba(0,0,0,0.04)` (barely there, just enough for depth)
- NO cards should have `border-radius: 16px` — standardize to 12px everywhere

### 1E. Typography Hierarchy Strengthening
- All section eyebrow labels: `font-size: 13px` (not 12px), `font-weight: 700`, `letter-spacing: 1.5px` (not 2px), color `#1A5FAC`
- All section titles: `font-weight: 800`, color `#0B2040`, `letter-spacing: -0.5px`
- All body text: color `#444` (not #666 — more readable), `line-height: 1.7`
- All secondary/muted text: `#888` (not #999 or #aaa)

---

## PHASE 2: ALTERNATING SECTION BACKGROUNDS (the biggest visual impact)

Every page MUST have at least one navy section and use alternating backgrounds. The pattern is:
- White (#fff) → Surface (#FAFBFC) → White → Navy (#0B2040) → White → Surface

Specific changes per page:

### Homepage (src/app/page.tsx or similar)
The homepage may already have a stats bar and some navy. Verify and ensure:
- Hero section: white background (keep as-is)
- Stats/numbers bar: navy #0B2040 background, white text (if not already)
- Services tabbed section: surface #FAFBFC background
- How it Works section: WHITE background (so it contrasts with the surface above)
- Trust/social proof section: navy #0B2040 background, white text
- Final CTA section: surface #FAFBFC background with navy text

### Services Page (src/app/services/page.tsx)
- Page header area: white
- Service cards grid: surface #FAFBFC background
- FAQ accordion section: white
- Cross-link teasers (Fleet/Marine): navy #0B2040 background, white text, orange buttons

### Fleet Page (src/app/fleet/page.tsx)
- Page header/hero: white
- Vehicle types section: surface #FAFBFC
- Fleet process steps: white
- Value props: navy #0B2040 background, white text
- Services list: surface #FAFBFC
- FAQ: white
- Bottom CTA: navy #0B2040

### Book Page (src/app/book/page.tsx)
- Page header: white
- Form + sidebar area: surface #FAFBFC background (the entire form area should sit ON a surface background, not floating on white)
- Below form: white for any additional content

### Contact Page (src/app/contact/page.tsx)
- Page header: white
- Form + info area: surface #FAFBFC
- "Prefer to book directly?" section: navy #0B2040, white text

### Marine Page (currently placeholder — apply when content is built)
### About Page (currently placeholder — apply when content is built)

---

## PHASE 3: TRUST SECTION UPGRADE

Create a reusable trust bar component (or add it inline to pages that need it). This should appear on the homepage AND the /book page (above the form).

**Desktop layout:** Single row, 4 items, on a navy (#0B2040) background with subtle padding (40px 24px)
**Mobile layout:** 2x2 grid

The 4 trust items:
1. Shield icon → "Fully Licensed & Insured"
2. Wrench icon → "ASE-Certified Technicians"  
3. Badge/star icon → "12-Month Service Warranty"
4. Dollar/tag icon → "Transparent Pricing, No Surprises"

Each item:
- Icon: 32px, white, use Lucide icons or simple SVG (Shield, Wrench, Award, Tag)
- Text: `font-size: 14px`, `font-weight: 600`, color `#fff`
- Subtle white separator lines between items (desktop only)

This is NOT a stats bar with numbers. It's a trust credentials bar.

---

## PHASE 4: BOOK PAGE SPECIFIC POLISH

### 4A. Service Card Selector Improvements
The service cards on /book need to feel interactive, not passive:
- Add a hover state: `border-color: #E07B2D`, `background: rgba(224,123,45,0.02)`, slight `transform: translateY(-1px)`
- Selected state should show a small orange checkmark circle (16px) in the top-right corner of the card
- Add a subtle left border accent (3px solid #E07B2D) on the selected card
- Transition: `all 0.15s ease`

### 4B. Sidebar Card Backgrounds
The "How it works" and "What's included" and "Prefer to call?" blocks in the sidebar need backgrounds:
- Each block: white background, `border: 1px solid #e8e8e8`, `border-radius: 12px`, `padding: 24px`
- 16px gap between blocks
- The step numbers in "How it works" should be navy circles with white text (if not already)

### 4C. Fleet/Marine Banner
The "Fleet or Marine Service — Request a custom quote" link at the bottom of the service cards should stand out more:
- Navy background #0B2040
- White text for "Fleet or Marine Service"
- Orange text for "Request a custom quote →"
- Border-radius: 12px
- Padding: 16px 20px
- Hover: slightly lighter navy background

---

## PHASE 5: FOOTER POLISH

The footer is decent but can be tightened:
- Reduce footer padding from whatever it is to `padding: 48px 24px 24px`
- Make sure footer link text is `#aaa` with hover state `#fff`
- The phone number in the footer should be orange (#E07B2D) and larger than the other text (18px, weight 700)
- Add a thin `border-top: 1px solid rgba(255,255,255,0.1)` above the copyright line
- Copyright text: `font-size: 12px`, color `rgba(255,255,255,0.4)`

---

## CRITICAL RULES

1. Do NOT rewrite entire page files. Make surgical edits to the specific styling/className props mentioned above.
2. Do NOT change any content text, copy, pricing, or form fields.
3. Do NOT change any Firebase/Firestore logic, form handlers, or data structures.
4. Do NOT add any new npm packages.
5. Do NOT change the mobile sticky bottom bar (Call + Book Online) — it should remain as-is.
6. READ each file completely before editing. Many of these pages are large.
7. If a page uses inline styles (style={{}}), edit the inline styles. If it uses Tailwind classes, edit the classes. Match the existing pattern of each file.
8. For the trust bar component: if there's a shared components directory, create it there. If pages use inline components, just add it inline to the homepage and book page.

---

## WHEN DONE
```bash
npm run build && npx netlify deploy --prod --dir=.next && git add -A && git commit -m "design: site-wide polish — visual rhythm, trust signals, spacing, hierarchy" && git push origin main
```
