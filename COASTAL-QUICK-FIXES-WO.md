# WORK ORDER: Quick Fixes — Nav + Fleet Polish

## CONTEXT
Two small fixes. Should take under 5 minutes.

## FIX 1: Add "Contact" to Header Navigation

Read the Header component (likely `src/components/Header.tsx` or `src/components/layout/Header.tsx`).

The current nav links are: Services, Fleet, Marine, About, Areas, FAQ

Add "Contact" to the nav links array, positioned after "FAQ":
Services, Fleet, Marine, About, Areas, FAQ, Contact

Route: `/contact`

Update both the desktop nav links AND the mobile hamburger menu drawer.

## FIX 2: Fleet Page — "Request Fleet Consultation" Button

Read the Fleet page (`src/app/fleet/page.tsx`).

Find the CTA button that says "Request Fleet Consultation". The text is wrapping to two lines because it's too long for the button width.

Fix by either:
- **Option A (preferred):** Shorten the button text to "Request Consultation" or "Get Fleet Quote"
- **Option B:** Make the button wider with `min-width: 280px` or `white-space: nowrap`

Go with Option A — shorter text is better UX anyway.

## DO NOT
- Do not modify any other pages or components
- Do not change styling, colors, or layout beyond these two specific fixes

## WHEN DONE
```bash
npm run build && npx netlify deploy --prod --dir=.next && git add -A && git commit -m "fix: add Contact to nav, shorten fleet CTA text" && git push origin main
```
