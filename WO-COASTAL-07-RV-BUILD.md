# WO-COASTAL-07: RV Services Seed + Page Build

## Summary
Seed RV & Trailer services into Firestore and flesh out the /rv page with real content.

## Pre-read (read ALL of these in full before making any edits)
- scripts/seed-services.js (understand the seeding pattern)
- src/app/rv/RVContent.tsx (or whatever renders the RV page)
- src/app/rv/page.tsx
- Check current Firestore RV data: the RV page currently shows "coming soon" which means no services exist with division "rv"

## Changes

### 1. Create RV Seed Script
Create scripts/seed-rv-services.js that seeds these RV & Trailer service categories and services to Firestore:

**Category: RV Oil & Lube**
- RV Oil Change (Gas) -- $129.95
- RV Oil Change (Diesel) -- $189.95
- Chassis Lube -- $39.95
- Generator Oil Change -- $89.95

**Category: RV Brakes**
- RV Front Brake Job -- $450
- RV Rear Brake Job -- $450
- Trailer Brake Adjustment -- $89.95
- Trailer Brake Service -- $249.95

**Category: RV Tires & Wheels**
- RV Tire M&B Single -- $79.95
- RV Tire M&B Dual -- $149.95
- RV Tire Rotation -- $69.95
- Wheel Bearing Repack -- $149.95

**Category: RV Maintenance**
- Generator Service & Inspection -- $199.95
- Roof Seal & Leak Inspection -- $149.95
- Slide-Out Lubrication -- $79.95
- RV Battery Service -- $59.95
- RV HVAC Service -- $199.95
- RV Winterization -- $149.95
- RV De-Winterization -- $129.95

All services should have:
- division: "rv"
- isActive: true
- isBookable: true
- sortOrder: sequential within category

Use the same Firestore structure and field names as the existing seed script.

### 2. Run the Seed Script
```bash
node scripts/seed-rv-services.js
```

### 3. RV Page Content
After seeding, the RV page should automatically show services (it already queries division "rv"). But also:
- Add 3-4 FAQ questions at the bottom:
  - "What types of RVs do you service?" -- Class A, B, C motorhomes, fifth wheels, travel trailers, toy haulers, and pop-ups
  - "Do you come to RV parks and campgrounds?" -- Yes, we service RVs at parks, campgrounds, storage facilities, and your driveway
  - "How do I prepare my RV for service?" -- Make sure the area around the service point is accessible, have your keys ready, and let us know about any specific concerns
  - "Do you service trailer brakes and tires?" -- Yes, we handle all trailer maintenance including brakes, tires, bearings, and lights
- Add a CTA section above the FAQ: "Ready to book?" with a Book RV Service button linking to /book and a Call 813-722-LUBE button
- Add the same trust badges bar that /marine has (Fully Licensed, ASE-Certified, 12-Month Warranty, Transparent Pricing)
- Hide the labor rate categories on /rv the same way they are hidden on /services and /marine

## Rules
- Do NOT rewrite entire files. Surgical edits only (except the new seed script which is a new file).
- Do NOT touch globals.css or tailwind config.
- Match the visual style of the /marine page for consistency.

## Deploy
```bash
npm run build && npx netlify-cli deploy --prod --message="WO-07: RV services seeded and page built out"
```

Then run: git add -A && git commit -m "WO-07: RV services seeded and page built out" && git push origin main
