# WORK ORDER: Marine Page — Full Build

## CONTEXT
The /marine page is currently a placeholder with "coming soon" text. It needs a full build matching the design language of the Services and Fleet pages. Marine is one of the three service verticals and must be presentable for the Wednesday client meeting.

**Design system:** Navy #0B2040, Orange #E07B2D, Blue #1A5FAC, Surface #FAFBFC, Plus Jakarta Sans
**Match the design patterns from:** Fleet page (FleetContent.tsx) and Services page (ServicesContent.tsx)

## REPLACE the entire content of `src/app/marine/page.tsx`

### Page Metadata
- Title: "Marine Engine Service | Coastal Mobile Lube & Tire | Tampa"
- Description: "Dockside and boat ramp engine service across Tampa Bay. Outboard and inboard oil changes, lower unit service, impeller replacement, and seasonal maintenance packages."

### Page Structure (top to bottom)

**Section 1 — Hero (white background, left-aligned)**
- Eyebrow: "MARINE SERVICES" (blue, 13px uppercase, 700 weight)
- H1: "Dockside service for your boat" (navy, 42px desktop / 30px mobile, weight 800)
- Subtitle: "We service outboard and inboard engines right at the marina or boat ramp. No hauling, no waiting. Factory-grade parts, certified technicians, and a 12-month service warranty on every job." (color #444, 16px)
- Two CTAs: "Request Marine Quote" (orange button, links to `/contact`) + "Call 813-722-LUBE" (outlined button, `tel:8137225823`)

Use Cloudinary image `marinaBoatsAlt` on the right side (desktop: 2-column grid, image right; mobile: image stacked below text). Use the cloudinaryUrl helper with width 800.

**Section 2 — Service Packages (surface #FAFBFC background)**
- Eyebrow: "PACKAGES"
- Title: "Marine service packages"

Three cards in a row (desktop 3-col grid, mobile stack):

Card 1 — "Dock Ready"
- Price: "Starting at $149"
- Description: "Quick dockside service for single-engine boats"
- Includes: Engine oil and filter change, Lower unit gear oil check, Battery test, Visual hull and anode inspection, Safety systems check

Card 2 — "Captain's Choice" (highlight this card with orange top border, 3px)
- Price: "Starting at $399"
- Description: "Complete annual service per engine"
- Includes: Full oil and filter change, Lower unit gear oil change with pressure test, Impeller replacement, Spark plugs, Fuel filter and water separator, Anode inspection and replacement, Battery service, Steering cable lubrication

Card 3 — "Season Opener"
- Price: "Starting at $249"
- Description: "Get your boat ready for the water"
- Includes: Fuel system flush and stabilizer, Oil and filter change, Battery charge and test, Impeller inspection, Lower unit oil change, Full systems check

Card styling: white background, border 1px solid #e8e8e8, border-radius 12px, padding 28px. Package name in navy 20px 700 weight. Price in orange 16px 600 weight. Include items as a list with small orange dots.

**Section 3 — Individual Services (white background)**
- Eyebrow: "A LA CARTE"
- Title: "Individual marine services"

Two-column grid of service items (same style as fleet page service list):
- Outboard Oil Change — routine maintenance for any outboard
- Inboard Engine Service — oil, filters, and fluid check
- Lower Unit Service — gear oil change and seal inspection
- Impeller Replacement — raw water pump maintenance
- Fuel System Service — filter, water separator, stabilizer
- Anode and Zinc Replacement — saltwater corrosion protection
- Battery Service — testing, charging, and replacement
- Winterization and Storage Prep — seasonal protection package

Each item: service name bold (navy, 15px, 600), description below in gray (14px, #666). White card with border, same styling as fleet service list.

**Section 4 — "Where we service" (navy #0B2040 background)**
- Title: "Where we service boats" (white, 28px, 800)
- Subtitle: "We come to you at marinas, boat ramps, dry storage, and private docks across Tampa Bay and Hillsborough County." (white/70% opacity)
- Location list (inline, separated by dots or pipes): Tampa, Apollo Beach, Ruskin, Davis Islands, Westshore, Gandy, Courtney Campbell, Bayshore

**Section 5 — CTA (surface #FAFBFC background)**
- Title: "Ready to get your boat serviced?"
- Subtitle: "Tell us about your vessel and we will put together a custom service plan."
- Two CTAs: "Request Marine Quote" (orange, links to `/contact`) + "Call 813-722-LUBE" (outlined, `tel:8137225823`)

**Section 6 — Cross-links**
Two teaser cards linking to /services and /fleet (same pattern as bottom of services page):
- "Looking for automotive service?" → /services
- "Need fleet maintenance?" → /fleet

### SEO
- Use proper heading hierarchy (single H1, H2 for section titles, H3 for package/service names)

## DO NOT
- Do not modify any other pages
- Do not change shared components
- Do not add npm packages

## WHEN DONE
```bash
npm run build && npx netlify deploy --prod --dir=.next && git add -A && git commit -m "feat: marine page — full build with packages, services, locations" && git push origin main
```
