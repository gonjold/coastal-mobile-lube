# SITE AUDIT: Coastal Mobile Lube & Tire — Full Codebase Analysis

**Date:** 2026-03-24
**Auditor:** Claude Code (read-only)
**Branch:** main
**Last commit:** `57328ec` — design: site-wide polish — visual rhythm, trust signals, spacing, hierarchy

---

## Step 1: Directory Structure

```
src/app/about/page.tsx
src/app/book/BookingForm.tsx
src/app/book/page.tsx
src/app/contact/layout.tsx
src/app/contact/page.tsx
src/app/faq/page.tsx
src/app/fleet/FleetContent.tsx
src/app/fleet/page.tsx
src/app/globals.css
src/app/layout.tsx
src/app/marine/page.tsx
src/app/page.tsx
src/app/service-areas/page.tsx
src/app/services/page.tsx
src/app/services/ServicesContent.tsx
src/components/Button.tsx
src/components/Footer.tsx
src/components/Header.tsx
src/components/HullStripe.tsx
src/components/TrustBar.tsx
src/components/WaveDivider.tsx
src/config/theme.ts
src/lib/cloudinary.ts
src/lib/firebase.ts
```

**24 files total** (15 TSX, 7 TS, 1 CSS, 1 layout)

---

## Step 2: Page-by-Page Analysis

### 2.1 Home — `src/app/page.tsx`

- **Route:** `/`
- **Page title:** "Coastal Mobile Lube & Tire | Mobile Oil Change, Tire & Marine Service in Tampa" (from root layout metadata)
- **Total lines:** 463
- **Sections (top to bottom):**

| # | Section | Background |
|---|---------|-----------|
| 1 | **Hero** — H1 "The shop comes to you.", subtitle, two CTAs (Book Online + Call), trust badges (Factory-trained, Licensed & insured, Same-week availability). Right column: "Get a quick quote" booking widget with Automotive/Fleet/Marine tabs, service dropdown, zip, phone, notes, "Get My Quote" button | `bg-white` |
| 2 | **Services** — Tabbed section (Automotive / Fleet & Commercial / Marine) showing title, description, pricing, checklist of items, image with "Ready to book? → Get Quote" overlay | `bg-[#FAFBFC]` |
| 3 | **How It Works** — Three steps: Book online or call → We show up → Done. Go. | `bg-white` |
| 4 | **Stats Bar** — 30+ years, <1hr, 100% mobile, $0 surprise fees | `bg-[#0B2040]` (navy) |
| 5 | **Trust Bar** — Shared TrustBar component | `bg-[#0B2040]` (navy) |
| 6 | **CTA** — "Skip the shop." with Book Online + Call buttons | `bg-[#FAFBFC]` |
| 7 | **Mobile Sticky Bottom Bar** — Phone icon + "Book Online" button (visible on < lg only) | `bg-white` with border-t |

- **CTAs:**

| Text | Destination | Style |
|------|------------|-------|
| "Book Online" (hero) | `/book` | Button component, primary lg |
| "Call 813-722-LUBE" (hero) | `tel:8137225823` | White outlined button |
| "Get My Quote" (widget) | **No action** — plain `<button>` with no `onClick` or form submission | Orange bg button |
| "Get Quote" (services overlay) | `/book` | Orange link-button |
| "Book Online" (CTA section) | `/book` | Button component, primary lg |
| "Call 813-722-LUBE" (CTA section) | `tel:8137225823` | White outlined button |
| "Book Online" (sticky bar) | `/book` | Orange full-width |
| Phone icon (sticky bar) | `tel:8137225823` | Bordered icon button |
| "813-722-LUBE" (widget sub-text) | `tel:8137225823` | Blue text link |

- **Forms:**
  - **Booking Widget** — Fields: Service Needed (select, dynamic per tab), Zip Code (text), Phone (tel), Notes (textarea). **CRITICAL: No form submission handler. No `onSubmit`, no `onClick` on the "Get My Quote" button. No Firebase write. The widget is purely visual / non-functional.**

- **Images (via Cloudinary helper):**
  - `images.drivewayService` (automotive tab)
  - `images.commercialService` (fleet tab)
  - `images.marinaBoatsAlt` (marine tab)
  - All rendered at `width: 800, height: 600`

- **Data connections:** None (no Firebase reads/writes)

---

### 2.2 About — `src/app/about/page.tsx`

- **Route:** `/about`
- **Page title:** "About Coastal Mobile | Coastal Mobile Lube & Tire"
- **Total lines:** 35
- **Sections:**

| # | Section | Background |
|---|---------|-----------|
| 1 | **Hero banner** — H1 "About Coastal Mobile", subtitle "30 years of dealership expertise, brought directly to you." | `bg-navy` (`#0B2040`) |
| 2 | **Body** — Single paragraph placeholder: "Full story coming soon." | `bg-white` (`.section`) |

- **CTAs:** None
- **Forms:** None
- **Images:** None
- **Data connections:** None
- **NOTE:** This is a **placeholder page** with minimal content.

---

### 2.3 Book — `src/app/book/page.tsx` + `src/app/book/BookingForm.tsx`

- **Route:** `/book`
- **Page title:** "Book Mobile Service | Coastal Mobile Lube & Tire"
- **Total lines:** 13 (page.tsx) + 691 (BookingForm.tsx) = **704 total**
- **Sections:**

| # | Section | Background |
|---|---------|-----------|
| 1 | **Hero** — "Book Service" eyebrow, H1 "Schedule your service", subtitle about 2-hour confirmation | `bg-white` |
| 2 | **Trust Bar** — Shared TrustBar component | `bg-[#0B2040]` |
| 3 | **Form + Sidebar** — Left: full booking form with returning customer lookup; Right: How it works, What's included, Prefer to call? | `bg-[#FAFBFC]` |
| 4 | **Confirmation state** — Replaces form after successful submit: "You're all set!" with service/date/phone details, "Book Another Service" and "Back to Home" buttons | Same section |

- **CTAs:**

| Text | Destination | Style |
|------|------------|-------|
| "Fleet or Marine Service → Request a custom quote" | `/contact` | Navy bg banner link |
| "Request Appointment" | Firebase submit | Orange full-width button |
| "Book Another Service" (post-submit) | Resets form | Orange button |
| "Back to Home" (post-submit) | `/` | Navy outlined button |
| "813-722-LUBE" (sidebar) | `tel:8137225823` | Orange bold link |
| "813-722-LUBE" (post-submit) | `tel:8137225823` | Bold link |

- **Forms:**
  - **Booking Form** — Fields: Service (card select: Oil Change $89, Tire Service $75, Brake Service $199, A/C Service $149, Battery Replacement $149, Full Maintenance $179), Preferred Date (date input, tomorrow to +60 days), Preferred Time (button group: Morning 7-10, Midday 10-1, Afternoon 1-5), Your Name (text), Phone (tel), Service Address (text), Notes (textarea)
  - **On submit:** Writes to Firebase `bookings` collection
  - **On success:** Shows confirmation screen

  - **Returning Customer Lookup** — Phone field, "Find me" button. Queries Firebase `bookings` collection by `phone`, auto-fills name/phone/address.

- **Images:** None
- **Data connections:**
  - **Firestore WRITE** → `bookings` collection: `{ service, preferredDate, timeWindow, name, phone (stripped), address, notes, status: "pending", source: "website", returningCustomer, createdAt, updatedAt }`
  - **Firestore READ** → `bookings` collection: `where("phone", "==", digits)` for returning customer lookup

---

### 2.4 Contact — `src/app/contact/page.tsx` + `src/app/contact/layout.tsx`

- **Route:** `/contact`
- **Page title:** "Contact Us | Coastal Mobile Lube & Tire | Tampa FL" (from layout.tsx)
- **Total lines:** 307 (page.tsx) + 16 (layout.tsx) = **323 total**
- **Sections:**

| # | Section | Background |
|---|---------|-----------|
| 1 | **Hero** — "Contact" eyebrow, H1 "Get in touch", subtitle | `bg-white` |
| 2 | **Form + Contact Info** — Left: Netlify form (name, phone, email, interest dropdown, message). Right: Call/text (813-722-LUBE), Email (info@coastalmobilelube.com), Service area list, Business hours | `bg-[#FAFBFC]` |
| 3 | **CTA** — "Prefer to book directly?" with Book Online + Call buttons | `bg-[#0B2040]` |

- **CTAs:**

| Text | Destination | Style |
|------|------------|-------|
| "Send Message" | Form submit (Netlify) | Orange button |
| "Send another message" (post-submit) | Resets form | Blue text link |
| "813-722-LUBE" (sidebar) | `tel:8137225823` | Orange bold link |
| "info@coastalmobilelube.com" (sidebar) | `mailto:info@coastalmobilelube.com` | Navy link |
| "Book Online" (bottom CTA) | `/book` | Orange button |
| "Call 813-722-LUBE" (bottom CTA) | `tel:8137225823` | White outlined button |
| "813-722-LUBE" (post-submit) | `tel:8137225823` | Bold link |

- **Forms:**
  - **Contact Form** — Fields: Name (required), Phone (required), Email (required), Interest (select: General inquiry, Automotive service quote, Fleet & commercial services, Marine service quote, Partnership or business opportunity, Other), Message (required)
  - **Submission:** `POST /` with `data-netlify="true"` attribute. Uses `fetch("/")` with form-urlencoded body; falls back to native form submit on error.
  - **On success:** Shows "Message sent." confirmation

- **Images:** None
- **Data connections:** Netlify Forms (not Firebase)

---

### 2.5 FAQ — `src/app/faq/page.tsx`

- **Route:** `/faq`
- **Page title:** "Frequently Asked Questions | Coastal Mobile Lube & Tire"
- **Total lines:** 35
- **Sections:**

| # | Section | Background |
|---|---------|-----------|
| 1 | **Hero banner** — H1 "Frequently Asked Questions" | `bg-navy` |
| 2 | **Body** — Single paragraph placeholder: "Our full FAQ section with detailed answers is coming soon." | `bg-white` |

- **CTAs:** None (mentions calling 813-722-LUBE in body text, but not as a link)
- **Forms:** None
- **Images:** None
- **Data connections:** None
- **NOTE:** This is a **placeholder page** with no actual FAQ content. The fleet and services pages have their own built-in FAQ sections with real content.

---

### 2.6 Fleet — `src/app/fleet/page.tsx` + `src/app/fleet/FleetContent.tsx`

- **Route:** `/fleet`
- **Page title:** "Fleet & Commercial Mobile Service | Tampa FL | Coastal Mobile Lube & Tire"
- **Total lines:** 14 (page.tsx) + 419 (FleetContent.tsx) = **433 total**
- **Sections:**

| # | Section | Background |
|---|---------|-----------|
| 1 | **Hero** — "Fleet & Commercial" eyebrow, H1 "Keep your fleet on the road", subtitle, Get Fleet Quote + Call CTAs, hero image | `bg-white` |
| 2 | **Vehicle Types** — 3 cards: Company Cars & Sedans, Vans & SUVs, Box Trucks & Heavy-Duty | `bg-[#FAFBFC]` |
| 3 | **The Process** — 4 steps: Consultation → Custom plan → Scheduled visits → Reporting | `bg-white` |
| 4 | **Why Fleet Managers Choose Us** — 6 value props with orange left-border | `bg-[#0B2040]` |
| 5 | **Fleet Services List** — 10 services with descriptions | `bg-[#FAFBFC]` |
| 6 | **Fleet CTA** — "Let's talk about your fleet." with Request Consultation + Call | `bg-[#0B2040]` |
| 7 | **Fleet FAQs** — 6 accordion Q&As | `bg-white` |
| 8 | **Other Services Teaser** — 2 cards: Automotive → /services, Marine → /marine | `bg-[#FAFBFC]` |

- **CTAs:**

| Text | Destination | Style |
|------|------------|-------|
| "Get Fleet Quote" | `/contact` | Button primary lg |
| "Call 813-722-LUBE" | `tel:8137225823` | White outlined |
| "Request Consultation" | `/contact` | Button primary lg |
| "Call 813-722-LUBE" (second) | `tel:8137225823` | White outlined on navy |
| "Learn about automotive services" | `/services` | Orange text link w/ arrow |
| "Learn about marine services" | `/marine` | Orange text link w/ arrow |

- **Forms:** None
- **Images:**
  - Hardcoded Cloudinary URL: `https://res.cloudinary.com/dgcdcqjrz/image/upload/w_1600,h_450,c_fill,q_auto:good,f_auto/v1774318456/commercial-service_wbgfog.jpg` (NOT using the `cloudinaryUrl` helper)
- **Data connections:** None

---

### 2.7 Marine — `src/app/marine/page.tsx`

- **Route:** `/marine`
- **Page title:** "Marine Services | Coastal Mobile Lube & Tire"
- **Total lines:** 35
- **Sections:**

| # | Section | Background |
|---|---------|-----------|
| 1 | **Hero banner** — H1 "Marine Services" | `bg-navy` |
| 2 | **Body** — Single paragraph placeholder: "Full marine service menu coming soon." | `bg-white` |

- **CTAs:** None
- **Forms:** None
- **Images:** None
- **Data connections:** None
- **NOTE:** This is a **placeholder page**. Despite being prominently featured in navigation and home page tabs with a full marine service list, the dedicated /marine page has no real content.

---

### 2.8 Service Areas — `src/app/service-areas/page.tsx`

- **Route:** `/service-areas`
- **Page title:** "Service Areas | Coastal Mobile Lube & Tire"
- **Total lines:** 35
- **Sections:**

| # | Section | Background |
|---|---------|-----------|
| 1 | **Hero banner** — H1 "Service Areas" | `bg-navy` |
| 2 | **Body** — Single paragraph placeholder: "Detailed service area information and scheduling by location coming soon." | `bg-white` |

- **CTAs:** None
- **Forms:** None
- **Images:** None
- **Data connections:** None
- **NOTE:** This is a **placeholder page**.

---

### 2.9 Services — `src/app/services/page.tsx` + `src/app/services/ServicesContent.tsx`

- **Route:** `/services`
- **Page title:** "Mobile Auto Services in Tampa | Oil Change, Tires, Brakes | Coastal Mobile"
- **Total lines:** 14 (page.tsx) + 371 (ServicesContent.tsx) = **385 total**
- **Sections:**

| # | Section | Background |
|---|---------|-----------|
| 1 | **Hero** — "Automotive Services" eyebrow, H1 "Mobile maintenance at your door", subtitle, Get a Quote + Call CTAs | `bg-white` |
| 2 | **Service Cards** — 7 cards: Synthetic Oil Change ($49), Tire Sales/Installation/Rotation, Brake Inspection, Battery Testing, Fluid Top-Off, Air & Cabin Filter ($29/filter), Wiper Blade ($19/blade). Each with description, detail bullets, price, "Book This Service" link | `bg-[#FAFBFC]` |
| 3 | **Not Sure CTA** — "Not sure what you need?" with Get a Quote + Call | `bg-white` |
| 4 | **FAQs** — 7 accordion Q&As about mobile service | `bg-white` |
| 5 | **Other Services Teaser** — 2 cards: Fleet & Commercial → /fleet, Marine → /marine | `bg-[#0B2040]` |

- **CTAs:**

| Text | Destination | Style |
|------|------------|-------|
| "Get a Quote" (hero) | `/book` | Button primary lg |
| "Call 813-722-LUBE" (hero) | `tel:8137225823` | White outlined |
| "Book This Service" (x7, per card) | `/book` | Orange text link w/ arrow |
| "Get a Quote" (not sure section) | `/book` | Button primary lg |
| "Call 813-722-LUBE" (not sure section) | `tel:8137225823` | White outlined |
| "Learn about fleet services" | `/fleet` | Orange text link w/ arrow |
| "Learn about marine services" | `/marine` | Orange text link w/ arrow |

- **Forms:** None
- **Images (via Cloudinary helper):**
  - `images.oilChangeService` (800x600) — Oil Change card
  - `images.tireService` (800x600) — Tire card
  - `images.drivewayServiceAlt` (800x600) — Brake card
  - `images.oilChangeServiceAlt` (800x600) — Battery card
  - `images.vanInteriorEquipment` (800x600) — Fluid card
  - `null` — Filter card (no image)
  - `null` — Wiper card (no image)
- **Data connections:** None

---

## Step 3: Shared Components Analysis

### 3.1 `Button.tsx`

- **What it does:** Reusable button/link component. Renders as `<Link>` when `href` is provided, otherwise as `<button>`.
- **Used by:** Home (`/`), Fleet (`/fleet`), Services (`/services`), Header, Mobile drawer
- **Key props:** `children`, `href?`, `variant?: "primary" | "secondary"`, `size?: "sm" | "md" | "lg"`, `className?`, `onClick?`, `type?`
- **Styles:** Primary = orange bg + white text. Secondary = navy border + navy text, hover inverts. Uses `--radius-button` CSS var.

### 3.2 `Footer.tsx`

- **What it does:** Site-wide footer with 4 columns: Brand/phone, Services links, Company links, Service Areas links. Plus bottom bar with copyright and "Website by JG Systems".
- **Used by:** Root layout (every page)
- **Key props:** None
- **Links — Services column:** Automotive → /services, Fleet & Commercial → /fleet, Marine → /marine, Book Online → /book
- **Links — Company column:** About → /about, Service Areas → /service-areas, FAQ → /faq, Contact → /contact
- **Links — Service Areas column:** Tampa, Brandon, Riverview, Wesley Chapel, Plant City, Lutz → all link to /service-areas

### 3.3 `Header.tsx`

- **What it does:** Sticky top header with logo, desktop nav, phone button, "Book Now" button. Mobile: phone icon + hamburger → slide-out drawer with nav links, phone, "Book Online" button.
- **Used by:** Root layout (every page)
- **Key props:** None
- **Nav links:** Services → /services, Fleet → /fleet, Marine → /marine, About → /about, Contact → /contact
- **Desktop actions:** Phone → `tel:8137225823`, "Book Now" → /book
- **Mobile drawer actions:** Same nav links + Phone → `tel:8137225823`, "Book Online" → /book
- **Scroll behavior:** Adds `shadow-sm` on scroll > 10px. Body scroll locked when drawer open.

### 3.4 `HullStripe.tsx`

- **What it does:** Decorative horizontal stripe element with blue/orange/gold color bands.
- **Used by:** **Not imported anywhere** — orphan component
- **Key props:** None

### 3.5 `TrustBar.tsx`

- **What it does:** Full-width navy bar showing 4 trust signals with icons: Fully Licensed & Insured, ASE-Certified Technicians, 12-Month Service Warranty, Transparent Pricing No Surprises.
- **Used by:** Home (`/`), Book (`/book`)
- **Key props:** None

### 3.6 `WaveDivider.tsx`

- **What it does:** SVG wave section divider with configurable color and flip direction.
- **Used by:** **Not imported anywhere** — orphan component
- **Key props:** `color?` (default #FFFFFF), `flip?` (boolean), `className?`

---

## Step 4: Navigation & Routing Map

### 4.1 Header Nav Links (Desktop)

| Text | Destination | Status |
|------|------------|--------|
| Services | `/services` | Full content |
| Fleet | `/fleet` | Full content |
| Marine | `/marine` | **Placeholder** |
| About | `/about` | **Placeholder** |
| Contact | `/contact` | Full content |
| 813-722-LUBE | `tel:8137225823` | Phone link |
| Book Now | `/book` | Full content |

### 4.2 Header Mobile Drawer Links

Same as desktop, with "Book Online" instead of "Book Now" button text.

### 4.3 Footer Links

**Services column:**
| Text | Destination | Status |
|------|------------|--------|
| Automotive | `/services` | Full content |
| Fleet & Commercial | `/fleet` | Full content |
| Marine | `/marine` | **Placeholder** |
| Book Online | `/book` | Full content |

**Company column:**
| Text | Destination | Status |
|------|------------|--------|
| About | `/about` | **Placeholder** |
| Service Areas | `/service-areas` | **Placeholder** |
| FAQ | `/faq` | **Placeholder** |
| Contact | `/contact` | Full content |

**Service Areas column:**
All 6 cities (Tampa, Brandon, Riverview, Wesley Chapel, Plant City, Lutz) → `/service-areas` — **Placeholder**

### 4.4 Mobile Sticky Bottom Bar (Home Page Only)

| Element | Destination |
|---------|------------|
| Phone icon | `tel:8137225823` |
| "Book Online" | `/book` |

### 4.5 All Internal Links by Page

**Home (`/`):**
- Book Online → /book (hero, CTA section, sticky bar)
- Get Quote → /book (services section overlay)
- Call links → tel:8137225823

**Book (`/book`):**
- Fleet or Marine Service → /contact
- Back to Home → / (post-submit)

**Contact (`/contact`):**
- Book Online → /book (bottom CTA)

**Services (`/services`):**
- Get a Quote → /book (hero)
- Book This Service (x7) → /book
- Learn about fleet services → /fleet
- Learn about marine services → /marine

**Fleet (`/fleet`):**
- Get Fleet Quote → /contact
- Request Consultation → /contact
- Learn about automotive services → /services
- Learn about marine services → /marine

**About (`/about`):** No internal links in content
**FAQ (`/faq`):** No internal links (phone number mentioned in text, not a link)
**Marine (`/marine`):** No internal links in content
**Service Areas (`/service-areas`):** No internal links in content

### 4.6 Broken / Dead Links

No technically broken links (all routes have corresponding page files). However, 4 routes are **effectively broken** because they show placeholder "coming soon" content:
- `/about` — "Full story coming soon."
- `/faq` — "coming soon"
- `/marine` — "coming soon"
- `/service-areas` — "coming soon"

### 4.7 Orphan Pages

None. All pages are reachable via header nav, footer, or cross-links from other pages.

---

## Step 5: CTA Flow Analysis

### 5.1 Book Automotive Service — Entry Points

| Page | CTA Text | Destination |
|------|----------|------------|
| Home | "Book Online" (hero) | `/book` |
| Home | "Get My Quote" (widget) | **BROKEN — no handler** |
| Home | "Get Quote" (services overlay) | `/book` |
| Home | "Book Online" (CTA section) | `/book` |
| Home | "Book Online" (sticky bar) | `/book` |
| Services | "Get a Quote" (hero) | `/book` |
| Services | "Book This Service" (x7 per card) | `/book` |
| Services | "Get a Quote" (not sure section) | `/book` |
| Contact | "Book Online" (bottom CTA) | `/book` |
| Header | "Book Now" (desktop) | `/book` |
| Header | "Book Online" (mobile drawer) | `/book` |

### 5.2 Request Fleet Quote — Entry Points

| Page | CTA Text | Destination |
|------|----------|------------|
| Fleet | "Get Fleet Quote" (hero) | `/contact` |
| Fleet | "Request Consultation" (CTA) | `/contact` |
| Book | "Fleet or Marine Service → Request a custom quote" | `/contact` |
| Home | Quick quote widget (Fleet tab) | **BROKEN — no handler** |

### 5.3 Request Marine Quote — Entry Points

| Page | CTA Text | Destination |
|------|----------|------------|
| Book | "Fleet or Marine Service → Request a custom quote" | `/contact` |
| Home | Quick quote widget (Marine tab) | **BROKEN — no handler** |

**Note:** The `/marine` page itself has NO CTAs — no way to request a quote, book service, or take any action from that page.

### 5.4 Where does "Book Now" (header) go?

`/book` — the booking form page.

### 5.5 Where does "Book Online" go on each page?

Always goes to `/book` across all pages.

### 5.6 Where does "Get a Quote" / "Get My Quote" go?

- "Get a Quote" (Services page hero + "not sure" section) → `/book`
- "Get My Quote" (Home page widget) → **NOWHERE — non-functional button**
- "Get Fleet Quote" (Fleet hero) → `/contact`
- "Get Quote" (Home services overlay) → `/book`

### 5.7 CTA Inconsistencies

| Issue | Details |
|-------|---------|
| **"Get My Quote" button is non-functional** | The home page booking widget has no submit handler. Users can fill out the form but nothing happens when they click the button. This is the most prominent CTA on the entire site. |
| **Inconsistent CTA text for the same action** | "Book Online", "Book Now", "Get a Quote", "Get Quote", "Book This Service" all go to `/book`. The variety may confuse users about whether these lead to the same place. |
| **Fleet/Marine quote goes to generic Contact** | Fleet quote CTAs go to `/contact` which is a generic contact form, not a fleet-specific intake. |
| **No marine-specific CTA path** | There is no dedicated way to request marine service. The `/marine` page has zero CTAs. The only path is the "Fleet or Marine Service" link on the booking page → generic contact form. |
| **Phone number on FAQ page is not a link** | FAQ page mentions "call us at 813-722-LUBE" but it's plain text, not a `tel:` link. |

---

## Step 6: Design Consistency Check

### 6.1 Background Colors

| Color | Hex | Usage |
|-------|-----|-------|
| White | `#FFFFFF` / `bg-white` | Hero sections, how-it-works, FAQ sections |
| Surface/Light gray | `#FAFBFC` / `bg-[#FAFBFC]` | Services sections, form sections, teaser sections |
| Navy | `#0B2040` / `bg-[#0B2040]` / `bg-navy` | Stats bar, trust bar, fleet dark sections, footer, CTAs |
| **Note:** `bg-navy` in CSS maps to `#0B2040` | Same value | Used on about/faq/marine/service-areas placeholder pages |

### 6.2 Border Radius Values

| Value | Usage |
|-------|-------|
| `rounded-[12px]` | Cards, form containers, images, booking widget, service cards |
| `rounded-[10px]` | Input fields, buttons (booking form), service items on fleet page, sticky bar phone button |
| `rounded-[14px]` | Step number badges (how-it-works), `--radius-card: 14px` in theme |
| `rounded-[var(--radius-button)]` (= `8px`) | Button component, CTA buttons |
| `rounded-lg` (= `8px`) | Tab container on home page |
| `rounded-md` (= `6px`) | Tab buttons, "Get Quote" overlay button |
| `rounded-full` | Confirmation checkmark circle, mobile phone icon, dot bullets |
| `rounded-[6px]` | Check icon boxes (hero badges) |
| `rounded-[11px]` | Header logo |

**Inconsistencies:**
- The theme defines `--radius-card: 14px` but most cards actually use `rounded-[12px]`
- Input fields use `rounded-[10px]` but theme defines `--radius-input: 8px`
- Some buttons use `rounded-[var(--radius-button)]` (8px), others use `rounded-[10px]`

### 6.3 Font Sizes

**Headings:**

| Size | Usage |
|------|-------|
| `text-[50px]` / `md:text-[50px]` | Home page H1 only |
| `text-4xl md:text-5xl` (36px/48px) | Placeholder pages (about, faq, marine, service-areas) |
| `text-[42px]` / `md:text-[42px]` | Services, Fleet, Contact H1s |
| `text-[34px]` / `md:text-[34px]` | Home services H2, home CTA H2, booking form H1 |
| `text-[30px]` | Services H1, Fleet H1 (mobile) |
| `text-[28px]` | Section H2s (most pages), confirmation H2, fleet section H2s |
| `text-[24px]` | Contact CTA H2, contact confirmation H2 |
| `text-[22px]` | Service card names, home service tab title |
| `text-[20px]` | Teaser card titles |
| `text-[19px]` | Booking widget H2 |
| `text-[18px]` | Step titles (how-it-works), vehicle type card titles, fleet service titles |
| `text-[16px]` | Booking form sidebar H3s |
| `text-lg` (18px) | Placeholder page subtitles, footer brand |

**Body/Labels:**

| Size | Usage |
|------|-------|
| `text-[17px]` | Home hero subtitle |
| `text-[16px]` | Page subtitles (book, contact, fleet, services) |
| `text-[15px]` | Services descriptions, body paragraphs, FAQ questions, card descriptions |
| `text-[14px]` | Step descriptions, FAQ answers, service details, value prop descriptions, returning customer text |
| `text-[13px]` | Eyebrow labels (uppercase), service list items, sub-text, tab buttons, trust notes |
| `text-[12px]` | Price labels, form footnotes, error messages, label classes (booking form) |
| `text-[11px]` | Form labels (contact page), footer column headers |
| `text-sm` (14px) | Nav links, footer links, phone buttons, contact input fields |

**Inconsistencies:**
- H1 sizes vary significantly: 50px (home), 42px (services/fleet/contact), 34px (book), 48px/36px (placeholder pages using Tailwind defaults)
- Placeholder pages use Tailwind size classes (`text-4xl`, `text-5xl`) while built-out pages use pixel sizes (`text-[42px]`), creating a subtle mismatch
- Section eyebrow labels are consistently `text-[13px]` uppercase — good consistency here
- Form label sizes differ: `text-[11px]` on contact, `text-[12px]` on booking form

### 6.4 Heading Styles on Placeholder vs Built-Out Pages

Placeholder pages (about, faq, marine, service-areas) use a different hero pattern:
- `bg-navy py-20 md:py-24 px-6 text-center` with `max-w-[680px]`
- Subtitle is `text-[#CBD5E1]`

Built-out pages (services, fleet, contact, book) use:
- `bg-white` with `section-inner px-4 lg:px-6 pt-10 pb-4`
- Eyebrow label + H1 + subtitle pattern
- Subtitle is `text-[#444]`

This creates a **jarring visual disconnect** between the two groups of pages.

---

## Step 7: Firebase / Firestore Analysis

### 7.1 Firebase Config — `src/lib/firebase.ts`

```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: 'coastal-mobile-lube.firebaseapp.com',
  projectId: 'coastal-mobile-lube',
  storageBucket: 'coastal-mobile-lube.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};
```

- Uses env vars for sensitive keys (good practice)
- Hardcodes `authDomain`, `projectId`, `storageBucket` (acceptable, these are public)
- Falls back to empty strings if env vars are missing (app may silently fail)

### 7.2 Firestore Collections

| Collection | Operation | Page | Fields |
|-----------|-----------|------|--------|
| `bookings` | **WRITE** (`addDoc`) | `/book` (BookingForm.tsx) | `service` (string), `preferredDate` (string, ISO date), `timeWindow` (string: "morning"/"midday"/"afternoon"), `name` (string, trimmed), `phone` (string, digits only), `address` (string, trimmed), `notes` (string), `status` ("pending"), `source` ("website"), `returningCustomer` (boolean), `createdAt` (serverTimestamp), `updatedAt` (serverTimestamp) |
| `bookings` | **READ** (`getDocs` with `where`) | `/book` (BookingForm.tsx) | Query: `where("phone", "==", digits)`. Reads: `name`, `phone`, `address` from first matching doc |

### 7.3 Security Concerns

- **No Firestore security rules visible in codebase.** Cannot determine if rules are properly configured from code alone. The project may be using default test-mode rules which would allow open read/write access.
- **Customer lookup by phone number** queries all bookings by phone. If Firestore rules are open, any client-side code could query all bookings.
- **No authentication** is implemented anywhere in the app. All writes to `bookings` are unauthenticated.
- **No rate limiting** on form submission or customer lookup. Could be abused for spam or data scraping.
- **Phone number stored as digits-only string.** The lookup also queries by digits-only. Good consistency.

---

## Step 8: Cloudinary Helper Analysis

### 8.1 Configuration — `src/lib/cloudinary.ts`

- **Cloud name:** `dgcdcqjrz`
- **Base URL pattern:** `https://res.cloudinary.com/dgcdcqjrz/image/upload/{transforms}/{publicId}`

### 8.2 Default Transforms

| Parameter | Default Value |
|-----------|---------------|
| `width` | `800` |
| `height` | (none) |
| `crop` | `"fill"` |
| `quality` | `"auto:good"` |
| `format` | `"auto"` |

### 8.3 Image Registry

| Key | Public ID | Used On |
|-----|-----------|---------|
| `logo` | `v1774315498/Coastal_Lube_logo_v1_zbx9qs.png` | **Not used anywhere** |
| `vanMockup` | `v1774317068/Van_mockup_ln68oh.png` | **Not used anywhere** |
| `vanMockupTransparent` | `v1774317068/Van_mockup_transparent_bd5z75.png` | **Not used anywhere** |
| `heroVanDriveway` | `v1774318456/hero-van-driveway_nag1pq.jpg` | **Not used anywhere** |
| `heroVanDrivewayAlt` | `v1774318456/hero-van-driveway-alt_mil6jl.jpg` | **Not used anywhere** |
| `fleetVehicles` | `v1774318456/fleet-vehicles_cjciux.jpg` | **Not used anywhere** |
| `fleetVehiclesAlt` | `v1774318456/fleet-vehicles-alt_n85acn.jpg` | **Not used anywhere** |
| `marinaBoats` | `v1774318456/marina-boats_daijbf.jpg` | **Not used anywhere** |
| `marinaBoatsAlt` | `v1774318456/marina-boats-alt_ilx2op.jpg` | Home page (marine services tab) |
| `oilChangeService` | `v1774318456/oil-change-service_zptify.jpg` | Services page (Oil Change card) |
| `oilChangeServiceAlt` | `v1774318456/oil-change-service-alt_q3ziwb.jpg` | Services page (Battery card) |
| `tireService` | `v1774318456/tire-service_kezdax.jpg` | Services page (Tire card) |
| `vanInteriorEquipment` | `v1774318456/van-interior-equipment_u2gu99.jpg` | Services page (Fluid card) |
| `drivewayService` | `v1774318456/driveway-service_sceizn.jpg` | Home page (automotive services tab) |
| `drivewayServiceAlt` | `v1774318456/driveway-service-alt_uqmkou.jpg` | Services page (Brake card) |
| `commercialService` | `v1774318456/commercial-service_wbgfog.jpg` | Home page (fleet tab) + Fleet page hero (hardcoded) |
| `commercialServiceAlt` | `v1774318456/commercial-service-alt_xpwvoi.jpg` | **Not used anywhere** |

### 8.4 Quality Settings

- All images using the helper function get `q_auto:good` (the default)
- Fleet page hero uses a **hardcoded URL** with `q_auto:good` — bypasses the helper

### 8.5 Issues

- **8 of 18 registered images are unused:** logo, vanMockup, vanMockupTransparent, heroVanDriveway, heroVanDrivewayAlt, fleetVehicles, fleetVehiclesAlt, marinaBoats, commercialServiceAlt
- **Fleet page hardcodes a Cloudinary URL** instead of using `cloudinaryUrl()` helper — different dimensions (w_1600, h_450) vs standard (w_800, h_600)
- **No Next.js `<Image>` component used anywhere** — all images use raw `<img>` tags, missing out on automatic lazy loading, size optimization, and layout shift prevention

---

## Step 9: Known Issues

### CRITICAL

1. **Home page "Get My Quote" button is non-functional.** The most prominent conversion element on the site does nothing when clicked. No `onClick`, no form `onSubmit`, no Firebase write. The entire booking widget on the home page is cosmetic only.

2. **Four placeholder pages are linked prominently in nav/footer:**
   - `/about` — "Full story coming soon."
   - `/faq` — "coming soon"
   - `/marine` — "coming soon"
   - `/service-areas` — "coming soon"

   These are accessible from the main nav (marine, about) and footer (all four). Users clicking through will see minimal content.

3. **Marine page has zero CTAs.** A user who navigates to `/marine` has no way to book, call, or request a quote from that page. The only actions are to navigate away via header/footer.

### HIGH

4. **FAQ page phone number is not a clickable link.** Text reads "call us at 813-722-LUBE" but is not wrapped in an `<a href="tel:">`.

5. **Inconsistent design language between placeholder and built-out pages.** Placeholder pages use navy hero with centered white text (`bg-navy py-20`); built-out pages use white hero with left-aligned content and eyebrow labels. Users navigating between them will notice the disconnect.

6. **HullStripe and WaveDivider components are orphaned.** They exist in `src/components/` but are not imported or used anywhere.

7. **Fleet page hero image bypasses Cloudinary helper.** Uses a hardcoded URL with different dimensions (1600x450 vs 800x600 standard), creating an inconsistency and defeating the purpose of the centralized helper.

8. **8 of 18 Cloudinary images are registered but unused.** Including the company logo, van mockup, and several hero/fleet images.

### MEDIUM

9. **Border-radius inconsistencies.** Theme defines `--radius-card: 14px` but cards use `rounded-[12px]`. Theme defines `--radius-input: 8px` but inputs use `rounded-[10px]`. Some buttons use the CSS var, others hardcode different values.

10. **H1 size inconsistency.** Ranges from 34px to 50px across pages with no clear hierarchy system. Placeholder pages use Tailwind `text-4xl/5xl` while built pages use pixel values.

11. **Form label size inconsistency.** Contact page uses `text-[11px]` for labels; booking form uses `text-[12px]`. Minor but noticeable side-by-side.

12. **No `<Image>` component from Next.js.** All images are raw `<img>` tags. Missing lazy loading, automatic WebP/AVIF, width/height attributes for layout stability, and responsive srcset.

13. **Contact form uses Netlify Forms** while booking form uses Firebase. Two different data backends for similar form data, which may complicate operations.

14. **No email field on booking form.** The booking form collects name, phone, and address but not email. The contact form requires email. This means bookings cannot receive email confirmations.

15. **Booking form service prices don't match home page.** Home page services tab shows "Starting at $49" for automotive. Booking form shows Oil Change $89, Tire Service $75, etc. The $49 price from the home page doesn't appear on the booking form.

### LOW

16. **Copyright year hardcoded.** Footer shows "2026 Coastal Mobile Lube & Tire" — no dynamic year.

17. **No `data-netlify` bot field honeypot** on the contact form (standard Netlify spam prevention).

18. **Mobile sticky bottom bar only on home page.** Other pages (services, fleet) don't have it, which means mobile users lose the persistent booking CTA when navigating away from home.

19. **Services tab on home page shows "Starting at $49" for automotive** but the booking form and services page show different prices (oil change at $89 on booking form, $49 on services page). The pricing is inconsistent across the site.

20. **Booking widget on home page has no validation or error states** (moot since it has no submit handler, but worth noting for when it gets wired up).

21. **Two back-to-back `bg-white` sections on services page** (Not Sure CTA + FAQ) with no visual separation between them.

---

## Summary

| Metric | Count |
|--------|-------|
| Total files | 24 |
| Page routes | 8 |
| Fully built pages | 4 (Home, Book, Contact, Services, Fleet) |
| Placeholder pages | 4 (About, FAQ, Marine, Service Areas) |
| Shared components | 6 (4 used, 2 orphaned) |
| Cloudinary images registered | 18 |
| Cloudinary images actually used | 10 |
| Firebase collections | 1 (bookings) |
| Forms | 3 (home widget [broken], booking form, contact form) |
| Critical issues | 3 |
| High issues | 5 |
| Medium issues | 7 |
| Low issues | 6 |
