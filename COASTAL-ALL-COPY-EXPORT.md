# Coastal Mobile Lube & Tire — Complete Public Copy Export
Generated: 2026-04-21 from commit 008028c
Source site: coastal-mobile-lube.netlify.app

---

## GLOBAL

### SEO — Site-wide defaults (src/app/layout.tsx)
- Title (default): `Coastal Mobile Lube & Tire | Mobile Auto, Marine & RV Service | Tampa Bay`
- Title template: `%s | Coastal Mobile Lube & Tire`
- Meta description: `Factory-trained mobile mechanics serving Tampa Bay. Oil changes, brakes, tires, marine engine service, and RV maintenance at your location. Call 813-722-LUBE.`
- Open Graph title: `Coastal Mobile Lube & Tire | Mobile Auto, Marine & RV Service | Tampa Bay`
- Open Graph description: `Factory-trained mobile mechanics serving Tampa Bay. Oil changes, brakes, tires, marine engine service, and RV maintenance at your location. Call 813-722-LUBE.`
- Open Graph site name: `Coastal Mobile Lube & Tire`
- Open Graph image alt: `Coastal Mobile Lube & Tire`
- Twitter title: `Coastal Mobile Lube & Tire | Mobile Service in Apollo Beach FL`
- Twitter description: `Mobile oil change, tire service, and marine engine maintenance. 30 years of dealership expertise brought to your door. Call 813-722-LUBE.`
- Canonical URL: `https://coastalmobilelube.com`

### Structured data (JSON-LD, layout.tsx)
- Organization name: `Coastal Mobile Lube & Tire LLC`
- LocalBusiness name: `Coastal Mobile Lube & Tire`
- Telephone: `+1-813-722-5823`
- Email: `Coastalmobilelube@gmail.com`
- Address: Apollo Beach, FL 33572, US
- Geo: latitude 27.7731, longitude -82.4075
- Hours: Mon–Sat, 07:00–18:00
- Price range: `$$`
- Areas served (cities): Apollo Beach, Ruskin, Riverview, Gibsonton, Sun City Center, Palmetto, Ellenton
- LocalBusiness description: `Mobile oil change, tire service, and marine engine maintenance in Apollo Beach and the South Shore. 30 years of dealership expertise brought to your driveway, parking lot, or marina.`
- Service (Automotive) name: `Mobile Automotive Service`
- Service (Automotive) description: `Oil changes, tire rotation, brake service, fluid flushes, and routine maintenance at your home or office.`
- Service (Fleet) name: `Fleet Maintenance Program`
- Service (Fleet) description: `Scheduled mobile maintenance programs for commercial fleets. Preventive maintenance tiers for gas and diesel vehicles.`
- Service (Marine) name: `Marine Engine Service`
- Service (Marine) description: `Dockside service for outboard, inboard, and diesel marine engines. Oil changes, lower unit service, impeller replacement, and seasonal maintenance.`
- Service area servedBy: `Apollo Beach, FL and South Shore communities`

### Nav / Header (all pages — src/components/Header.tsx)
- Logo wordmark line 1: `Coastal Mobile`
- Logo wordmark line 2: `Lube & Tire`
- Desktop nav link 1: `How It Works`
- Desktop nav link 2 (dropdown trigger): `Services`
- Services dropdown items (NavServicesDropdown.tsx): `Automotive`, `Marine`, `RV`, `Fleet`
- Desktop nav link 3: `About`
- Desktop nav link 4: `Contact`
- Desktop phone button: `813-722-LUBE`
- Desktop primary CTA: `Book Service`
- Mobile phone icon aria-label: `Call 813-722-LUBE`
- Mobile menu aria-label: `Open menu`

### Mobile drawer (Header.tsx)
- Close aria-label: `Close menu`
- Drawer link 1: `How It Works`
- Drawer "Services" accordion header: `Services`
- Drawer Services sub-links: `All Services`, `Automotive`, `Marine`, `RV`, `Fleet`
- Drawer link: `About`
- Drawer link: `Contact`
- Drawer secondary CTA: `Get a Quote`
- Drawer phone button: `813-722-LUBE`
- Drawer primary CTA: `Book Service`

### Sticky bottom bar (mobile only — src/components/StickyBottomBar.tsx)
- Button 1: `Call`
- Button 2: `Quote`
- Button 3: `Book`

### Floating Quote FAB / Chat widget (src/components/QuoteFAB.tsx)
- Trigger label (both mobile and desktop): `Need a price? Ask us.`

### Footer (all pages — src/components/Footer.tsx)
- Tagline under logo: `Cars. Boats. RVs. Fleets. One call.`
- Phone (large, prominent): `813-722-LUBE`
- Services column header: `Services`
- Services column links (in order):
  - `All Services` → /services-overview
  - `Automotive` → /services
  - `Fleet & Commercial` → /fleet
  - `Marine` → /marine
  - `RV` → /rv
  - `Book Service` (opens booking modal)
- Company column header: `Company`
- Company column links (in order):
  - `How It Works` → /how-it-works
  - `About` → /about
  - `Service Areas` → /service-areas
  - `FAQ` → /faq
  - `Contact` → /contact
  - `Book Service` (opens booking modal)
- Bottom row badge alt: `ASE Certified`
- Bottom row copyright: `2026 Coastal Mobile Lube & Tire. All rights reserved.`
- Bottom row legal links: `Privacy Policy`, `Terms of Service`
- Bottom row right-side credit: `Website by Gold Co LLC`

---

## HOMEPAGE (/)

### Hero — Mobile + Desktop (src/app/page.tsx)
Hero copy is populated from Firestore `siteConfig/heroCopy` with fallbacks defined in `HERO_DEFAULTS`. The fallback/default copy is:
- Eyebrow line 1: `APOLLO BEACH · TAMPA BAY · SOUTH SHORE`
- Eyebrow line 2: `Cars. Boats. RVs. Fleets.`
- H1 / Headline: `We bring the shop. You keep your day.`
- Desktop subheadline: `Mobile oil, tires, brakes, marine, RV, and fleet service. A fully equipped shop on wheels, at your driveway, marina, RV park, storage lot, or job site. Backed by 30 years of dealership service and a 12-month warranty on every job.`
- Mobile subheadline (hardcoded): `Mobile service for cars, boats, RVs, and fleets. We come to wherever your vehicle lives.`
- Primary CTA (mobile + desktop): `Book Service`
- Secondary CTA (mobile + desktop): `Call 813-722-LUBE`

### Hero trust pills (mobile cards + desktop capsule)
- Trust pill 1: `Factory-trained team`
- Trust pill 2: `Licensed and insured`
- Trust pill 3: `12-month warranty`

### Hero quote form (desktop right column)
- Card heading: `Connect with us`
- Card subhead: `Tell us what you need. We get back to you fast.`
- Field placeholders (in order): `First name`, `Last name`, `Phone`, `Email`, `City`
- Service-needed select placeholder: `Service needed`
- Service-needed select options: `Oil change`, `Tires`, `Brakes`, `Marine service`, `RV service`, `Fleet service`, `Other`
- Submit button (idle): `Send Quote Request`
- Submit button (submitting): `Sending...`
- Success message: `Got it! We'll be in touch soon.`
- Error message: `Something went wrong. Call 813-722-LUBE.`

### "How It Works" section
- Eyebrow: `HOW IT WORKS`
- H2: `Three steps. That's the whole thing.`
- Step 1 number: `1`
- Step 1 title: `Book in 60 seconds`
- Step 1 body: `Pick your service, enter your vehicle, choose a time. Or call and we book it for you.`
- Step 2 number: `2`
- Step 2 title: `We come to your location`
- Step 2 body: `Our van shows up at your home, office, marina, storage lot, or job site. On time. Fully equipped. Ready to work.`
- Step 3 number: `3`
- Step 3 title: `You never left your day.`
- Step 3 body: `Most jobs done in under an hour. Digital invoice in your inbox. 12-month warranty included. Your vehicle never moved. Neither did you.`

### "The Coastal Difference" section
- Eyebrow: `The Coastal Difference`
- H2: `Three things every other mobile mechanic doesn't have.`
- Card 1 eyebrow: `OIL SERVICE`
- Card 1 title: `Vacuum extraction. No mess.`
- Card 1 body: `We pull oil through the dipstick tube using the same vacuum extraction system high-end dealerships use. No drain plug, no crawling underneath, no drips on your driveway, your marina dock, or your fleet yard. Faster than conventional drain. Cleaner every time.`
- Card 2 badge: `COMING SOON`
- Card 2 title: `Tire delivery and install`
- Card 2 body (para 1): `Soon you'll order tires online and have them shipped straight to your appointment location. Our van shows up with a full tire machine, mounts and balances on-site, and hauls away the old tires. Launching this summer.`
- Card 2 body (para 2): `Already have tires you need installed? We'll mount and balance them at your location today. Just call.`
- Card 3 eyebrow: `ONE PROVIDER`
- Card 3 title: `Cars, boats, RVs, fleets. One call.`
- Card 3 body: `Most mobile mechanics handle one or two verticals. We cover all four. Your daily driver, your weekend boat, your RV, and your work fleet, all serviced by the same local team. One vendor. One invoice. One number to call.`

### Services section
- Eyebrow: `Services`
- H2: `Everything we handle on-site`
- Sub (desktop only): `Factory-grade work for cars, trucks, boats, RVs, and commercial fleets. Brought directly to your location by a local team trained on dealership standards.`
- Tab labels: `Automotive`, `Fleet & Commercial`, `Marine`, `RV`
- Card "Starting at" prefix: `Starting at $X.XX`
- Fallback label when no price: `Call for pricing`
- Mobile "Starting at" (expanded): `Starting at $X.XX`
- Mobile default CTA: `Book This Service`
- Fleet category CTA override: `Request Fleet Quote`
- "View all" link (varies per tab):
  - Automotive: `View all Automotive services →`
  - Fleet: `View all Fleet services →`
  - Marine: `View all Marine services →`
  - RV: `View all RV services →`
- Mobile "View All" link: `View All Services →`

[SOURCE: `DIVISION_CATEGORIES` in src/app/page.tsx — hardcoded fallbacks when Firestore `serviceCategories` is empty. When Firestore is populated, display name comes from `tabLabel || name` and description comes from Firestore `description`. Hardcoded defaults below:]

#### Automotive tab (default categories)
- `Oil Changes` — `Conventional, synthetic blend, full synthetic, and diesel oil changes. Factory-grade service at your location.`
- `Tires & Wheels` — `Tire rotation, flat repair, mount and balance, TPMS service, and new tire installation.`
- `Brakes` — `Front and rear brake pads, full brake jobs, and brake fluid flush.`
- `Basic Maintenance` — `Wiper blades, air filters, cabin filters, batteries, coolant flush, belts, and more.`
- `A/C & Heating` — `A/C diagnostic, EVAC and recharge, and heating system service.`

#### Fleet tab (default categories)
- `Custom Fleet Maintenance Programs` — `Scheduled maintenance for your entire fleet. Volume pricing available.` — CTA: `Request Fleet Quote`

#### Marine tab (default categories)
- `Oil Service` — `Outboard and inboard engine oil changes, filter replacement, and lower unit service.`
- `Engine Service` — `Fuel system service, diesel maintenance, and comprehensive engine diagnostics.`
- `Electrical & Maintenance` — `Battery service, wiring, lighting, belts, hoses, and marine system diagnostics.`
- `Winterization` — `Complete winterization service to protect your boat during the off-season.`

#### RV tab (default categories)
- `Oil & Lube` — `Full synthetic and diesel oil changes for motorhomes and tow vehicles.`
- `Tires & Wheels` — `Tire rotation, flat repair, mount and balance, and TPMS service for RVs.`
- `Brakes` — `Brake pads, rotors, and brake system service for all RV types.`
- `Maintenance` — `Generator service, roof inspections, slide-out care, filters, and more.`

### Stats row (4 stats)
- Stat 1 value: `30+`
- Stat 1 label: `Years dealership experience`
- Stat 2 value: `<1hr`
- Stat 2 label: `Most jobs`
- Stat 3 value: `100%`
- Stat 3 label: `Mobile, always`
- Stat 4 value: `$0`
- Stat 4 label: `Surprise fees`

### Trust Bar (4-icon strip, inline)
- Indicator 1: `Licensed and insured`
- Indicator 2: `ASE-certified team`
- Indicator 3: `12-month service warranty`
- Indicator 4: `Flat, honest pricing`

### CTA band (desktop only)
- Eyebrow: `Ready when you are`
- H2: `Skip the shop. Keep your day.`
- Sub: `Most appointments available within the week. Booking takes under a minute.`
- Primary CTA: `Book Service`
- Secondary CTA: `Call 813-722-LUBE`

NOTE: A "Reviews" / testimonials section is NOT currently present on the homepage (removed in commit 008028c "Remove fabricated testimonials section from homepage"). The work-order template mentioned it — it has been stripped from the current page.tsx.

---

## HOW IT WORKS (/how-it-works)

### SEO
- Title: `How Mobile Service Works | Coastal Mobile Lube`
- Description: `Book in 60 seconds. We come to your location. Your vehicle never moves. Three steps, one hour, zero trips to a garage.`
- Open Graph title/description: same

### Hero
- Eyebrow: `How It Works`
- H1 (two lines): `No shop. No waiting.` / `Your vehicle never moves.`
- Body: `Here's exactly what happens from the moment you book to the moment we leave. Three steps, one hour, zero trips to a garage.`

### Step One
- Badge number: `1`
- Eyebrow: `Step One`
- H2: `Book in 60 seconds`
- Body (para 1): `Pick your service, enter your vehicle, choose a time. The whole thing takes under a minute.`
- Body (para 2): `Have a VIN? Paste it in, we auto-fill the rest. Returning customer? Enter your phone and your vehicle history loads in a second.`
- CTA: `Book Service`
- Illustration in-image text: `Book Service`, `YOUR VEHICLE`, `Enter VIN...`, `or search`, `2024 Toyota Tacoma`, `FUEL TYPE`, `Gas`, `Next`, `60 SEC`

### Step Two
- Badge number: `2`
- Eyebrow: `Step Two`
- H2: `We come to you`
- Body (para 1): `Our fully equipped service van rolls up at your driveway, office parking lot, marina slip, or job site.` then bold phrase `On time. Every time.`
- Body (para 2): `The van carries what a shop bay carries. Pneumatic tools, OEM-grade fluids, full tire machine, vacuum oil extraction, diagnostic scanners, certified equipment. And a factory-trained tech, not a gig-app contractor.`
- Illustration in-image text: `COASTAL`, `MOBILE LUBE`

### Step Three
- Badge number: `3`
- Eyebrow: `Step Three`
- H2: `You never left your day`
- Body (para 1): `Most services complete in under an hour. You get an itemized digital invoice and pay securely online. No cash, no paperwork, no shop visit.`
- Body (para 2): `Every service is backed by a 12-month warranty. If anything is not right, we come back and make it right. Your vehicle never moved an inch. Neither did your schedule.`
- Illustration in-image text: `INVOICE`, `Oil Change`, `$89`, `Synthetic blend`, `Filter replacement`, `Fluid top-off`, `PAID`, `12 MO`, `WARRANTY`, `ALL SERVICE`

### Where We Set Up section
- Eyebrow: `Locations`
- H2: `Wherever your vehicle lives`
- Sub: `Half the work of mobile service is showing up where you actually are. Here's where we set up.`
- Location chips (in order):
  - `Your home driveway or garage`
  - `Your office parking lot`
  - `Marinas, slips, ramps, dry storage`
  - `RV parks, campgrounds, storage lots`
  - `Fleet yards and depots`
  - `Job sites and construction lots`

### What's In The Van section
- Eyebrow: `The Van`
- H2: `A real shop on wheels`
- Sub: `Our service van isn't a pickup truck with a toolbox. It's a fully equipped mobile bay carrying everything a dealership service department uses.`
- List items:
  - `Vacuum oil extraction system. The same kind dealerships use.`
  - `Full tire mount and balance machine`
  - `OEM-grade fluids and filters in stock`
  - `OBD2, marine, and RV diagnostic scanners`
  - `Pneumatic tools and calibrated torque wrenches`
  - `Spare parts on board: filters, brakes, batteries, belts, wipers`

### What You Skip section
- Eyebrow: `What You Skip`
- H2: `A short list of things you don't have to do.`
- List items (strikethrough):
  - `Drive anywhere`
  - `Sit in a waiting room`
  - `Arrange a ride home`
  - `Reschedule your day`
  - `Deal with shop drop-off and pickup`
  - `Visit a tire shop, oil shop, or service center`

### Common questions (strip, 4 Qs)
- H2: `Common questions`
- Q1: `Do you bring everything you need?`
- A1: `Yes. Our van carries OEM-grade oil, factory-spec filters, tires in stock, brake parts, diagnostic tools, and everything for a full service bay. We don't make trips to the parts store.`
- Q2: `What about jobs you can't do on-site?`
- A2: `On-site we handle 95% of service and maintenance. For transmission rebuilds or internal engine work, we refer you to a trusted partner shop and coordinate drop-off for you.`
- Q3: `How early do I need to book?`
- A3: `Most weeks we have same-day or next-day availability. Fleet and marine customers on a schedule book their slots weeks in advance.`
- Q4: `What's included in the 12-month warranty?`
- A4: `If the work we performed isn't holding, we come back at no charge and make it right. Parts and labor covered for 12 months or 12,000 miles, whichever comes first.`

### Trust band stats (4 stats)
- `30+` / `Years in fixed ops`
- `<1hr` / `Most services`
- `100%` / `Mobile, always`
- `$0` / `Surprise fees`

### FAQ section (full list, 8 Qs)
- Eyebrow: `Frequently Asked`
- H2: `Common questions`
- Q1: `Do I need to be home when you service the vehicle?`
- A1: `Not required. As long as we can access the vehicle and it is safe to work on, we can perform most services without you being present. We recommend being available by phone in case we have questions. For services that require vehicle startup, test drive, or a signature on parts recommendations, we will ask you to be nearby.`
- Q2: `What is your service area?`
- A2: `Apollo Beach, Ruskin, Sun City Center, Riverview, Gibsonton, and surrounding South Shore and Tampa Bay communities. If you are outside our standard area, call us. We can often accommodate on a case-by-case basis or for fleet accounts.`
- Q3: `What payment methods do you accept?`
- A3: `Credit card, debit card, digital wallets, and ACH. You receive an invoice with a secure payment link. Fleet accounts can set up monthly billing.`
- Q4: `What if my vehicle needs a part you do not have on the van?`
- A4: `Our vans are stocked for the vast majority of common services. If a specific part is needed, we will source it and schedule a return visit, usually within 24 to 48 hours. You only pay for the service once it is completed.`
- Q5: `Is mobile service more expensive than a shop?`
- A5: `Our pricing is competitive with traditional shops for comparable services. When you factor in the time you save not sitting in a waiting room, driving to and from the shop, or arranging a ride, mobile service is typically the better value.`
- Q6: `Are you licensed and insured?`
- A6: `Yes. Fully licensed, bonded, and insured. Our techs are ASE-certified with 30 plus years of combined experience. All work is backed by a 12-month service warranty.`
- Q7: `How far in advance should I book?`
- A7: `Same-day service is often available. For preferred time slots or larger services like full brake jobs, booking 1 to 3 days ahead is recommended. Fleet accounts can set up recurring scheduled service.`
- Q8: `What happens if it rains?`
- A8: `Most services continue in light rain. For safety reasons we may reschedule in heavy weather or lightning. We will contact you directly if we need to move your appointment.`

### Bottom CTA
- H2: `Ready to skip the shop?`
- Sub: `Pick a time that works for you. We handle the rest.`
- Primary CTA: `Book Service`
- Secondary CTA: `Call 813-722-LUBE`

---

## SERVICES OVERVIEW (/services-overview)

### SEO
- Title: `Our Services | Coastal Mobile Lube & Tire`
- Description: `Mobile automotive, marine, RV, and fleet service across Apollo Beach and Tampa Bay. Oil changes, brakes, tires, and more. We come to you.`
- OG description: `Mobile automotive, marine, RV, and fleet service across Tampa Bay.`

### Hero
- Eyebrow: `Services`
- H1 (two lines): `One team. Four verticals.` / `Everything you own.`
- Body: `Cars, trucks, boats, RVs, and commercial fleets. Mobile service from a local team trained on dealership standards. Wherever your vehicle lives, that's where we work.`

### Automotive card
- Eyebrow: `CARS · TRUCKS · SUVS`
- Card H3: `Automotive`
- Body: `Full-service mobile maintenance for passenger vehicles. Factory-trained techs. OEM-grade parts. At your home or office.`
- Bullets:
  - `Oil changes (conventional, synthetic, diesel)`
  - `Brakes, tires, batteries, belts, filters`
  - `A/C, heating, and diagnostic scans`
- Link: `View automotive services`

### Marine card
- Eyebrow: `Boats, Outboards, Inboards`
- Card H3: `Marine`
- Body: `Engine service at the marina, slip, dry storage, or boat ramp across Tampa Bay. Outboards, inboards, sterndrives. Your boat stays in the water.`
- Bullets:
  - `Engine oil and lower-unit service`
  - `Impeller and fuel system service`
  - `Winterization and de-winterization`
- Link: `View marine services`

### RV card
- Eyebrow: `CLASS A · CLASS C · TRAVEL TRAILERS`
- Card H3: `RV`
- Body: `Service at the RV park, the campground, your storage lot, or your driveway. Class A, B, C, fifth wheels, travel trailers. Your rig stays parked.`
- Bullets:
  - `Chassis and generator oil service`
  - `Brake inspection and replacement`
  - `Pre-trip multi-point inspection`
- Link: `View RV services`

### Fleet card
- Eyebrow: `COMPANY VEHICLES · WORK VANS · TRUCKS`
- Card H3: `Fleet & Commercial`
- Body: `Scheduled mobile service at your yard or job site. One vendor, one invoice, zero downtime across your operation.`
- Bullets:
  - `Recurring monthly or quarterly service`
  - `Consolidated monthly billing`
  - `Dedicated fleet account manager`
- Link: `Request a fleet quote`
- In-image text: `COASTAL`

### Trust band stats (same 4 as /how-it-works)
- `30+` / `Years in fixed ops`
- `<1hr` / `Most services`
- `100%` / `Mobile, always`
- `$0` / `Surprise fees`

### Bottom CTA
- H2: `Not sure which fits?`
- Sub: `Tell us what you need. We will point you to the right division and schedule the service.`
- Primary CTA: `Book Service`
- Secondary CTA: `Call 813-722-LUBE`

---

## AUTOMOTIVE (/services)

### SEO
- Title: `Mobile Oil Change, Tires & Brakes | Coastal Mobile Lube`
- Description: `Mobile vacuum-extraction oil changes, tire mount and balance, brake service, and full automotive maintenance across Apollo Beach and the South Shore. We come to your home or office.`

### Hero (src/app/services/ServicesContent.tsx)
- Eyebrow: `Automotive Services`
- H1: `Oil, tires, brakes, and the rest of the list.`
- Body: `Mobile vacuum-extraction oil changes, tire mount and balance, brake service, and full maintenance across Apollo Beach, Ruskin, Riverview, and the South Shore. We come to your home, your office, or wherever you park.`
- Primary CTA: `Book Service`
- Secondary CTA: `Call 813-722-LUBE`

### Loading state
- `Services loading...`
- `Please check back shortly or call 813-722-LUBE.`

### Sticky category pill nav
- Categories and labels are dynamic from Firestore (`serviceCategories` in division `auto`). If packages exist, a leading pill `Coastal Packages` is prepended. Each other pill's label is the Firestore category `name`. Each pill also renders a `$X.XX` starting-at price derived from Firestore service prices (not user-visible in the pill — it's computed but rendered only in category section headings).

### Coastal Packages tab (when packages exist)
- H2: `Coastal Packages`
- Sub: `Bundle and save on routine maintenance`
- Package card "Most Popular" badge: `Most Popular`
- Package price prefix: `Starting at $X.XX`
- Package CTA: `Book This Package`
- [SOURCE: Firestore `services` collection, `type === "package"`, `division === "auto"`. Package copy (displayName, name, price, bundleItems array, featured flag) is fully dynamic. No hardcoded seed data is shipped in the page — see Firestore admin for current values.]

### Category section template (per category)
- Section heading: `{Category name}` (Firestore `name` field)
- "starting at" label: `starting at $X.XX`
- Body: category description from Firestore
- Service row display: `{displayName or name}` + `${price}` or `Call for price`
- [SOURCE: Firestore `services` collection + `serviceCategories` collection, filtered to `division === "auto"`. All category names, service names, prices, and descriptions are dynamic. No hardcoded fallback copy is shipped on this page.]

### Coastal Tire Store Coming Soon block
- Badge: `Coming Soon`
- H2: `Coastal Tire Store`
- Body (para 1): `We're launching a tire store this summer. Order tires online, have them shipped to your appointment location, we install on-site. No tire shop visit, no waiting room, no mounting fees added at checkout.`
- Body (para 2): `Already have tires you need installed? Call 813-722-LUBE and we'll mount and balance them at your location today.`
- Primary CTA: `Get notified when it launches` (mailto to info@coastalmobilelube.com)
- Secondary CTA: `Call 813-722-LUBE`

### Bottom CTA
- H2: `Ready to keep your day?`
- Sub: `Pick a time, pick a service, we do the rest.`
- Primary CTA: `Book Service`
- Secondary CTA: `Call 813-722-LUBE`

### Other Services Teaser (cross-links at bottom)
- Card 1 H3: `Fleet & Commercial`
- Card 1 body: `From company cars to box trucks. Scheduled maintenance programs built around your fleet.`
- Card 1 link: `See fleet services`
- Card 2 H3: `Marine`
- Card 2 body: `Outboard and inboard engine service at the marina or boat ramp.`
- Card 2 link: `See marine services`

---

## MARINE (/marine)

### SEO
- Title: `Marine Engine Service at Your Marina | Coastal Mobile Lube`
- Description: `Outboard, inboard, and sterndrive service at the marina, slip, or dry storage across Tampa Bay. No hauling. Factory-grade parts, 12-month warranty.`

### Hero
- Eyebrow: `Marine Services`
- H1: `Your boat stays in the water.`
- Body: `Outboard, inboard, and sterndrive service at the marina, slip, ramp, or dry storage across Tampa Bay. No hauling. No 2-week shop backlogs. Factory-grade parts, certified team, 12-month warranty on every job.`
- Primary CTA: `Book Service`
- Secondary CTA: `Call 813-722-LUBE`

### Sticky category pill nav (labels stripped of "Marine" prefix and "Service/Services" suffix)
- [SOURCE: Firestore `serviceCategories` (division = "marine"), filtered to exclude "labor rate" and "marine brakes"]

### Loading / empty state
- `Services loading...`
- `Please check back shortly or call 813-722-LUBE.`

### Category section template
- Section heading: `{Firestore category name}`
- "starting at" label: `starting at $X.XX`
- Body: Firestore category description
- Service row: `{displayName or name}` + `${price}` or `Call for price`
- [SOURCE: Firestore `services` (division = "marine"). Fully dynamic — no hardcoded seed data in the page.]

### Where We Service (marinas)
- H2: `Marinas, slips, and ramps we cover`
- Body: `We come to you at marinas, boat ramps, dry storage, and private docks across Apollo Beach and the South Shore.`
- Locations chip list (with bullet separators):
  - `Apollo Beach`
  - `Ruskin`
  - `Gibsonton`
  - `Palmetto`
  - `Ellenton`
  - `Riverview`
  - `Sun City`
  - `Sun City Center`

### Marine Quote Form
- Section H2: `Get a marine service quote`
- Section sub: `Tell us about your boat and we will put together a service plan.`
- Field labels (uppercase): `First name`, `Last name`, `Phone`, `Email`, `Best Way to Reach You`, `Preferred Date`, `Engine Type`, `Number of Engines`, `What do you need?`
- Field placeholders: `First name`, `Last name`, `(555) 555-5555`, `you@email.com`
- Contact preference buttons: `Call`, `Text`, `Email`
- Flexible dates checkbox label: `My dates are flexible`
- Engine Type options: `Select engine type`, `Outboard`, `Inboard`, `Sterndrive`, `Not sure`
- Engine count options: `Select number of engines`, `Single`, `Twin`, `Triple+`
- Notes placeholder: `Engine make/model, service needed, marina or location, anything that helps...`
- Submit (idle): `Get Marine Quote`
- Submit (submitting): `Submitting...`
- Success heading: `We will call you within 24 hours to discuss your marine service.`
- Success link: `Call now: 813-722-LUBE`

### Bottom CTA
- H2: `Ready to skip the haul?`
- Sub: `Get a marine service quote in under two minutes. We come to the dock.`
- Primary CTA: `Get Marine Quote`
- Secondary CTA: `Call 813-722-LUBE`

---

## RV (/rv)

### SEO
- Title: `Mobile RV Service | Coastal Mobile Lube`
- Description: `Class A, B, C, fifth wheels, travel trailers. Oil, tires, brakes, generators, and pre-trip inspections at your RV park, campground, or driveway.`

### Hero
- Eyebrow: `RV Services`
- H1: `RV service wherever you're parked.`
- Body: `Class A, B, C, fifth wheels, travel trailers. Oil, tires, brakes, generators, and pre-trip inspections. We come to the RV park, the campground, your storage lot, or your driveway. No moving your rig.`
- Primary CTA: `Book Service`
- Secondary CTA: `Call 813-722-LUBE`

### Empty state (when grouped.length === 0)
- `RV services coming soon`
- `Call 813-722-LUBE for a custom RV service quote today.`

### Category pill nav + section template
- Pill labels = Firestore RV category names (division = "rv")
- Section H2 = Firestore category name
- "starting at $X.XX" price label
- Category body = Firestore description
- Service row: `{displayName or name}` + `${price}` or `Call for price`
- [SOURCE: Firestore `services` (division = "rv")]

### Why RV owners choose us section
- H2: `Why RV owners choose Coastal Mobile`
- Card 1 title: `Your rig stays put`
- Card 1 body: `RV parks, campsites, storage lots, driveways. Wherever your rig is parked, that's where we work.`
- Card 2 title: `No towing, no driving`
- Card 2 body: `Your RV stays put. No navigating tight roads or burning fuel to get to a shop.`
- Card 3 title: `Gas and diesel`
- Card 3 body: `Class A, Class B, Class C, fifth wheels, travel trailers with generators. We handle it all.`
- Card 4 title: `Same quality, your location`
- Card 4 body: `Factory-grade parts, certified technicians, and a 12-month service warranty on every job.`
- Card 5 title: `Seasonal prep`
- Card 5 body: `Getting ready for a trip or putting your RV in storage? We handle pre-trip and winterization services.`
- Card 6 title: `RV park partnerships`
- Card 6 body: `We work with park managers to offer scheduled service days for residents. One call covers the whole park.`

### Service Area section
- Eyebrow: `Service Area`
- H2: `Apollo Beach and South Shore`
- Body: `We service RVs across Apollo Beach and the greater South Shore area. RV parks, campgrounds, storage facilities, and private driveways.`
- Locations chip list (with bullet separators):
  - `Apollo Beach`
  - `Ruskin`
  - `Sun City`
  - `Sun City Center`
  - `Riverview`
  - `Gibsonton`
  - `Balm`
  - `Wimauma`
  - `Parrish`
  - `Palmetto`
  - `Ellenton`
  - `Fish Hawk`

### "Ready to book?" CTA (mid-page)
- H2: `Ready to book?`
- Sub: `Schedule your RV service online or give us a call. We come to you.`
- Primary CTA: `Book RV Service`
- Secondary CTA: `Call 813-722-LUBE`

### Trust badges row
- `Fully Licensed` / `& Insured`
- `ASE-Certified` / `Technicians`
- `12-Month Warranty` / `On Every Job`
- `Transparent Pricing` / `No Hidden Fees`

### RV FAQ section
- H2: `Frequently Asked Questions`
- Q1: `What types of RVs do you service?`
- A1: `Class A, B, C motorhomes, fifth wheels, travel trailers, toy haulers, and pop-ups.`
- Q2: `Do you come to RV parks and campgrounds?`
- A2: `Yes, we service RVs at parks, campgrounds, storage facilities, and your driveway.`
- Q3: `How do I prepare my RV for service?`
- A3: `Make sure the area around the service point is accessible, have your keys ready, and let us know about any specific concerns.`
- Q4: `Do you service trailer brakes and tires?`
- A4: `Yes, we handle all trailer maintenance including brakes, tires, bearings, and lights.`

### RV Quote Form
- Section H2: `Get an RV service quote`
- Section sub: `Tell us about your RV and we will get back to you within 24 hours.`
- Field labels: `First name`, `Last name`, `Phone`, `Email`, `Best Way to Reach You`, `Preferred Date`, `RV Type`, `Tell us about your RV`
- Field placeholders: `First name`, `Last name`, `(555) 555-5555`, `you@email.com`
- Contact preference buttons: `Call`, `Text`, `Email`
- Flexible dates checkbox label: `My dates are flexible`
- RV Type options: `Select RV type`, `Class A Motorhome`, `Class B Camper Van`, `Class C Motorhome`, `Fifth Wheel`, `Travel Trailer`, `Other`
- Notes placeholder: `Year, make, model, engine type (gas or diesel), location where your RV is parked, services needed...`
- Submit (idle): `Get RV Quote`
- Submit (submitting): `Submitting...`
- Success heading: `We will call you within 24 hours to discuss your RV service.`
- Success link: `Call now: 813-722-LUBE`

---

## FLEET (/fleet)

### SEO
- Title: `Fleet Mobile Maintenance | Coastal Mobile Lube`
- Description: `Scheduled mobile maintenance for company vehicles, vans, and commercial fleets. One vendor, one invoice, zero downtime. Apollo Beach and South Shore.`

### Hero
- Eyebrow: `Fleet & Commercial`
- H1: `Your fleet stays on the road. We stay on schedule.`
- Body: `Scheduled mobile maintenance for company vehicles, vans, box trucks, and commercial fleets. We come to your yard or job site. Your drivers stay driving. One vendor, one invoice, volume pricing.`
- Primary CTA: `Get Fleet Quote`
- Secondary CTA: `Call 813-722-LUBE`

### TrustBar component (reused, src/components/TrustBar.tsx)
- Item 1: `Fully Licensed & Insured`
- Item 2: `ASE-Certified Technicians`
- Item 3: `12-Month Service Warranty`
- Item 4: `Transparent Pricing, No Surprises`

### The Process section
- Eyebrow: `The Process`
- H2: `Built around your operation`
- Step 1 (#1): `Consultation` — `We learn your fleet size, vehicle mix, and maintenance needs. No commitment.`
- Step 2 (#2): `Custom plan` — `We build a maintenance schedule and pricing structure that fits your budget and your vehicles.`
- Step 3 (#3): `Scheduled visits` — `Our van shows up on schedule at your location. Your team keeps working.`
- Step 4 (#4): `Reporting` — `You get service records, maintenance history, and upcoming service alerts for every vehicle.`

### Vehicles We Service section
- Eyebrow: `What We Cover`
- H2: `Vehicles We Service`
- Chips (in order):
  - `Box Trucks`
  - `Vans & Sprinters`
  - `Pickup Trucks`
  - `Sedans & SUVs`
  - `Heavy Equipment`
  - `Specialty Vehicles`

### Vehicle Types section
- Eyebrow: `Vehicle Types`
- H2: `Light-duty to heavy-duty`
- Card 1 title: `Company Cars & Sedans`
- Card 1 body: `Employee vehicles, sales rep cars, executive fleet. Oil changes, tire rotations, brake checks, and routine maintenance on a schedule that works for your team.`
- Card 2 title: `Vans & SUVs`
- Card 2 body: `Service vans, delivery vehicles, passenger shuttles. We handle fleets of any mix with consistent service quality and reporting.`
- Card 3 title: `Box Trucks & Heavy-Duty`
- Card 3 body: `Straight trucks, flatbeds, utility vehicles, and commercial equipment. DOT-ready inspections and maintenance programs built for uptime.`

### Why Fleet Managers Choose Us section
- H2: `Why fleet managers choose Coastal Mobile`
- Card 1: `Zero downtime` — `Your vehicles stay in service. We work around your schedule, not the other way around.`
- Card 2: `One point of contact` — `No chasing multiple shops or service writers. One call, one team, one invoice.`
- Card 3: `Volume pricing` — `Multi-vehicle discounts that scale with your fleet size. The more vehicles, the better your rate.`
- Card 4: `Service records` — `Digital maintenance history for every vehicle. Know exactly what was done and when.`
- Card 5: `Flexible scheduling` — `Weekly, bi-weekly, monthly, or on-demand. We match your cadence.`
- Card 6: `All vehicle types` — `Sedans to box trucks. Gas, diesel, hybrid. One provider covers your entire fleet.`

### Fleet Services list
- Eyebrow: `Services`
- H2: `What we handle for fleets`
- Service rows (name — note, each opens booking modal with Fleet division):
  - `Synthetic Oil Changes` — `scheduled by mileage or interval`
  - `Tire Rotation & Balance` — `extend tire life across your fleet`
  - `Tire Sales & Installation` — `we source and install on-site`
  - `Brake Inspection & Service` — `catch problems before they cost you`
  - `Battery Testing & Replacement` — `no surprise dead batteries`
  - `Fluid Service & Top-Off` — `coolant, brake, transmission, power steering`
  - `Filter Replacement` — `engine air and cabin filters`
  - `DOT Inspections` — `keep your commercial vehicles compliant`
  - `Wiper Blades & Lights` — `small items that add up across a fleet`
  - `Emergency Mobile Service` — `breakdowns happen, we respond fast`

### Fleet Quote Form (embedded, id=fleet-quote)
- Section H2: `Get a fleet quote`
- Section sub: `Tell us about your fleet and we will put together a custom maintenance plan within 48 hours.`
- Field labels: `First name`, `Last name`, `Phone`, `Email`, `Best Way to Reach You`, `Preferred Date`, `Fleet Size`, `Tell us about your fleet`
- Field placeholders: `First name`, `Last name`, `(555) 555-5555`, `you@company.com`
- Contact preference buttons: `Call`, `Text`, `Email`
- Flexible dates checkbox label: `My dates are flexible`
- Fleet Size options: `Select fleet size`, `1-5 vehicles`, `6-15 vehicles`, `16-50 vehicles`, `50+ vehicles`
- Notes placeholder: `Vehicle types, current maintenance schedule, locations, anything that helps us build your plan...`
- Submit (idle): `Get Fleet Quote`
- Submit (submitting): `Submitting...`
- Success heading: `We will call you within 48 hours to discuss your fleet program.`
- Success link: `Call now: 813-722-LUBE`

### Bottom CTA
- H2: `Ready to simplify your fleet maintenance?`
- Sub: `Get a custom maintenance plan built around your vehicles, your schedule, and your budget.`
- Primary CTA: `Get a Fleet Quote`
- Secondary CTA: `Call 813-722-LUBE`

### Fleet Service FAQs section
- Eyebrow: `Common Questions`
- H2: `Fleet Service FAQs`
- Q1: `What size fleet do you work with?`
- A1: `We work with fleets from 3 vehicles to 50+. Whether you have a handful of company cars or a full commercial operation, we build a program that fits.`
- Q2: `How does fleet pricing work?`
- A2: `We offer volume discounts based on fleet size and service frequency. The more vehicles and the more regular the schedule, the better your per-vehicle rate. Contact us for a custom quote.`
- Q3: `Can you handle box trucks and heavy-duty vehicles?`
- A3: `Yes. We service light-duty company cars through heavy-duty box trucks, flatbeds, and utility vehicles. If it has an engine and tires, we likely cover it.`
- Q4: `Do you provide service records for each vehicle?`
- A4: `Yes. Every service is documented with the vehicle, date, mileage, services performed, and any notes. You get digital records you can pull up anytime.`
- Q5: `What if a vehicle breaks down outside the maintenance schedule?`
- A5: `Call us. We offer emergency mobile service for fleet customers. We will get to your vehicle as quickly as possible to minimize downtime.`
- Q6: `Do you service diesel vehicles?`
- A6: `Yes. We handle both gas and diesel vehicles including diesel oil changes with the appropriate filters and oil specifications.`

---

---

## ABOUT (/about)

### SEO
- Title: About Us | Coastal Mobile Lube
- Description: Founded by Jason Binder after 30 years running dealership service departments. A local team trained on dealership standards, now mobile across Apollo Beach and South Shore.
- OG title: About Us | Coastal Mobile Lube
- OG description: Founded by Jason Binder after 30 years running dealership service departments. A local team trained on dealership standards, now mobile across Apollo Beach and South Shore.
- OG URL: https://coastalmobilelube.com/about
- OG type: website
- Canonical: https://coastalmobilelube.com/about

### Hero
- Eyebrow: Our Story
- H1: 30 years of dealership service. Now coming to you.
- Body: Founded by Jason Binder after three decades running dealership service departments. Built around a local team trained on the same standards he set in the shop.
- Trust pills (below divider):
  - 30 years experience
  - Apollo Beach based
  - Licensed & insured
- Hero image: Coastal Mobile Lube service van in a driveway (Cloudinary)

### Van Wrap Showcase section
- Eyebrow: Our Rig
- H2: The shop on wheels
- Placeholder body: Van photos coming soon

### Our Story section
- Eyebrow: Our Story
- H2: Built on 30 years and a handshake
- Paragraph 1: Jason Binder spent 30 years running service departments at dealerships. He knows what a well-maintained vehicle looks like, what corners never to cut, and how to treat a customer so they keep coming back.
- Paragraph 2: When he started Coastal Mobile Lube & Tire, the idea was simple: take everything he learned inside the shop and bring it to the people who don't have time to visit one. A fully equipped van, factory-grade tools, and the same vacuum extraction system used in high-volume dealerships. No drain plugs, no drips, no mess at any location.
- Paragraph 3: What started as one van is now a growing local team. Jason hires and trains every technician personally. Same standards, same vacuum extraction, same honest pricing, same warranty, regardless of which Coastal van rolls up at your location.
- Paragraph 4 (bold): Multiple vans. One standard. Wherever you need us.
- Image: Interior of the Coastal Mobile service van with professional equipment (Cloudinary)
- Image caption: Fully equipped mobile shop

### Value Props section
- Eyebrow: Why Coastal
- H2: What sets us apart
- Card 01 — A real local team
  - Body: Multiple vans, one standard. Every tech personally trained by Jason. The same dealership-grade work, no matter who shows up.
- Card 02 — No upsells, ever
  - Body: If it doesn't need replacing, we tell you. We quote honestly and never push services you don't need.
- Card 03 — 30 years of dealership experience
  - Body: Three decades managing service departments. That experience shows up in every oil change, every tire mount, every diagnostic.
- Card 04 — Vacuum extraction. Clean every time.
  - Body: The same dealership-grade tech we use on every oil change. Pulls oil through the dipstick tube. No drain plug, no crawling underneath, no drips. Your driveway, marina, or yard stays clean.

### Three Verticals section (shows 4 verticals despite the heading)
- Eyebrow: Full Service
- H2: One team for everything you own
- Sub: Personal vehicles, boats, work trucks, RVs, trailers, fleet vehicles. If it has an engine, we service it.
- Card 1 — Automotive
  - Body: Cars, trucks, and SUVs serviced at your home or office.
  - CTA: See services → /services
- Card 2 — Fleet
  - Body: Scheduled maintenance programs for businesses with 5 vehicles or 500.
  - CTA: See services → /fleet
- Card 3 — Marine
  - Body: Dockside service for outboard, inboard, and diesel marine engines.
  - CTA: See services → /marine
- Card 4 — RV and Trailers
  - Body: Oil changes, tire service, and maintenance at your RV park or storage lot.
  - CTA: See services → /services

### CTA
- H2: Ready to skip the shop?
- Sub: Book your first service online or call us. Most appointments available within the week.
- Primary button: Book Service
- Secondary button: Call 813-722-LUBE (tel:8137225823)

---

## CONTACT (/contact)

### SEO
- Title: Contact Us
- Description: Get in touch with Coastal Mobile Lube & Tire. Call 813-722-LUBE or request a quote online.
- OG title: Contact Us | Coastal Mobile Lube & Tire
- OG description: Get in touch with Coastal Mobile Lube & Tire. Call 813-722-LUBE or request a quote online.
- OG URL: https://coastalmobilelube.com/contact
- OG type: website
- Canonical: https://coastalmobilelube.com/contact

### Hero
- Eyebrow: Contact
- H1: Talk to us
- Body: Have a question or want to learn more about our services? We respond within one business day. For service bookings, use our Book Service page. For fleet or marine quotes, visit Fleet or Marine.
  - Inline link: "Book Service" → opens booking modal
  - Inline link: "Fleet" → /fleet
  - Inline link: "Marine" → /marine

### Contact Form (Netlify-backed, name="contact")
- Field 1: First name (label), "First" (placeholder), required
- Field 2: Last name (label), "Last" (placeholder), required
- Field 3: Phone (label), "(555) 555-5555" (placeholder), required
- Field 4: Email (label), "you@email.com" (placeholder), required
- Field 5: I am interested in (label) — select with options:
  - General inquiry
  - Automotive service quote
  - Fleet & commercial services
  - Marine service quote
  - Partnership or business opportunity
  - Other
- Field 6: Message (label), "Tell us how we can help. Include vehicle details, fleet size, or any questions." (placeholder), required
- Submit button: Send Message
- Footer note: We respond to every message within one business day.

### Form Success State
- Icon: Green checkmark
- H2: Message sent.
- Body: We will get back to you within one business day. For immediate help, call 813-722-LUBE.
- Link: Send another message

### Contact Info Sidebar
- Section 1: Call or text
  - Number: 813-722-LUBE (tel:8137225823)
  - Note: Available Monday through Friday
- Section 2: Email
  - Address: info@coastalmobilelube.com
  - Note: We respond within one business day
- Section 3: Service area
  - Heading: Apollo Beach and the South Shore
  - Body: Ruskin, Sun City Center, Riverview, Gibsonton, Fish Hawk, Palmetto, Ellenton, Parrish, Balm, Wimauma, Sun City
- Section 4: Business hours
  - Monday - Friday: 8:00 AM - 5:00 PM
  - Saturday - Sunday: Closed

### Bottom CTA
- H2: Prefer to book directly?
- Sub: Skip the form and schedule your service now.
- Primary button: Book Service (opens booking modal)
- Secondary button: Call 813-722-LUBE (tel:8137225823)

---

## FAQ (/faq)

### SEO
- Title: Frequently Asked Questions | Coastal Mobile Lube & Tire
- Description: Answers to common questions about mobile oil change, tire, and marine service in Apollo Beach, FL. How mobile service works, areas served, pricing, and more.
- Canonical: https://coastalmobilelube.com/faq

### JSON-LD
- Page-level FAQPage schema emitted, entities built from the faqItems array below.

### Hero
- Eyebrow: Common Questions
- H1: Frequently Asked Questions
- Body: Everything you need to know about how mobile service works, what we cover, and how to get started.

### FAQ list (all 13 items — accordion, closed by default)
1. Q: How does mobile service work?
   A: We come to you. Whether you are at home, at the office, or at a job site, our fully equipped service vehicle arrives at your location with everything needed to handle the job on the spot. No waiting rooms, no dropping off your car. Just book a time, and we show up ready to work.
2. Q: What areas do you serve?
   A: We are based in Apollo Beach and serve the entire South Shore area. That includes Ruskin, Sun City Center, Sun City, Riverview, Gibsonton, Balm, Wimauma, Parrish, Palmetto, Ellenton, and Fish Hawk. If you are not sure whether we cover your area, give us a call.
3. Q: How do I book a service?
   A: You can book online through our website, call us at 813-722-LUBE, or send a text to the same number. We will confirm your appointment and give you a time window that works for your schedule.
4. Q: What is included in an oil change?
   A: Our standard oil change starts at $89.95 and includes synthetic blend oil, a new oil filter, and a multi-point vehicle inspection. We check your tires, fluids, belts, and battery so you know exactly where your vehicle stands. Full synthetic and diesel options are also available.
5. Q: Do you service fleets?
   A: Yes. We have a dedicated fleet program for businesses with company vehicles, work trucks, and commercial fleets. Fleet services are quote-based, and we can set up recurring maintenance schedules to keep your vehicles on the road with zero downtime.
6. Q: Do you service boats?
   A: Yes. Our marine division handles outboard, inboard, and diesel marine engines. We come directly to your dock or marina for oil changes, fluid services, and seasonal maintenance. No need to haul your boat to a shop.
7. Q: Do you service RVs?
   A: Yes. We handle RVs the same way we handle automotive and diesel vehicles. Oil changes, fluid services, tire work, and general maintenance can all be done on-site at your home or RV park.
8. Q: What payment methods do you accept?
   A: We accept Zelle, Venmo, cash, and check. Payment is collected at the time of service.
9. Q: Are you licensed and insured?
   A: Yes. Coastal Mobile Lube & Tire is fully licensed and insured. Our technicians are ASE-certified, so you can trust that the work is done right every time.
10. Q: What is vacuum extraction?
    A: Instead of removing your drain plug and crawling under the vehicle, we use a vacuum extraction system to pull the oil out through the dipstick tube. It is cleaner, faster, and leaves no mess on your driveway. No drips, no spills.
11. Q: What are your hours?
    A: We are available Monday through Friday, 8AM to 5PM. We are closed on Saturday and Sunday.
12. Q: How long does a service take?
    A: Most services are completed in under an hour. A standard oil change typically takes 20 to 30 minutes. We will give you an estimated time when you book so you know what to expect.
13. Q: Do you work in the rain?
    A: Yes. We work rain or shine. Our service vehicle has covered equipment, so we can handle most jobs regardless of the weather. If conditions are truly unsafe, we will reach out to reschedule.

### CTA
- H2: Still have questions?
- Sub: Give us a call and we will be happy to help. Or book your service online in under two minutes.
- Primary button: 813-722-LUBE (tel:8137225823, phone icon)
- Secondary button: Book Service Online (opens booking modal)

---

## SERVICE AREAS (/service-areas)

### SEO
- Title: Service Areas | Coastal Mobile Lube & Tire
- Description: Mobile oil changes, tire service, and maintenance in Apollo Beach, Riverview, Ruskin, Sun City Center, and 12 South Shore communities. We come to you.
- Canonical: https://coastalmobilelube.com/service-areas

### Hero
- Eyebrow: South Shore Coverage (MapPin icon)
- H1: We Come to You
- Body: Mobile oil changes, tire service, and vehicle maintenance across Apollo Beach and 12 South Shore communities. No shop visits, no waiting rooms.

### Service Area Cards (12 total, displayed in two groups of 6)

Group 1 (bg-[#FAFBFC]):
1. Apollo Beach — Our home base. Apollo Beach residents get the fastest response times and most flexible scheduling. From Waterset to MiraBay, we know every neighborhood and driveway in town.
2. Riverview — One of the fastest-growing communities in Hillsborough County, and one of our busiest service areas. We handle oil changes, tire rotations, and brake work throughout Riverview, from Panther Trace to Alafia.
3. Ruskin — Just south of Apollo Beach along US-41, Ruskin is a short drive from our base. We service personal vehicles, work trucks, and boats at marinas along the Little Manatee River.
4. Sun City Center — Convenient mobile service for Sun City Center residents who prefer not to drive to a shop. We bring factory-grade oil changes, battery service, and tire rotations right to your door.
5. Sun City — Nestled between Ruskin and Wimauma, Sun City homeowners count on us for convenient vehicle maintenance. No appointment drop-offs, no waiting rooms. Just quality service in your driveway.
6. Fish Hawk — Fish Hawk families juggle busy schedules. Our mobile service means you can get an oil change or tire rotation while you handle everything else at home. We cover all of Fish Hawk Ranch and Starling.

Group 2 (bg-[#F8F6F1]):
7. Gibsonton — Located right along US-41, Gibsonton is a quick trip from our Apollo Beach base. We service cars, trucks, and commercial vehicles throughout the Gibsonton corridor.
8. Palmetto — Just across the Manatee River, Palmetto residents enjoy the same fast, professional mobile service. Oil changes, brake checks, and tire work done at your home or business.
9. Ellenton — Conveniently located near I-75 and the Ellenton outlets, this community is well within our service radius. We handle everything from routine oil changes to full brake jobs on-site.
10. Parrish — Parrish is growing fast with new communities popping up along the 301 corridor. We bring professional mobile maintenance to North River Ranch, Harrison Ranch, and surrounding neighborhoods.
11. Balm — Rural Balm and the surrounding agricultural areas east of US-301 are part of our regular service territory. We work on personal vehicles, farm trucks, and equipment right on your property.
12. Wimauma — South of Riverview along SR-674, Wimauma residents rely on us for dependable mobile service. No need to drive into town. We bring the shop to you, from oil changes to tire installs.

Each card has a CTA: "Book Service in {City Name}" with arrow icon (opens booking modal).

### Bottom CTA
- H2: Ready to skip the shop?
- Body: Book your mobile service online in under two minutes, or call us at 813-722-LUBE.
- Primary button: Book Service Now (arrow icon, opens booking modal)

---

## PRIVACY POLICY (/privacy)

Per WO: legal copy, H1 + section headings only.

### SEO
- Title: Privacy Policy | Coastal Mobile Lube & Tire
- Description: How Coastal Mobile Lube & Tire collects, uses, and protects your information.
- Canonical: https://coastalmobilelube.com/privacy

### Hero
- Eyebrow: Legal
- H1: Privacy Policy
- Effective date: Effective: April 20, 2026

### Body (opening paragraph)
- Coastal Mobile Lube & Tire LLC ("Coastal," "we," "us") operates coastalmobilelube.com and the booking, scheduling, and invoicing services offered through it. This policy explains what we collect, why, who we share it with, and your rights.

### Section headings
1. Who we are and how to reach us
2. Information we collect
3. How we use it
4. Who we share it with
5. Cookies and tracking
6. Your rights
7. Data retention
8. Security
9. Children
10. Changes
11. Questions

### Notable inline copy
- Business: Coastal Mobile Lube & Tire LLC, Apollo Beach, FL, Phone: 813-722-5823, Email: info@coastalmobilelube.com
- Third-party processors listed: Google Firebase, Netlify, Intuit QuickBooks, Clover, Twilio, Google Analytics (GA4), Cloudinary, NHTSA
- Retention: Appointment/service 2 yrs min (FDACS), Invoice/payment 7 yrs, QR scans 90 days, Deleted accounts purged within 30 days
- CCPA/CPRA: Coastal does not sell personal data
- Response window: 30 days to data requests

---

## TERMS OF SERVICE (/terms)

Per WO: legal copy, H1 + section headings only.

### SEO
- Title: Terms of Service | Coastal Mobile Lube & Tire
- Description: Terms governing use of coastalmobilelube.com and services provided by Coastal Mobile Lube & Tire.
- Canonical: https://coastalmobilelube.com/terms

### Hero
- Eyebrow: Legal
- H1: Terms of Service
- Effective date: Effective: April 20, 2026

### Body (opening paragraph)
- These Terms govern your use of coastalmobilelube.com and any service booked through it. By using the site or booking a service, you agree to these Terms. If you do not agree, do not use the site.

### Section headings
1. About us
2. Booking a service
3. Pricing and fees
4. Cancellation and rescheduling
5. Payment
6. Warranty
7. Your responsibilities
8. Limitation of liability
9. Governing law and disputes
10. End user license agreement
11. Changes to terms
12. Contact

### Notable inline copy
- Business description: Coastal Mobile Lube & Tire LLC is a licensed Florida motor vehicle repair business operating in the Tampa Bay area. Mobile automotive, fleet, marine, and RV services. FDACS registration available on request.
- Cancellation policy: 24-hour notice, no charge; inside 24 hours or no-show may be subject to convenience fee
- Payment: Credit cards, debit cards, ACH via Clover and Intuit QuickBooks Payments. Late fee after 30 days, collections after 60 days
- Warranty: 30 days or 1,000 miles, whichever comes first; parts under manufacturer warranty
- Exclusions: Normal wear, accidents/misuse/modifications, pre-existing conditions, fleet accounts (governed by fleet agreement)
- Jury trial waiver (Section 9)
- Contact: Coastal Mobile Lube & Tire LLC, Apollo Beach, FL, 813-722-5823, info@coastalmobilelube.com

---

## BOOKING MODAL (BookingWizardModal, triggered from all Book Service buttons)

Note: the modal has 4 steps in this order: Vehicle → Services → Details → Review. The WO template assumed Services-first, but the on-screen stepper labels are the ones below.

### Header (all steps)
- H2: Book Your Service
- Sub: Pick your service, your vehicle, and a time. Takes about a minute.
- Close button: × icon (unlabeled)

### Progress Stepper (4 steps)
- Step 1: Vehicle
- Step 2: Services
- Step 3: Details
- Step 4: Review

### Step 1 — Vehicle (VehicleSelector component)
- Section heading: Your Vehicle (or "Vessel Information" when Marine division)
- Mode toggle pills: "Year / Make / Model" | "VIN"

#### YMM (Year/Make/Model) mode
- Quick search label: Quick search
- Quick search placeholder: Try: 2023 Toyota
- Quick search helper: Fills year and make — pick model below
- Field label: Year — Select: "Select year"
- Field label: Make — Select: "Select year first" (disabled) / "Select make"
- Field label: Model — Select: "Select make first" (disabled) / "Loading models..." / "Select model"
- Field label: Fuel Type — Select: "Select fuel type" with options Gas / Diesel / Hybrid / Electric
- Inner dropdown on search: "Search..." (placeholder), "No matches" (empty state)

#### VIN mode
- Button: Scan VIN with camera (dark navy button)
- Field label: VEHICLE IDENTIFICATION NUMBER
- Placeholder: Enter 17-character VIN
- Character counter: {n}/17
- Decode button: "Decode" → "Decoding..." while loading
- Error: Could not decode VIN. Enter vehicle details manually.
- Success card heading: VIN Decoded Successfully
- Success card labels: YEAR, MAKE, MODEL, FUEL TYPE
- Success card action: Edit

#### "Been here before?" row (inline at bottom of vehicle step when public)
- Text: Been here before? Look up by phone number →

#### Phone lookup panel (expanded)
- Phone input placeholder: (555) 555-5555
- Submit button: "Look me up" → "Looking..." while loading
- Empty result message: No previous bookings found with that number. No worries, fill in your details below.
- Error: Couldn't look up your info right now. Please fill in your details below.
- Results header: Select a previous booking:
- Result card (per booking): {Year} {Make} {Model} or "No vehicle info", service list or "No services listed", date
- "Been here before?" link in vehicle step: Been here before? We can auto-fill your vehicle info.
- "Been here before?" link in details step: Been here before? Sign in to auto-fill your details.

#### Marine variant (Vessel Information)
- Trigger link: Been here before? We can auto-fill your vessel info.
- Field label: Hull Identification Number (HIN) — placeholder: Enter HIN
- Divider: Don't know your HIN? Describe your vessel.
- Field labels: Vessel Year (placeholder "e.g. 2020"), Vessel Make (placeholder "e.g. Boston Whaler"), Vessel Model (placeholder "e.g. Montauk 170")

#### VIN Scanner overlay (component: VINScanner)
- Title: Scan VIN Barcode
- Close button: × icon (aria "Close scanner")
- Instructional footer: Point camera at the VIN barcode. Found on the driver's side door jamb or dashboard through the windshield.
- Error variants:
  - Camera permission denied. Enable camera access in your browser settings.
  - No camera found on this device.
  - Could not start camera. Please try again or enter the VIN manually.
- Error dismiss button: Close

### Step 2 — Services
- Division pills: Automotive | Marine | RV | Fleet (horizontal scroll on mobile)

#### Coastal Packages (Automotive division only — collapsible)
- Header button: Bundle and save with Coastal Packages (with chevron)
- Per-package card: Name, price ($XX.XX), optional "Most Popular" badge, bundle items list
- Divider text: Or choose individual services

#### Category accordion
- Collapsed row: {Category} (left), "From ${price}" (right), chevron
- Selected count badge: green circle with N
- Dimmed diesel note: (for diesel vehicles only)
- Expanded row per service: checkbox, {service name}, {price} or "Quote"
- Diesel-on-gas warning: This service is typically for diesel vehicles. Your vehicle uses gas.

#### Fuel-type info banners
- Electric: Electric vehicles don't need oil changes. Here are the services available for your EV.
- Hybrid: Hybrid vehicles may have different oil requirements. Please confirm specifics with our technician.

#### Something Else option
- Button label: Something Else
- Textarea placeholder: Describe the service you're looking for...

#### Mobile summary (below list when services selected)
- Format: "N service(s) selected" + total "$XXX.XX" or "Quote"

#### Desktop sidebar — YOUR SELECTION panel (steps 2-4)
- Panel heading: YOUR SELECTION (uppercase, letter-spaced)
- Empty state: Pick services to get started
- Grouped service rows: {category uppercase label}, {service name}, {price} or "Quote", × remove
- "Other" grouping uses label: OTHER with Quote and × remove
- Convenience fee row: {feeConfig.label} — usually "Mobile Service Fee" — "$39.95" or when waived "$39.95" (strikethrough) + "FREE"
- Free-first-service note: FREE - first service
- Estimated Total label + total "$XXX.XX+" (with + for quote items) or "Quote"

#### Search overlay (if opened)
- Input placeholder: Search services...
- Close: × icon
- Done button: Done

### Step 3 — Details
- Section heading: Your Details
- "Been here before?" link: Been here before? Sign in to auto-fill your details.
- Field: First name * — placeholder "First name"
- Field: Last name — placeholder "Last name"
- Field: Phone * — placeholder "(555) 555-5555"
- Field: Email — placeholder "you@example.com"
- Field: Preferred Date (date input)
- Field: Preferred Time — select with options:
  - Select time (placeholder)
  - Morning (7-10am)
  - Midday (10am-1pm)
  - Afternoon (1-4pm)
  - Late (4-6pm)
- Field: Best way to reach you — pill buttons Call / Text / Email
- Field: Service Address * — placeholder "Where should we come? (street address or cross streets)"
- Field: Anything else we should know? — placeholder "E.g.: Keys will be at reception, ask for Ana. Call (813) 555-1234 upon arrival. Access code: #1234. Car is on parking level 2, spot 45."

### Step 4 — Review
- Section heading: Review Your Booking
- Vehicle card: heading "Vehicle" (or "Vessel"), Edit link; displays year/make/model/trim + fuel type, VIN/HIN
- Vehicle uncertainty banner: No worries if you're not sure — we'll sort it out on the call.
- Services card: heading "Services", Edit link, list of services with prices or "Quote"
- "Other:" prefix for the Something Else line
- Convenience fee line: {fee label} — "$XX.XX" or strikethrough + FREE
- Contact & Schedule card: heading "Contact & Schedule", Edit link, shows:
  - Name
  - Phone
  - Email
  - Contact: {call|text|email}
  - Address: {address}
  - Date: {date}
  - Time: {label}
  - Notes: {notes}
- Estimated Total block: "Estimated Total" label + "$XXX.XX+" or "Quote on-site"
- Quote note: Some services will be quoted on-site
- Error (if submit fails): Something went wrong. Please try again.

### Confirmation state (after submit)
- Green checkmark circle
- H3: You're all set!
- Body: We will reach out within 2 hours to confirm your appointment.

### Bottom navigation bar
- Back button (from step 2+): Back
- Primary button:
  - Steps 1-3: Next
  - Step 4: Submit Booking (or "Request a Quote" if Fleet division is active)
  - While submitting: Submitting...
- Mobile summary readout: "{N} service(s)" / "Step {n} · {label}" + total line "$XXX.XX+ est." or "Quote"

---

## QUOTE MODAL (src/components/QuoteModal.tsx — triggered from QuoteFAB "Need a price? Ask us.")

### Modal
- H3: Connect with us
- Subhead: Tell us what you need. We get back to you fast.
- Close button: × icon (unlabeled)

### Form fields
- First name (placeholder "First name")
- Last name (placeholder "Last name")
- Phone (placeholder "Phone")
- Email (placeholder "Email")
- City (placeholder "City")
- Service needed (select) — options:
  - Service needed (placeholder)
  - Oil change
  - Tires
  - Brakes
  - Marine service
  - RV service
  - Fleet service
  - Other
- Reach me by: radio group — Call / Text / Email
- Submit button: Send Quote Request → "Sending..." while submitting

### Feedback states
- Success: Got it! We'll be in touch soon.
- Error: Something went wrong. Call 813-722-LUBE.

---

## QUOTE FAB (src/components/QuoteFAB.tsx — sitewide "Ask us" trigger)

- Button label (mobile, bottom-right pill): Need a price? Ask us.
- Button label (desktop, hidden until scrolled past hero): Need a price? Ask us.
- Icon: chat bubble
- Clicking opens the QuoteModal above.

---

## FLOATING QUOTE BAR (src/components/FloatingQuoteBar.tsx — desktop-only alternative; hidden on mobile)

Note: this component uses the global `bookings` collection for leads, separate from QuoteModal. Currently hidden on mobile; the container is rendered with `hidden` utility class.

### Collapsed trigger pill (bottom-right)
- Label: Need a price? Ask us. (with up-chevron)

### Expanded panel
- Heading: Need a price? Ask us.
- Subhead: Name, number, what you need. We call back within the hour.
- Close: × icon
- Labels (uppercase eyebrows): NAME, PHONE, EMAIL, SERVICE, PREFERRED CONTACT
- Inputs:
  - Name placeholder: Your name
  - Phone placeholder: (555) 555-5555
  - Email placeholder: Email address
  - Service (select) — placeholder "What do you need?" — options:
    - Auto Service
    - Marine Service
    - RV / Trailer Service
    - Fleet Inquiry
  - Preferred Contact pills: call / text / email
- Submit button: Get My Quote → "Sending..." while submitting
- Success: Got it! We'll reach out shortly.
- Error: Something went wrong. Please call 813-722-LUBE.

---

## MOBILE QUICK QUOTE (src/components/MobileQuickQuote.tsx — mobile-only side tab)

### Side tab (pinned to right edge, vertical text)
- Label: Quick Quote (vertical, rotated)

### Slide-in panel
- Heading: Quick Quote
- Subhead: We'll get back to you within the hour.
- Close: × icon (aria "Close quick quote")
- Labels (uppercase eyebrows): NAME, PHONE, EMAIL, SERVICE, PREFERRED CONTACT
- Inputs:
  - Name placeholder: Your name
  - Phone placeholder: (555) 555-5555
  - Email placeholder: Email address
  - Service (select) — placeholder "What do you need?" — options: Auto Service / Marine Service / RV / Trailer Service / Fleet Inquiry
  - Preferred Contact pills: call / text / email
- Submit button: Get My Quote → "Sending..." while submitting
- Success: Got it! We'll reach out shortly.
- Error: Something went wrong. Please call 813-722-LUBE.

