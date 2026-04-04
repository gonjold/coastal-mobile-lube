#!/bin/bash
# coastal-frontend-services.sh
# Services page + Booking flow redesign
# Run AFTER coastal-backend.sh Task B1 completes (needs pricingCatalog.ts)
# tmux new -s frontend && bash ~/coastal-mobile-lube/coastal-frontend-services.sh

set -e
cd ~/coastal-mobile-lube
git checkout navy-redesign

LOG=~/coastal-mobile-lube/FRONTEND-LOG.md
echo "# Frontend Services + Booking Pipeline" > $LOG
echo "Started: $(date)" >> $LOG
echo "Branch: navy-redesign" >> $LOG
echo "---" >> $LOG

run_task() {
  local TASK_NUM=$1
  local TASK_NAME=$2
  local PROMPT=$3
  
  echo "" >> $LOG
  echo "## Task $TASK_NUM: $TASK_NAME" >> $LOG
  echo "Started: $(date)" >> $LOG
  
  if claude --dangerously-skip-permissions -p "$PROMPT" 2>&1 | tee /tmp/frontend-task-$TASK_NUM.log; then
    echo "Status: COMPLETED" >> $LOG
  else
    echo "Status: FAILED (exit code $?)" >> $LOG
  fi
  
  echo "Finished: $(date)" >> $LOG
  echo "---" >> $LOG
  sleep 3
}

# ============================================================
# TASK F1: Services Page Redesign
# ============================================================
run_task F1 "Services Page - Category Pills + Starting At Pricing" \
'Read src/app/services/ServicesContent.tsx in full. Also read src/data/pricingCatalog.ts if it exists (it may have been created by a parallel pipeline).

Completely rebuild the services page display with this approach:

LAYOUT:
1. Navy hero section at top with eyebrow "AUTOMOTIVE SERVICES", heading "What we handle on-site", subtext about factory-trained techs coming to your location. Book Service CTA + Call 813-722-LUBE button.

2. CATEGORY PILL NAVIGATION below the hero:
   - Oil Changes | Tires & Wheels | Brakes | Fluid Services | Diesel Services | Maintenance
   - Active pill: navy bg (#0B2040) white text
   - Inactive pill: light bg (#FAFBFC) gray text
   - Clicking a pill smooth-scrolls to that category section

3. Each CATEGORY SECTION shows:

   OIL CHANGES (starting at $89.95):
   - Brief description: "Factory-grade oil change performed at your location."
   - Three tier cards side by side:
     * Synthetic Blend $89.95 (up to 5 qts)
     * Full Synthetic $119.95 (up to 5 qts) - tagged "Most popular" with orange border
     * Diesel $219.95
   - Below tiers: "Bundle and save" callout note: "Add tire rotation + multi-point inspection with our Basic, Better, or Best packages starting at $119.95"
   - Expandable "View all oil change packages" showing the full Basic/Better/Best matrix for each oil type

   TIRES & WHEELS (starting at $39.95):
   - Brief description: "Rotation, mount and balance, patching, and more. All on-site."
   - 2-column mini-card grid showing:
     * Tire Rotation $39.95
     * Mount & Balance (single) $49.95
     * Mount & Balance (4 tires) $159.95
     * Rotate & Balance $89.95
     * Tire Patch $69.95
     * Road Force Balance $199.95
     * TPMS/Valve Stem $69.95
   - Note about oversized tires pricing

   BRAKES (starting at $320):
   - Brief description: "Includes pads and resurfacing rotors."
   - Cards:
     * Front + Rear Brake Job $320
     * Transit Front + Rear $450
     * Dually Front $450
     * Dually Rear $720

   FLUID SERVICES (starting at $79.95):
   - Brief description: "Wynns professional fluid services."
   - 2-column grid of all fluid services with prices:
     * Battery Service $79.95
     * Throttle Body Service $129.95
     * Power Steering Flush $219.95
     * Brake Flush $239.95
     * Fuel Induction Service $239.95
     * Transfer Case Flush $249.95
     * A/C Evaporator Service $259.95
     * Coolant Flush $269.95
     * Front Diff Flush $269.95
     * Rear Diff Flush $269.95
     * Stop Squeal $297.95
     * Transmission Auto $419.95
     * Transmission Manual $249.95

   DIESEL SERVICES (starting at $49.95):
   - Brief description: "Specialized diesel maintenance and fluid services."
   - Cards for each diesel service with prices

   MAINTENANCE (starting at $34.95):
   - Brief description: "Filters, wipers, batteries, and basic maintenance."
   - 2-column grid:
     * Rear Wiper Blade $34.95
     * Front Wiper Blades $79.95
     * Engine Air Filter $79.95
     * Cabin Air Filter $99.95
     * Cabin Air Filter w/ Frigi Fresh $129.95
     * Diesel Air Filter $119.95
     * Battery Replacement from $50
     * Diesel Fuel Filters $399.95

4. BOTTOM CTA section: "Ready to book?" with Book Service button and Call 813-722-LUBE

DESIGN NOTES:
- Use the navy-redesign aesthetic: navy hero, warm sand/white alternating sections
- Category pill bar should be sticky (sticks below the header on scroll)
- Cards should have subtle shadows, clean borders
- Orange for all prices and CTAs
- "Most popular" and "Recommended" tags in orange pill badges
- No hourly labor rates displayed anywhere
- No em dashes, no emojis

COPY RULES: Human tone, not salesy. "Factory-grade" not "professional-grade". Short descriptions.

Do NOT break any existing navigation or page routing. This replaces the content of ServicesContent.tsx.

npm run build && git add -A && git commit -m "[F1] Services page redesign - category pills, starting at pricing, tier cards, full catalog"'

# ============================================================
# TASK F2: Booking Page - Smart Defaults Flow
# ============================================================
run_task F2 "Booking Page - Smart Defaults + Full Catalog" \
'Read src/app/book/BookingForm.tsx in full (this is a large file, ~691 lines). Also read src/data/pricingCatalog.ts if it exists.

Redesign the booking page with the "Smart Defaults" approach. The goal: 80% of customers want an oil change or tires. Make that fast. The other 20% who need something specific can browse the full catalog.

NEW LAYOUT:

1. HERO SECTION:
   - Heading: "Book your service"
   - Subtext: "Pick a service, choose a date, and we will confirm your appointment within 2 hours. Or call 813-722-LUBE."
   - Clean, short, navy or white depending on page design

2. MOST BOOKED section (6 hero cards in a 2x3 or 3x2 grid):
   - Synthetic Blend Oil Change - starting at $89.95
   - Full Synthetic Oil Change - starting at $119.95
   - Tire Rotation - $39.95
   - Mount & Balance (4 Tires) - $159.95
   - Front + Rear Brakes - starting at $320
   - Cabin Air Filter - $99.95
   
   Each card: service name, price in orange, brief one-line description, click to select (toggle on/off)
   Selected state: orange border, subtle orange background tint, checkmark badge

3. BUNDLE UPSELL section:
   - Heading: "Save with a package"
   - Three tier cards:
     * Basic $119.95 - Oil change + tire rotation (syn blend)
     * Better $139.95 - Basic + MOA additive
     * Best $179.95 - Basic + MOA + fuel additives
   - Note: "Also available in Full Synthetic and Diesel"
   - Selecting a bundle replaces individual oil change selection

4. BROWSE ALL SERVICES (expandable/collapsible):
   - "Browse all services" button/header that expands
   - Inside: same category pill navigation as /services page
   - Shows full catalog organized by category
   - Each item selectable with price
   - This is for the 20% who need fluid services, diesel work, etc.

5. SELECTED SERVICES SUMMARY (sticky bottom bar or right sidebar):
   - Shows all selected services with prices
   - Running subtotal
   - "X" to remove individual items
   - On mobile: sticky bottom bar showing item count + total, tappable to expand
   - On desktop: right sidebar (similar to shopping cart)

6. BOOKING FORM (below services or as step 2):
   - Preferred date picker
   - Time window selector (Morning 7-10, Late Morning 10-12, Afternoon 12-3, Late Afternoon 3-5)
   - Name, Phone, Email, Address
   - Contact preference (Call/Text/Email toggles)
   - "My dates are flexible" checkbox
   - Vehicle info (optional): Year, Make, Model
   - Notes textarea
   - Submit button: "Get My Quote" (full width, orange)

7. After submit:
   - Write to Firestore "bookings" collection (same structure as current)
   - Include selected services array with prices
   - Include subtotal estimate
   - Source: "booking-page"
   - Show confirmation screen with selected services, estimated total, and "We will confirm within 2 hours"

8. FLEET/MARINE REDIRECT:
   - Below the hero or as a note: "Looking for fleet or marine service? Get a custom quote on those pages."
   - Links to /fleet and /marine

CRITICAL REQUIREMENTS:
- All Firestore submission logic MUST be preserved. Read the existing handleSubmit, addDoc, serverTimestamp code and keep it working.
- The returning customer phone lookup must still work
- All form validation must still work
- Contact preference toggles must still work
- Source tracking must still work

DESIGN:
- Navy-redesign aesthetic
- Cards with subtle shadows and hover effects
- Selected cards with orange border + checkmark
- Sticky summary bar on mobile
- Clean, scannable, fast to use
- A customer should be able to book a basic oil change in under 30 seconds

COPY: No em dashes. No emojis. Human tone. "We will confirm" not "We'\''ll confirm".

npm run build && git add -A && git commit -m "[F2] Booking page - smart defaults, bundle upsell, full catalog browse, sticky summary"'

# ============================================================
# TASK F3: Marine Page - Same Treatment
# ============================================================
run_task F3 "Marine Page - Full Catalog Display" \
'Read src/app/marine/page.tsx or MarineContent.tsx in full.

Apply the same pricing display strategy as the services page, using the real marine pricing:

CATEGORY SECTIONS:

MARINE OIL SERVICE (starting at $129.95):
- Generator: $129.95
- Outboard Small: $149.95
- Outboard V6/V8: $199.95
- Inboard Small Block: $229.95
- Inboard Big Block: $279.95
- Diesel Marine: $349.95
- Notes: Twin engine surcharge +$75, travel charge $49.95
- Pre-Trip Inspection: $59.95
- Sea Trial/Ramp Run Support: $149.95

MARINE FUEL & FLUID SERVICES (starting at $29.95):
- Show all 16 items in a 2-column grid with prices

MARINE DIESEL SERVICES (starting at $29.95):
- Show all 6 items

MARINE MAINTENANCE (starting at $29.95):
- Show all 9 items

MARINE TRAILER & TIRE (starting at $29.95):
- Show all 10+ items

MARINE BRAKES (starting at $129.95):
- Show all 4 items

Keep the existing inline quote form with engineType, engineCount fields. Keep the Firestore submission.

Add category pills like the auto services page. Same visual treatment. The marine page should feel like it belongs to the same site.

npm run build && git add -A && git commit -m "[F3] Marine page - full catalog with categories and real pricing"'

# ============================================================
# TASK F4: RV Page - Pricing Update
# ============================================================
run_task F4 "RV Page - Full Service Display" \
'Read src/app/rv/RVContent.tsx in full.

Update the RV page to show the relevant services from the auto catalog that apply to RVs. RVs use the same auto and diesel services:

KEY SERVICES TO HIGHLIGHT:
- Synthetic Blend Oil Change: $89.95
- Full Synthetic Oil Change: $119.95  
- Diesel Oil Change: $219.95
- Tire Rotation: $39.95
- Mount & Balance: $159.95
- All fluid services apply
- All diesel services apply
- HVAC Recharge: $299.99
- Battery Replacement: from $50

Show these with the same category card approach. Note that RV-specific considerations (larger vehicles, diesel common, generator service available).

Keep the inline quote form with source: "rv-page".

npm run build && git add -A && git commit -m "[F4] RV page - full relevant service pricing from auto catalog"'

# ============================================================
# DEPLOY
# ============================================================
echo "## Deploy" >> $LOG
echo "Started: $(date)" >> $LOG
git push origin navy-redesign 2>&1 | tail -5 >> $LOG
npx netlify-cli deploy --alias navy-preview 2>&1 | tail -10 >> $LOG
echo "---" >> $LOG
echo "## Pipeline Complete" >> $LOG
echo "Finished: $(date)" >> $LOG
echo "Navy preview: https://navy-preview--coastal-mobile-lube.netlify.app" >> $LOG
