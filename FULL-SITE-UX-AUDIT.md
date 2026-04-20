# Coastal Mobile Lube & Tire — Full Site UI/UX Audit

> Extracted 2026-04-10. Structural, visual, and interaction audit of every public-facing page and component.

---

## Design System Overview

### Typography
- **Font family**: Plus Jakarta Sans (Google Fonts), weights 400–800
- **Heading weight**: 700–800 (extrabold used heavily)
- **Heading line-height**: 1.06–1.15
- **Body line-height**: 1.65
- **Heading letter-spacing**: -0.5px to -1.5px (tight tracking)

### Color Palette
| Token | Hex | Usage |
|---|---|---|
| Navy | `#0B2040` | Primary dark bg, hero sections, text |
| Navy Mid | `#132E54` | Gradient midpoint |
| Blue | `#1A5FAC` | Eyebrow text, section accents |
| Blue Light | `#2E7ECC` | Contact eyebrow |
| Orange | `#E07B2D` | Primary CTA, prices, accents |
| Orange Hover | `#CC6A1F` | CTA hover state |
| Gold | `#D9A441` | Stats bar, review stars, select eyebrows |
| Teal | `#0D8A8F` | Check icons in hero trust pills |
| Surface | `#FAFBFC` | Light section backgrounds |
| Warm Surface | `#F0EDE6` | Services section, some alternating bgs |
| Warm Surface 2 | `#F4EEE3` | Reviews section |
| Warm Surface 3 | `#F8F6F1` | Trust bar inline |
| Warm Surface 4 | `#F7F8FA` | Value props, why-choose sections |

**Observation**: There are 4+ slightly different "warm surface" background colors used across sections. These are close but not unified under a single token, creating subtle inconsistency.

### Layout System
- **Max-width container**: `max-width: 1100px` via `.section-inner` class
- **Narrow container**: `max-width: 680px` via `.section-narrow`
- **Section padding**: `px-4 lg:px-6` horizontal, variable vertical per section
- **Border radius**: Cards 14px, Buttons 8px (via `var(--radius-button)`), Pills 9999px (full round)

### Breakpoints
- **Mobile**: default (< 768px / `md:`)
- **Tablet**: `md:` (768px+)
- **Desktop**: `lg:` (1024px+)

---

## Global Elements

### Header (sticky, `z-50`)

**Layout**: Sticky top-0, full-width navy gradient bg (`linear-gradient(135deg, #0F2847, #0B2040)`)
- Inner: `.section-inner` container, flex row, justify-between, `px-4 py-3 lg:px-6`
- **Height**: ~56px (py-3 + logo h-8/h-10)

**Desktop (lg+)**:
- Left: Logo image (h-8 lg:h-10) + "Coastal Mobile" / "Lube & Tire" text
- Center: 6 nav links (text-sm, white/85, hover white)
- Right: Phone button (outlined, rounded-[10px]) + "Book Service" button (primary orange)

**Mobile (<lg)**:
- Left: Logo image + text
- Right: Phone icon (circle, outlined) + Hamburger icon
- Drawer: Slides in from right (w-72), navy bg, full-height, nav links stacked vertically with border-b dividers, phone + Book Service buttons at bottom

**Image**: Logo from Cloudinary (`w_200,q_auto:good,f_png`), inline `<img>` not Next `<Image>`

### Footer

**Layout**: Full-width navy bg (`#0B2040`)
- Inner: `.section-inner px-6 pt-12 pb-6`
- **Grid**: 1-col mobile, 2-col md, `lg:grid-cols-[2fr_1fr_1fr]` desktop

**Columns**:
1. Brand: Logo (max-w-[180px]), tagline, phone (orange, bold, lg)
2. Services: Column header (11px uppercase, white/35), 5 links
3. Company: Column header, 5 links

**Bottom bar**: Border-top white/10, flex row md, col mobile
- ASE badge (35px, brightness inverted to white, 60% opacity)
- Copyright text (12px, white/40)
- Credit text (12px, white/40)
- **Extra bottom padding on mobile**: `pb-24 lg:pb-5` to clear sticky bottom bar

### Sticky Bottom Bar (Mobile Only, `z-40`)

**Layout**: Fixed bottom-0, full-width, flex row, white bg, border-top, shadow
- Padding: 10px 16px
- **Call button**: 40% width, 44px height, navy text/border, outlined
- **Book Service button**: 60% width, 44px height, orange bg, white text

**Hidden at lg+ via `lg:hidden`**

### Floating Quote Bar (Desktop/Tablet Only, `z-50`)

**Layout**: Fixed, bottom-[80px] lg:bottom-6, right-4 lg:right-6
- Hidden on mobile (`hidden lg:block`)
- Hidden when booking modal is open
- Hidden on admin pages

**Collapsed**: Orange pill button with "Get a Quote" text + ChevronUp icon, shadow

**Expanded**: 380px wide frosted-glass panel
- White/95 bg with blur(16px) backdrop
- rounded-[16px], p-5
- Fields: Name, Phone, Email, Service (select), Preferred Contact (pill buttons)
- Submit: "Get My Quote" orange button, full-width

### Mobile Quick Quote (Mobile Only, `z-40`/`z-50`)

**Layout**: Block lg:hidden
- Hidden when booking modal is open
- Hidden on admin pages

**Collapsed**: Orange tab pinned to right edge, vertically centered
- 36px wide x 120px tall, orange bg, rounded left corners
- "Quick Quote" text in vertical writing-mode

**Expanded**: Full-screen overlay with slide-in panel from right
- Panel width: `min(300px, 85vw)`
- White bg, shadow, slide-in animation (0.25s)
- Same form fields as FloatingQuoteBar

### Main Content Area
- `<main className="flex-1 pb-20 lg:pb-0">` — 80px bottom padding on mobile for sticky bar, 0 on desktop

---

## Homepage (/)

### Above the Fold (375px phone)
Visible without scrolling: Header + Hero section (eyebrow, sub-eyebrow, headline, mobile subtext, partial hero area). No CTA buttons visible on mobile — they rely on the sticky bottom bar.

### Section Order

#### 1. Hero
- **BG**: Navy gradient (`linear-gradient(180deg, #0A1628, #0B2040 50%, #0F2847)`)
- **Layout**: `.section-inner`, centered text, `max-w-3xl mx-auto`
- **Padding**: `pt-10 pb-10 md:pt-24 md:pb-20` — compact mobile, generous desktop
- **Image**: Logo watermark (800px, 4% opacity, absolute center, decorative)
- **Mobile**: Shorter subtext, NO CTA buttons (sticky bar handles it), NO trust pills
- **Desktop**: Full subtext, 2 CTA buttons (Book Service orange + Call outlined), trust pills with teal check icons, border-top separator
- **Responsive delta**: Headline 30px→52px, significant layout simplification on mobile

#### 2. How It Works
- **BG**: White
- **Layout**: `.section-inner`, centered header, 3-col grid (`md:grid-cols-3`), max-w-[900px]
- **Padding**: `py-8 md:py-20` — tight mobile, airy desktop
- **Mobile**: Single column stack, `gap-4`
- **Desktop**: 3-col with gradient connecting line between step icons
- **Step icons**: 56px→72px squares, rounded-[14px]→[18px], gradient backgrounds, step number overlay
- **No images** — icon-only

#### 3. Services (Tabbed)
- **BG**: Warm surface `#F0EDE6`
- **Layout**: `.section-inner`, centered header, pill tabs, then content area
- **Padding**: `pt-8 pb-10 md:pt-14 md:pb-14`
- **Tabs**: Horizontal scroll on mobile (overflow-x-auto, -mx-4 px-4), centered flex on desktop
- **Mobile**: Accordion pattern — category rows with expand/collapse, full-width buttons
- **Desktop**: Card grid (`auto-fill, minmax(240px, 1fr)`), fleet tab gets `max-w-xl mx-auto`
- **Each card**: 14px rounded, p-5, shadow, border, with category name, price, description (line-clamp-2), outlined orange CTA
- **View All link**: Centered below cards, orange text with arrow entity
- **Dynamic data**: Category names, descriptions, prices from Firestore with hardcoded fallbacks

#### 4. Hull Stripe Separator
- **Height**: 3px
- **Style**: `linear-gradient(to right, #1A5FAC, #E07B2D, #D9A441, #1A5FAC)` — brand-color gradient stripe
- **Pure decorative divider**

#### 5. Stats Bar
- **BG**: Navy gradient (135deg), with top/bottom 1px gold accent lines
- **Layout**: `.section-inner`, 4-col grid (2x2 mobile, 4-col desktop)
- **Padding**: `py-8 md:py-14`
- **Stats**: Large orange numbers (28px→42px, extrabold) + small white/50 labels
- **Desktop**: Vertical divider lines between items (white/10)

#### 6. Reviews (Auto-scrolling Carousel)
- **BG**: `#F4EEE3` warm surface
- **Layout**: Full-width overflow, infinite horizontal scroll animation (35s cycle)
- **Padding**: Header in `.section-inner` (`pt-8 md:pt-14 pb-2 md:pb-4`), cards overflow
- **Cards**: 280px→350px wide, flex-shrink-0, white bg, 14px rounded, shadow, border
- **Content**: Gold stars (★★★★★), review text in quotes, name + city + "Google Review" label
- **Interaction**: Hover pauses animation
- **Implementation**: Cards duplicated 2x for seamless loop
- **Below carousel**: "Reviews from customers across the South Shore" + Google review link
- **No images** — text-only review cards

#### 7. Hull Stripe Separator (Duplicate)
- Same gradient stripe as above

#### 8. Trust Bar (Inline)
- **BG**: `#F8F6F1`
- **Layout**: `.section-inner`, 2x2 grid mobile, 4-col desktop
- **Padding**: `py-6 md:py-12`
- **Each item**: Colored icon in 40px→52px rounded square + 12px→13px bold text
- **Desktop**: Vertical border dividers between items
- **Icons**: Shield (blue), Wrench (teal), Award (gold), Tag (orange)

#### 9. CTA Section (Desktop Only)
- **BG**: Navy gradient with gold top accent line (3px)
- **Layout**: `.section-inner`, centered text, `py-14 md:py-20`
- **Hidden on mobile**: `hidden md:block` — sticky bar handles mobile CTAs
- **Image**: Logo watermark (200px, 4% opacity, right-aligned)
- **Buttons**: Book Service (orange, shadow) + Call (outlined white)

### Image Inventory (Homepage)
| Image | Source | Placement | Purpose |
|---|---|---|---|
| Logo watermark (hero) | Cloudinary `images.logo` w=900 | Absolute center, 4% opacity | Decorative brand stamp |
| Logo watermark (CTA) | Cloudinary `images.logo` w=300 | Absolute right, 4% opacity | Decorative |

**No hero photography, no service photos on homepage.** The hero is entirely text-based.

---

## Automotive Services (/services)

### Above the Fold (375px phone)
Header + Hero (eyebrow, headline, partial body text). CTA buttons partially visible.

### Section Order

#### 1. Hero
- **BG**: Navy gradient (4-stop: `#0A1C38 → #0B2040 → #0F2847 → #132E54`)
- **Layout**: `.section-inner`, left-aligned text (not centered like homepage)
- **Padding**: `pt-10 pb-6 md:pt-14 md:pb-10`
- **Buttons**: Book Service + Call 813-722-LUBE, stacked on mobile, row on sm+
- **No image, no watermark**

#### 2. Sticky Category Pill Navigation
- **Position**: `sticky top-[64px] z-30` (below header)
- **BG**: White, border-bottom, shadow
- **Pills**: Horizontal scroll, rounded-full, 13px font
- **Active pill**: Navy bg, white text, shadow
- **Inactive pill**: Surface bg, gray text, hover warm bg
- **First tab**: "Coastal Packages" (if packages exist in Firestore)
- **Content swaps in-place** — only shows active tab's section, not scroll-to

#### 3. Coastal Packages Tab `[DYNAMIC]`
- **BG**: `#FAFBFC`
- **Layout**: 1-col mobile, 3-col md grid, gap-6
- **Card design**: White bg, 14px rounded, p-7, shadow/border
- **Featured card**: Orange top border (3px), "Most Popular" pill badge (-top-3)
- **Bundle items**: Bullet list with orange dots
- **CTA**: "Book This Package" full-width orange button

#### 4. Service Category Sections `[DYNAMIC]`
- **Layout**: Alternating white / `#FAFBFC` backgrounds
- **Grid**: `lg:grid-cols-[3fr_2fr]` when image present, single col otherwise
- **Image**: Right column on desktop, top on mobile, aspect-[4/3], rounded-lg, shadow
- **Service grid**: 2-col `sm:grid-cols-2`, gap-3
- **Each row**: White bg, 10px rounded, border, px-5 py-4, name left + price right
- **Hover**: Shadow increase, orange border hint, -1px translate-y
- **Clickable**: Each service row opens booking wizard with pre-selected service

**Images used** (Cloudinary, w=800 h=600):
| Category Match | Image Key | Type |
|---|---|---|
| "oil" | `oilChangeService` | Stock/AI |
| "tire" | `tireService` | Stock/AI |
| "brake" | `drivewayServiceAlt` | Stock/AI |
| "battery" | `oilChangeServiceAlt` | Stock/AI |
| "fluid" | `vanInteriorEquipment` | Likely real |
| "filter"/"air" | `drivewayService` | Stock/AI |
| "wiper" | `commercialService` | Stock/AI |

#### 5. Bottom CTA
- **BG**: Navy gradient
- **Layout**: Centered text, 2 buttons
- **Same pattern as homepage CTA**

#### 6. Other Services Teaser
- **BG**: `#F7F8FA`
- **Layout**: 2-col md grid, gap-6
- **Cards**: White, 14px rounded, p-7, border/shadow, hover translate-y
- **Links**: Orange text with ArrowRight icon

---

## Fleet (/fleet)

### Above the Fold (375px phone)
Header + Hero (eyebrow, headline, partial body). CTA buttons partially visible.

### Section Order

#### 1. Hero
- Same pattern as Services hero but with "Get Fleet Quote" (links to #fleet-quote anchor) instead of "Book Service"
- **No image**

#### 2. Trust Bar (Component)
- Uses standalone `<TrustBar />` component
- White bg, `.section-inner`, 2x2→4-col grid, py-10
- Blue icons, bold text, border dividers on desktop

#### 3. The Process (4-Step)
- **BG**: White
- **Layout**: Centered header, 4-col md grid, max-w-[1000px]
- **Padding**: `py-12 md:py-16`
- **Step icons**: 72px rounded-[18px] squares, navy gradient (step 4: orange gradient)
- **Desktop**: Gradient connecting line (navy → orange)
- **Numbered badges**: Absolute -top-2 -right-2, white circle with navy text

#### 4. Vehicles We Service
- **BG**: White
- **Layout**: 2-col mobile, 3-col md grid
- **Items**: Navy gradient bg, rounded-[12px], px-5 py-4, white text with orange bullet

#### 5. Vehicle Types
- **BG**: `#FAFBFC`
- **Layout**: 3-col md grid, gap-6
- **Cards**: White, 14px rounded, navy top border (3px), p-6, shadow, hover effect
- **No images**

#### 6. Why Fleet Managers Choose Us
- **BG**: `#F7F8FA`
- **Layout**: 2-col md grid, gap-6
- **Items**: Left border (3px orange), pl-4, title + description

#### 7. Fleet Services List
- **BG**: `#FAFBFC`
- **Layout**: 2-col md grid, gap-3
- **Items**: White bg, 10px rounded, border, px-[14px] py-[14px]
- **Clickable**: Opens booking wizard with Fleet division
- **Hover**: Orange border hint, warm bg, shadow, translate-y

#### 8. Fleet Quote Form
- **BG**: Navy gradient
- **Layout**: Centered header, frosted-glass form card (max-w-[560px])
- **Card style**: `rgba(255,255,255,0.07)` bg, blur(24px), white/10 border, heavy shadow
- **Fields**: 7 fields + checkbox + contact preference buttons
- **Submit**: "Get Fleet Quote" orange button, full-width

#### 9. Fleet CTA
- **BG**: Navy gradient
- Same CTA pattern

#### 10. Fleet FAQs
- **BG**: `#FAFBFC`
- **Layout**: max-w-[700px] centered
- **Accordion**: Simple toggle, no cards — border-bottom dividers only
- **Chevron**: Rotates 180deg on open

**Observation**: Fleet page is the longest page. 10 sections is a lot. Some consolidation opportunities exist (e.g., "Vehicles We Service" grid + "Vehicle Types" cards feel redundant — they both answer "what vehicles do you cover?").

---

## Marine (/marine)

### Above the Fold (375px phone)
Header + Hero (eyebrow, headline, partial body).

### Section Order

#### 1. Hero
- Same navy gradient pattern, left-aligned
- **No image**

#### 2. Sticky Category Pill Navigation
- Same sticky pattern as /services but `top-[64px]`
- **Pill labels**: Short labels derived by stripping "Marine" prefix and "Service(s)" suffix
- **Flex-wrap instead of scroll** (different from /services which uses overflow-x-auto)

#### 3. Service Category Sections `[DYNAMIC]`
- Same CategorySection component pattern as /services
- Alternating white/surface backgrounds
- **Images**: Marine-specific Cloudinary images based on category keyword matching
  - engine/oil/outboard/inboard/diesel → `marinaBoats`
  - lower unit/impeller/generator/add-on → `marinaBoatsAlt`
  - trailer/bearing/tire → `fleetVehicles`

#### 4. Where We Service Boats
- **BG**: `#F7F8FA`
- **Layout**: Centered text, flex-wrap location names with bullet separators
- **Locations**: 8 items (Apollo Beach through Sun City Center)

#### 5. Marine Quote Form
- Same frosted-glass card pattern as Fleet quote
- **Different fields**: Engine Type (select), Number of Engines (select) instead of Fleet Size
- **Engine Type options**: Outboard, Inboard, Sterndrive, Not sure
- **Engine Count options**: Single, Twin, Triple+

**Observation**: Marine page has no CTA section between content and the quote form. The service sections go directly into "Where We Service" then the form. No bottom CTA with Book Service buttons. The quote form IS the bottom CTA, which is a different pattern from other pages.

---

## RV (/rv)

### Above the Fold (375px phone)
Header + Hero (eyebrow, headline, partial body).

### Section Order

#### 1. Hero
- Same navy gradient pattern
- **No image**

#### 2. Sticky Category Pill Navigation
- `sticky top-0 z-40` — **NOTE**: This uses `top-0` not `top-[64px]` like /services and /marine. This means the pill bar covers the header on scroll, which is inconsistent.

#### 3. Service Category Sections `[DYNAMIC]`
- Same pattern BUT **no images** — RV uses a simpler CategorySection without image column

#### 4. Why RV Owners Choose Us
- **BG**: `#F7F8FA`
- Same border-left card pattern as Fleet value props
- 6 items in 2-col md grid

#### 5. Service Area
- **BG**: `#FAFBFC`
- Centered text, 12 location names with bullet separators
- Has eyebrow "Service Area" — unique to RV page

#### 6. CTA Section
- **BG**: Navy gradient
- Book RV Service + Call buttons

#### 7. Trust Badges
- **BG**: White with border-y
- **Layout**: 2x2→4-col grid, text-center
- **Different design from TrustBar component**: Just text, no icons, two-line format (label + sub)
- **Inconsistency**: This is a different implementation than the reusable TrustBar component used on Fleet page

#### 8. RV FAQ
- **BG**: `#FAFBFC`
- **Different accordion design from Fleet FAQ**: Uses card-style accordions (white bg, border, rounded-[14px], shadow) instead of simple border-bottom dividers
- 4 items (fewer than Fleet's 6)
- Centered headline

#### 9. RV Quote Form
- Same frosted-glass pattern
- **Different field**: RV Type (select) instead of Fleet Size or Engine Type
- **RV Type options**: Class A Motorhome, Class B Camper Van, Class C Motorhome, Fifth Wheel, Travel Trailer, Other

**Inconsistency notes**:
- Sticky nav is `top-0` instead of `top-[64px]` — will overlap header
- Trust badges section uses a different design than TrustBar component
- FAQ accordion style differs from Fleet FAQ

---

## About (/about)

### Above the Fold (375px phone)
Header + Hero left column (eyebrow, headline, body text, trust pills). Image not visible without scrolling on mobile.

### Section Order

#### 1. Hero
- **BG**: Navy `#0B2040`
- **Layout**: `max-w-[1100px]`, 2-col lg grid (`lg:grid-cols-2`, gap-10 lg:gap-14)
- **Left**: Eyebrow (gold), headline, body, trust pills with teal checks
- **Right**: Image (Cloudinary `heroVanDrivewayAlt` w=800), rounded-[14px], shadow, inset border overlay
- **Mobile**: Single column, text then image stacked
- **Image**: Logo watermark (500px, 4% opacity, right side, desktop only)

#### 2. Van Showcase
- **BG**: `#FAFBFC`
- **Layout**: `max-w-[1100px]`, centered header, single image container
- **Image**: PLACEHOLDER — gray bg (`#F0EDE6`) with italic "Van photos coming soon" text
- **Card**: White bg, p-4 md:p-6, rounded-[14px], heavy shadow, border

#### 3. The Story
- **BG**: White
- **Layout**: `max-w-[1100px]`, 2-col lg grid
- **Left**: 3 paragraphs of body copy + blockquote (orange left border)
- **Right**: Image (Cloudinary `vanInteriorEquipment` w=800), rounded-[14px], shadow
- **Image overlay caption**: White bar at bottom with "Fully equipped mobile shop" text
- **Mobile**: Single column, text then image

#### 4. Value Props
- **BG**: `#F7F8FA`
- **Layout**: `max-w-[1100px]`, centered header, 2-col md grid
- **Cards**: White, 14px rounded, p-7, shadow/border, hover effect
- **Numbering**: Orange rounded square badges (01-04)

#### 5. Verticals (One Team for Everything)
- **BG**: `#F7F8FA` (SAME as section above — no visual break between sections 4 and 5)
- **Layout**: `max-w-[1100px]`, centered header/body, 4-col sm:2/md:4 grid
- **Cards**: White, 14px rounded, p-6, left-aligned, hover translate-y
- **Links**: Orange text with ArrowRight icon

**Observation**: Sections 4 and 5 both use `#F7F8FA` background, making them visually merge into one long section. Adding a different bg or a separator would improve scannability.

#### 6. CTA Section
- **BG**: `#FAFBFC`
- **Layout**: `max-w-[1100px]`, centered text
- **Different from other CTAs**: Light bg instead of navy gradient
- **Buttons**: Book Service (orange, shadow) + Call (secondary variant)

---

## Service Areas (/service-areas)

### Above the Fold (375px phone)
Header + Hero (badge, headline, body text).

### Section Order

#### 1. Hero
- **BG**: Navy gradient (4-stop)
- **Layout**: Centered text, max-w-[680px]
- **Badge**: MapPin icon + "South Shore Coverage" text (gold)

#### 2. Service Area Cards — Group 1
- **BG**: `#FAFBFC`
- **Layout**: max-w-[1100px], 1→2→3 col grid
- **6 cards**: White, 14px rounded, p-6, border, shadow, hover translate-y
- **Each card**: MapPin icon in navy/8% circle + city name + description + "Book Service in [City]" orange link with ArrowRight

#### 3. Service Area Cards — Group 2
- **BG**: `#F8F6F1` (warmer variant)
- **6 cards**: Same design as group 1 but with warmer border color (`#ebe5d8`)
- **Split into two groups for visual rhythm**

#### 4. Bottom CTA
- **BG**: Navy gradient
- Centered text, phone number as inline orange link
- "Book Service Now" button with ArrowRight icon

**No images on this page.** All text-based cards.

---

## FAQ (/faq)

### Above the Fold (375px phone)
Header + Hero (badge, headline, body text). First FAQ item partially visible.

### Section Order

#### 1. Hero
- **BG**: Navy gradient (4-stop)
- **Layout**: Centered, max-w-[680px]
- **Badge**: HelpCircle icon + "Common Questions"

#### 2. FAQ Items
- **BG**: `#FAFBFC`
- **Layout**: max-w-[740px] centered, flex-col, gap-3
- **13 items**: Card-style accordions (same as RV FAQ)
  - White bg, border `#E8E8E8`, rounded-[14px], shadow
  - Hover: shadow increase
  - Open: ChevronDown rotates 180deg (orange color), answer with border-top separator
- **Schema.org**: FAQPage JSON-LD injected

#### 3. CTA
- **BG**: Navy gradient
- **Buttons**: Phone number as primary orange button (large, with Phone icon) + "Book Service Online" outlined
- **Different pattern**: Phone is primary CTA here, Book Service is secondary — reversed from other pages

---

## Contact (/contact)

### Above the Fold (375px phone)
Header + Hero (eyebrow, headline, body text). Form partially visible.

### Section Order

#### 1. Hero
- **BG**: `#0B2040` solid (not gradient like other pages)
- **Layout**: `.section-inner`, max-w-[700px], left-aligned
- **Eyebrow**: Blue-light color `#6BA3E0` (different from other pages which use gold or blue)
- **Body**: Contains inline button (Book Service) and links (Fleet, Marine)

#### 2. Form + Contact Info
- **BG**: `#FAFBFC`
- **Layout**: max-w-[1100px], 2-col lg grid `lg:grid-cols-[3fr_2fr]`, gap-8 lg:gap-12

**Left column (Form)**:
- White bg card, border, rounded-[12px], p-6 md:p-8
- 5 fields: Name + Phone (2-col sm), Email, Interest (select), Message (textarea, min-height 120px)
- Submit: "Send Message" full-width orange button
- Footer: "We respond to every message within one business day"
- **Netlify Forms integration** (data-netlify="true")
- **Success state**: CheckCircle icon + "Message sent." + "Send another message" link

**Right column (Contact Info)**:
- 4 info blocks separated by border-bottom dividers
- Each: Icon + uppercase label + value + helper text
- Phone (orange icon), Email (blue icon), Service Area (blue icon), Business Hours (blue icon)
- Hours: 2-row table layout

#### 3. CTA
- **BG**: `#0B2040` solid
- **Layout**: Centered text, py-10
- **Compact** compared to other CTAs
- **Buttons**: Book Service (orange) + Call (outlined with white/40 border)

**No images on this page.**

---

## Booking Wizard Modal (via /book or any "Book Service" CTA)

### Modal Structure
- **Overlay**: Fixed inset-0, z-9999, navy/55 bg with blur(6px)
- **Card**: Max-width 960px, max-height 94vh, rounded-20, white bg, flex-col
- **Mobile (< 640px)**: Full-screen (no border radius, 100dvh height)
- **Tablet (640-959px)**: Margin 12px

### Layout

**Header** (fixed top):
- "Book Your Service" h2 (19px, 800 weight) + "We come to you." subtitle
- Close X button (32px circle)

**Progress Bar**:
- 4-step horizontal stepper, max-w-[380px] centered
- Circles: 30px, numbered, orange=current, green=complete, gray=future
- Connecting lines between steps
- Labels below: Services, Vehicle, Details, Review

**Content Area** (scrollable):
- **Desktop**: 2-panel layout (65% left content + 35% right sidebar)
- **Mobile**: Single column, sidebar hidden

**Sidebar** (desktop only):
- Sticky, `#F8FAFC` bg, border-left
- Shows: "Your Selection" header, grouped services by category, prices, remove buttons, estimated total
- Updates live as user makes selections

**Bottom Navigation** (fixed bottom):
- Back button (left, outlined) + Next/Submit button (right, orange)
- Submit button glows on step 4 (`box-shadow: 0 0 20px rgba(249,115,22,0.4)`)
- Fleet division: "Request a Quote" instead of "Submit Booking"

### Step 1: Services
- **Division pills**: 4 horizontal buttons (Automotive, Marine, RV, Fleet), pill-style
- **Coastal Packages** (auto only): Collapsible section, orange border, cards with checkboxes
- **Category grid**: `auto-fill, minmax(130px, 1fr)` — responsive square-ish cards
  - Each card: Icon + category name + "From $X" price, clickable
  - Active: Orange border + arrow indicator below
  - Selected count: Green circle badge
- **Detail panel**: Expandable below active card, `#F8FAFC` bg, checkbox list of services
- **"Something Else"**: Text input appears when selected
- **Search**: "Browse all [Division] services" link opens search overlay modal
- **Mobile summary**: Orange bg bar with count + total

**Field count (Step 1)**: 0 traditional form fields — it's all click/tap selection

### Step 2: Vehicle
- **"Been here before?" lookup**: Expandable section, phone input, "Look me up" button
  - Searches Firestore by phone, shows previous bookings to select from
- **Marine**: HIN input + vessel Year/Make/Model fields (3-col grid)
- **Auto/RV/Fleet Desktop**: Unified search bar with typeahead dropdown
  - Fallback: Manual Year/Make/Model dropdowns
  - "or enter details manually" link
- **Auto/RV/Fleet Mobile**: 3 cascading native `<select>` elements (Year → Make → Model)
- **VIN section**: Text input (monospace, uppercase) + "Scan" button (opens camera)
  - VIN auto-decode with NHTSA API
  - Camera scanner via html5-qrcode library
- **All fields optional** — can skip entirely

**Field count (Step 2)**: 3-4 fields (Year, Make, Model + optional VIN/HIN)

### Step 3: Your Details
- **"Been here before?" lookup**: Same pattern, different prompt text
- **Fields**: Full Name*, Phone*, Email, Preferred Date, Preferred Time, Contact Preference, Service Address, Notes
- **Date/Time**: 2-col grid, date picker + time select (4 slots)
- **Contact preference**: 3 pill-toggle buttons (call/text/email)

**Field count (Step 3)**: 8 fields (2 required). This is the highest-friction step.

### Step 4: Review
- **3 review cards**: Services (with Edit link), Vehicle (with Edit link), Contact & Schedule (with Edit link)
- **Estimated Total**: Orange highlight box with total or "Quote on-site"
- **Error handling**: Red error banner below total

### Confirmation
- Green checkmark circle (56px)
- "You're all set!" headline
- "We will reach out within 2 hours to confirm your appointment."
- Auto-closes after 3 seconds

### Total Booking Wizard Fields: ~12-14 across all steps
- Step 1: 0 (selection only)
- Step 2: 3-4 (optional)
- Step 3: 8 (2 required)
- Step 4: 0 (review only)

---

## Cross-Page Consistency Audit

### CTA Button Patterns

| Page | Primary CTA | Secondary CTA | CTA Style |
|---|---|---|---|
| Homepage hero | Book Service | Call 813-722-LUBE | Orange solid + white outlined |
| Homepage bottom | Book Service | Call 813-722-LUBE | Orange solid + white outlined |
| /services hero | Book Service | Call 813-722-LUBE | Orange solid + white outlined |
| /services bottom | Book Service | Call 813-722-LUBE | Orange solid + white outlined |
| /fleet hero | Get Fleet Quote | Call 813-722-LUBE | Orange solid + white outlined |
| /fleet bottom | Get a Fleet Quote | Call 813-722-LUBE | Orange solid + white outlined |
| /marine hero | Book Service | Call 813-722-LUBE | Orange solid + white outlined |
| /rv hero | Book Service | Call 813-722-LUBE | Orange solid + white outlined |
| /rv CTA | Book RV Service | Call 813-722-LUBE | Orange solid + white outlined |
| /about CTA | Book Service | Call 813-722-LUBE | Orange + secondary (light bg!) |
| /contact CTA | Book Service | Call 813-722-LUBE | Orange + white outlined (white/40 border) |
| /faq CTA | 813-722-LUBE (phone!) | Book Service Online | **REVERSED** — phone is primary |
| /service-areas | Book Service Now → | *(none)* | Single button with arrow |

**Inconsistencies**:
- /about CTA uses light bg instead of navy gradient
- /faq reverses primary/secondary (phone first, book second)
- /service-areas has a single CTA button (no phone option)
- /contact CTA uses different border opacity (white/40 vs white/20)
- Fleet uses "Get Fleet Quote" (anchor link) vs "Book Service" (modal)

### Hero Section Patterns

| Page | Alignment | Has Image | Gradient | Eyebrow Color |
|---|---|---|---|---|
| Homepage | Center | No (watermark only) | 3-stop | Orange `#F97316` |
| /services | Left | No | 4-stop | Gold `#D9A441` |
| /fleet | Left | No | 4-stop | Gold `#D9A441` |
| /marine | Left | No | 4-stop | Gold `#D9A441` |
| /rv | Left | No | 4-stop | Gold `#D9A441` |
| /about | Left (2-col) | Yes (right) | Solid | Gold `#D9A441` |
| /contact | Left | No | Solid | Blue-light `#6BA3E0` |
| /faq | Center | No | 4-stop | Gold `#D9A441` |
| /service-areas | Center | No | 4-stop | Gold `#D9A441` |

**Inconsistencies**:
- Homepage eyebrow uses orange `#F97316` (not used anywhere else — all others use gold `#D9A441`)
- Contact eyebrow uses blue-light `#6BA3E0` (unique)
- About and Contact use solid navy bg, others use gradient
- Only About page has an image in hero

### Section Background Alternation

Most pages follow a pattern of alternating section backgrounds, but the specific colors vary:

| BG Color | Used On |
|---|---|
| `#FFFFFF` (white) | Story sections, process sections, trust bar |
| `#FAFBFC` | Service area cards, FAQ, quote forms alt bg |
| `#F7F8FA` | Value props, "why choose us" sections |
| `#F8F6F1` | Service area group 2, trust bar inline |
| `#F0EDE6` | Homepage services section |
| `#F4EEE3` | Homepage reviews section |

**6 different "light" background colors** in use. Consider consolidating to 2-3 for stronger brand consistency.

### Sticky Navigation Behavior

| Page | Sticky Element | Top Position | Z-Index |
|---|---|---|---|
| /services | Category pills | `top-[64px]` | `z-30` |
| /marine | Category pills | `top-[64px]` | `z-30` |
| /rv | Category pills | `top-0` | `z-40` |

**Bug**: /rv sticky pills use `top-0` which will overlap the sticky header. Should be `top-[64px]` like other pages.

### Accordion/FAQ Design

| Page | Style | Cards? | Animation |
|---|---|---|---|
| /fleet FAQ | Simple border-bottom dividers | No | ChevronDown rotation |
| /rv FAQ | Card-style (white bg, border, rounded, shadow) | Yes | ChevronDown rotation + color change |
| /faq page | Card-style (same as RV) | Yes | ChevronDown rotation + color change |

**Inconsistency**: Fleet FAQ uses a different, simpler accordion design than /rv and /faq pages.

### Quote Form Design

All three quote forms (Fleet, Marine, RV) use the same frosted-glass card pattern on navy bg. Consistent design.

| Form | Unique Field | Options |
|---|---|---|
| Fleet | Fleet Size | 1-5, 6-15, 16-50, 50+ |
| Marine | Engine Type + Engine Count | Outboard/Inboard/Sterndrive/Not sure + Single/Twin/Triple+ |
| RV | RV Type | Class A/B/C, Fifth Wheel, Travel Trailer, Other |

All include: Name, Phone, Email, Contact Preference, Preferred Date, "Dates flexible" checkbox, Notes textarea.

---

## Image Audit

### Real Photos vs Stock/AI

| Image Key | Assessment | Used On |
|---|---|---|
| `logo` | **Real** — company logo | Header, footer, hero watermarks |
| `heroVanDriveway` | **Stock/AI** — generic service van in driveway | About hero |
| `heroVanDrivewayAlt` | **Stock/AI** — alt angle | About hero |
| `vanInteriorEquipment` | **Likely stock** — van interior with tools | About story, /services fluid category |
| `oilChangeService` | **Stock/AI** — oil change scene | /services oil category |
| `oilChangeServiceAlt` | **Stock/AI** — alt angle | /services battery category |
| `tireService` | **Stock/AI** — tire work | /services tire category |
| `drivewayService` | **Stock/AI** — driveway service | /services filter category |
| `drivewayServiceAlt` | **Stock/AI** — alt | /services brake category |
| `commercialService` | **Stock/AI** — commercial | /services wiper category |
| `marinaBoats` | **Stock/AI** — marina | /marine oil/engine categories |
| `marinaBoatsAlt` | **Stock/AI** — alt marina | /marine lower unit categories |
| `fleetVehicles` | **Stock/AI** — fleet | /marine trailer category |
| `vanMockup` | **Placeholder** — van wrap mockup | Not currently used in pages |
| `vanMockupTransparent` | **Placeholder** — transparent | Not currently used |
| `vanWrapSide` | **Placeholder** — van wrap | Not currently used |
| `vanWrapRear` | **Placeholder** — van wrap rear | Not currently used |
| `/images/ase-badge.png` | **Real** — ASE certification badge | Footer |

**Van photos**: About page shows "Van photos coming soon" placeholder — real van wrap photos not yet taken.

**No photos appear to be real service photos.** All service imagery appears to be stock or AI-generated. The only real assets are the logo and ASE badge.

---

## Mobile UX Audit

### What Hides on Mobile
- Hero CTA buttons (homepage) — replaced by sticky bottom bar
- Hero trust pills (homepage)
- Desktop subheadline (homepage shows shorter version)
- Bottom CTA section (homepage) — `hidden md:block`
- Floating Quote Bar — `hidden lg:block`
- Review carousel desktop widths shrink (350px → 280px)
- Desktop-style sidebar in booking wizard

### What Shows Only on Mobile
- Sticky Bottom Bar (Call + Book Service) — `lg:hidden`
- Mobile Quick Quote (right-edge tab) — `block lg:hidden`
- Simplified homepage subheadline
- Service category accordion (homepage) — desktop shows card grid
- Cascading native selects in booking wizard (instead of typeahead search)

### Spacing on Mobile
- All heroes: `pt-10 pb-6` to `pt-10 pb-10` — compact
- Content sections: `py-8` to `py-10` — moderate
- `gap-4` to `gap-6` between items
- Main content: `pb-20` bottom padding to clear sticky bar

### Potential Mobile Issues
1. **No CTA above the fold on homepage mobile** — user must scroll or use sticky bar
2. **Horizontal scroll on service tabs** — can be missed if user doesn't know to swipe
3. **Mobile Quick Quote panel is narrow** (`min(300px, 85vw)`) — forms may feel cramped on small screens
4. **3-step How It Works stacks to single column** — each step takes full screen height, pushing content far down
5. **Booking wizard goes full-screen on mobile** — good, but the step count (4 steps) may feel long

---

## Potential Redundancy & Ordering Issues

### Redundant Sections
1. **Fleet page — "Vehicles We Service" grid + "Vehicle Types" cards**: Both sections answer "what vehicles do you cover?" The grid is a simple list; the cards add descriptions. Could be combined.
2. **Homepage — Two hull stripe separators**: Both are identical gradient stripes. The second one (between reviews and trust bar) feels unnecessary since those sections already have different backgrounds.
3. **About page — Sections 4 & 5 share same background**: Value Props and Verticals both use `#F7F8FA`, making them visually merge. Need a separator or different bg.

### Ordering Suggestions
1. **Fleet page**: Trust Bar after hero → The Process → Services List → Why Choose Us → Vehicles We Service → Quote Form → FAQ → CTA. Current order has vehicle info split into two separate sections with "Why Choose Us" sandwiched between.
2. **Marine page**: Missing a bottom CTA section between "Where We Service" and the quote form. Other pages have a clear "Ready to book?" CTA before the form.
3. **RV page**: CTA → Trust Badges → FAQ → Quote Form is an unusual end sequence. Most users expect FAQ before CTA, not between CTA and the form.

### Missing Elements
1. **Homepage**: No images of actual service work or the van — entirely text-based hero
2. **Marine page**: No trust bar or trust badges section
3. **RV page**: No "How it works" or process section (Fleet has one)
4. **Service Area page**: No trust bar or any credibility indicators
5. **Contact page**: No FAQ section (common pattern for contact pages)

---

## Form UX Friction Analysis

### Contact Form (/contact)
- **Fields**: 5 (Name, Phone, Email, Interest, Message)
- **Required**: 3 (Name, Phone, Email via HTML required)
- **Friction**: Low — standard contact form
- **Backend**: Netlify Forms

### Quick Quote (FloatingQuoteBar / MobileQuickQuote)
- **Fields**: 5 (Name, Phone, Email, Service, Contact Preference)
- **Required**: 2 (Name, Phone via JS validation)
- **Friction**: Low-Medium — good for quick leads
- **Backend**: Firestore direct write

### Fleet/Marine/RV Quote Forms
- **Fields**: 7-8 (Name, Phone, Email, Contact Pref, Date, Dates Flexible, Unique Field, Notes)
- **Required**: 2 (Name, Phone)
- **Friction**: Medium — appropriate for quote requests
- **Backend**: Firestore direct write

### Booking Wizard
- **Total fields across all steps**: ~12-14
- **Required**: 2 (Name, Phone in step 3)
- **Steps**: 4 (Services → Vehicle → Details → Review)
- **Friction**: Medium-High
  - Step 1 is click-based (low friction)
  - Step 2 is optional (can skip)
  - Step 3 has 8 fields (highest friction point)
  - Step 4 is review-only
- **Friction reducers**: "Been here before?" lookup, VIN scanner, typeahead vehicle search, optional fields
- **Friction adders**: 4-step process may feel long, contact preference + service address + notes all on same step
- **Suggestion**: Consider splitting Step 3 — contact info on one step, schedule preferences on another. Or move some optional fields (address, notes) to a collapsible "Additional info" section.

---

## Interactive Elements Inventory

| Element | Type | Pages | Notes |
|---|---|---|---|
| Service tabs | Pill toggle | Homepage, /services, /marine, /rv | Tab content swap, not scroll-to |
| Category accordion | Expand/collapse | Homepage (mobile) | Category rows expand to show details |
| FAQ accordion | Expand/collapse | /fleet, /rv, /faq | Two different visual styles |
| Review carousel | Auto-scroll | Homepage | Infinite loop, hover-to-pause |
| Booking wizard | Multi-step modal | Global (via any CTA) | 4 steps, back/next navigation |
| Quote forms | Inline form | /fleet, /marine, /rv | Frosted glass on navy bg |
| Floating quote | Collapsible panel | Global (desktop) | Pill → expanded form |
| Mobile quick quote | Slide-in panel | Global (mobile) | Edge tab → drawer |
| VIN scanner | Camera modal | Booking wizard | html5-qrcode library |
| Vehicle search | Typeahead dropdown | Booking wizard (desktop) | YMM API integration |
| Service search | Search overlay | Booking wizard | Full-screen search modal |
| Customer lookup | Inline expansion | Booking wizard | Phone-based Firestore query |
| Hover effects | Card lift | Most card sections | translate-y + shadow increase |
| Nav drawer | Slide-in drawer | Header (mobile) | Right-side, w-72 |

---

## Performance Observations

1. **No Next.js `<Image>` component used anywhere** — all images use plain `<img>` tags with Cloudinary URLs. Missing out on lazy loading, blur placeholders, and automatic srcset optimization.
2. **Cloudinary transformations** are applied via URL params (good), but format is defaulted to `auto` which is appropriate.
3. **Review carousel** duplicates all review cards 2x in the DOM for infinite scroll — 12 card elements for 6 reviews.
4. **Booking wizard modal** is a large component (~2400 lines) loaded via the BookingProvider context. It mounts globally even when not open.
5. **Google Tag Manager** is loaded in `<head>` synchronously — consider moving to after-interactive.

---

## Summary of Key Issues

### High Priority
1. **RV sticky nav overlaps header** (`top-0` instead of `top-[64px]`)
2. **No real service photos** — all stock/AI. Van photos placeholder still showing.
3. **Homepage has no CTA above the fold on mobile** — relies entirely on sticky bar discovery

### Medium Priority
4. **6+ different "light" background colors** — consolidate to 2-3
5. **FAQ accordion has two different designs** (Fleet vs RV/FAQ page)
6. **Fleet page has 10 sections** — some redundant (two vehicle sections)
7. **About page sections 4 & 5 share same background** — visually merge
8. **No `<Image>` component** — missing Next.js image optimization

### Low Priority
9. **Contact eyebrow uses unique color** (`#6BA3E0`) not used elsewhere
10. **FAQ page reverses CTA button order** (phone primary, book secondary)
11. **Marine page missing bottom CTA section** before quote form
12. **About page CTA uses light bg** instead of navy gradient like other pages
