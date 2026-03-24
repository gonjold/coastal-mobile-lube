# WORK ORDER: UX Simplification — Clear Flows, Inline Forms, Content Hierarchy

## CONTEXT
The site has good content but the user experience is confusing. There are too many different forms, inconsistent CTA language, and no clear distinction between booking automotive service vs requesting fleet/marine quotes. This WO restructures the flow so every page answers one question: "What do I do here?"

**The new rules:**
- **Automotive** = Book online (date, time, service, contact info → Firestore → confirmation)
- **Fleet** = Request a quote (inline form on fleet page → Firestore → "we'll call you")
- **Marine** = Request a quote (inline form on marine page → Firestore → "we'll call you")
- **Contact** = General inquiries only (not a conversion path)
- **Homepage** = Universal entry point with tabbed quick-quote widget

Read each file completely before editing. Make surgical changes only.

---

## CHANGE 1: Homepage Copy Fix

In `src/app/page.tsx`, change the hero H1 from:
"The shop comes to **you.**"
to:
"The shop that comes to **you.**"

---

## CHANGE 2: Simplify /book Page — Automotive Only, Clean Layout

Read `src/app/book/BookingForm.tsx` and `src/app/book/page.tsx`.

### 2A. Change page header
- Eyebrow: "BOOK SERVICE" → change to "AUTOMOTIVE SERVICE"
- H1: "Schedule your service" → change to "Book your service"
- Subtitle: keep the "Pick a service, choose a date, and we will confirm your appointment within 2 hours." text

### 2B. Remove sidebar content on desktop
The right sidebar currently has three blocks: "How it works", "What's included", "Prefer to call?". Remove all three sidebar blocks. The form should be full width (or nearly full width, max-width 700px centered).

The trust bar above the form already communicates credibility. The sidebar is visual clutter competing with the form.

### 2C. Remove "Fleet or Marine Service" banner from the form
The navy banner that says "Fleet or Marine Service — Request a custom quote →" inside the booking form is confusing. Remove it entirely. If someone wants fleet or marine, they navigate via the header nav. The /book page is automotive only.

### 2D. Move "How it works" and "What's included" BELOW the form
After the form card, add a section (surface background #FAFBFC) that contains:
- "How it works" — the 3 steps (You request → We confirm → We show up) in a horizontal 3-column layout on desktop, stacked on mobile
- "What's included" — the 4 checkmark items in a horizontal row on desktop

This keeps the SEO-valuable content on the page but below the fold, out of the way of the conversion action.

### 2E. Add a simple note above the form
Above the form card (but below the trust bar), add a single line of text:
"For fleet or marine service, visit our [Fleet](/fleet) or [Marine](/marine) pages for a custom quote."
Style: font-size 14px, color #888, centered, with the links in orange.

---

## CHANGE 3: Fleet Page — Add Inline Quote Form

Read `src/app/fleet/FleetContent.tsx` (or `src/app/fleet/page.tsx`).

### 3A. Replace the navy CTA section with an inline form
Find the navy section that says "Let's talk about your fleet." with "Request Consultation" and "Call" buttons. Replace it with an inline quote form section:

**Section background:** Navy #0B2040
**Section title:** "Get a fleet quote" (white, 28px, weight 800)
**Section subtitle:** "Tell us about your fleet and we will put together a custom maintenance plan within 48 hours." (white/70%)

**Form (inside the navy section, in a white card with rounded corners):**
- Field 1: "YOUR NAME" — text input, placeholder "First and last name"
- Field 2: "PHONE" — tel input, placeholder "(555) 555-5555"  
- Field 3: "EMAIL" — email input, placeholder "you@company.com"
- Field 4: "FLEET SIZE" — select dropdown with options: "1-5 vehicles", "6-15 vehicles", "16-50 vehicles", "50+ vehicles"
- Field 5: "TELL US ABOUT YOUR FLEET" — textarea, 3 rows, placeholder "Vehicle types, current maintenance schedule, locations, anything that helps us build your plan..."
- Submit button: "Get Fleet Quote" (orange, full width)

**Form card styling:** white background, border-radius 12px, padding 32px, max-width 560px, centered within the navy section.

**On submit:** Write to Firestore `bookings` collection:
```
{
  name: trimmed,
  phone: digits only,
  email: trimmed,
  fleetSize: selected value,
  notes: textarea value,
  service: "Fleet Consultation",
  serviceCategory: "fleet",
  status: "pending",
  source: "fleet-page",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

**On success:** Replace form with confirmation: green check, "We will call you within 48 hours to discuss your fleet program." + phone link.

**Validation:** Name and phone required. Show red border on empty required fields.

**Imports:** Use the same Firebase imports as BookingForm.tsx: `import { db } from '@/lib/firebase'` and `import { collection, addDoc, serverTimestamp } from 'firebase/firestore'`. Add `"use client"` directive if not already present.

### 3B. Remove cross-link cards at the bottom
The "Automotive" and "Marine" cross-link teaser cards at the very bottom of the fleet page — remove them. They're unnecessary navigation since the header handles this. This tightens the page.

### 3C. Update hero CTA buttons
Change the hero buttons:
- "Get Fleet Quote" → keep text, but change the link from `/contact` to scroll to the form section below. Use an anchor: `href="#fleet-quote"` and add `id="fleet-quote"` to the form section.
- "Call 813-722-LUBE" → keep as-is

---

## CHANGE 4: Marine Page — Add Inline Quote Form

Read `src/app/marine/page.tsx`.

### 4A. Replace the CTA section with an inline form
Find the section that says "Ready to get your boat serviced?" with "Request Marine Quote" and "Call" buttons. Replace it with an inline quote form section:

**Section background:** Navy #0B2040
**Section title:** "Get a marine service quote" (white, 28px, weight 800)
**Section subtitle:** "Tell us about your boat and we will put together a service plan." (white/70%)

**Form (inside the navy section, in a white card):**
- Field 1: "YOUR NAME" — text input
- Field 2: "PHONE" — tel input
- Field 3: "ENGINE TYPE" — select dropdown: "Outboard", "Inboard", "Sterndrive", "Not sure"
- Field 4: "NUMBER OF ENGINES" — select dropdown: "Single", "Twin", "Triple+"
- Field 5: "WHAT DO YOU NEED?" — textarea, 3 rows, placeholder "Engine make/model, service needed, marina or location, anything that helps..."
- Submit button: "Get Marine Quote" (orange, full width)

**Form card styling:** Same as fleet — white card, rounded 12px, padding 32px, max-width 560px, centered.

**On submit:** Write to Firestore `bookings` collection:
```
{
  name: trimmed,
  phone: digits only,
  engineType: selected value,
  engineCount: selected value,
  notes: textarea value,
  service: "Marine Service Quote",
  serviceCategory: "marine",
  status: "pending",
  source: "marine-page",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

**On success:** Replace form with confirmation: green check, "We will call you within 24 hours to discuss your marine service." + phone link.

**Validation:** Name and phone required.

**Imports:** Same Firebase imports. Add `"use client"` if needed.

### 4B. Remove cross-link cards at the bottom
Remove the "Looking for automotive service?" / "Need fleet maintenance?" teaser cards. Header nav handles this.

### 4C. Update hero CTA buttons
- "Request Marine Quote" → keep text, change link to `href="#marine-quote"`, add `id="marine-quote"` to the form section
- "Call 813-722-LUBE" → keep as-is

---

## CHANGE 5: Contact Page — Reposition as General Inquiries

Read `src/app/contact/page.tsx`.

Change the subtitle text from:
"Have a question, need a quote, or want to talk about fleet services? We respond to every inquiry within one business day."
to:
"Have a question or want to learn more about our services? We respond within one business day. For service bookings, use our [Book Service](/book) page. For fleet or marine quotes, visit [Fleet](/fleet) or [Marine](/marine)."

Make the links orange and clickable. This redirects conversion traffic to the right pages while keeping /contact for general inquiries.

---

## CHANGE 6: Homepage Widget — Keep as-is but fix "Book Online" text

On the homepage, the navy CTA section near the bottom says "Skip the shop." with "Book Online" and "Call" buttons. The contact page "Prefer to book directly?" section also says "Book Online."

Change all instances of "Book Online" to "Book Service" (should already be done from previous WO, but verify).

---

## CONTENT HIERARCHY PRINCIPLE (for CC to follow everywhere)

On every page, the visual priority from top to bottom should be:
1. **What is this?** (eyebrow + title + one sentence)
2. **What do I do?** (the form or primary CTA — this should be above the fold or very close to it)
3. **Why should I trust you?** (trust bar, credentials, value props — below the fold)
4. **Tell me more** (detailed content, FAQs, service lists — deep in the page for SEO and engaged readers)

Do NOT move any SEO content off the pages. Just move it below the conversion action.

---

## DO NOT
- Do not change the header, footer, or mobile sticky bar
- Do not change the homepage hero widget form or its Firebase logic
- Do not change the trust bar component
- Do not delete any SEO content (service lists, FAQs, value props) — just reorder
- Do not add npm packages
- Do not change the logo

## WHEN DONE
```bash
npm run build && npx netlify deploy --prod --dir=.next && git add -A && git commit -m "ux: simplify flows — inline fleet/marine forms, clean /book, content hierarchy" && git push origin main
```
