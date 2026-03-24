# WORK ORDER: Booking Page Rebuild — Single-Page Form

## CONTEXT
The current /book page is a multi-step wizard (5 steps, 15+ fields). It needs to be replaced with a simple single-page booking form. The amount of information we ask for should match what we give back. Since we're not showing real-time availability, a clean form that says "we'll confirm within 2 hours" is better than a complex wizard.

**Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Firebase/Firestore
**Project dir:** ~/coastal-mobile-lube
**Design system:** Navy #0B2040, Orange #E07B2D, Blue #1A5FAC, Surface #FAFBFC, Plus Jakarta Sans

## WHAT TO DO

**Delete** the entire current booking wizard implementation at `src/app/book/page.tsx` (and any wizard-specific components it imports — check for step components, wizard state management, etc. in `src/components/`). Replace with a clean single-page form.

**Do NOT touch** any shared components (Header, Footer, MobileBottomBar), the Firebase config, or any other pages.

## THE NEW /book PAGE

### Page Layout
- Full-width white page with standard Header/Footer
- Eyebrow: "BOOK SERVICE" (blue, 12px uppercase, letter-spacing 2px)
- Title: "Schedule your service" (navy, 34px desktop / 28px mobile, weight 800)
- Subtitle: "Pick a service, choose a date, and we will confirm your appointment within 2 hours." (gray #666, 16px, max-width 520px)
- Below that: two-column layout on desktop (form left, info sidebar right). Single column stacked on mobile.

### Left Column — The Form (inside a white card with border #eee, border-radius 16px, padding 32px, subtle shadow)

**Returning Customer Lookup (top of form):**
- Small text above form: "Been here before?" with an orange text link "Look up your info"
- Clicking it reveals a phone input field with a "Find me" button
- On submit, query Firestore `bookings` collection where `phone` matches
- If found: pre-fill name, phone, and address fields. Show a small green "Welcome back!" message
- If not found: show "No worries — fill out the form below and we'll get you set up"
- This lookup section can be collapsed/dismissed

**Field 1 — Service Type (required)**
- Label: "WHAT DO YOU NEED?" (12px uppercase gray label, same style as contact page)
- Radio card selector (not a dropdown). Show 6 options in a 2x3 grid (desktop) or 1-column stack (mobile):
  1. Oil Change — starting at $89
  2. Tire Service — starting at $75
  3. Brake Service — starting at $199
  4. A/C Service — starting at $149
  5. Battery Replacement — starting at $149
  6. Full Maintenance — starting at $179
- Each card: border #eee, border-radius 10px, padding 14px, cursor pointer
- Selected state: border 2px solid #E07B2D, light orange background rgba(224,123,45,0.04)
- Show service name (15px, weight 600, navy) and price (13px, orange, weight 600)
- Also show a 7th option at the bottom: "Fleet or Marine Service" styled slightly different (navy background, white text, full width) — links to /contact instead of being a selectable option. Text: "Fleet or Marine Service — Request a custom quote →"

**Field 2 — Preferred Date (required)**
- Label: "PREFERRED DATE"
- Native date input (`type="date"`), styled to match the design system
- Min date = tomorrow, max date = 60 days out
- Styled: border 2px solid #eee, border-radius 10px, padding 12px 14px, font-size 15px, focus border #E07B2D

**Field 3 — Time Window (required)**
- Label: "PREFERRED TIME"
- Three pill-style buttons in a row: "Morning (7–10)" | "Midday (10–1)" | "Afternoon (1–5)"
- Unselected: border #eee, gray text
- Selected: orange background, white text, border orange

**Field 4 — Your Name (required)**
- Label: "YOUR NAME"
- Text input, placeholder "First and last name"
- Same input styling as contact page

**Field 5 — Phone (required)**
- Label: "PHONE"
- Tel input, placeholder "(555) 555-5555"

**Field 6 — Service Address (required)**
- Label: "SERVICE ADDRESS"
- Text input, placeholder "Street address, city, ZIP"
- Single line — we do NOT need separate city/state/zip fields. Just one address field.

**Field 7 — Notes (optional)**
- Label: "ANYTHING ELSE WE SHOULD KNOW?"
- Textarea, 3 rows, placeholder "Vehicle details, gate codes, special requests..."
- Resize vertical only

**Submit Button:**
- Full width, orange (#E07B2D), white text, 16px weight 700, padding 16px, border-radius 10px
- Text: "Request Appointment"
- Hover: darken to #cc6a1f, slight lift, orange shadow
- Loading state: show spinner, disable button, text "Submitting..."

**Form Validation:**
- All required fields validated on submit
- Show red border + small red error text below any empty required field
- Phone field: basic format check (at least 10 digits)
- Do NOT use HTML5 native validation — use React state-based validation for consistent styling

### Right Column — Info Sidebar (desktop only, hidden on mobile)

Three info blocks stacked vertically with 24px gap:

**Block 1 — "How it works"**
- 3 numbered steps, each with a navy circle number (24px, weight 700, white text on navy) and text:
  1. "You request" — Pick your service and preferred time
  2. "We confirm" — Our team confirms within 2 hours
  3. "We show up" — Fully equipped service van at your door

**Block 2 — "What's included"**
- Checkmark list (4 items, green check icon + text):
  - Factory-grade parts and fluids
  - Certified master technicians
  - 12-month service warranty
  - No hidden fees, ever

**Block 3 — "Prefer to call?"**
- Phone icon + "813-722-LUBE" in orange, large (20px, weight 700), tappable link
- Below: "Available Monday through Saturday" in gray

### Confirmation State (after successful submit)

After the form submits successfully to Firestore:
- Replace the entire form area with a confirmation card
- Green checkmark circle at top (48px, white check on green #22c55e background)
- Title: "You're all set!" (navy, 28px, weight 800)
- Text: "We received your request for [SERVICE NAME] on [DATE]. Our team will call you at [PHONE] within 2 hours to confirm your appointment."
- Below that, a secondary text: "Need to make changes? Call us at 813-722-LUBE"
- Two buttons below:
  - "Book Another Service" (orange, full width) — resets form
  - "Back to Home" (outlined, navy border) — links to /

### Firestore Write

On submit, write to the `bookings` collection with this document structure:
```
{
  service: "Oil Change",           // selected service name
  preferredDate: "2026-03-28",     // ISO date string
  timeWindow: "morning",           // morning | midday | afternoon
  name: "John Smith",
  phone: "8135551234",             // digits only, stripped
  address: "123 Main St, Tampa, FL 33601",
  notes: "Gate code 1234",         // optional
  status: "pending",
  source: "website",
  returningCustomer: true/false,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

Use the existing Firebase config in the project (`src/lib/firebase.ts` or wherever it lives — read the file first). Import `collection`, `addDoc`, `serverTimestamp` from `firebase/firestore`. Import `query`, `where`, `getDocs` for the phone lookup.

### Mobile Responsive
- Form goes full width, no sidebar
- Service cards stack to single column
- Time window pills stack if needed (but should fit 3-across on 375px)
- All touch targets minimum 44px
- The sidebar info blocks should appear BELOW the form on mobile, not hidden

### SEO
- Page title: "Book Mobile Service | Coastal Mobile Lube & Tire"
- Meta description: "Schedule mobile oil changes, tire service, brake repair, and more. We come to your home or office in the Tampa Bay area. Book online in under 60 seconds."

## DO NOT
- Do not rewrite or modify any other pages
- Do not change the Header, Footer, or MobileBottomBar components
- Do not change the Firebase config
- Do not add any new npm packages — use only what's already installed
- Do not create separate component files for each form section — keep it all in one page file (src/app/book/page.tsx). Inline helper components are fine within the same file.

## WHEN DONE
```bash
npm run build && npx netlify deploy --prod --dir=.next && git add -A && git commit -m "feat: rebuild /book as simple single-page booking form with Firebase" && git push origin main
```
