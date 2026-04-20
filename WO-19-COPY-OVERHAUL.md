# WO-19: Site-Wide Copy Overhaul

**Goal:** Update all public-facing copy to the new unified voice, using the master copy doc as the source of truth. Add SEO meta tags and JSON-LD schema. Touch only strings, do not restructure components.

**Reference doc:** `COASTAL-MASTER-COPY-V2-2026-04-17.md` in the project root. Read it in full before editing.

**Expected execution time:** 40-60 minutes.
**Files touched:** ~12-15 files, most changes are single-line str_replace.

---

## Step 1: Read the master copy doc

Every change in this WO maps to an entry in the master copy doc. If a **[CURRENT]** string doesn't exist verbatim in the codebase, search for the closest match and confirm before editing.

## Step 2: Read every public page file before editing

```bash
cd ~/coastal-mobile-lube
ls src/app/
ls src/app/how-it-works/
ls src/app/services-overview/
ls src/app/services/
ls src/app/fleet/
ls src/app/marine/
ls src/app/rv/
ls src/app/about/
ls src/app/contact/
ls src/app/book/
cat src/app/page.tsx
cat src/app/how-it-works/page.tsx
cat src/app/services-overview/page.tsx
cat src/components/layout/Footer.tsx
cat src/components/layout/MobileStickyBar.tsx
cat src/components/layout/FloatingQuoteBar.tsx
```

## Step 3: Homepage (src/app/page.tsx + any homepage section components)

Apply all Homepage changes from the master copy doc Section "Homepage":

### 3a. Surgical text edits to existing sections

- Hero eyebrow, sub-eyebrow, headline (now `We bring the shop. You keep your day.`), desktop subhead, mobile subhead, trust pills
- How It Works section headline and all 3 step titles/descriptions. Step 3 title is now **`You never left your day.`** (the line replaces "Done. Go." or whatever the current title is)
- Services section headline, subheadline
- Stats bar 4 items
- Reviews section headline and footer line
- Trust bar 4 items
- Bottom CTA eyebrow, headline, body
- Floating Quote CTA collapsed and expanded text

Use surgical str_replace for each. Do not rewrite any component.

### 3b. NEW SECTION: "The Coastal Difference"

Add a new section to the homepage between the How It Works preview and the Services section.

**Position:** insert after the existing How It Works section, before the Services section. Match the section padding pattern of adjacent sections.

**Structure:**

```tsx
<section className="py-16 md:py-20 bg-[#FFFDF8]">  {/* match Coastal cream bg pattern */}
  <div className="max-w-6xl mx-auto px-4">
    <div className="text-center mb-12">
      <p className="text-xs font-semibold tracking-widest text-[#E07B2D] uppercase mb-3">The Coastal Difference</p>
      <h2 className="text-3xl md:text-4xl font-bold text-[#0B2040] tracking-tight">Three things every other mobile mechanic doesn't have.</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1: Vacuum extraction */}
      {/* Card 2: Tire delivery (coming soon) */}
      {/* Card 3: Multi-vertical */}
    </div>
  </div>
</section>
```

Each card matches existing Coastal card styling (white bg, sand border `#E2DBCE`, 12px border radius, 24px padding).

**Card content (verbatim from V2 doc):**

Card 1:
- Eyebrow: `OIL SERVICE`
- Title: `Vacuum extraction. No mess.`
- Body: `We pull oil through the dipstick tube using the same vacuum extraction system high-end dealerships use. No drain plug, no crawling underneath, no drips on your driveway, your marina dock, or your fleet yard. Faster than conventional drain. Cleaner every time.`

Card 2:
- Eyebrow badge: `COMING SOON` (visually distinct — small amber/orange pill)
- Title: `Tire delivery and install`
- Body: `Soon you'll order tires online and have them shipped straight to your appointment location. Our van shows up with a full tire machine, mounts and balances on-site, and hauls away the old tires. Launching this summer.`
- Small line: `Already have tires you need installed? We'll mount and balance them at your location today. Just call.`

Card 3:
- Eyebrow: `ONE PROVIDER`
- Title: `Cars, boats, RVs, fleets. One call.`
- Body: `Most mobile mechanics handle one or two verticals. We cover all four. Your daily driver, your weekend boat, your RV, and your work fleet, all serviced by the same local team. One vendor. One invoice. One number to call.`

## Step 4: How It Works page (src/app/how-it-works/page.tsx)

Apply all How It Works changes from the master copy doc:

### 4a. Existing section edits

- Hero eyebrow, headline (now `No shop. No waiting. Your vehicle never moves.`), body
- Step 1 body text (2 paragraphs)
- Step 2 body text (paragraph 2 only — paragraph 1 stays)
- Step 3: title becomes **`You never left your day.`** (replacing whatever the current Step 3 title is). Both body paragraphs updated per V2 doc.

### 4b. NEW SECTION: "Where we set up" (insert after the 3 expanded steps)

Use a card grid pattern. 6 location items in a 2x3 desktop grid (or 3x2, whatever matches existing patterns):

```tsx
<section className="py-16 bg-white">
  <div className="max-w-5xl mx-auto px-4">
    <div className="text-center mb-10">
      <p className="text-xs font-semibold tracking-widest text-[#E07B2D] uppercase mb-3">Locations</p>
      <h2 className="text-3xl font-bold text-[#0B2040] tracking-tight mb-3">Wherever your vehicle lives</h2>
      <p className="text-[#555] max-w-xl mx-auto">Half the work of mobile service is showing up where you actually are. Here's where we set up.</p>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {/* 6 location pills/cards */}
    </div>
  </div>
</section>
```

The 6 location items (each in a small bordered card or pill, navy text on cream/white bg):
- `Your home driveway or garage`
- `Your office parking lot`
- `Marinas, slips, ramps, dry storage`
- `RV parks, campgrounds, storage lots`
- `Fleet yards and depots`
- `Job sites and construction lots`

### 4c. NEW SECTION: "What's in the van" (insert after "Where we set up")

Same section pattern but with equipment callouts. Each item gets a small icon (use lucide-react or inline SVG circle/dot — keep it minimal):

- Eyebrow: `THE VAN`
- Headline: `A real shop on wheels`
- Intro: `Our service van isn't a pickup truck with a toolbox. It's a fully equipped mobile bay carrying everything a dealership service department uses.`
- 6 equipment callouts (verbatim from V2 doc):
  - `Vacuum oil extraction system. The same kind dealerships use.`
  - `Full tire mount and balance machine`
  - `OEM-grade fluids and filters in stock`
  - `OBD2, marine, and RV diagnostic scanners`
  - `Pneumatic tools and calibrated torque wrenches`
  - `Spare parts on board: filters, brakes, batteries, belts, wipers`

### 4d. NEW SECTION: "What you don't have to do" (insert after "What's in the van", before FAQ strip)

Counter-positioning section. Visual: each item gets a strikethrough treatment OR a red/orange "no" indicator (small X icon or strikethrough text).

- Eyebrow: `WHAT YOU SKIP`
- Headline: `A short list of things you don't have to do.`
- 6 items, displayed with strikethrough or "X" indicator:
  - `Drive anywhere`
  - `Sit in a waiting room`
  - `Arrange a ride home`
  - `Reschedule your day`
  - `Deal with shop drop-off and pickup`
  - `Visit a tire shop, oil shop, or service center`

Suggested visual: each item in a row with a small `×` icon in coral/red on the left, the item text on the right with `text-decoration: line-through` and `color: #888`. This makes the visual immediately scannable as "things crossed off your list."

### 4e. FAQ strip (4 Q&As)

Add the new FAQ strip at the bottom of the page before the bottom CTA. Use the existing FAQ component/pattern if one exists, otherwise add inline with consistent styling.

The 4 Q&As (verbatim from V2 doc):
- Q: `Do you bring everything you need?` / A: `Yes. Our van carries OEM-grade oil, factory-spec filters, tires in stock, brake parts, diagnostic tools, and everything for a full service bay. We don't make trips to the parts store.`
- Q: `What about jobs you can't do on-site?` / A: `On-site we handle 95% of service and maintenance. For transmission rebuilds or internal engine work, we refer you to a trusted partner shop and coordinate drop-off for you.`
- Q: `How early do I need to book?` / A: `Most weeks we have same-day or next-day availability. Fleet and marine customers on a schedule book their slots weeks in advance.`
- Q: `What's included in the 12-month warranty?` / A: `If the work we performed isn't holding, we come back at no charge and make it right. Parts and labor covered for 12 months or 12,000 miles, whichever comes first.`

### 4f. Bottom CTA

- Headline: `Ready to skip the shop?`
- Body: `Pick a time that works for you. We handle the rest.`
- CTAs: `Book Service` / `Call 813-722-LUBE`

## Step 5: Services Overview page (src/app/services-overview/page.tsx)

Apply all Services Overview changes:
- Hero eyebrow, headline, body
- Card 1 Automotive: eyebrow change (add middle dot separators)
- Card 2 Marine: body text
- Card 3 RV: eyebrow (add middle dot separators), body text
- Card 4 Fleet: eyebrow, body text

Note: for eyebrows like `CARS · TRUCKS · SUVS`, the middle dot character is `·` (U+00B7), not a period.

## Step 6: Division pages

### /services (Automotive) — src/app/services/page.tsx
- Hero headline (now `Oil, tires, brakes, and the rest of the list.`) and body
- "Learn about fleet services →" → "See fleet services →"
- "Learn about marine services →" → "See marine services →"
- Bottom CTA headline and body

**ALSO add new section: "Coastal Tire Store coming soon" callout**

Position: between the service category list and the bottom CTA. Use a single full-width card with a soft cream/sand background to differentiate it from the regular service categories.

```tsx
<section className="py-12">
  <div className="max-w-4xl mx-auto px-4">
    <div className="bg-[#FAF7F2] border border-[#E2DBCE] rounded-xl p-8 md:p-10">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-xs font-semibold tracking-widest text-[#E07B2D] uppercase bg-[#FAEEDA] px-2 py-1 rounded">Coming Soon</span>
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-[#0B2040] tracking-tight mb-3">Coastal Tire Store</h2>
      <p className="text-[#555] mb-3 leading-relaxed">
        We're launching a tire store this summer. Order tires online, have them shipped to your appointment location, we install on-site. No tire shop visit, no waiting room, no mounting fees added at checkout.
      </p>
      <p className="text-sm text-[#7A7A7A] mb-5">
        Already have tires you need installed? Call 813-722-LUBE and we'll mount and balance them at your location today.
      </p>
      <div className="flex gap-3 flex-wrap">
        <a className="bg-[#0B2040] text-white px-5 py-2.5 rounded-lg text-sm font-semibold">Get notified when it launches</a>
        <a className="border border-[#C4BCAB] text-[#0B2040] px-5 py-2.5 rounded-lg text-sm font-semibold">Call 813-722-LUBE</a>
      </div>
    </div>
  </div>
</section>
```

The "Get notified" CTA should open a simple email-capture form (modal or inline expansion). If that's too much for this WO, link it to a mailto: with subject "Notify me when Coastal Tire Store launches" — captures intent without building a new form. WO-25 (future) can build the proper notification list.

### /fleet — src/app/fleet/page.tsx
- Hero eyebrow (if present in uppercase style), headline, body
- Bottom CTA headline tweak

### /marine — src/app/marine/page.tsx
- Hero headline and body
- "Where we service boats" → "Marinas and docks we cover"
- Add new "Ready to skip the haul?" CTA section before the footer if missing

### /rv — src/app/rv/page.tsx
- Hero headline and body
- "We come to you" value prop heading → "Your rig stays put"

## Step 7: About and Contact

### /about — src/app/about/page.tsx
- Hero headline and body
- Story section: REPLACE ALL THREE PARAGRAPHS with the 4-paragraph version from master copy. This is the one place in this WO that rewrites a block rather than surgical str_replace.
- 4 value prop cards (titles and bodies)

### /contact — src/app/contact/page.tsx
- Headline "Get in touch" → "Talk to us"

## Step 8: Global layout elements

### Footer — src/components/layout/Footer.tsx (or wherever footer tagline lives)
- "Automotive. Fleet. Marine. RV." → "Cars. Boats. RVs. Fleets. One call."

### Mobile Sticky Bar — src/components/layout/MobileStickyBar.tsx (or similar)
- Currently 2 buttons: Call / Book Service
- Change to 3 buttons: Call / Quote / Book
- "Quote" button triggers the Quick Quote slide-up panel (same handler as the desktop floating CTA)

### Floating Quote Bar (desktop) — src/components/layout/FloatingQuoteBar.tsx (or similar)
- Collapsed label: "Need a price? Ask us."
- Expanded sub: "Name, number, what you need. We call back within the hour."
- NOTE: the scroll-trigger removal and always-visible behavior is in WO-20, not this WO. Only change the text here.

## Step 9: Booking wizard hero text

### src/app/book/page.tsx
- Subheadline: "We come to you. You never leave your day." → "Pick your service, your vehicle, and a time. Takes about a minute."

## Step 10: Global find-and-replace pass

After all page-specific edits, run these site-wide replacements. Use grep to find, then individual str_replace per occurrence (do not use `sed -i` because it doesn't review context).

Search for each of these and replace based on context:

```bash
grep -rn "Learn More\|learn more" src/app src/components
grep -rn "Get Started" src/app src/components
grep -rn "—" src/app src/components  # em dash hunt
grep -rn "&nbsp;" src/app src/components
```

For each hit:
- "Learn More" / "learn more" → use a context-specific verb. For service links use "See services", for content links use "Read more", for feature explanations remove the link or change to a specific action.
- "Get Started" → "Book Service" (if it leads to /book) or "Get a Quote" (if it leads to a quote form)
- em dash → period or comma depending on sentence
- `&nbsp;` → regular space (let CSS handle spacing)

## Step 11: SEO meta tags

For each page that has its own `layout.tsx` or exports `metadata`, update the `metadata` object with the title and description from master copy doc Part 2.

Pages needing meta updates:
- `src/app/page.tsx` → Homepage metadata
- `src/app/services/page.tsx` → /services
- `src/app/fleet/page.tsx` → /fleet
- `src/app/marine/page.tsx` → /marine
- `src/app/rv/page.tsx` → /rv
- `src/app/how-it-works/page.tsx` → /how-it-works
- `src/app/about/page.tsx` → /about

Example format:
```ts
export const metadata: Metadata = {
  title: "Mobile Oil Change & Auto Service Apollo Beach | Coastal Mobile",
  description: "Mobile oil changes, tires, brakes, marine, RV, and fleet service across Apollo Beach and South Shore. We come to your driveway. 30 years of dealership-grade care.",
};
```

## Step 12: JSON-LD Schema (critical SEO win)

Add JSON-LD structured data to the root layout and key pages.

### src/app/layout.tsx — Organization + LocalBusiness schema

Add a `<script type="application/ld+json">` block inside the root `<head>` (or use Next.js `<Script>` component) with:

```json
{
  "@context": "https://schema.org",
  "@type": "AutoRepair",
  "name": "Coastal Mobile Lube & Tire",
  "image": "https://coastalmobilelube.com/og-image.jpg",
  "telephone": "+1-813-722-5823",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Apollo Beach",
    "addressRegion": "FL",
    "postalCode": "33572",
    "addressCountry": "US"
  },
  "areaServed": [
    { "@type": "City", "name": "Apollo Beach" },
    { "@type": "City", "name": "Ruskin" },
    { "@type": "City", "name": "Riverview" },
    { "@type": "City", "name": "Gibsonton" },
    { "@type": "City", "name": "Sun City Center" },
    { "@type": "City", "name": "Palmetto" },
    { "@type": "City", "name": "Ellenton" }
  ],
  "url": "https://coastalmobilelube.com",
  "openingHours": "Mo-Sa 07:00-18:00"
}
```

### src/app/how-it-works/page.tsx — FAQPage schema

Generate FAQPage schema from the 4 Q&A pairs added in Step 4. Format:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Do you bring everything you need?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Our van carries OEM-grade oil, factory-spec filters, tires in stock, brake parts, diagnostic tools, and everything for a full service bay. We don't make trips to the parts store."
      }
    }
    // ... same for all 4 questions
  ]
}
```

## Step 13: Build, commit, push, deploy

```bash
cd ~/coastal-mobile-lube
npm run build
```

If build fails on a specific file, read the error and fix. Do not revert all changes.

```bash
git add src/
git commit -m "WO-19: Site-wide copy overhaul + new content sections + SEO meta/schema

- New unified voice across homepage, how-it-works, services-overview, services, fleet, marine, rv, about, contact, booking
- Hero rewritten: 'We bring the shop. You keep your day.'
- Step 3 'You never left your day' as title
- NEW homepage section: The Coastal Difference (vacuum extraction, tire delivery coming soon, multi-vertical)
- NEW how-it-works sections: Where we set up, What's in the van, What you don't have to do, FAQ strip
- NEW /services callout: Coastal Tire Store coming soon
- Footer tagline, floating CTA text, mobile sticky bar rewording
- Meta titles and descriptions for all pages
- Organization and AutoRepair JSON-LD schema in root layout
- FAQPage schema on how-it-works
- Global: removed 'Learn More', em dashes, &nbsp; in copy"
git push origin main
npx netlify-cli deploy --prod
```

## Step 14: Verification

1. Open https://coastal-mobile-lube.netlify.app and scan the homepage top to bottom. Hero, how-it-works, services, stats, reviews, trust bar, bottom CTA, floating quote bar — every string should match the master copy doc.
2. Check /how-it-works — new FAQ strip should be present at the bottom.
3. Check /services-overview — card eyebrows should use middle dots not commas.
4. Check /about — story section should be 4 paragraphs starting with "Jason Binder spent 30 years running service departments..."
5. View page source on homepage, confirm `<meta name="description"` matches master copy.
6. View page source, confirm `<script type="application/ld+json">` block is present with AutoRepair schema.
7. Open Google Rich Results Test: https://search.google.com/test/rich-results → paste the homepage URL → should detect LocalBusiness / AutoRepair, no errors.
8. For /how-it-works: Google Rich Results Test should detect FAQPage schema.

## Do NOT

- Do NOT rewrite any page component wholesale. Surgical str_replace for every change except the About page story section.
- Do NOT touch the booking wizard Step 1 vehicle UI — that is WO-18's territory.
- Do NOT change any images or layouts yet — that is WO-20.
- Do NOT use `git add -A`. Use `git add src/`.
- Do NOT introduce em dashes or emojis anywhere.
