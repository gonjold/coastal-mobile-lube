# Coastal Mobile Lube & Tire — Full Site Copy Audit

> Extracted 2026-04-10. Every word a visitor sees, organized by page and section. Dynamic content sourced from Firestore is noted with `[DYNAMIC]`.

---

## Navigation (Global)

### Desktop Nav Links
- Automotive
- RV
- Marine
- Fleet
- About
- Contact

### Desktop Action Buttons
- 813-722-LUBE *(phone button)*
- Book Service *(CTA button)*

### Mobile Header
- Phone icon (aria-label: "Call 813-722-LUBE")
- Hamburger menu icon (aria-label: "Open menu")

### Mobile Drawer
- Automotive
- RV
- Marine
- Fleet
- About
- Contact
- 813-722-LUBE *(phone button)*
- Book Service *(CTA button)*

### Logo Text
- Coastal Mobile
- Lube & Tire

---

## Homepage (/)

### Hero Section
- Eyebrow: Mobile Service
- Sub-eyebrow: Cars. Trucks. RVs. Boats. Your entire fleet.
- Headline: The shop that comes to **you.**
- Subheadline (mobile): We come to your driveway, parking lot, or dock. No shop visit needed.
- Subheadline (desktop): Mobile oil changes, tire service, fleet maintenance, marine engine care, and RV service. We come to your driveway, your parking lot, or your dock.
- CTA 1: Book Service
- CTA 2: Call 813-722-LUBE
- Trust pills:
  - Factory-trained techs
  - Licensed & insured
  - Same-day availability

### How It Works Section
- Eyebrow: How It Works
- Headline: Three steps. That's it.
- Step 1 Title: Book in 60 seconds
- Step 1 Description: Pick your service, choose a time. Or just call us.
- Step 2 Title: We show up
- Step 2 Description: Our fully equipped van arrives at your location, on time, ready to work.
- Step 3 Title: Done. Go.
- Step 3 Description: No waiting rooms. No ride to the shop. You never left your day.

### Services Section
- Eyebrow: Services
- Headline: What we handle on-site
- Subheadline (desktop): Everything your vehicle, fleet, boat, or RV needs. Brought directly to your location by a factory-trained technician.

#### Division Tab Labels
- Automotive
- Fleet & Commercial
- Marine
- RV

#### Automotive Category Cards `[DYNAMIC - names/prices from Firestore, fallbacks below]`
- Oil Changes — Starting at $[price] — Conventional, synthetic blend, full synthetic, and diesel oil changes. Factory-grade service at your location.
- Tires & Wheels — Starting at $[price] — Tire rotation, flat repair, mount and balance, TPMS service, and new tire installation.
- Brakes — Starting at $[price] — Front and rear brake pads, full brake jobs, and brake fluid flush.
- Basic Maintenance — Starting at $[price] — Wiper blades, air filters, cabin filters, batteries, coolant flush, belts, and more.
- A/C & Heating — Starting at $[price] — A/C diagnostic, EVAC and recharge, and heating system service.

#### Fleet Category Cards
- Custom Fleet Maintenance Programs — Scheduled maintenance for your entire fleet. Volume pricing available.
  - CTA: Request Fleet Quote

#### Marine Category Cards `[DYNAMIC]`
- Oil Service — Starting at $[price] — Outboard and inboard engine oil changes, filter replacement, and lower unit service.
- Engine Service — Starting at $[price] — Fuel system service, diesel maintenance, and comprehensive engine diagnostics.
- Electrical & Maintenance — Starting at $[price] — Battery service, wiring, lighting, belts, hoses, and marine system diagnostics.
- Winterization — Starting at $[price] — Complete winterization service to protect your boat during the off-season.

#### RV Category Cards `[DYNAMIC]`
- Oil & Lube — Starting at $[price] — Full synthetic and diesel oil changes for motorhomes and tow vehicles.
- Tires & Wheels — Starting at $[price] — Tire rotation, flat repair, mount and balance, and TPMS service for RVs.
- Brakes — Starting at $[price] — Brake pads, rotors, and brake system service for all RV types.
- Maintenance — Starting at $[price] — Generator service, roof inspections, slide-out care, filters, and more.

#### Per-Card Actions
- Book This Service *(default CTA)*
- Call for pricing *(when no price available)*

#### View All Links
- View all Automotive services →
- View all Fleet services →
- View all Marine services →
- View all RV services →
- View All Services → *(mobile)*

### Stats Bar
- 30+ — Years in fixed ops
- <1hr — Most services completed
- 100% — Mobile. Always.
- $0 — Surprise fees. Ever.

### Reviews Section
- Eyebrow: Reviews
- Headline: What our customers say

#### Review Cards (hardcoded)
1. "Called Monday morning, Chase was at my house by noon. Oil change done in my driveway in 25 minutes. Why would I ever go back to a shop?" — Mike R. - Apollo Beach — Google Review
2. "We have 14 work vans and scheduling service used to be a nightmare. Now they come to our lot every month. Game changer for our fleet." — Sarah T. - Riverview — Google Review
3. "Had my boat winterized right at the marina. No hauling, no waiting. Professional, fast, fair price." — Dave K. - Ruskin — Google Review
4. "First time trying mobile service and I am never going back to sitting in a waiting room. Booked online, tech showed up on time, done." — Lisa M. - Sun City Center — Google Review
5. "Got new tires mounted in my office parking lot during lunch. Did not miss a minute of work." — James P. - Gibsonton — Google Review
6. "Honest pricing, no upselling. Exactly what they quoted is what I paid. Refreshing." — Ana C. - Riverview — Google Review

- Reviews from customers across the South Shore
- Leave us a review on Google →

### Trust Bar (Homepage Inline)
- Fully Licensed & Insured
- ASE-Certified Technicians
- 12-Month Service Warranty
- Transparent Pricing, No Surprises

### CTA Section (Desktop Only)
- Eyebrow: Ready?
- Headline: Skip the shop.
- Body: Book your mobile service today. Most appointments available within the week.
- CTA 1: Book Service
- CTA 2: Call 813-722-LUBE

---

## Automotive Services (/services)

### Hero Section
- Eyebrow: Automotive Services
- Headline: What we handle on-site
- Body: Factory-trained technicians come to your driveway, parking lot, or job site with everything needed to get the job done right.
- CTA 1: Book Service
- CTA 2: Call 813-722-LUBE

### Sticky Category Navigation `[DYNAMIC — labels from Firestore categories]`
- Coastal Packages *(if packages exist)*
- `[Category names derived from Firestore serviceCategories]`

### Coastal Packages Tab `[DYNAMIC]`
- Headline: Coastal Packages
- Subheadline: Bundle and save on routine maintenance
- Badge on featured: Most Popular
- Per package:
  - `[Package name]` `[DYNAMIC]`
  - Starting at $`[price]` `[DYNAMIC]`
  - `[Bundle items list]` `[DYNAMIC]`
  - CTA: Book This Package

### Service Category Sections `[DYNAMIC]`
- Per category:
  - `[Category name]` starting at $`[min price]` `[DYNAMIC]`
  - `[Category description]` `[DYNAMIC]`
  - Per service row: `[Service name]` — $`[price]` or "Call for price" `[DYNAMIC]`

### Fallback States
- Loading: *(spinner)*
- Empty: Services loading... — Please check back shortly or call 813-722-LUBE.

### Bottom CTA
- Headline: Ready to book?
- Body: Pick a time that works for you. We come to your location with everything we need.
- CTA 1: Book Service
- CTA 2: Call 813-722-LUBE

### Other Services Teaser
- Card 1 Title: Fleet & Commercial
- Card 1 Body: From company cars to box trucks. Scheduled maintenance programs built around your fleet.
- Card 1 Link: Learn about fleet services →
- Card 2 Title: Marine
- Card 2 Body: Outboard and inboard engine service at the marina or boat ramp.
- Card 2 Link: Learn about marine services →

---

## Fleet (/fleet)

### Hero Section
- Eyebrow: Fleet & Commercial
- Headline: Keep your fleet on the road
- Body: Scheduled mobile maintenance for company vehicles, box trucks, vans, and commercial fleets. We come to your yard, your lot, or your job site. No vehicle downtime, no shop visits.
- CTA 1: Get Fleet Quote
- CTA 2: Call 813-722-LUBE

### Trust Bar
- Fully Licensed & Insured
- ASE-Certified Technicians
- 12-Month Service Warranty
- Transparent Pricing, No Surprises

### The Process Section
- Eyebrow: The Process
- Headline: Built around your operation
- Step 1: Consultation — We learn your fleet size, vehicle mix, and maintenance needs. No commitment.
- Step 2: Custom plan — We build a maintenance schedule and pricing structure that fits your budget and your vehicles.
- Step 3: Scheduled visits — Our van shows up on schedule at your location. Your team keeps working.
- Step 4: Reporting — You get service records, maintenance history, and upcoming service alerts for every vehicle.

### Vehicles We Service
- Eyebrow: What We Cover
- Headline: Vehicles We Service
- Items: Box Trucks, Vans & Sprinters, Pickup Trucks, Sedans & SUVs, Heavy Equipment, Specialty Vehicles

### Vehicle Types Section
- Eyebrow: Vehicle Types
- Headline: Light-duty to heavy-duty
- Card 1: Company Cars & Sedans — Employee vehicles, sales rep cars, executive fleet. Oil changes, tire rotations, brake checks, and routine maintenance on a schedule that works for your team.
- Card 2: Vans & SUVs — Service vans, delivery vehicles, passenger shuttles. We handle fleets of any mix with consistent service quality and reporting.
- Card 3: Box Trucks & Heavy-Duty — Straight trucks, flatbeds, utility vehicles, and commercial equipment. DOT-ready inspections and maintenance programs built for uptime.

### Why Fleet Managers Choose Coastal Mobile
- Headline: Why fleet managers choose Coastal Mobile
- Zero downtime — Your vehicles stay in service. We work around your schedule, not the other way around.
- One point of contact — No chasing multiple shops or service writers. One call, one team, one invoice.
- Volume pricing — Multi-vehicle discounts that scale with your fleet size. The more vehicles, the better your rate.
- Service records — Digital maintenance history for every vehicle. Know exactly what was done and when.
- Flexible scheduling — Weekly, bi-weekly, monthly, or on-demand. We match your cadence.
- All vehicle types — Sedans to box trucks. Gas, diesel, hybrid. One provider covers your entire fleet.

### Fleet Services List
- Eyebrow: Services
- Headline: What we handle for fleets
- Synthetic Oil Changes — scheduled by mileage or interval
- Tire Rotation & Balance — extend tire life across your fleet
- Tire Sales & Installation — we source and install on-site
- Brake Inspection & Service — catch problems before they cost you
- Battery Testing & Replacement — no surprise dead batteries
- Fluid Service & Top-Off — coolant, brake, transmission, power steering
- Filter Replacement — engine air and cabin filters
- DOT Inspections — keep your commercial vehicles compliant
- Wiper Blades & Lights — small items that add up across a fleet
- Emergency Mobile Service — breakdowns happen, we respond fast

### Fleet Quote Form
- Headline: Get a fleet quote
- Subheadline: Tell us about your fleet and we will put together a custom maintenance plan within 48 hours.
- Labels: Your Name, Phone, Email, Best Way to Reach You, Preferred Date, Fleet Size, Tell us about your fleet
- Placeholders: First and last name, (555) 555-5555, you@company.com, Vehicle types, current maintenance schedule, locations, anything that helps us build your plan...
- Contact buttons: Call, Text, Email
- Checkbox: My dates are flexible
- Fleet Size options: Select fleet size, 1-5 vehicles, 6-15 vehicles, 16-50 vehicles, 50+ vehicles
- Submit: Get Fleet Quote / Submitting...
- Success: We will call you within 48 hours to discuss your fleet program. — Call now: 813-722-LUBE

### Fleet CTA
- Headline: Ready to simplify your fleet maintenance?
- Body: Get a custom maintenance plan built around your vehicles, your schedule, and your budget.
- CTA 1: Get a Fleet Quote
- CTA 2: Call 813-722-LUBE

### Fleet FAQs
- Eyebrow: Common Questions
- Headline: Fleet Service FAQs
1. Q: What size fleet do you work with? — A: We work with fleets from 3 vehicles to 50+. Whether you have a handful of company cars or a full commercial operation, we build a program that fits.
2. Q: How does fleet pricing work? — A: We offer volume discounts based on fleet size and service frequency. The more vehicles and the more regular the schedule, the better your per-vehicle rate. Contact us for a custom quote.
3. Q: Can you handle box trucks and heavy-duty vehicles? — A: Yes. We service light-duty company cars through heavy-duty box trucks, flatbeds, and utility vehicles. If it has an engine and tires, we likely cover it.
4. Q: Do you provide service records for each vehicle? — A: Yes. Every service is documented with the vehicle, date, mileage, services performed, and any notes. You get digital records you can pull up anytime.
5. Q: What if a vehicle breaks down outside the maintenance schedule? — A: Call us. We offer emergency mobile service for fleet customers. We will get to your vehicle as quickly as possible to minimize downtime.
6. Q: Do you service diesel vehicles? — A: Yes. We handle both gas and diesel vehicles including diesel oil changes with the appropriate filters and oil specifications.

---

## Marine (/marine)

### Hero Section
- Eyebrow: Marine Services
- Headline: Dockside service for your boat
- Body: We service outboard and inboard engines right at the marina or boat ramp. No hauling, no waiting. Factory-grade parts, certified technicians, and a 12-month service warranty on every job.
- CTA 1: Book Service
- CTA 2: Call 813-722-LUBE

### Sticky Category Navigation `[DYNAMIC — short labels derived from Firestore]`
- `[Category short labels, e.g. "Oil Service" stripped of "Marine" prefix]` `[DYNAMIC]`

### Service Category Sections `[DYNAMIC]`
- Per category:
  - `[Category name]` starting at $`[min price]` `[DYNAMIC]`
  - `[Category description]` `[DYNAMIC]`
  - Per service row: `[Service name]` — $`[price]` or "Call for price" `[DYNAMIC]`

### Fallback States
- Loading: *(spinner)*
- Empty: Services loading... — Please check back shortly or call 813-722-LUBE.

### Where We Service Boats
- Headline: Where we service boats
- Body: We come to you at marinas, boat ramps, dry storage, and private docks across Apollo Beach and the South Shore.
- Locations: Apollo Beach • Ruskin • Gibsonton • Palmetto • Ellenton • Riverview • Sun City • Sun City Center

### Marine Quote Form
- Headline: Get a marine service quote
- Subheadline: Tell us about your boat and we will put together a service plan.
- Labels: Your Name, Phone, Email, Best Way to Reach You, Preferred Date, Engine Type, Number of Engines, What do you need?
- Placeholders: First and last name, (555) 555-5555, you@email.com, Engine make/model, service needed, marina or location, anything that helps...
- Contact buttons: Call, Text, Email
- Checkbox: My dates are flexible
- Engine Type options: Select engine type, Outboard, Inboard, Sterndrive, Not sure
- Engine Count options: Select number of engines, Single, Twin, Triple+
- Submit: Get Marine Quote / Submitting...
- Success: We will call you within 24 hours to discuss your marine service. — Call now: 813-722-LUBE

---

## RV (/rv)

### Hero Section
- Eyebrow: RV Services
- Headline: Mobile service for your RV
- Body: We come to your RV park, your campsite, or your storage lot. Oil changes, tire service, brakes, and full maintenance for every class of RV. No shop visits, no towing, no hassle.
- CTA 1: Book Service
- CTA 2: Call 813-722-LUBE

### Sticky Category Navigation `[DYNAMIC]`
- `[Category labels from Firestore]` `[DYNAMIC]`

### Service Category Sections `[DYNAMIC]`
- Per category:
  - `[Category name]` starting at $`[min price]` `[DYNAMIC]`
  - `[Category description]` `[DYNAMIC]`
  - Per service row: `[Service name]` — $`[price]` or "Call for price" `[DYNAMIC]`

### Fallback States
- Loading: *(spinner)*
- Empty: RV services coming soon — Call 813-722-LUBE for a custom RV service quote today.

### Why RV Owners Choose Coastal Mobile
- Headline: Why RV owners choose Coastal Mobile
- We come to you — RV parks, campsites, storage lots, driveways. Wherever your rig is parked, that is where we work.
- No towing, no driving — Your RV stays put. No navigating tight roads or burning fuel to get to a shop.
- Gas and diesel — Class A, Class B, Class C, fifth wheels, travel trailers with generators. We handle it all.
- Same quality, your location — Factory-grade parts, certified technicians, and a 12-month service warranty on every job.
- Seasonal prep — Getting ready for a trip or putting your RV in storage? We handle pre-trip and winterization services.
- RV park partnerships — We work with park managers to offer scheduled service days for residents. One call covers the whole park.

### Service Area
- Eyebrow: Service Area
- Headline: Apollo Beach and South Shore
- Body: We service RVs across Apollo Beach and the greater South Shore area. RV parks, campgrounds, storage facilities, and private driveways.
- Locations: Apollo Beach • Ruskin • Sun City • Sun City Center • Riverview • Gibsonton • Balm • Wimauma • Parrish • Palmetto • Ellenton • Fish Hawk

### CTA Section
- Headline: Ready to book?
- Body: Schedule your RV service online or give us a call. We come to you.
- CTA 1: Book RV Service
- CTA 2: Call 813-722-LUBE

### Trust Badges
- Fully Licensed / & Insured
- ASE-Certified / Technicians
- 12-Month Warranty / On Every Job
- Transparent Pricing / No Hidden Fees

### RV FAQ
- Headline: Frequently Asked Questions
1. Q: What types of RVs do you service? — A: Class A, B, C motorhomes, fifth wheels, travel trailers, toy haulers, and pop-ups.
2. Q: Do you come to RV parks and campgrounds? — A: Yes, we service RVs at parks, campgrounds, storage facilities, and your driveway.
3. Q: How do I prepare my RV for service? — A: Make sure the area around the service point is accessible, have your keys ready, and let us know about any specific concerns.
4. Q: Do you service trailer brakes and tires? — A: Yes, we handle all trailer maintenance including brakes, tires, bearings, and lights.

### RV Quote Form
- Headline: Get an RV service quote
- Subheadline: Tell us about your RV and we will get back to you within 24 hours.
- Labels: Your Name, Phone, Email, Best Way to Reach You, Preferred Date, RV Type, Tell us about your RV
- Placeholders: First and last name, (555) 555-5555, you@email.com, Year, make, model, engine type (gas or diesel), location where your RV is parked, services needed...
- Contact buttons: Call, Text, Email
- Checkbox: My dates are flexible
- RV Type options: Select RV type, Class A Motorhome, Class B Camper Van, Class C Motorhome, Fifth Wheel, Travel Trailer, Other
- Submit: Get RV Quote / Submitting...
- Success: We will call you within 24 hours to discuss your RV service. — Call now: 813-722-LUBE

---

## About (/about)

### Hero Section
- Eyebrow: Our Story
- Headline: Dealership expertise, delivered to your **door.**
- Body: 30 years of fixed operations experience. Now mobile in Apollo Beach and the South Shore.
- Trust pills:
  - 30 years experience
  - Apollo Beach based
  - Licensed & insured

### Van Showcase Section
- Eyebrow: Our Rig
- Headline: The shop on wheels
- Placeholder text: Van photos coming soon

### Story Section
- Eyebrow: Our Story
- Headline: Built on 30 years and a handshake
- Paragraph 1: At Coastal Mobile Lube & Tire, we built this business to serve our local community with honesty, convenience, and dependable service. Living in Apollo Beach and working in Tampa, we recognized the need for a better way to help customers maintain their vehicles and equipment without sitting in traffic or waiting at a repair shop. Life is busy, and people deserve service that is professional, reliable, and built around their schedule. That is why Coastal Mobile Lube & Tire was created.
- Paragraph 2: With a background in automotive dealerships and fixed operations, our company is built on 30 years of experience in luxury customer service, operational excellence, and white-glove care. That experience shaped our commitment to doing things the right way, communicating clearly, and delivering service our customers can trust. We use a vacuum oil extraction system that pulls the oil out through the dipstick tube instead of removing the drain plug and crawling under the vehicle. It is cleaner, faster, and leaves no mess on your driveway. No drips, no spills.
- Paragraph 3: Coastal Mobile Lube & Tire is built on faith-based values that matter: integrity, honesty, hard work, kindness, and service to others. These principles are at the heart of how we operate, how we treat our customers, and how we serve our community. We are proud to serve the people who live, work, and enjoy life throughout the Apollo Beach and South Shore area. Whether it is your personal vehicle, boat, work truck, RV, trailer, fleet vehicle, or recreational equipment, our goal is to bring high-quality mobile lube, tire, and maintenance services directly to you with professionalism and a personal touch.
- Blockquote: We are more than a mobile service company. We are a local business built on experience, strong values, and a commitment to serving our community the right way.
- Image caption: Fully equipped mobile shop

### Value Props Section
- Eyebrow: Why Coastal
- Headline: What sets us apart
- 01 White-Glove Service — Every customer gets the same luxury experience you would expect at a top dealership. We show up on time, treat your property with respect, and leave the work area cleaner than we found it.
- 02 Integrity First — We quote honestly, work transparently, and never upsell services you do not need. If it is not broken, we will tell you.
- 03 30 Years of Know-How — Three decades managing dealership service departments means we have seen it all. That experience shows up in every oil change, every tire rotation, every marine service call.
- 04 Faith-Driven Values — Honesty, hard work, kindness, and service to others. Those are not just words on a wall. They guide every decision we make and every customer interaction we have.

### Verticals Section
- Eyebrow: Full Service
- Headline: One team for everything you own
- Body: Personal vehicles, boats, work trucks, RVs, trailers, fleet vehicles. If it has an engine, we service it.
- Card 1: Automotive — Cars, trucks, and SUVs serviced at your home or office. — Learn more →
- Card 2: Fleet — Scheduled maintenance programs for businesses with 5 vehicles or 500. — Learn more →
- Card 3: Marine — Dockside service for outboard, inboard, and diesel marine engines. — Learn more →
- Card 4: RV and Trailers — Oil changes, tire service, and maintenance at your RV park or storage lot. — Learn more →

### CTA Section
- Headline: Ready to skip the shop?
- Body: Book your first service online or call us. Most appointments available within the week.
- CTA 1: Book Service
- CTA 2: Call 813-722-LUBE

---

## Service Areas (/service-areas)

### Hero Section
- Badge: South Shore Coverage *(with MapPin icon)*
- Headline: We Come to You
- Body: Mobile oil changes, tire service, and vehicle maintenance across Apollo Beach and 12 South Shore communities. No shop visits, no waiting rooms.

### Service Area Cards

1. **Apollo Beach** — Our home base. Apollo Beach residents get the fastest response times and most flexible scheduling. From Waterset to MiraBay, we know every neighborhood and driveway in town. — Book Service in Apollo Beach →
2. **Riverview** — One of the fastest-growing communities in Hillsborough County, and one of our busiest service areas. We handle oil changes, tire rotations, and brake work throughout Riverview, from Panther Trace to Alafia. — Book Service in Riverview →
3. **Ruskin** — Just south of Apollo Beach along US-41, Ruskin is a short drive from our base. We service personal vehicles, work trucks, and boats at marinas along the Little Manatee River. — Book Service in Ruskin →
4. **Sun City Center** — Convenient mobile service for Sun City Center residents who prefer not to drive to a shop. We bring factory-grade oil changes, battery service, and tire rotations right to your door. — Book Service in Sun City Center →
5. **Sun City** — Nestled between Ruskin and Wimauma, Sun City homeowners count on us for convenient vehicle maintenance. No appointment drop-offs, no waiting rooms. Just quality service in your driveway. — Book Service in Sun City →
6. **Fish Hawk** — Fish Hawk families juggle busy schedules. Our mobile service means you can get an oil change or tire rotation while you handle everything else at home. We cover all of Fish Hawk Ranch and Starling. — Book Service in Fish Hawk →
7. **Gibsonton** — Located right along US-41, Gibsonton is a quick trip from our Apollo Beach base. We service cars, trucks, and commercial vehicles throughout the Gibsonton corridor. — Book Service in Gibsonton →
8. **Palmetto** — Just across the Manatee River, Palmetto residents enjoy the same fast, professional mobile service. Oil changes, brake checks, and tire work done at your home or business. — Book Service in Palmetto →
9. **Ellenton** — Conveniently located near I-75 and the Ellenton outlets, this community is well within our service radius. We handle everything from routine oil changes to full brake jobs on-site. — Book Service in Ellenton →
10. **Parrish** — Parrish is growing fast with new communities popping up along the 301 corridor. We bring professional mobile maintenance to North River Ranch, Harrison Ranch, and surrounding neighborhoods. — Book Service in Parrish →
11. **Balm** — Rural Balm and the surrounding agricultural areas east of US-301 are part of our regular service territory. We work on personal vehicles, farm trucks, and equipment right on your property. — Book Service in Balm →
12. **Wimauma** — South of Riverview along SR-674, Wimauma residents rely on us for dependable mobile service. No need to drive into town. We bring the shop to you, from oil changes to tire installs. — Book Service in Wimauma →

### Bottom CTA
- Headline: Ready to skip the shop?
- Body: Book your mobile service online in under two minutes, or call us at 813-722-LUBE.
- CTA: Book Service Now →

---

## FAQ (/faq)

### Hero Section
- Badge: Common Questions *(with HelpCircle icon)*
- Headline: Frequently Asked Questions
- Body: Everything you need to know about how mobile service works, what we cover, and how to get started.

### FAQ Items

1. Q: How does mobile service work? — A: We come to you. Whether you are at home, at the office, or at a job site, our fully equipped service vehicle arrives at your location with everything needed to handle the job on the spot. No waiting rooms, no dropping off your car. Just book a time, and we show up ready to work.
2. Q: What areas do you serve? — A: We are based in Apollo Beach and serve the entire South Shore area. That includes Ruskin, Sun City Center, Sun City, Riverview, Gibsonton, Balm, Wimauma, Parrish, Palmetto, Ellenton, and Fish Hawk. If you are not sure whether we cover your area, give us a call.
3. Q: How do I book a service? — A: You can book online through our website, call us at 813-722-LUBE, or send a text to the same number. We will confirm your appointment and give you a time window that works for your schedule.
4. Q: What is included in an oil change? — A: Our standard oil change starts at $89.95 and includes synthetic blend oil, a new oil filter, and a multi-point vehicle inspection. We check your tires, fluids, belts, and battery so you know exactly where your vehicle stands. Full synthetic and diesel options are also available.
5. Q: Do you service fleets? — A: Yes. We have a dedicated fleet program for businesses with company vehicles, work trucks, and commercial fleets. Fleet services are quote-based, and we can set up recurring maintenance schedules to keep your vehicles on the road with zero downtime.
6. Q: Do you service boats? — A: Yes. Our marine division handles outboard, inboard, and diesel marine engines. We come directly to your dock or marina for oil changes, fluid services, and seasonal maintenance. No need to haul your boat to a shop.
7. Q: Do you service RVs? — A: Yes. We handle RVs the same way we handle automotive and diesel vehicles. Oil changes, fluid services, tire work, and general maintenance can all be done on-site at your home or RV park.
8. Q: What payment methods do you accept? — A: We accept Zelle, Venmo, cash, and check. Payment is collected at the time of service.
9. Q: Are you licensed and insured? — A: Yes. Coastal Mobile Lube & Tire is fully licensed and insured. Our technicians are ASE-certified, so you can trust that the work is done right every time.
10. Q: What is vacuum extraction? — A: Instead of removing your drain plug and crawling under the vehicle, we use a vacuum extraction system to pull the oil out through the dipstick tube. It is cleaner, faster, and leaves no mess on your driveway. No drips, no spills.
11. Q: What are your hours? — A: We are available Monday through Friday, 8AM to 5PM. We are closed on Saturday and Sunday.
12. Q: How long does a service take? — A: Most services are completed in under an hour. A standard oil change typically takes 20 to 30 minutes. We will give you an estimated time when you book so you know what to expect.
13. Q: Do you work in the rain? — A: Yes. We work rain or shine. Our service vehicle has covered equipment, so we can handle most jobs regardless of the weather. If conditions are truly unsafe, we will reach out to reschedule.

### CTA Section
- Headline: Still have questions?
- Body: Give us a call and we will be happy to help. Or book your service online in under two minutes.
- CTA 1: 813-722-LUBE *(phone link)*
- CTA 2: Book Service Online

---

## Contact (/contact)

### Hero Section
- Eyebrow: Contact
- Headline: Get in touch
- Body: Have a question or want to learn more about our services? We respond within one business day. For service bookings, use our Book Service page. For fleet or marine quotes, visit Fleet or Marine.

### Contact Form
- Labels: Name, Phone, Email, I am interested in, Message
- Placeholders: Your name, (555) 555-5555, you@email.com, Tell us how we can help. Include vehicle details, fleet size, or any questions.
- Interest dropdown options:
  - General inquiry
  - Automotive service quote
  - Fleet & commercial services
  - Marine service quote
  - Partnership or business opportunity
  - Other
- Submit: Send Message
- Footer text: We respond to every message within one business day.

### Contact Form — Success State
- Headline: Message sent.
- Body: We will get back to you within one business day. For immediate help, call 813-722-LUBE.
- Link: Send another message

### Contact Info Sidebar
- **Call or text**: 813-722-LUBE — Available Monday through Friday
- **Email**: info@coastalmobilelube.com — We respond within one business day
- **Service area**: Apollo Beach and the South Shore — Ruskin, Sun City Center, Riverview, Gibsonton, Fish Hawk, Palmetto, Ellenton, Parrish, Balm, Wimauma, Sun City
- **Business hours**:
  - Monday - Friday: 8:00 AM - 5:00 PM
  - Saturday - Sunday: Closed

### CTA Section
- Headline: Prefer to book directly?
- Body: Skip the form and schedule your service now.
- CTA 1: Book Service
- CTA 2: Call 813-722-LUBE

---

## Booking Wizard Modal (/book and via any "Book Service" CTA)

### Modal Header
- Headline: Book Your Service
- Subheadline: We come to you. You never leave your day.

### Progress Bar Steps
- Step 1: Services
- Step 2: Vehicle
- Step 3: Details
- Step 4: Review

### Step 1: Services

#### Division Pills
- Automotive
- Marine
- RV
- Fleet

#### Coastal Packages (Automotive only) `[DYNAMIC]`
- Collapsible header: Bundle and save with Coastal Packages
- Badge on featured: Most Popular
- Divider: Or choose individual services
- Per package: `[Package name]` — $`[price]` — `[bundle items list]` `[DYNAMIC]`

#### Category Cards `[DYNAMIC]`
- Per card: `[Category name]` — From $`[starting price]` `[DYNAMIC]`
- Fallback category (always present): Something Else

#### Service Detail Panel
- `[Category name]` — Select the services you need
- Per service: `[Service name]` — $`[price]` or "Quote" `[DYNAMIC]`

#### "Something Else" Input
- Label: What do you need?
- Placeholder: Describe the service you're looking for...

#### Browse Link
- Browse all [Division] services

#### Mobile Selection Summary
- [count] service(s) selected — $[total] or "Quote"

#### Search Overlay
- Placeholder: Search services...
- Done *(button)*

### Step 2: Vehicle

#### Section Title
- Vehicle Information *(or "Vessel Information" for Marine)*

#### "Been here before?" Lookup
- Link text: Been here before? We can auto-fill your vehicle info.
- Placeholder: (555) 555-5555
- Button: Look me up / Looking...
- Results header: Select a previous booking:
- Per result: `[Year Make Model]` or "No vehicle info" — `[services]` or "No services listed" — `[date]`
- Not found: No previous bookings found with that number. No worries, fill in your details below.
- Error: Couldn't look up your info right now. Please fill in your details below.

#### Marine Vessel Fields
- Label: Hull Identification Number (HIN)
- Placeholder: Enter HIN
- Divider: Don't know your HIN? Describe your vessel.
- Labels: Vessel Year, Vessel Make, Vessel Model
- Placeholders: e.g. 2020, e.g. Boston Whaler, e.g. Montauk 170

#### Auto/RV/Fleet Vehicle Fields (Desktop)
- Unified search placeholder (Auto): Search your vehicle... e.g. 2024 Ford F-150
- Unified search placeholder (RV): Search your vehicle... e.g. 2022 Thor Four Winds
- Unified search placeholder (Fleet): Search your vehicle... e.g. 2023 Ford Transit
- Loading state: Loading vehicle database...
- No match text: No matches for "[query]". Try searching by make or model name.
- Manual entry link: or enter details manually
- Fallback message: Can't load vehicle database. Enter your vehicle details below.
- Labels: Year, Make, Model
- Placeholders: Year, Make, Model / Select make first
- Results footer: Showing 8 of [count] results

#### Auto/RV/Fleet Vehicle Fields (Mobile)
- Labels: Year, Make, Model
- Default options: Select Year, Select Make, Select Model / Loading models... / Select make first

#### VIN Section
- Divider: or enter your VIN
- Label: VIN
- Placeholder: Enter 17-character VIN
- Scan button: Scan
- Decoding state: Decoding VIN...
- Success: VIN decoded successfully

### Step 3: Your Details

#### Section Title
- Your Details

#### Lookup
- Link text: Been here before? Sign in to auto-fill your details.

#### Form Fields
- Labels: Full Name *, Phone *, Email, Preferred Date, Preferred Time, Best way to reach you, Service Address, Anything else we should know?
- Placeholders: Your full name, (555) 555-5555, you@example.com, Where should we come? (street address or cross streets), Special instructions, location details, etc.
- Time slot default: Select time
- Time slot options:
  - Morning (7-10am)
  - Midday (10am-1pm)
  - Afternoon (1-4pm)
  - Late (4-6pm)
- Contact preference buttons: call, text, email

### Step 4: Review

#### Section Title
- Review Your Booking

#### Review Cards
- Services — Edit
  - Per service: `[name]` — $`[price]` or "Quote"
  - Other: `[other text]`
- Vehicle (or Vessel) — Edit
  - `[Year Make Model]`
  - VIN (or HIN): `[value]`
  - Fallback: Not provided
- Contact & Schedule — Edit
  - `[name]`
  - `[phone]`
  - `[email]`
  - Contact: `[preference]`
  - Address: `[value]`
  - Date: `[value]`
  - Time: `[time slot label]`
  - Notes: `[value]`

#### Estimated Total
- Label: Estimated Total
- Value: $`[total]` or "Quote on-site"
- Footnote (when applicable): Some services will be quoted on-site

#### Error State
- Something went wrong. Please try again.

### Desktop Sidebar (persistent)
- Header: Your Selection
- Empty state: Pick services to get started
- Per category group: `[Category]` — `[Service name]` — $`[price]` or "Quote" — ✕
- Other section: Other — `[text]` — Quote — ✕
- Estimated Total: $`[total]` or "Quote"

### Navigation Buttons
- Back
- Next
- Submit Booking *(step 4, non-Fleet)*
- Request a Quote *(step 4, Fleet)*
- Submitting...

### Confirmation Screen
- Headline: You're all set!
- Body: We will reach out within 2 hours to confirm your appointment.

---

## Footer (Global)

### Brand Column
- Logo image alt: Coastal Mobile Lube & Tire
- Tagline: Automotive. Fleet. Marine. RV.
- Phone: 813-722-LUBE

### Services Column
- Column Header: Services
- Automotive
- Fleet & Commercial
- Marine
- RV
- Book Service

### Company Column
- Column Header: Company
- About
- Service Areas
- FAQ
- Contact
- Book Service

### Bottom Bar
- ASE Certified *(badge image)*
- 2026 Coastal Mobile Lube & Tire. All rights reserved.
- Website by Gold Co LLC

---

## Floating/Sticky Elements

### Sticky Bottom Bar (Mobile Only)
- Call *(button with Phone icon)*
- Book Service *(button)*

### Floating Quote Bar (Desktop/Tablet Only)

#### Collapsed State
- Get a Quote *(pill button)*

#### Expanded State
- Headline: Get a Quick Quote
- Subheadline: We'll get back to you within the hour.
- Labels: Name, Phone, Email, Service, Preferred Contact
- Placeholders: Your name, (555) 555-5555, Email address
- Service dropdown default: What do you need?
- Service options: Auto Service, Marine Service, RV / Trailer Service, Fleet Inquiry
- Contact preference buttons: call, text, email
- Submit: Get My Quote / Sending...
- Success message: Got it! We'll reach out shortly.
- Error message: Something went wrong. Please call 813-722-LUBE.

### Mobile Quick Quote (Mobile Only)

#### Tab (right edge)
- Quick Quote *(vertical text)*

#### Expanded Panel
- Headline: Quick Quote
- Subheadline: We'll get back to you within the hour.
- Labels: Name, Phone, Email, Service, Preferred Contact
- Placeholders: Your name, (555) 555-5555, Email address
- Service dropdown default: What do you need?
- Service options: Auto Service, Marine Service, RV / Trailer Service, Fleet Inquiry
- Contact preference buttons: call, text, email
- Submit: Get My Quote / Sending...
- Success message: Got it! We'll reach out shortly.
- Error message: Something went wrong. Please call 813-722-LUBE.

---

## Trust Bar Component (Reusable)

Used on: Fleet page (standalone), Homepage (inline variant)

- Fully Licensed & Insured
- ASE-Certified Technicians
- 12-Month Service Warranty
- Transparent Pricing, No Surprises

---

## SEO Metadata (Not Visible on Page, but in `<head>`)

### Homepage
- Title: *(default from layout)*
- Description: *(default from layout)*

### About
- Title: About Us
- Description: 30 years of dealership experience, now mobile. Licensed, insured, ASE-certified technicians serving Tampa Bay.

### Service Areas
- Title: Service Areas | Coastal Mobile Lube & Tire
- Description: Mobile oil changes, tire service, and maintenance in Apollo Beach, Riverview, Ruskin, Sun City Center, and 12 South Shore communities. We come to you.

---

## Notes on Dynamic vs. Hardcoded Copy

### Hardcoded (in source code)
- All page headlines, subheadlines, body copy, CTAs
- How It Works steps
- Stats bar values
- Customer reviews
- Trust bar items
- About page story, value props, verticals
- Fleet process steps, vehicle types, value props, service list, FAQ
- RV value props, FAQ
- Marine locations list
- Service area descriptions
- FAQ items
- All form labels, placeholders, and option lists
- Footer text
- Floating/sticky element text
- Booking wizard UI text, step labels, fallback service data

### Dynamic from Firestore `[DYNAMIC]`
- Service category names (tab labels, pill navigation)
- Service category descriptions
- Individual service names and display names
- Service prices and "starting at" prices
- Coastal Packages (names, prices, bundle items, featured flag)
- Category sort order and visibility (showOnHomepage flag)
- Category startingAt values (used as price fallback)
