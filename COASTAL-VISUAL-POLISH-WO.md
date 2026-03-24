# WO: Visual Polish & Consistency Fixes
## Coastal Mobile Lube & Tire — 2026-03-24

Read every file mentioned below IN FULL before making any changes. Do not rewrite entire files. Make surgical edits only.

---

## CHANGE 1 — Standardize marine CTA button text

**File:** `src/app/marine/page.tsx`

Find the hero CTA button that says "Request Marine Quote" and change it to "Get Marine Quote" so it matches the pattern used on the fleet page ("Get Fleet Quote"). The `href` should remain `#marine-quote`.

Search the rest of the file for any other instances of "Request Marine Quote" and change them all to "Get Marine Quote".

---

## CHANGE 2 — Fix pricing inconsistencies

### 2a — Services page brake pricing
**File:** `src/app/services/ServicesContent.tsx` (or `src/app/services/page.tsx` — whichever contains the brake card)

The brake service card currently shows "Brake pads from $149". Change to: "Brake pads from $199" to match the booking page.

### 2b — Services page tire pricing  
Same file. The tire card shows "Starting at $29 (rotation) / Call for tire pricing". Change to: "Starting at $75 / Rotation from $29" to align with the booking page's $75 for tire service.

---

## CHANGE 3 — Add visual separator on services page

**File:** `src/app/services/ServicesContent.tsx` (or `src/app/services/page.tsx`)

Find the "Not sure what you need?" section and the "Common Questions" FAQ section below it. If both sections use `bg-white` or no background class, change the FAQ section's wrapper to use `bg-[#FAFBFC]` so there's a visual break between them.

---

## CHANGE 4 — Fix contact page hours

**File:** `src/app/contact/page.tsx`

Find the business hours section. Currently shows:
- Monday - Friday: 7:00 AM - 6:00 PM  
- Saturday: 8:00 AM - 4:00 PM
- Sunday: Closed

Change to:
- Monday - Saturday: 7:00 AM - 6:00 PM
- Sunday: By appointment

---

## CHANGE 5 — Add Trust Bar to fleet and marine pages

### 5a — Fleet page
**File:** `src/app/fleet/FleetContent.tsx` (or `src/app/fleet/page.tsx`)

Import the TrustBar component: `import TrustBar from '@/components/TrustBar'`

Add `<TrustBar />` right after the hero section (after the hero image), before the "Vehicle Types" section. This matches the homepage and booking page pattern.

### 5b — Marine page
**File:** `src/app/marine/page.tsx`

Same pattern. Import TrustBar and place it right after the hero section, before the "Packages" section.

---

## CHANGE 6 — Homepage widget form verification

**File:** `src/app/page.tsx`

Read the homepage file and verify:
1. The "Get My Quote" button has an `onClick` or the form has an `onSubmit` handler
2. The handler calls `addDoc` to write to the Firestore `bookings` collection
3. The submission includes `source: "homepage-widget"` and `serviceCategory` based on the active tab

If the submit handler is NOT wired up (no onClick/onSubmit on the button or form), wire it up:
- On form submit, collect: service (from dropdown), zip, phone, notes, and the active tab (automotive/fleet/marine)
- Write to Firestore `bookings` collection with fields:
  - `serviceCategory`: the active tab value ("automotive", "fleet", or "marine")
  - `service`: selected service from dropdown
  - `zip`: zip code value
  - `phone`: phone value (strip to digits only)
  - `notes`: notes value
  - `source`: "homepage-widget"
  - `status`: "pending"
  - `createdAt`: serverTimestamp()
  - `updatedAt`: serverTimestamp()
- After successful submit, show a brief success message (replace the form content with "Got it! We'll be in touch shortly." with a "Submit another" link to reset)
- Add basic validation: require phone (min 10 digits) and service selection

If the submit handler IS already wired up, leave it alone and just confirm in your response that it's functional.

---

## BUILD AND DEPLOY

```
npm run build && netlify deploy --prod && git add -A && git commit -m "polish: pricing alignment, CTA consistency, hours fix, trust bars, widget verification" && git push origin main
```
