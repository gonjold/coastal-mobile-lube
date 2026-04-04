# COASTAL MOBILE LUBE & TIRE — MASTER SPEC (MERGED FINAL)
# For Claude Code Autonomous Work Sessions
# Generated: April 3, 2026 — Merged from OpenClaw Project + Coastal Project
# Sources: All session checkpoints (Mar 23-26, Apr 3), site audit, project state dump, conversation history

---

## HOW TO USE THIS FILE

You are Claude Code, working autonomously on the Coastal Mobile Lube & Tire website. This file is your single source of truth. Read it in full before starting any work. Follow the priority queue in order. Self-QA every change. Commit after each milestone. Write a QA report when done.

**Work rules:**
- Read every target file in full before making changes
- Never rewrite entire files — make surgical edits only
- Do NOT touch globals.css or tailwind config unless explicitly instructed
- Run `npm run build` after every change — if it fails, fix it before moving on
- Check your work against the design system and copy rules below
- Commit with descriptive messages after each completed task
- Write progress to `~/coastal-mobile-lube/OVERNIGHT-QA-REPORT.md` as you go
- Deploy: `npx netlify-cli deploy --prod` (auto-deploy may not be connected, verify)
- If you get stuck on something for more than 3 attempts, document the blocker in the QA report and move to the next task
- Max 3-4 focused changes per task. Never do sweeping multi-file rewrites.

---

## 1. DEAL STATUS

| Item | Value |
|------|-------|
| Client | Jason Binder, Coastal Mobile Lube & Tire LLC |
| Location | Apollo Beach, FL |
| SOW | Signed March 2026 |
| Total price | $3,000 |
| Deposit paid | $1,000 (received via Zelle to jonrgold@gmail.com) |
| Balance due | $2,000 at go-live (site on custom domain) |
| 90-day support | Started from deposit date |
| Van timeline | Truck purchased April 2. Van wrap/build ready ~April 15 |
| Client goal | Grow business and customer base to sell it. CRM/data tracking critical for exit value. |
| Client expectation | Polished, investor-ready quality |
| Jason's email | Coastalmobilelube@gmail.com |
| Jason's phone | 813-722-LUBE (813-722-5823) |
| Domain | coastalmobilelube.com (Jason owns via PorkBun, credentials received by Jon) |
| Developer | Jon Gold, Gold Co LLC (jon@jgoldco.com) |

### What's Included in the $3K
- Website (all pages, booking system, forms)
- Admin dashboard with CRM
- Firebase Auth + Firestore security (DONE)
- Custom domain setup (NOT YET DONE)
- Google Workspace (2 accounts, $168/yr each, Jason pays directly)
- GA4, Search Console, Tag Manager
- Initial SEO (service area pages, schema, GBP optimization)
- Social accounts (Instagram, TikTok, Facebook)
- 90 days of support from deposit date

---

## 2. INFRASTRUCTURE

| Item | Value |
|------|-------|
| Live URL | https://coastal-mobile-lube.netlify.app |
| Admin URL | https://coastal-mobile-lube.netlify.app/admin |
| Repo | github.com/gonjold/coastal-mobile-lube |
| Firebase project | coastal-mobile-lube |
| Firebase owners | jonrgold@gmail.com + jon@jgoldco.com |
| Firestore | us-east1, SECURITY RULES DEPLOYED (no longer test mode) |
| Cloud Functions | us-east1: onNewBooking + sendConfirmationEmail |
| Auth | Firebase Auth, Google Sign-In, allowlist: jon@jgoldco.com + coastalmobilelube@gmail.com |
| Gmail secrets | GMAIL_USER + GMAIL_APP_PASSWORD in Firebase secrets, sends from jon@jgoldco.com |
| Hosting | Netlify |
| Stack | Next.js 16, TypeScript, Tailwind CSS v4, Firebase/Firestore |
| Cloudinary cloud | dgcdcqjrz |
| Mac Mini project dir | ~/coastal-mobile-lube |
| Mac Mini SSH | jgsystems@100.66.96.13 (Tailscale) |
| tmux session | coastal |
| Domain registrar | PorkBun (Jason owns coastalmobilelube.com) |
| Deploy method | `npx netlify-cli deploy --prod` (auto-deploy may not be connected) |

### CRITICAL MANUAL STEP STILL NEEDED
Add `coastal-mobile-lube.netlify.app` to Firebase Auth authorized domains (Authentication > Settings > Authorized domains). Google Sign-In on /admin will NOT work without this. This is a Firebase Console action, NOT a code change. Do NOT attempt this.

---

## 3. DESIGN SYSTEM (LOCKED)

### Colors
| Token | Hex | Usage |
|---|---|---|
| Navy | #0B2040 | Headings, footer, dark sections |
| Navy header | #0F2847 | Header background (updated April 3) |
| Navy mid | #132E54 | Card backgrounds on dark sections |
| Blue | #1A5FAC | Links, eyebrow labels, focus states |
| Blue light | #2E7ECC | Hover states |
| Orange | #E07B2D | Primary CTAs, price highlights, active states |
| Orange hover | #CC6A1F | CTA hover |
| Gold | #D9A441 | Premium accents, hull stripe |
| Teal | #0D8A8F | Trust signals, check marks, marine accents |
| Teal soft | #E1F4F3 | Tag backgrounds, light accents |
| Sand | #F4EEE3 | Alternate section backgrounds |
| Sand light | #FAF7F2 | Form backgrounds |
| Cream | #FFFDF8 | Light section backgrounds |
| Surface | #FAFBFC | Alternate section backgrounds |
| White | #FFFFFF | Cards, primary background |

### Typography
- Font: Plus Jakarta Sans (all text, weights 400-800)
- Headings: weight 700-800, line-height 1.15, letter-spacing -0.5px to -0.8px
- Body: weight 400-500, line-height 1.65
- Base size: 16px

### Design Tokens
- Border radius cards: 14px (standardize to this)
- Border radius buttons: 8px
- Border radius pills: 20px
- Border radius inputs: 8px (standardize to this)
- Section padding desktop: 60px vertical, 24px horizontal
- Max width content: 1100px
- Max width narrow (forms, text): 680px

### CTA Conventions
- "Book Service" or "Book Now" = automotive
- "Get Fleet Quote" = fleet
- "Get Marine Quote" = marine

### Copy Rules (CRITICAL)
- No em dashes anywhere (use commas, periods, or colons)
- No emojis anywhere
- No AI-sounding copy. Human-written tone. Not salesy, not corporate.
- Service order always: Automotive, Fleet, Marine
- "Tampa" not "Tampa Bay"
- "Coastal Mobile" as shorthand, full name only in headers/legal
- Phone: 813-722-LUBE displayed prominently
- Business hours: Mon-Fri 8AM-5PM, Sat-Sun Closed
- Client email: jon@jgoldco.com for all client-facing email
- Branding: Gold Co LLC (not JG Systems)
- ASE badge: white version in footer only (35px, inverted, opacity 0.6)

---

## 4. CLOUDINARY IMAGE REGISTRY

Cloud: `dgcdcqjrz` | Base URL: `https://res.cloudinary.com/dgcdcqjrz/image/upload/`

### Brand Assets
| Asset | Public ID | Usage |
|---|---|---|
| Pin+wrench horizontal logo | CMLT_pin_horiz_troiyw.png | Header |
| Oval badge logo | Coastal_Lube_logo_v1_zbx9qs.png | Footer + hero |
| Van wrap mockup (white bg) | Van_mockup_ln68oh.png | About page |
| Van wrap mockup (transparent) | Van_mockup_transparent_bd5z75.png | Available |

### Website Images
| Public ID | Currently Used On |
|---|---|
| hero-van-driveway_nag1pq.jpg | Not used |
| hero-van-driveway-alt_mil6jl.jpg | Not used |
| fleet-vehicles_cjciux.jpg | Not used |
| fleet-vehicles-alt_n85acn.jpg | Not used |
| marina-boats_daijbf.jpg | Not used |
| marina-boats-alt_ilx2op.jpg | Homepage marine tab |
| oil-change-service_zptify.jpg | Services page (Oil Change card) |
| oil-change-service-alt_q3ziwb.jpg | Services page (Battery card) |
| tire-service_kezdax.jpg | Services page (Tire card) |
| van-interior-equipment_u2gu99.jpg | Services page (Fluid card) |
| driveway-service_sceizn.jpg | Homepage automotive tab |
| driveway-service-alt_uqmkou.jpg | Services page (Brake card) |
| commercial-service_wbgfog.jpg | Homepage fleet tab + Fleet page |
| commercial-service-alt_xpwvoi.jpg | Not used |

Van wrap photos were uploaded April 3 (exact public IDs: check codebase).

### Image Transforms
- Hero: `w_1600,q_auto:good,f_auto`
- Cards/sections: `w_800,q_auto:good,f_auto`
- Thumbnails: `w_400,h_300,c_fill,q_auto,f_auto`

---

## 5. CURRENT PAGE STATUS (As of April 3 Late Night)

### Homepage (/) — VISUALLY BROKEN, Functionally Working
- Layout: 60/40 sticky hero (left content, right quote widget), services tabs, How It Works, stats bar, trust bar, reviews carousel, CTA section
- Quick quote widget: 3 tabs (Auto/Fleet/Marine), writes to Firestore `bookings` collection
- Visual problem: Navy was bolted onto a white-bg design. Blobby flat color blocks, hard section transitions, no depth or texture.
- NOTE: WO-1 hero redesign (atmospheric navy, watermark badge, frosted glass widget) may have uncommitted changes. CHECK `git status` FIRST.
- VISUAL REDESIGN AUTHORIZED. Do not do incremental CSS patches. Rebuild the visual layer section by section with depth, texture, and atmospheric design. See Task 16 for full direction.

### Automotive (/services) — Working Draft
- 7 service cards with PLACEHOLDER pricing ($89 oil change)
- Needs real pricing from Jason's spreadsheet swapped in
- Component: ServicesContent.tsx

### Fleet (/fleet) — Working Draft
- Quote-only (NO pricing displayed per Jason's instruction)
- Inline quote form writes to Firestore with fleetSize field
- Component: FleetContent.tsx

### Marine (/marine) — Working Draft
- 3 packages with PLACEHOLDER pricing (Dock Ready $149, Captain's Choice $399, Season Opener $249)
- Needs real marine pricing from Jason's spreadsheet
- Inline quote form with engineType, engineCount fields

### About (/about) — Working Draft
- Placeholder story content, needs Jason's real "Our Story" swapped in
- Van wrap photo added April 3 via Cloudinary

### Book (/book) — Working Draft
- 16 services (6 main + More Services expandable), multi-select
- Form: service, preferredDate, timeWindow, name, phone, address, email, contactPreference, notes
- Returning customer phone lookup
- Component: BookingForm.tsx (691 lines)
- Pricing needs update to Jason's real numbers

### Contact (/contact) — Done
- Uses Netlify Forms (separate from Firebase — inconsistency noted)
- Hours: Mon-Fri 8AM-5PM, Sat-Sun Closed

### Admin (/admin) — Done, Auth Protected
- Firebase Auth with Google Sign-In (AdminAuthGuard)
- Full feature set: list/calendar/customers views, set appointment, confirm/complete/cancel/delete, comms log, admin notes, Google Calendar, toast notifications, new lead badges, real-time Firestore
- Missing: CSV export, manual customer entry, SMS (Twilio), tags/segments, vehicle tracking

### FAQ (/faq) — Placeholder Only
- Removed from nav, accessible via direct URL

### Service Areas (/service-areas) — Placeholder Only
- Removed from nav
- 12 pages needed: Balm, Ruskin, Ellenton, Palmetto, Fish Hawk, Gibsonton, Riverview, Apollo Beach, Parrish, Wimauma, Sun City, Sun City Center

### RV (/rv) — NOT YET BUILT
- Planned marketing page targeting RV park owners
- Same auto/diesel services apply

### Pitch Presentation (/pitch-presentation.html) — Done
- Static HTML, editable with lock code 8788
- Leave this alone.

---

## 6. JASON'S REAL PRICING (From Coastal_Pricing.xlsx)

### AUTO (Display on /services and /book)
- Syn Blend Oil Change: $89.95
- Full Synthetic Oil Change: $119.95
- Diesel Oil Change: $219.95
- Bundle tiers: Basic $119.95, Better $209.95, Best $309.95
- Tire Rotation: $39.95
- Mount & Balance 4 tires: $159.95
- Front + Rear Brakes: $320
- Cabin Air Filter: $99.95
- Battery: $50-100 labor
- HVAC Recharge: $299.99
- Brake Flush: $239.95
- Coolant Flush: $269.95
- Transmission Flush: $419.95

Display approach: "Starting at $XX.XX" with category groupings. Do NOT display hourly labor rates or per-quart upcharges.

### MARINE (Display on /marine)
- Outboard Small: $149.95
- Outboard V6/V8: $199.95
- Inboard Small: $229.95
- Inboard Large: $279.95
- Diesel Marine: $349.95
- Generator: $129.95
- Twin Surcharge: $75
- Lower Unit: $149.95
- Impeller: $249.95
- Trailer Tire M&B: $49.95 single
- Bearing Repack: from $179.95
- Travel Charge: $49.95

### FLEET (NO pricing on site — quote request only)
- Internal reference: PM-A/B/C tiers Gas $99.95-$189.95, Diesel $199.95-$329.95
- Do NOT display fleet pricing anywhere on the site

---

## 7. JASON'S OUR STORY CONTENT

Use this to replace placeholder About page content:
- Based in Apollo Beach, FL
- 30 years automotive dealership fixed ops experience
- Luxury customer service, white-glove care
- Faith-based values: integrity, honesty, hard work, kindness, service to others
- Serves Apollo Beach and South Shore communities
- Services: personal vehicles, boats, work trucks, RVs, trailers, fleet vehicles, recreational equipment

Write this in a warm, human tone. Not corporate, not salesy. A person telling their story. Follow all copy rules (no em dashes, no emojis, no AI tells).

---

## 8. FIRESTORE DATA MODEL

### `bookings` collection
Common fields: status, source, serviceCategory, phone, email, contactPreference, preferredDate, datesFlexible, createdAt, updatedAt, lastViewedAt, adminNotes, commsLog (array)

Source values: "homepage-widget" | "website" | "fleet-page" | "marine-page"
Status values: "pending" | "confirmed" | "completed" | "cancelled"

Booking page extras: service (comma-joined), services (array), name, address, timeWindow, notes, returningCustomer
Fleet extras: fleetSize
Marine extras: engineType, engineCount
Homepage widget extras: zip
Confirmed appointment: confirmedDate, confirmedArrivalWindow, estimatedDuration, confirmedAt

### Security Rules (DEPLOYED)
- Public create: anyone can submit bookings
- Admin read/write: authenticated allowlisted users only

---

## 9. CLOUD FUNCTIONS

| Function | Trigger | Purpose |
|---|---|---|
| onNewBooking | Firestore onCreate on bookings | Sends admin alert email to jon@jgoldco.com |
| sendConfirmationEmail | HTTP POST with CORS | Sends branded customer confirmation email with calendar link |

Gmail secrets stored via firebase functions:secrets. Do NOT modify Cloud Functions unless specifically instructed.

---

## 10. FILE STRUCTURE

```
src/app/
  about/page.tsx
  book/BookingForm.tsx          # 691 lines
  book/page.tsx
  contact/layout.tsx
  contact/page.tsx
  faq/page.tsx                  # Placeholder
  fleet/FleetContent.tsx
  fleet/page.tsx
  globals.css                   # DO NOT TOUCH
  layout.tsx
  marine/page.tsx
  page.tsx                      # Homepage
  service-areas/page.tsx        # Placeholder
  services/page.tsx
  services/ServicesContent.tsx
src/components/
  Button.tsx
  Footer.tsx
  Header.tsx
  HullStripe.tsx                # ORPHANED (not imported anywhere)
  TrustBar.tsx
  WaveDivider.tsx               # ORPHANED (not imported anywhere)
src/config/
  theme.ts
src/lib/
  cloudinary.ts
  firebase.ts
```

---

## 11. PRIORITY WORK QUEUE

### BEFORE STARTING: Run these checks
```bash
git status                    # Check for uncommitted WO-1 hero changes
git log --oneline -5          # Verify latest commits
npm run build                 # Verify clean build state
```
If there are uncommitted changes, commit them first:
```bash
git add -A && git commit -m "WO-1: Hero redesign (uncommitted from previous session)" && git push origin main
```

---

### TIER 1 — Real Content (Highest Impact, No Design Approval Needed)

**Task 1: Swap Real Automotive Pricing**
- Open `src/app/services/ServicesContent.tsx`
- Replace all placeholder prices with Jason's real pricing from Section 6 above
- Use "Starting at $XX.XX" format
- Group services logically: Oil Changes, Tires, Brakes, Maintenance, Fluids
- Verify $89.95 (not $89) for synthetic blend oil change everywhere
- Also update any pricing shown on homepage services tab and /book page to match
- Pricing on /book (BookingForm.tsx) service cards must match /services page

**Task 2: Swap Real Marine Pricing**
- Open `src/app/marine/page.tsx`
- Replace placeholder package pricing with Jason's real marine pricing from Section 6
- Restructure if needed: outboard services, inboard services, diesel marine, add-ons (lower unit, impeller, generator)
- Include travel charge note: "$49.95 travel charge applies"
- Twin surcharge: "+$75 for twin engines"

**Task 3: Update About Page with Real Content**
- Open `src/app/about/page.tsx`
- Replace placeholder story with Jason's real content from Section 7
- Keep the van wrap photo (added April 3)
- Tone: warm, personal, human. A 30-year veteran telling you why he started this.
- Include: Apollo Beach location, faith-based values, white-glove service philosophy
- Add the three service verticals (auto, fleet, marine, RV)

**Task 4: Update Business Hours Everywhere**
- Search entire codebase for any "7" AM or "6" PM or "7-6" or "7AM-6PM" references
- Replace ALL with: Mon-Fri 8AM-5PM, Sat-Sun Closed
- Check: Footer, Contact page, any FAQ content, booking page, admin

**Task 5: Fix Pricing on Booking Page**
- Open `src/app/book/BookingForm.tsx`
- Update all service names and prices to match Jason's real pricing
- Oil Change should show "Synthetic Blend Oil Change - $89.95"
- Full Synthetic should be separate: "$119.95"
- Add Diesel Oil Change: "$219.95"
- Bundle tiers if displayed: Basic $119.95, Better $209.95, Best $309.95
- Ensure service names match what's on /services page

### TIER 1B — Visual Redesign (AUTHORIZED — No Approval Needed)

The current site has navy bolted onto a white-bg design and it looks flat, blobby, and disconnected. The goal is to make it feel like the van wrap came to life. Here is the design direction:

**Design Philosophy:**
- Deep blue with sunset/orange energy — not flat corporate blocks
- Depth and texture: subtle gradients, layered elements, atmospheric backgrounds
- Bold typography with real visual hierarchy
- Contemporary layout that feels premium and investor-ready
- Smooth transitions between sections (gradient fades, not hard color cuts)
- The oval badge logo should feel integrated, not floating awkwardly
- Think: high-end automotive brand website meets Florida coastal energy

**Specific Direction:**
- Hero: atmospheric navy with gradient depth, integrate the oval badge as a subtle watermark or background element (not a floating logo), frosted glass or translucent card for the quote widget, van wrap photo as hero image if it looks good
- Section transitions: use gradient fades between navy and lighter sections, never hard color cuts
- Services section: cards with depth (subtle shadows, hover lift), category images, clean pricing display
- How It Works: make it visually interesting — not just three circles with numbers
- Stats bar: bold, impactful, fits the dark-to-light flow
- Reviews: warm sand or cream background, clean testimonial cards
- Trust bar: integrated into the page flow, not floating between two same-color sections
- Footer: keep the oval badge, navy background, clean grid layout
- Mobile: everything must stack and work at 375px

**Task 16: Homepage Visual Redesign**
- Read `src/app/page.tsx` in full
- Rebuild the visual layer section by section:
  1. Hero section: atmospheric navy gradient, integrate badge, frosted quote widget
  2. Services tabs: clean cards with shadows, real images, pricing
  3. How It Works: visually engaging, not generic circles
  4. Stats bar: bold metrics with depth
  5. Trust bar: positioned well in the page flow
  6. Reviews: warm background, polished cards
  7. Final CTA: compelling, on-brand
- Use the existing color palette but add depth with gradients, opacity layers, and subtle shadows
- Do NOT change any functionality — forms, links, and data flow must still work
- Run `npm run build` after changes
- Test that quote widget still writes to Firestore (check the form submission code path)

**Task 17: Service Pages Visual Polish**
- Apply the same visual treatment to /services, /fleet, /marine
- Read each component file first (ServicesContent.tsx, FleetContent.tsx, marine/page.tsx)
- Add depth and texture to match the redesigned homepage
- Ensure visual consistency across all pages
- Do NOT change any form functionality or data flow
- Keep inline quote forms on fleet and marine working

**Task 18: About Page Visual Polish**
- Read `src/app/about/page.tsx`
- After Task 3 swaps in real content, give it the same visual treatment
- Jason's story should feel personal and premium
- Van wrap photo should be showcased prominently
- Value props and verticals section should have depth

### TIER 2 — SEO Infrastructure (No Design Approval Needed)

**Task 6: Build Sitemap, Robots.txt, and Meta Tags**
- Generate sitemap.xml with all public routes: /, /services, /fleet, /marine, /about, /book, /contact
- Create robots.txt: allow all, point to sitemap, block /admin
- Add Open Graph meta tags to all public pages: og:title, og:description, og:image (use hero-van-driveway from Cloudinary), og:url, og:type
- Add twitter:card meta tags
- Add JSON-LD structured data: Organization + LocalBusiness (Apollo Beach, FL) + Service schemas

**Task 7: Build Service Area Pages**
- Create /service-areas as a hub page
- List all 12 service areas: Balm, Ruskin, Ellenton, Palmetto, Fish Hawk, Gibsonton, Riverview, Apollo Beach, Parrish, Wimauma, Sun City, Sun City Center
- Each area: card with area name, 2-3 sentence description mentioning the area by name, "Book Service in [Area]" CTA linking to /book
- Design: clean grid of cards, alternating white/sand sections
- Add /service-areas to footer navigation
- This is primarily SEO infrastructure. Content should be unique per area (mention landmarks, neighborhoods, distance from Apollo Beach, etc.)

**Task 8: Build FAQ Page**
- Build out /faq with real content:
  - How does mobile service work?
  - What areas do you serve? (Apollo Beach and South Shore — list the 12 areas)
  - How do I book? (online form, call 813-722-LUBE, or text)
  - What's included in an oil change? ($89.95 synthetic blend, filter, multi-point inspection)
  - Do you service fleets? (yes, dedicated fleet program, quote-based)
  - Do you service boats? (yes, marine division, outboard/inboard/diesel)
  - Do you service RVs? (yes, same auto/diesel services apply)
  - What payment methods? (Zelle, Venmo, cash, check)
  - Licensed and insured? (yes, fully licensed, insured, ASE-certified)
  - Vacuum extraction? (no drain plug removal, cleaner, faster, no mess)
  - Hours? (Mon-Fri 8AM-5PM, Sat-Sun Closed)
  - How fast? (Most services completed in under an hour)
  - Rain? (work rain or shine with covered equipment)
- Accordion-style FAQ, navy headings, clean cards
- Add /faq to footer navigation
- Add FAQ schema markup (JSON-LD FAQPage) for Google rich results
- CTA at bottom: "Still have questions? Call us at 813-722-LUBE"

### TIER 3 — Feature Enhancements (No Design Approval Needed)

**Task 9: CSV/Excel Export in Admin**
- Add "Export" button to admin dashboard header
- Export bookings as CSV: Date, Customer, Phone, Email, Service, Source, Status, Notes, Created
- Export customers as CSV: Name, Phone, Email, Total Bookings, Last Booking, Tags
- Client-side CSV generation (no server dependency)
- Style as secondary button (not orange CTA)

**Task 10: Add Customer Manually in Admin**
- Add "New Customer" button in Customers tab
- Modal form: Name, Phone, Email, Notes
- Writes to Firestore
- Should appear in customer list immediately via real-time listener

**Task 11: Build RV Marketing Page**
- Create /rv route
- Target audience: RV owners and RV park communities
- Content: same auto/diesel services apply to RVs (oil changes, tire service, brake checks, fluid services)
- Pricing: use auto pricing (synthetic blend $89.95, diesel $219.95, etc.)
- Unique angle: "We come to your RV park, your campsite, or your storage lot"
- Include service area (Apollo Beach and South Shore)
- Quote form inline (similar to fleet page, writes to Firestore with source: "rv-page")
- Add /rv to footer navigation under Services

**Task 12: Copy Polish Pass**
- Review ALL page copy for:
  - AI-sounding phrases (replace with natural human language)
  - Inconsistent pricing (verify all match Jason's real numbers)
  - Missing phone number (813-722-LUBE should be on every page)
  - "Tampa" references (should say Apollo Beach or South Shore where referring to business location)
  - Generic filler that should be specific to Coastal Mobile
  - Em dashes (replace with commas/periods/colons)
  - Emojis (remove)
  - Old hours (change any 7-6 or 7AM references to 8-5)
- Do NOT change page structure or layout — text content only

### TIER 4 — Performance and Polish (If Time Permits)

**Task 13: Blog Infrastructure**
- Create /blog route with listing page
- Blog post template component
- Write 3 starter posts (~500 words each):
  1. "Why Mobile Oil Changes Save You More Than Just Time"
  2. "Fleet Maintenance in Apollo Beach: How Mobile Service Keeps Your Vehicles Running"
  3. "Boat Engine Oil Changes: What Every South Shore Boater Should Know"
- Blog listing: card grid with title, excerpt, date, read more
- Add /blog to footer navigation
- All content follows copy rules

**Task 14: GA4 Setup**
- Add GA4 tracking via gtag.js
- Use env var NEXT_PUBLIC_GA4_MEASUREMENT_ID (add placeholder if doesn't exist, note in QA report)
- Track: page views (auto), form_submit (all forms, with source), cta_click (all CTAs), phone_click (tel: links)

**Task 15: Performance Audit**
- Verify all images use lazy loading
- Check for unnecessary client-side JS on public pages
- Add missing alt text on all images
- Verify heading hierarchy (one h1 per page, proper h2/h3 cascade)
- Standardize border-radius to design tokens (14px cards, 8px inputs)
- Clean up orphaned components (HullStripe.tsx, WaveDivider.tsx) — delete them if truly unused
- Remove any console.log statements

---

## 12. DO NOT TOUCH (Requires Human Action or Design Approval)

- **Custom domain setup** — requires PorkBun DNS changes (Jon has credentials)
- **Firebase Auth authorized domains** — manual Firebase Console step
- **Google Workspace setup** — external account creation
- **Google Business Profile** — external platform
- **Twilio account** — external service, not set up
- **Social media accounts** — external platforms
- **Logo vectorization** — Fiverr order
- **Real photos** — waiting on van (~April 15)
- **Cloud Functions** — require Firebase CLI auth, separate deploy
- **globals.css** — locked, do not modify
- **tailwind config** — locked, do not modify
- **Pricing changes** — only swap to Jason's real numbers as listed above. Do not invent prices.

---

## 13. KNOWN ISSUES TO BE AWARE OF

1. Contact form uses Netlify Forms while bookings use Firebase — two separate backends. Do not try to unify overnight.
2. Fleet page hardcodes a Cloudinary URL instead of using the helper function. Low priority, leave it.
3. Homepage "Starting at $49" pricing may appear — update to $89.95 to match real pricing.
4. Some border-radius inconsistencies (14px vs 12px cards, 8px vs 10px inputs). Standardize if you touch those components.
5. H1 sizes range from 34px to 50px. Do not attempt to fix system-wide — only in files you're already editing.

---

## 14. QA REPORT TEMPLATE

Write to `~/coastal-mobile-lube/OVERNIGHT-QA-REPORT.md`:

```markdown
# Overnight QA Report — [Date]

## Git State at Start
- Branch: [branch]
- Last commit: [hash] [message]
- Uncommitted changes: [yes/no, what]

## Tasks Completed
- [Task N]: [What was done] — PASS / ISSUES
  - Files changed: [list]
  - Self-QA issues found and fixed: [list or "none"]
  - Commit: [hash]

## Tasks Skipped or Blocked
- [Task N]: [Why]

## Build Status
- Final npm run build: PASS / FAIL
- Deploy: [deployed / not deployed / errors]

## Notes for Jon
- [Anything needing human review]
- [Any pricing or content questions]
- [Any files that need design approval before further work]
```

---

## 15. GIT WORKFLOW

- Work on `main` branch
- Commit after each completed task: `[Task N] Brief description`
- Push after each tier or at end: `git push origin main`
- Deploy after pushing: `npx netlify-cli deploy --prod`
- If deploy fails with EPIPE, retry: `npx netlify-cli deploy --prod --skip-functions-cache`

---

*Merged from: OpenClaw Project (session checkpoints Mar 23-26) + Coastal Project (project state dump Apr 3)*
*Total project history: ~20+ hours across 50+ work orders*
*This file supersedes all previous specs and checkpoints*
