# WO-COASTAL-08: Fleet Page Visual Weight

## Summary
Add visual weight to the /fleet page -- better hero, vehicle type icons, trust badges.

## Pre-read (read ALL of these in full before making any edits)
- src/app/fleet/page.tsx (or FleetContent.tsx -- whatever renders the fleet page)
- src/app/marine/MarineContent.tsx (reference for trust badges pattern)
- Check what images/assets exist: grep -r "cloudinary\|fleet" src/ --include="*.tsx" --include="*.ts" | head -20

## Changes

### 1. Fleet Hero Enhancement
- The fleet hero currently has a dark gradient but feels thin
- Add more vertical padding (py-20 to py-28 or similar)
- If a fleet-related Cloudinary image exists, use it as a background-image with a dark overlay
- If no image available, keep the gradient but make the hero taller with more presence
- Ensure the headline, description, and CTAs have strong visual hierarchy

### 2. Vehicle Type Icons Section
- Add a section below the hero showing vehicle types served
- Use simple text-based cards (no icon library needed) with emoji or unicode symbols:
  - Box Trucks
  - Vans & Sprinters
  - Pickup Trucks
  - Sedans & SUVs
  - Heavy Equipment
  - Specialty Vehicles
- 3-column grid on desktop, 2-column on mobile
- Each card: navy background, white text, subtle rounded corners
- Section heading: "Vehicles We Service"

### 3. Trust Badges Bar
- Add the same trust badges bar that /marine has: Fully Licensed & Insured, ASE-Certified Technicians, 12-Month Service Warranty, Transparent Pricing
- Place it between the hero and the process section
- Match the styling from /marine exactly

### 4. Fleet CTA Section
- Add a strong CTA section before the footer:
  - Heading: "Ready to streamline your fleet maintenance?"
  - Two buttons: "Get a Fleet Quote" (link to /contact or /book) and "Call 813-722-LUBE"
  - Dark background with white text

## Rules
- Do NOT rewrite entire files. Surgical edits only.
- Do NOT touch globals.css or tailwind config.
- Do NOT change the existing process steps or "Why fleet managers choose" sections.

## Deploy
```bash
npm run build && npx netlify-cli deploy --prod --message="WO-08: Fleet page visual weight"
```

Then run: git add -A && git commit -m "WO-08: Fleet page visual weight" && git push origin main
