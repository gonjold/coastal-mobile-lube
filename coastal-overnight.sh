#!/bin/bash
# coastal-overnight.sh
# Autonomous overnight build pipeline for Coastal Mobile Lube & Tire
# Each task gets a fresh Claude Code context window
# Run inside tmux: tmux new -s coastal-overnight && bash ~/coastal-mobile-lube/coastal-overnight.sh

set -e
cd ~/coastal-mobile-lube

LOG=~/coastal-mobile-lube/OVERNIGHT-LOG.md
SPEC=~/coastal-mobile-lube/COASTAL-MASTER-SPEC.md

echo "# Coastal Overnight Pipeline Log" > $LOG
echo "Started: $(date)" >> $LOG
echo "---" >> $LOG

run_task() {
  local TASK_NUM=$1
  local TASK_NAME=$2
  local PROMPT=$3
  
  echo "" >> $LOG
  echo "## Task $TASK_NUM: $TASK_NAME" >> $LOG
  echo "Started: $(date)" >> $LOG
  
  # Run CC with fresh context, capture exit code
  if claude --dangerously-skip-permissions -p "$PROMPT" 2>&1 | tee /tmp/coastal-task-$TASK_NUM.log; then
    echo "Status: COMPLETED" >> $LOG
  else
    echo "Status: FAILED (exit code $?)" >> $LOG
  fi
  
  # Log the build check
  if npm run build 2>&1 | tail -5 | grep -q "error"; then
    echo "Build: FAILED" >> $LOG
  else
    echo "Build: PASSED" >> $LOG
  fi
  
  echo "Finished: $(date)" >> $LOG
  echo "---" >> $LOG
  
  # Brief pause between tasks
  sleep 3
}

# Pre-flight checks
echo "## Pre-Flight Checks" >> $LOG
echo "Git status:" >> $LOG
git status --short >> $LOG 2>&1
echo "" >> $LOG
echo "Last 5 commits:" >> $LOG
git log --oneline -5 >> $LOG 2>&1
echo "---" >> $LOG

# Commit any uncommitted changes first
if [ -n "$(git status --porcelain)" ]; then
  echo "Uncommitted changes found — committing first" >> $LOG
  git add -A && git commit -m "Pre-overnight: commit uncommitted changes from previous session" && git push origin main
  echo "Committed and pushed." >> $LOG
fi

# TIER 1: Real Content

run_task 1 "Swap Real Automotive Pricing" \
"Read the file COASTAL-MASTER-SPEC.md in this directory. Execute ONLY Task 1: Swap Real Automotive Pricing.

Read src/app/services/ServicesContent.tsx in full first. Replace ALL placeholder prices with Jason's real pricing from Section 6 of the spec. Use 'Starting at \$XX.XX' format. Oil change is \$89.95 not \$89. Also check src/app/page.tsx for any pricing references on the homepage services tab and update those too.

Do NOT rewrite the entire file. Surgical edits to pricing values only. Run npm run build when done. Then: git add -A && git commit -m '[Task 1] Swap real automotive pricing from Jason spreadsheet'"

run_task 2 "Swap Real Marine Pricing" \
"Read the file COASTAL-MASTER-SPEC.md in this directory. Execute ONLY Task 2: Swap Real Marine Pricing.

Read src/app/marine/page.tsx in full first. Replace placeholder package pricing with real marine pricing from Section 6 of the spec. Restructure into: outboard services, inboard services, diesel marine, add-ons. Include travel charge \$49.95 and twin surcharge +\$75.

Do NOT rewrite the entire file. Surgical edits only. Run npm run build when done. Then: git add -A && git commit -m '[Task 2] Swap real marine pricing from Jason spreadsheet'"

run_task 3 "Update About Page with Real Content" \
"Read the file COASTAL-MASTER-SPEC.md in this directory. Execute ONLY Task 3: Update About Page with Real Content.

Read src/app/about/page.tsx in full first. Replace placeholder story with Jason's real content from Section 7 of the spec. Apollo Beach, 30 years fixed ops, faith-based values, white-glove service. Write in warm human tone. No em dashes, no emojis, no AI tells. Keep the van wrap photo that was added April 3.

Do NOT rewrite the entire file. Surgical edits to content only. Run npm run build when done. Then: git add -A && git commit -m '[Task 3] About page real content from Jason'"

run_task 4 "Fix Business Hours Sitewide" \
"Read the file COASTAL-MASTER-SPEC.md in this directory. Execute ONLY Task 4: Update Business Hours Everywhere.

Search the ENTIRE codebase (grep -r) for any references to '7AM' or '7 AM' or '7:00' or '6PM' or '6 PM' or '7-6' or '7am' and replace ALL with the correct hours: Mon-Fri 8AM-5PM, Sat-Sun Closed. Check Footer.tsx, contact/page.tsx, BookingForm.tsx, and any other files.

Surgical edits only. Run npm run build when done. Then: git add -A && git commit -m '[Task 4] Fix business hours sitewide to Mon-Fri 8-5'"

run_task 5 "Fix Pricing on Booking Page" \
"Read the file COASTAL-MASTER-SPEC.md in this directory. Execute ONLY Task 5: Fix Pricing on Booking Page.

Read src/app/book/BookingForm.tsx in full first. Update all service names and prices to match Jason's real pricing from Section 6 of the spec. Synthetic Blend Oil Change \$89.95, Full Synthetic \$119.95, Diesel \$219.95, etc. Ensure service names match the /services page.

Do NOT rewrite the entire file. Surgical edits to pricing only. Run npm run build when done. Then: git add -A && git commit -m '[Task 5] Booking page pricing matches Jason real numbers'"

# Deploy Tier 1
echo "## Tier 1 Deploy" >> $LOG
echo "Started: $(date)" >> $LOG
git push origin main 2>&1 | tail -5 >> $LOG
npx netlify-cli deploy --prod --skip-functions-cache 2>&1 | tail -10 >> $LOG
echo "Tier 1 deployed: $(date)" >> $LOG
echo "---" >> $LOG

# TIER 1B: Visual Redesign

run_task 16 "Homepage Visual Redesign" \
"Read the file COASTAL-MASTER-SPEC.md in this directory. Execute ONLY Task 16: Homepage Visual Redesign.

Read src/app/page.tsx in full first. The current site has navy bolted onto a white-bg design and looks flat and disconnected. Rebuild the visual layer to feel like the van wrap came to life:

1. Hero: atmospheric navy gradient with depth, oval badge as subtle watermark, frosted glass or translucent card for the quote widget
2. Section transitions: gradient fades between navy and lighter sections, never hard color cuts
3. Services tabs: cards with subtle shadows, clean pricing display
4. How It Works: visually engaging, not generic circles
5. Stats bar: bold metrics that fit the dark-to-light flow
6. Reviews: warm sand or cream background, polished cards
7. Trust bar: integrated into the page flow naturally
8. Final CTA: compelling close

Use the color palette from the spec. Add depth with CSS gradients, opacity layers, subtle shadows. Do NOT break any form functionality — the quote widget must still write to Firestore. Do NOT touch globals.css or tailwind config.

Run npm run build when done. Then: git add -A && git commit -m '[Task 16] Homepage visual redesign - atmospheric navy, depth, texture'"

run_task 17 "Service Pages Visual Polish" \
"Read the file COASTAL-MASTER-SPEC.md in this directory. Execute ONLY Task 17: Service Pages Visual Polish.

Read src/app/services/ServicesContent.tsx, src/app/fleet/FleetContent.tsx, and src/app/marine/page.tsx in full. Apply the same atmospheric visual treatment from the homepage: gradient backgrounds, depth, shadows, smooth transitions. Make them feel like they belong to the same site as the redesigned homepage.

Do NOT break any form functionality — fleet and marine inline quote forms must still write to Firestore. Surgical visual changes only. Run npm run build when done. Then: git add -A && git commit -m '[Task 17] Service pages visual polish matching homepage redesign'"

run_task 18 "About Page Visual Polish" \
"Read the file COASTAL-MASTER-SPEC.md in this directory. Execute ONLY Task 18: About Page Visual Polish.

Read src/app/about/page.tsx in full. Apply the same visual treatment: atmospheric backgrounds, depth, premium feel. Jason's story should feel personal and polished. Van wrap photo should be showcased prominently. Value props should have depth and texture.

Surgical visual changes only. Run npm run build when done. Then: git add -A && git commit -m '[Task 18] About page visual polish'"

# Deploy Tier 1B
echo "## Tier 1B Deploy" >> $LOG
echo "Started: $(date)" >> $LOG
git push origin main 2>&1 | tail -5 >> $LOG
npx netlify-cli deploy --prod --skip-functions-cache 2>&1 | tail -10 >> $LOG
echo "Tier 1B deployed: $(date)" >> $LOG
echo "---" >> $LOG

# TIER 2: SEO

run_task 6 "SEO Infrastructure" \
"Read the file COASTAL-MASTER-SPEC.md in this directory. Execute ONLY Task 6: Build Sitemap, Robots.txt, and Meta Tags.

Create sitemap.xml (public routes: /, /services, /fleet, /marine, /about, /book, /contact, /faq, /service-areas, /rv). Create robots.txt (allow all, block /admin, point to sitemap). Add Open Graph meta tags to layout.tsx or individual pages. Add JSON-LD structured data: Organization + LocalBusiness (Apollo Beach FL) + Service schemas.

Run npm run build when done. Then: git add -A && git commit -m '[Task 6] SEO infrastructure - sitemap, robots, OG tags, schema markup'"

run_task 7 "Service Area Pages" \
"Read the file COASTAL-MASTER-SPEC.md in this directory. Execute ONLY Task 7: Build Service Area Pages.

Read src/app/service-areas/page.tsx first. Build a hub page listing 12 service areas: Balm, Ruskin, Ellenton, Palmetto, Fish Hawk, Gibsonton, Riverview, Apollo Beach, Parrish, Wimauma, Sun City, Sun City Center. Each area gets a card with unique 2-3 sentence description mentioning the area name, and a CTA linking to /book. Clean card grid, alternating white/sand sections. Add /service-areas to Footer.tsx navigation.

Run npm run build when done. Then: git add -A && git commit -m '[Task 7] Service area pages - 12 areas for local SEO'"

run_task 8 "FAQ Page" \
"Read the file COASTAL-MASTER-SPEC.md in this directory. Execute ONLY Task 8: Build FAQ Page.

Read src/app/faq/page.tsx first. Build full FAQ with 13 questions from the spec. Accordion-style with navy headings and clean cards. Add FAQ schema markup (JSON-LD FAQPage). Add /faq to Footer.tsx navigation. CTA at bottom: Still have questions? Call 813-722-LUBE.

Follow all copy rules: no em dashes, no emojis, human tone. Run npm run build when done. Then: git add -A && git commit -m '[Task 8] Full FAQ page with accordion and schema markup'"

# Deploy Tier 2
echo "## Tier 2 Deploy" >> $LOG
echo "Started: $(date)" >> $LOG
git push origin main 2>&1 | tail -5 >> $LOG
npx netlify-cli deploy --prod --skip-functions-cache 2>&1 | tail -10 >> $LOG
echo "Tier 2 deployed: $(date)" >> $LOG
echo "---" >> $LOG

# TIER 3: Features

run_task 9 "CSV Export in Admin" \
"Read the file COASTAL-MASTER-SPEC.md in this directory. Execute ONLY Task 9: CSV/Excel Export in Admin.

Read the admin page source. Add an Export button to the admin header. Client-side CSV generation for bookings (Date, Customer, Phone, Email, Service, Source, Status, Notes, Created) and customers (Name, Phone, Email, Total Bookings, Last Booking). Style as secondary button.

Run npm run build when done. Then: git add -A && git commit -m '[Task 9] CSV export for bookings and customers in admin'"

run_task 10 "Add Customer Manually" \
"Read the file COASTAL-MASTER-SPEC.md in this directory. Execute ONLY Task 10: Add Customer Manually in Admin.

Read the admin page source. Add a New Customer button in the Customers tab. Modal form with Name, Phone, Email, Notes. Writes to Firestore. Should appear in list immediately via real-time listener.

Run npm run build when done. Then: git add -A && git commit -m '[Task 10] Manual customer entry in admin'"

run_task 11 "RV Marketing Page" \
"Read the file COASTAL-MASTER-SPEC.md in this directory. Execute ONLY Task 11: Build RV Marketing Page.

Create src/app/rv/page.tsx. Target: RV owners and RV park communities. Same auto/diesel services apply. Pricing from spec Section 6 (synthetic blend \$89.95, diesel \$219.95, etc.). Unique angle: we come to your RV park, campsite, or storage lot. Include service area (Apollo Beach and South Shore). Add inline quote form that writes to Firestore with source: rv-page. Add /rv to Footer.tsx. Match the visual design of other service pages.

Run npm run build when done. Then: git add -A && git commit -m '[Task 11] RV marketing page with quote form'"

run_task 12 "Copy Polish Pass" \
"Read the file COASTAL-MASTER-SPEC.md in this directory. Execute ONLY Task 12: Copy Polish Pass.

Review ALL page files for: AI-sounding phrases (replace with natural language), inconsistent pricing (must match Jason's real numbers), missing phone number (813-722-LUBE should be prominent), any Tampa references where it should say Apollo Beach or South Shore, generic filler, em dashes (replace), emojis (remove), old hours (must be Mon-Fri 8AM-5PM).

Text content only — do NOT change layout or structure. Run npm run build when done. Then: git add -A && git commit -m '[Task 12] Copy polish pass - human tone, correct pricing, hours, locations'"

# Final deploy
echo "## Final Deploy" >> $LOG
echo "Started: $(date)" >> $LOG
git push origin main 2>&1 | tail -5 >> $LOG
npx netlify-cli deploy --prod --skip-functions-cache 2>&1 | tail -10 >> $LOG
echo "---" >> $LOG
echo "## Pipeline Complete" >> $LOG
echo "Finished: $(date)" >> $LOG
echo "" >> $LOG
echo "Check results at: https://coastal-mobile-lube.netlify.app" >> $LOG
echo "Check git log: git log --oneline -20" >> $LOG
