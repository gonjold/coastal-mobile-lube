# WORK ORDER: Critical Fixes — Homepage Widget, Pricing, Mobile Bar, Cleanup

## CONTEXT
Site audit found 3 critical and several high-priority issues. This WO fixes the ones that would break the client presentation on Wednesday. Read each file fully before editing.

## FIX 1: Homepage "Get My Quote" Button — MAKE IT WORK

Read `src/app/page.tsx`. The "Get My Quote" button in the hero booking widget has no `onClick` or `onSubmit` handler. It does nothing.

**Fix:** Wire the button to collect the form data (service, zip, phone, notes, and the active tab) and write it to Firestore `bookings` collection. Use the same Firebase imports as BookingForm.tsx.

On submit:
- Validate: service must be selected, phone must have 10+ digits
- Strip phone to digits only
- Write to Firestore `bookings` collection:
```
{
  service: selectedService,       // e.g. "Oil Change" or "Fleet Consultation"
  serviceCategory: activeTab,     // "automotive" | "fleet" | "marine"
  zip: zipValue,
  phone: strippedPhone,
  notes: notesValue,
  status: "pending",
  source: "homepage-widget",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```
- On success: replace the form content with a simple confirmation: green check icon, "We'll call you back within 2 hours" text, and a "Call now: 813-722-LUBE" link
- On error: show a red error message below the button
- Loading state: button shows "Submitting..." and is disabled
- Add `"use client"` directive to the page if not already present (needed for useState + Firebase)

Import from firebase: `import { db } from '@/lib/firebase'` and `import { collection, addDoc, serverTimestamp } from 'firebase/firestore'`

## FIX 2: Pricing Consistency

In `src/app/page.tsx`, find the services section. The automotive tab shows "Starting at $49". 

Change it to "Starting at $49" everywhere it appears on the services page and homepage, AND change the booking form's Oil Change price from "$89" to "$49" in `src/app/book/BookingForm.tsx`.

Actually — check what the /services page (ServicesContent.tsx) says for oil change pricing. Whatever price the Services page shows for the basic oil change, that number should match across homepage, services page, and booking form. Make them all consistent. The lowest price (likely $49) should be the "starting at" number.

## FIX 3: Mobile Sticky Bottom Bar on ALL Pages

The mobile sticky bar (Call + Book Online) currently only shows on the homepage. Move it to the shared layout so it appears on every page.

Read `src/app/page.tsx` and find the mobile sticky bottom bar code (the div with `lg:hidden` that sticks to the bottom with Call + Book Online buttons).

**Cut** that code out of page.tsx and **paste** it into `src/app/layout.tsx` (the root layout), right before the closing `</body>` tag. This way it renders on every page automatically.

Make sure:
- The "Book Online" button links to `/book`
- The phone button links to `tel:8137225823`
- It's hidden on desktop (`lg:hidden` or `hidden lg:block` inverse)
- It has `fixed bottom-0` positioning
- It doesn't overlap the Footer — add `pb-16` or `pb-20` padding to the main content area in layout.tsx to account for the sticky bar height on mobile

## FIX 4: Remove Orphaned Components

Delete these two files that are not used anywhere:
- `src/components/HullStripe.tsx`
- `src/components/WaveDivider.tsx`

## FIX 5: FAQ Page Phone Number — Make Clickable

Read `src/app/faq/page.tsx`. Find the text "call us at 813-722-LUBE" and wrap the phone number in `<a href="tel:8137225823" className="text-orange font-bold hover:underline">813-722-LUBE</a>`.

## FIX 6: Remove Broken Nav/Footer Links to Placeholder Pages

In `src/components/Header.tsx`:
- Remove "Areas" from the nav if it's still there (should already be gone from quick fixes WO)
- Remove "FAQ" from the nav if it's still there

In `src/components/Footer.tsx`:
- Remove "Service Areas" from the COMPANY column links
- Remove "FAQ" from the COMPANY column links
- Remove the entire "SERVICE AREAS" column (Tampa, Brandon, Riverview, etc.) — these pages don't exist yet and clicking them leads to placeholders or 404s
- Keep the footer to 3 columns: brand info, SERVICES links, COMPANY links

These pages can be added back when they have real content.

## DO NOT
- Do not modify the Services page, Fleet page, or Contact page
- Do not change the design system colors, fonts, or spacing
- Do not add new npm packages

## WHEN DONE
```bash
npm run build && npx netlify deploy --prod --dir=.next && git add -A && git commit -m "fix: critical — wire homepage widget, fix pricing, global sticky bar, cleanup" && git push origin main
```
