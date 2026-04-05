#!/bin/bash
# coastal-frontend-polish.sh — Frontend Visual Polish Pipeline
# Based on full visual audit of production navy site vs white version
# Run on main branch, deploy to prod when done
# Usage: ./coastal-frontend-polish.sh [--start-from N]

set -euo pipefail

PROJECT_DIR="$HOME/coastal-mobile-lube"
LOG_DIR="$HOME/setup-logs/frontend-polish-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$PROJECT_DIR/FRONTEND-POLISH-V2-LOG.md"
START_FROM=1

if [ "${1:-}" = "--start-from" ] && [ -n "${2:-}" ]; then
  START_FROM=$2
fi

mkdir -p "$LOG_DIR"

cd "$PROJECT_DIR"
git checkout main
git pull origin main || true
git add -A && git commit -m "pre-frontend-polish: stage changes" || true

echo "# Frontend Polish V2 Pipeline" > "$LOG_FILE"
echo "Started: $(date)" >> "$LOG_FILE"
echo "Branch: main" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"

run_task() {
  local num=$1
  local name=$2
  local prompt=$3

  if [ "$num" -lt "$START_FROM" ]; then
    echo "⏭ Skipping Task $num: $name (--start-from $START_FROM)"
    return 0
  fi

  echo "" >> "$LOG_FILE"
  echo "## Task $num: $name" >> "$LOG_FILE"
  echo "Started: $(date)" >> "$LOG_FILE"

  echo "▶ Task $num: $name"

  cd "$PROJECT_DIR"
  claude -p "$prompt" --max-turns 30 > "$LOG_DIR/task-${num}.log" 2>&1
  local exit_code=$?

  if [ $exit_code -ne 0 ]; then
    echo "Status: FAILED (exit $exit_code)" >> "$LOG_FILE"
    echo "Finished: $(date)" >> "$LOG_FILE"
    echo "---" >> "$LOG_FILE"
    echo "❌ Task $num FAILED — check $LOG_DIR/task-${num}.log"
    return 1
  fi

  cd "$PROJECT_DIR"
  git add -A && git commit -m "[FP-$num] $name" || true

  echo "Status: COMPLETED" >> "$LOG_FILE"
  echo "Finished: $(date)" >> "$LOG_FILE"
  echo "---" >> "$LOG_FILE"
  echo "✅ Task $num: $name"
}

# ─────────────────────────────────────────────────
# TASK 1: Navigation + RV Integration Sitewide
# ─────────────────────────────────────────────────
run_task 1 "Add RV to nav and integrate RV throughout site" "
You are working on ~/coastal-mobile-lube (Next.js, Tailwind, navy design).

Read the main layout/nav component, the homepage, and the footer.

CHANGES:

1. NAVIGATION — Add 'RV' to the main nav bar between Marine and About:
   Current: Automotive | Fleet | Marine | About | Contact
   New: Automotive | Fleet | Marine | RV | About | Contact

2. HOMEPAGE HERO — Update the subhead text:
   Current: 'MOBILE AUTOMOTIVE. FLEET. MARINE.'
   New: 'MOBILE AUTOMOTIVE. FLEET. MARINE. RV.'

3. HOMEPAGE SERVICES TABS — Add an RV tab:
   Current tabs: Automotive | Fleet & Commercial | Marine
   New tabs: Automotive | Fleet & Commercial | Marine | RV
   The RV tab should show a card similar to the others with:
   - Title: 'RV Services'
   - Description: 'Oil changes, generator service, chassis maintenance, and tire work for Class A, B, C motorhomes and travel trailers. We come to your campsite, storage lot, or driveway.'
   - Starting at: dollar sign 89.95
   - Service list bullets: Synthetic Oil Change, Generator Service, Chassis Lube, Tire Rotation, Brake Inspection, Battery Service, Fluid Top-Off, Filter Replacement
   - Image: use the same van/service image used elsewhere, or any existing Cloudinary image
   - 'Get Quote' button linking to /rv

4. FOOTER — Update the services list:
   Make sure RV Service appears in the footer services column (it may already be there, verify)

5. HERO DESCRIPTION TEXT — Update to mention RV:
   Current: 'Mobile oil changes, tire service, fleet maintenance, and marine engine care.'
   New: 'Mobile oil changes, tire service, fleet maintenance, marine engine care, and RV service.'

Do NOT change the visual design or styling. Surgical text/content additions only. Do NOT touch globals.css or tailwind config.
"

# ─────────────────────────────────────────────────
# TASK 2: Homepage Hero — Sticky Form + Frosted Glass + Logo Position
# ─────────────────────────────────────────────────
run_task 2 "Homepage hero sticky form and frosted glass" "
You are working on ~/coastal-mobile-lube (Next.js, Tailwind, navy design).

Read the homepage component in full. Also check if the white-version branch has a sticky form implementation you can reference:
  git show white-version:src/app/page.tsx 2>/dev/null | head -200
  (or whatever the homepage file path is)

THREE CHANGES to the homepage hero section:

1. STICKY FORM — Make the quote form sticky so it stays visible as the user scrolls down through the hero. The left side content (heading, description, buttons, trust badges) should scroll normally, but the form on the right should stick and stay in view. Use CSS position:sticky with a top offset (e.g. top: 100px to clear the nav). The form should stop being sticky once the hero section ends (this happens naturally with sticky inside a container).

2. FROSTED GLASS FORM — Change the quote form card from its current solid white background to a frosted glass / transparent style:
   - Background: rgba(255, 255, 255, 0.08) or similar semi-transparent
   - backdrop-filter: blur(16px)
   - Border: 1px solid rgba(255, 255, 255, 0.15)
   - Text inside the form: white labels, white placeholder text (with opacity)
   - Input fields: semi-transparent backgrounds (rgba(255, 255, 255, 0.1)), white text, subtle white borders
   - The 'Get My Quote' button stays orange
   - Tab buttons (Automotive/Fleet/Marine): semi-transparent, active tab slightly brighter
   - Make sure all form text is readable against the dark hero background

3. LOGO/BADGE POSITION — The Coastal oval badge watermark in the hero background needs to sit LOWER. Currently it appears too high. Move it down so it sits behind the middle-to-lower portion of the hero content area. If it is positioned with CSS top/transform, adjust accordingly. It should be a subtle background element, not competing with the headline.

Do NOT change any content text (that was done in Task 1). Do NOT touch other sections of the homepage. Do NOT touch globals.css or tailwind config. Surgical CSS/style changes only within the hero section.
"

# ─────────────────────────────────────────────────
# TASK 3: Services Pages — Tabs Instead of Anchor Pills
# ─────────────────────────────────────────────────
run_task 3 "Services pages tabs instead of anchor scroll pills" "
You are working on ~/coastal-mobile-lube (Next.js, Tailwind, navy design).

Read these files in full:
- The automotive services page (src/app/services/page.tsx or similar)
- The marine services page (src/app/marine/page.tsx or similar)

BOTH pages currently have horizontal pill buttons that scroll to anchor sections on the same page. CHANGE THIS to tabbed content that swaps what is displayed:

FOR THE AUTOMOTIVE SERVICES PAGE:
- Keep the same pill/tab bar: Oil Changes | Tires & Wheels | Brakes | Fluid Services | Diesel Services | Maintenance
- Instead of all categories rendering on the page with anchor scroll, only render the ACTIVE tab's content
- Clicking a tab swaps the visible content (React state, no page reload)
- Default active tab: Oil Changes
- Each tab shows its category content exactly as it currently appears (tier cards, service grids, pricing, notes)
- Smooth fade or instant swap (no jarring flash)
- Tab bar should be sticky below the nav when scrolling (position: sticky, top: ~64px or whatever the nav height is)

FOR THE MARINE SERVICES PAGE:
- Same treatment: Oil Service | Fuel & Fluid | Diesel | Maintenance | Trailer & Tire | Brakes
- Only active tab content visible
- Default: Oil Service
- Sticky tab bar

STYLING for tabs (both pages):
- Active tab: bg-[#0F2A44] text-white rounded-full px-5 py-2
- Inactive tab: text-gray-600 hover:text-[#0F2A44] px-5 py-2
- Tab bar container: bg-white border-b border-gray-200, centered, with horizontal scroll on mobile if needed

Do NOT change the content within each category section. Do NOT add or remove any services. Do NOT touch globals.css or tailwind config. Only change the navigation pattern from scroll-to-anchor to tab-swap.
"

# ─────────────────────────────────────────────────
# TASK 4: Booking Page — Search Bar + Marine/RV Booking
# ─────────────────────────────────────────────────
run_task 4 "Booking page search bar and marine/RV booking" "
You are working on ~/coastal-mobile-lube (Next.js, Tailwind, navy design).

Read the booking page in full (src/app/book/page.tsx or src/app/booking/page.tsx).

THREE CHANGES:

1. SERVICE SEARCH BAR — Add a search input at the very top of the service selection area:
   - Placeholder: 'Search for a service (e.g. oil change, tire rotation, brakes...)'
   - As the user types, filter the visible services to only show matches
   - Fuzzy matching: search should match against service name, category name, and description
   - Case insensitive
   - Show results grouped by category still
   - If no matches: show 'No services found for [query]. Try a different search or call 813-722-LUBE.'
   - Clear button (X) on the right side of the search input
   - Search bar styling: full width, rounded-lg, border-gray-300, focus:ring-[#0F2A44], subtle search icon on left

2. DIVISION TABS ON BOOKING — Replace the current 'AUTOMOTIVE SERVICE' header with division tabs:
   - Tabs: Automotive | Marine | RV
   - Fleet is NOT bookable (quote only)
   - When Automotive is selected: show current automotive services
   - When Marine is selected: show marine services from the catalog (grouped by marine categories)
   - When RV is selected: show RV-relevant services (oil changes, generator service, tire work, brake checks, chassis lube, battery service)
   - The 'Most booked' section should update per division
   - Active tab: bg-[#0F2A44] text-white. Inactive: border border-gray-300 text-gray-600
   - Below the tabs, update the subtitle text per division:
     - Automotive: 'Pick a service, choose a date, and we will confirm your appointment within 2 hours.'
     - Marine: 'Select your marine service. We come to your marina, boat ramp, or private dock.'
     - RV: 'Select your RV service. We come to your campsite, storage lot, or driveway.'

3. REMOVE THE FLEET/MARINE REDIRECT NOTICE — Currently there is a line saying 'Looking for fleet or marine service? Get a custom quote on those pages.' REMOVE this line since marine is now bookable directly. Replace with a smaller note: 'Need fleet service? Get a custom fleet quote.' linking to /fleet

The sticky sidebar cart ('Your services' + 'Get My Quote') should work the same for all divisions. The form fields below (date, time, contact info) stay the same.

Do NOT change the form submission logic or the cart/sidebar behavior. Do NOT touch globals.css or tailwind config.
"

# ─────────────────────────────────────────────────
# TASK 5: Service Pages — More Images from White Version
# ─────────────────────────────────────────────────
run_task 5 "Add service images from white version to navy pages" "
You are working on ~/coastal-mobile-lube (Next.js, Tailwind, navy design).

The white version of the site (branch: white-version) has richer service page content with images alongside each service category. The navy version is missing these images.

First, check what images exist in the white version:
  git show white-version:src/app/services/page.tsx 2>/dev/null | grep -i 'img\|image\|src=\|cloudinary' | head -30

Then read the current navy automotive services page and marine services page.

FOR THE AUTOMOTIVE SERVICES PAGE:
- For each major category section (Oil Changes, Tires & Wheels, Brakes, Fluid Services, Diesel, Maintenance), add a service image on the right side of the category header area
- Use existing Cloudinary images from the project. Check:
  - src/data/ for any image registry or constants file
  - Public folder for local images
  - Any Cloudinary URLs already in the codebase (search for 'cloudinary' or 'res.cloudinary.com')
  - The white version branch for image URLs: git show white-version:src/app/services/page.tsx | grep cloudinary
- Layout: category header + description on left (60%), image on right (40%), like the white version does
- Images should be rounded-xl with subtle shadow
- On mobile: image goes full width above the service list, or hidden to save space

FOR THE MARINE SERVICES PAGE:
- Same treatment where images are available
- If no marine-specific images exist, use the van/service photos available

If you cannot find enough distinct images, use the same 3-4 van/service images rotated across sections. The key images available should be:
- Van exterior (driveway service shot)
- Van interior (equipment bay)
- Engine work close-up
- Tire service
Check Cloudinary cloud 'dgcdcqjrz' URLs already in the codebase.

Do NOT change any pricing, service names, or descriptions. Do NOT touch globals.css or tailwind config. Layout and image additions only.
"

# ─────────────────────────────────────────────────
# TASK 6: Fleet Page Visual Weight + RV Page Polish
# ─────────────────────────────────────────────────
run_task 6 "Fleet page visual weight and RV page polish" "
You are working on ~/coastal-mobile-lube (Next.js, Tailwind, navy design).

Read the fleet page and the RV page in full.

FLEET PAGE:
The fleet page feels visually light compared to other pages. Add:
- A hero section with a background image or the same navy gradient as other pages. Use existing van/fleet imagery from Cloudinary or the codebase.
- The hero should have: 'FLEET & COMMERCIAL' eyebrow, 'Keep your fleet moving' headline, a short description, and a 'Get Fleet Quote' CTA button
- The vehicle type cards (Company Cars, Vans & SUVs, Box Trucks) need subtle icons or small images to make them less text-heavy. Use simple SVG icons (vehicle silhouettes) or unicode if no images available.
- Add the trust badges bar (Licensed, ASE-Certified, Warranty, Transparent Pricing) between the services list and the FAQ section, same as it appears on other pages

RV PAGE:
- Make sure the hero section matches the style of other service pages (navy background, proper headline, CTA buttons)
- If the RV page does not have a full service listing like automotive and marine do, add one:
  - Categories: Oil Changes, Generator Service, Chassis & Drivetrain, Tires & Wheels, Brakes, Electrical & Battery
  - Pull relevant services and pricing from the automotive catalog (same prices apply to RVs)
  - Note at the top: 'Class A, B, C motorhomes and travel trailers. We come to your campsite, storage lot, or driveway.'
- Add a 'Book RV Service' CTA that links to /book (the booking page will have an RV tab from Task 4)
- Add the trust badges bar
- Add a short FAQ section with 3-4 RV-specific questions:
  - 'What types of RVs do you service?' - Class A, B, C motorhomes, fifth wheels, travel trailers, toy haulers
  - 'Do you service RV generators?' - Yes, oil changes, filter replacement, and basic maintenance on Onan and other common brands
  - 'Can you come to my campsite?' - Yes, we service RVs at campgrounds, storage facilities, driveways, and anywhere we can safely access your vehicle
  - 'Do you handle RV tires?' - Yes, including mounting, balancing, and rotation for all RV tire sizes

Do NOT touch globals.css or tailwind config. Content and layout additions only.
"

# ─────────────────────────────────────────────────
# TASK 7: Spacing, Icons, and Copy Cleanup Pass
# ─────────────────────────────────────────────────
run_task 7 "Spacing icons and copy cleanup sitewide" "
You are working on ~/coastal-mobile-lube (Next.js, Tailwind, navy design).

Read through ALL public-facing pages and do a final cleanup pass:

1. SPACING FIXES:
   - Ensure consistent section spacing: py-16 or py-20 between major sections on all pages
   - Ensure consistent card spacing: gap-6 or gap-8 in all card grids
   - No sections should feel cramped or have inconsistent padding compared to siblings
   - The hero-to-content transition should be smooth on all pages (no abrupt spacing changes)

2. COPY CLEANUP:
   - No em dashes anywhere (replace with commas, periods, or 'to')
   - No AI-sounding phrases ('leveraging', 'utilize', 'comprehensive suite', 'cutting-edge', 'seamless')
   - Check all pricing is consistent: oil change starting at dollar sign 89.95
   - Hours everywhere: Mon-Fri 8 AM to 5 PM, Sat-Sun Closed
   - Phone everywhere: 813-722-LUBE
   - Location references: Apollo Beach, FL and the South Shore / Tampa Bay area

3. ICON CONSISTENCY:
   - Trust badges section: make sure all 4 badges have consistent icon styling (same size, same color, same weight)
   - How It Works section: make sure step icons are consistent
   - If any section has placeholder text like 'icon' or missing icons, add simple SVG icons or use text alternatives

4. MOBILE CHECK:
   - Make sure the sticky tab bars on services pages have horizontal scroll on mobile (overflow-x-auto)
   - Make sure the booking page search bar and division tabs stack properly on mobile
   - Make sure the hero frosted glass form stacks below the content on mobile (not sticky on mobile)

5. FOOTER:
   - Verify all links work (Automotive, Fleet, Marine, RV, About, Service Areas, FAQ, Contact, Book Service)
   - The small logo in the footer should render properly
   - Copyright year should be 2026

Do NOT rewrite entire files. Surgical fixes throughout. Do NOT touch globals.css or tailwind config. Do NOT change the admin pages.
"

# ─────────────────────────────────────────────────
# TASK 8: Build, Deploy, Verify
# ─────────────────────────────────────────────────
run_task 8 "Build and deploy" "
You are working on ~/coastal-mobile-lube.

1. git checkout main
2. npm run build
3. If build fails, fix errors with minimal changes. Common issues:
   - Missing imports for new components
   - TypeScript type errors
   - Unused variables
4. Re-run npm run build until it passes.
5. Once passing:
   git add -A && git commit -m 'frontend-polish-v2: nav, hero, tabs, booking, images, RV, cleanup'
   git push origin main
   
   Check build output dir (.next or out):
   npx netlify-cli deploy --prod --dir=[CORRECT_DIR] --message='Frontend Polish V2 complete'
   npx netlify-cli deploy --alias navy-preview --dir=[CORRECT_DIR] --message='Frontend Polish V2 staging'

6. Verify:
   curl -s -o /dev/null -w '%{http_code}' https://coastal-mobile-lube.netlify.app && echo ' prod'
   curl -s -o /dev/null -w '%{http_code}' https://navy-preview--coastal-mobile-lube.netlify.app && echo ' staging'

7. Sync navy-redesign:
   git checkout navy-redesign && git merge main && git push origin navy-redesign && git checkout main
"

echo "" >> "$LOG_FILE"
echo "## Pipeline Complete" >> "$LOG_FILE"
echo "Finished: $(date)" >> "$LOG_FILE"
echo "Production: https://coastal-mobile-lube.netlify.app" >> "$LOG_FILE"
echo "Staging: https://navy-preview--coastal-mobile-lube.netlify.app" >> "$LOG_FILE"

echo ""
echo "══════════════════════════════════════════════"
echo "  FRONTEND POLISH V2 PIPELINE COMPLETE"
echo "  Log: $LOG_FILE"
echo "  Task logs: $LOG_DIR/"
echo "══════════════════════════════════════════════"
