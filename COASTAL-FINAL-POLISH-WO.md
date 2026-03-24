# WORK ORDER: Final Presentation Polish

## CONTEXT
Last WO before the Wednesday client presentation. This covers visual polish, hero image layout fixes, CTA language consistency, and cross-link card styling. Read each file fully before editing. Make surgical changes only.

**Design system:** Navy #0B2040, Orange #E07B2D, Blue #1A5FAC, Surface #FAFBFC

---

## FIX 1: Fleet Page Hero Image — Full Width

Read `src/app/fleet/FleetContent.tsx` (or wherever the fleet page content lives).

The hero section currently has a two-column layout with text left and a small image right. Change the fleet hero to:
- Text content (eyebrow, H1, subtitle, CTAs) stays on top, full width
- Image goes BELOW the text, full width, with rounded corners (border-radius 12px), max-height 400px, object-fit cover
- Remove the two-column grid from the hero section

This matches how high-end service sites handle hero images — let the image breathe.

## FIX 2: Marine Page Hero Image — Full Width

Read `src/app/marine/page.tsx`.

Same fix as fleet: change the hero from two-column (text + small image) to stacked layout:
- Text content on top, full width
- Image below, full width, rounded corners (12px), max-height 400px, object-fit cover
- On mobile this is already stacked, but the image is too small. Make it full width on mobile too.

## FIX 3: Cross-Link Cards — Remove Dashed Borders

On the Marine page and Fleet page, the cross-link teaser cards at the bottom (e.g., "Looking for automotive service?" / "Need fleet maintenance?") have dashed colored borders (orange dashed, navy dashed). These look inconsistent with the rest of the site.

Change them to:
- Border: `1px solid #e8e8e8` (solid, not dashed)
- On hover: `border-color: #E07B2D` and subtle `transform: translateY(-2px)` with `transition: all 0.2s`
- Remove any colored top border accents
- Keep the orange "Learn more →" / "View services →" link text

## FIX 4: CTA Language Consistency

Standardize all CTA button text across the site. The rule is:
- **Automotive** = "Book Service" (because they can book online)
- **Fleet** = "Get Fleet Quote" (because it's custom pricing)
- **Marine** = "Get Marine Quote" (because it's custom pricing)
- **General/unclear** = "Get a Quote" (catch-all)

Specific changes needed:

In the **Header** (`src/components/Header.tsx`):
- "Book Now" button → change to "Book Service" (still links to `/book`)

In the **homepage** (`src/app/page.tsx`):
- Hero "Book Online" button → change to "Book Service"
- Bottom CTA section "Book Online" → change to "Book Service"

In the **mobile sticky bar** (now in `src/app/layout.tsx`):
- "Book Online" → change to "Book Service"

In the **fleet page** hero:
- "Get Fleet Quote" is good — keep it
- Bottom CTA: "Request Consultation" → change to "Get Fleet Quote" for consistency

In the **marine page** hero:
- "Request Marine Quote" is good — keep it

In the **services page**:
- "Get a Quote" button in hero → keep it (generic is fine here since page covers all verticals)

In the **about page**:
- Bottom CTA "Book Online" → change to "Book Service"

In the **footer** (`src/components/Footer.tsx`):
- If there's a "Book Online" link in the footer services column, change to "Book Service"

## FIX 5: Marine Hero CTA Buttons — Fix Text Wrapping

On the marine page, the "Request Marine Quote" and "Call 813-722-LUBE" buttons are wrapping text to two lines, making them look chunky.

Fix by adding `whitespace-nowrap` (or `white-space: nowrap`) to both buttons. If they still don't fit side by side on mobile, stack them vertically on mobile with full width (`flex-col` on mobile, `flex-row` on desktop).

## FIX 6: About Page — "What sets us apart" Cards Need More Visual Weight

The four value prop cards (01-04) on the about page look flat. Add:
- A left border accent: `border-left: 3px solid #E07B2D` on each card
- Slightly increase padding-left to `32px` to give the accent breathing room
- The "01" / "02" etc. numbers should be orange (#E07B2D) instead of navy, to create visual interest

## FIX 7: Homepage Mobile — Hero Buttons Stack

Looking at mobile screenshots, the "Book Online" and "Call" buttons in the hero are stacking full-width which is fine, but there's extra whitespace below them before the trust badges. Tighten the gap between the hero buttons and the trust badges on mobile to `margin-top: 16px` (from whatever it is now).

## FIX 8: Footer — Add "Book Service" to COMPANY column

In the Footer, the COMPANY column currently shows "About" and "Contact". Add "Book Service" as a third link pointing to `/book`.

## DO NOT
- Do not change any form logic, Firebase writes, or data handling
- Do not change the homepage booking widget functionality (it's working)
- Do not change the booking form on /book
- Do not change page content/copy (except CTA button text as specified)
- Do not add npm packages
- Do not rewrite entire files — surgical edits only

## WHEN DONE
```bash
npm run build && npx netlify deploy --prod --dir=.next && git add -A && git commit -m "polish: final presentation pass — hero images, CTAs, cross-links, mobile" && git push origin main
```
