# HOMEPAGE VISUAL REDESIGN SPEC
# Coastal Mobile Lube & Tire
# Date: April 4, 2026
# Author: Jon Gold / Gold Co LLC
# For: Claude Code execution on Mac Mini (~/coastal-mobile-lube, tmux: coastal)

---

## OVERVIEW

The homepage needs a ground-up visual overhaul. Navy was bolted onto a white design and looks flat, blobby, and disconnected. The new direction: make the site feel like the van wrap came to life. Deep blue with atmospheric depth, sunset orange energy, gold premium accents, and real photographic texture.

This is NOT incremental patching. Every homepage section gets a visual pass. The page structure (header, hero, services, how it works, reviews, stats, trust, CTA, footer) stays the same, but the visual treatment changes completely.

**Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Firebase/Firestore
**Repo:** github.com/gonjold/coastal-mobile-lube
**Live:** coastal-mobile-lube.netlify.app

---

## DESIGN PRINCIPLES

1. **Atmospheric depth, not flat blocks.** Navy sections use radial gradients (lighter center fading to dark edges) instead of solid #0B2040. This gives the van wrap's dimensional feel.
2. **Gradient transitions, not hard cuts.** Where navy meets white, there is a gradient fade zone. No hard horizontal lines between color blocks.
3. **Van wrap energy.** The palette draws from the van wrap: deep blue depth, sunset orange (#E07B2D) for action, gold (#D9A441) for premium accents, teal (#0D8A8F) for trust signals.
4. **Oval badge as watermark.** The logo oval sits centered in the hero as a large, low-opacity watermark behind the headline. It anchors the brand without floating awkwardly.
5. **Warm breathing room.** Between navy sections, warm tones (sand #F4EEE3, cream #FFFDF8, white #FFFFFF) create contrast and prevent navy fatigue.
6. **Hull stripe continuity.** The van wrap's hull stripe pattern (blue | orange | gold | blue) appears at the footer top edge.

---

## COLOR PALETTE (updated)

### Navy depth ramp (use these instead of flat #0B2040 everywhere)
- Deepest: #071829 (footer bg, hero edges)
- Dark: #0B2040 (hero mid-tone, step numbers)
- Mid: #0F2847 (header gradient start)
- Atmospheric: #132E54 (card backgrounds on dark)
- Light: #162F52 (radial gradient center on hero/stats)

### Action
- Orange: #E07B2D (CTAs, price highlights, "you." accent)
- Orange hover: #CC6A1F
- Gold: #D9A441 (stars, review card bottom borders, eyebrow labels on warm sections)

### Trust
- Teal: #0D8A8F (checkmarks, trust signals)
- Teal soft: #E1F4F3

### Warm neutrals
- Sand: #F4EEE3 (reviews bg)
- Sand light: #F8F0E0 (reviews gradient end)
- Cream: #FFFDF8 (final CTA bg)
- Cream warm: #FBF5EB (final CTA gradient end)

### Clean neutrals
- White: #FFFFFF (services bg)
- Surface: #FAFBFC (how it works bg)

---

## PAGE FLOW (top to bottom)

```
Header ........... navy gradient (sticky, transparent glass on scroll)
Hero ............. navy radial gradient, deep atmospheric feel
                   Oval badge centered as large watermark (opacity ~0.06)
                   Headline left, quote widget right (frosted glass)
Gradient fade .... navy fades to white (40-60px transitional zone)
Services ......... white bg, 3 service cards (Auto, Fleet, Marine)
RV Callout ....... wide banner, navy bg with photo placeholder, link to /rv
How It Works ..... light surface (#FAFBFC), 3 steps with connecting track
Reviews .......... warm sand gradient, white review cards, gold star accents
Stats + Trust .... navy radial (combined into one section), orange stat numbers
Final CTA ........ warm cream bg, centered headline + two CTAs
Footer ........... hull stripe top edge, deepest navy, text wordmark
```

---

## SECTION-BY-SECTION SPEC

### 1. HEADER (sticky)
- Background: linear-gradient(135deg, #0F2847 0%, #0B2040 100%)
- On scroll: could add backdrop-filter blur for glass effect (optional, enhancement)
- Left: text wordmark "Coastal Mobile" (white, 800 weight) + "LUBE & TIRE" (rgba white 0.45, 600 weight, letter-spacing 2px)
- Center: nav links (Automotive, Fleet, Marine, About, Contact) in rgba white 0.85
- Right: phone "813-722-LUBE" (rgba white 0.9) + orange "Book Service" button
- No logo image in header. Text wordmark only.

### 2. HERO
- Background: radial-gradient(ellipse at 30% 40%, #162F52 0%, #0B2040 60%, #071829 100%)
- Oval badge: centered horizontally AND vertically in the hero section, large (300-400px), opacity 0.06, using the actual logo image from Cloudinary: https://res.cloudinary.com/dgcdcqjrz/image/upload/v1774315498/Coastal_Lube_logo_v1_zbx9qs.png
- Layout: two columns. Left = headline + CTAs. Right = quote widget.
- Eyebrow text: "Mobile automotive. Fleet. Marine." in gold (#D9A441), uppercase, letter-spacing 2.5px
- Headline: "The shop that comes to you." with "you." in orange (#E07B2D). Weight 800, size ~40-48px, letter-spacing -1px
- Subhead: current copy, rgba white 0.65, max-width ~420px
- CTAs: orange "Book Service" button + ghost "Call 813-722-LUBE" button (border rgba white 0.25)
- Trust pills below CTAs: teal checkmarks, rgba white 0.5 text
- Quote widget: frosted glass effect. Background rgba white 0.06, backdrop-filter blur(12px), border 1px rgba white 0.1, border-radius 14px. Form fields have rgba white 0.08 bg. Tab bar (Auto/Fleet/Marine) with selected state bg rgba white 0.12. Orange "Get My Quote" submit.

### 3. GRADIENT FADE
- A 40-60px div between hero and services
- Background: linear-gradient(to bottom, #0B2040 0%, transparent 100%) layered over white
- This eliminates the hard navy-to-white cut

### 4. SERVICES (3 cards)
- White background, generous padding
- Eyebrow: "SERVICES" in blue (#1A5FAC)
- Headline: "What we handle on-site" in navy (#0B2040)
- Three equal cards in a CSS grid (3 columns)
- Each card has:
  - Photo strip header (100-120px tall, navy gradient placeholder). When real photos come in: oil-change-service for Auto, commercial-service for Fleet, marina-boats for Marine
  - Category name (15px, weight 800, navy)
  - Service pills (small gray bg tags): Auto = Oil Changes, Tires, Brakes, Batteries. Fleet = PM Programs, Box Trucks, DOT. Marine = Outboard, Inboard, Winterization
  - Price line: "Starting at $89.95" (Auto), "Custom programs for every fleet" (Fleet), "Starting at $149.95" (Marine). Price/accent in orange.
  - CTA button: outline orange, text "Book Service" / "Get Fleet Quote" / "Get Marine Quote"
- Cards have 1px #eee border, border-radius 12px, subtle shadow on hover

### 5. RV CALLOUT (NEW SECTION)
- Wide banner, navy background with slight gradient
- Layout: text left, photo placeholder right (or reversed)
- Eyebrow: "RV SERVICE" in gold
- Headline: "We come to your RV park." in white, weight 800
- Body: "Same factory-trained service for your motorhome, fifth wheel, or travel trailer. Oil changes, diesel service, tire work, and more." in rgba white 0.65
- CTA: orange button "Learn More" linking to /rv
- Photo placeholder: will eventually use rv/camper stock or van-at-rv-park photo
- This section sits between Services and How It Works

### 6. HOW IT WORKS
- Background: #FAFBFC (light surface)
- Eyebrow: "HOW IT WORKS" in blue
- Headline: "Three steps. That's it." in navy
- Three steps in a horizontal row with a connecting track line behind them
- Track: 2px line, navy-to-orange gradient, opacity 0.15
- Step circles: 44px, navy bg (#0B2040) for steps 1-2, orange (#E07B2D) for step 3
- Step text: title weight 700, description weight 400 in gray
- Step 1: "Book online or call" / "Pick your service, enter your zip, choose a time."
- Step 2: "We show up" / "Our fully equipped van arrives at your location, on time."
- Step 3: "Done. Go." / "No waiting rooms. You never left your day."

### 7. REVIEWS
- Background: linear-gradient(135deg, #F4EEE3 0%, #F8F0E0 100%) (warm sand)
- Eyebrow: "REVIEWS" in gold (#D9A441)
- Headline: "What our customers say" in navy
- Horizontal row of review cards (3-4 visible, horizontal scroll on mobile)
- Cards: white bg, border-radius 10px, 3px bottom border in gold (#D9A441)
- Gold star ratings (&#9733;)
- Review text in #333
- Customer name (weight 700, navy) + city (weight 400, #999)
- Keep existing review content
- Note: copy says "Tampa" not "Tampa Bay" per copy rules

### 8. STATS + TRUST (combined section)
- Background: radial-gradient(ellipse at 50% 30%, #162F52 0%, #0B2040 60%, #071829 100%)
- Stats row: 30+ / <1hr / 100% / $0 in orange (#E07B2D), weight 800, ~32px
- Stat labels in rgba white 0.5
- Subtle divider: 1px rgba white 0.08
- Trust badges row below: icons in subtle glass squares (rgba white 0.06 bg, border-radius 6px)
- Badges: Licensed & Insured, ASE-Certified Techs, 12-Month Warranty, Transparent Pricing
- Badge text in rgba white 0.7

### 9. FINAL CTA
- Background: linear-gradient(135deg, #FFFDF8 0%, #FBF5EB 100%) (warm cream)
- Eyebrow: "READY?" in gold
- Headline: "Skip the shop." in navy, weight 800
- Subhead: "Book your mobile service today. Most appointments available within the week."
- Two CTAs: solid orange "Book Service" + outlined navy "Call 813-722-LUBE"

### 10. FOOTER
- Hull stripe at top: flex row, 3px tall. Blue (flex:2) | Orange (flex:1) | Gold (flex:1) | Blue (flex:3)
- Background: #071829 (deepest navy)
- Text wordmark left: "Coastal Mobile" + "LUBE & TIRE" + "Automotive. Fleet. Marine." + phone in orange
- Service links column: Automotive, Fleet & Commercial, Marine, Book Service
- Company links column: About, Contact, Service Areas, FAQ
- Copyright row at bottom with Gold Co LLC credit
- All text uses rgba white at various opacities (0.25-0.6)

---

## COPY RULES (must follow)
- No em dashes anywhere
- No emojis
- No AI-sounding copy
- Service order always: Automotive, Fleet, Marine
- "Tampa" not "Tampa Bay"
- "Coastal Mobile" shorthand, full name only in headers/legal

---

## CLOUDINARY IMAGE URLS

Logo (for hero watermark):
https://res.cloudinary.com/dgcdcqjrz/image/upload/v1774315498/Coastal_Lube_logo_v1_zbx9qs.png

Van wrap (about page, reference):
https://res.cloudinary.com/dgcdcqjrz/image/upload/v1774317068/Van_mockup_ln68oh.png

Service photos (for card headers when ready):
- hero-van-driveway: https://res.cloudinary.com/dgcdcqjrz/image/upload/v1774318456/hero-van-driveway_nag1pq.jpg
- oil-change-service: https://res.cloudinary.com/dgcdcqjrz/image/upload/v1774318456/oil-change-service_zptify.jpg
- fleet-vehicles: https://res.cloudinary.com/dgcdcqjrz/image/upload/v1774318456/fleet-vehicles_cjciux.jpg
- marina-boats: https://res.cloudinary.com/dgcdcqjrz/image/upload/v1774318456/marina-boats_daijbf.jpg
- commercial-service: https://res.cloudinary.com/dgcdcqjrz/image/upload/v1774318456/commercial-service_wbgfog.jpg

Cloudinary responsive transforms:
- Auto: /w_1200,q_auto,f_auto/
- Hero: /w_1920,h_800,c_fill,q_auto,f_auto/
- Card: /w_400,h_300,c_fill,q_auto,f_auto/

---

## WO EXECUTION SEQUENCE

Each WO is surgical. Max 3-4 changes per WO. CC must read target files in full before making changes. Every WO includes build + commit + push.

### WO-1: Hero + Header + Gradient Fade
**Target files:** Read page.tsx (homepage) and Header component first.
**Changes:**
1. Header: change bg to navy gradient, text to white/rgba, nav links to white, CTA stays orange. Remove any logo image from header, text wordmark only.
2. Hero: replace flat navy bg with radial gradient. Add oval badge as centered watermark image (position absolute, centered, large, opacity 0.06). Update eyebrow to gold.
3. Hero quote widget: change to frosted glass (rgba bg, backdrop-filter blur, translucent borders and inputs).
4. Add gradient fade div between hero and next section (linear-gradient navy to transparent, 50px tall).

**Do NOT rewrite the entire file.** Make surgical edits to existing styles.
**Do NOT touch globals.css or tailwind config.**
**Finish:** npm run build && git add -A && git commit -m "WO-1: Hero redesign with atmospheric navy, watermark badge, frosted glass quote widget" && git push origin main

### WO-2: Services Cards + RV Callout
**Target files:** Read page.tsx homepage services section.
**Changes:**
1. Replace tabbed services layout with 3-card grid (Auto, Fleet, Marine). Each card: photo strip header (navy gradient placeholder), category name, service pills, pricing line, outline CTA.
2. Add RV callout section after services. Navy bg with gradient, "We come to your RV park." headline, body text, orange CTA linking to /rv.
3. Update service pills and pricing to use real data (Auto starting at $89.95, Marine starting at $149.95, Fleet quote-only).

**Do NOT rewrite the entire file.** Make surgical edits to the services section.
**Do NOT touch globals.css or tailwind config.**
**Finish:** npm run build && git add -A && git commit -m "WO-2: Service cards grid, RV callout section, real pricing" && git push origin main

### WO-3: How It Works + Reviews
**Target files:** Read page.tsx how-it-works and reviews sections.
**Changes:**
1. How It Works: add connecting track line behind step circles. Update step 3 circle to orange. Ensure bg is #FAFBFC surface.
2. Reviews: change bg to warm sand gradient. Add 3px gold bottom border to review cards. Update eyebrow color to gold. Fix any "Tampa Bay" references to just "Tampa".
3. Clean up any hard edges between sections, ensure smooth visual transitions.

**Do NOT rewrite the entire file.** Make surgical edits to these two sections.
**Do NOT touch globals.css or tailwind config.**
**Finish:** npm run build && git add -A && git commit -m "WO-3: How It Works track line, Reviews warm sand treatment" && git push origin main

### WO-4: Stats/Trust Merge + CTA + Footer
**Target files:** Read page.tsx stats section, trust bar, CTA section, Footer component.
**Changes:**
1. Merge stats section and trust bar into one navy section with radial gradient bg. Stats on top, divider, trust badges below.
2. Final CTA: change bg to warm cream gradient. Update eyebrow to gold.
3. Footer: add hull stripe div at top (flex row, 3px, blue|orange|gold|blue). Deepen footer bg to #071829. Ensure text wordmark layout.

**Do NOT rewrite the entire file.** Make surgical edits to these sections.
**Do NOT touch globals.css or tailwind config.**
**Finish:** npm run build && git add -A && git commit -m "WO-4: Combined stats/trust, warm CTA, hull stripe footer" && git push origin main

---

## CC LAUNCH PROMPT (paste into tmux after SCP)

```
Read HOMEPAGE-VISUAL-REDESIGN-SPEC.md in full. This is a comprehensive visual redesign of the homepage. Execute WO-1 first. Before making any changes, read the target files completely. Make surgical edits only, do NOT rewrite entire files. Do NOT touch globals.css or tailwind config. Follow the spec exactly for colors, gradients, opacity values, and layout. After completing WO-1, stop and report what was changed so I can review before moving to WO-2.
```

---

*Generated: April 4, 2026*
