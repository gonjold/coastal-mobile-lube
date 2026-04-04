#!/bin/bash
# coastal-final-polish.sh
# Final visual + copy polish pass based on COASTAL-FINAL-POLISH-SPEC.md
# Run AFTER backend and frontend pipelines complete
# tmux new -s final-polish && bash ~/coastal-mobile-lube/coastal-final-polish.sh

set -e
cd ~/coastal-mobile-lube
git checkout navy-redesign
git stash 2>/dev/null || true

# Pull any changes from the other pipelines
git pull origin navy-redesign 2>/dev/null || true

LOG=~/coastal-mobile-lube/FINAL-POLISH-LOG.md
echo "# Final Polish Pipeline" > $LOG
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
  
  if claude --dangerously-skip-permissions -p "$PROMPT" 2>&1 | tee /tmp/final-task-$TASK_NUM.log; then
    echo "Status: COMPLETED" >> $LOG
  else
    echo "Status: FAILED (exit code $?)" >> $LOG
  fi
  
  echo "Finished: $(date)" >> $LOG
  echo "---" >> $LOG
  sleep 3
}

# ============================================================
# TASK P1: Kill ALL Gradient Transitions and Atmospheric Effects
# ============================================================
run_task P1 "Remove All Gradient Transitions" \
'Search the ENTIRE src/ directory for gradient transition elements and atmospheric effects. Remove ALL of them.

Specifically find and DELETE:
1. Any <div> whose only purpose is a gradient spacer between sections. These look like:
   - style={{ background: "linear-gradient(to bottom, #0F2847..." }} with a fixed height
   - style={{ background: "linear-gradient(to bottom, #FAFBFC 0%, #0F2847..." }}
   - Any div with just a gradient background and a height like 40px, 60px, 80px
   Delete the entire element.

2. Any atmospheric glow overlays:
   - style={{ background: "radial-gradient(ellipse..." }} with pointer-events-none
   Delete the entire element.

3. Any grid texture overlays:
   - backgroundImage containing "linear-gradient(rgba(255,255,255,0.1) 1px..."
   - Any element with opacity-[0.03] that is a visual texture
   Delete the entire element.

4. Any "bottom gradient fade" or "top gradient fade" divs:
   - Comments like {/* Bottom gradient fade */} or {/* Navy-to-light transition */}
   Delete the element AND the comment.

Files to check (read each one):
- src/app/page.tsx
- src/app/about/page.tsx
- src/app/services/ServicesContent.tsx
- src/app/fleet/FleetContent.tsx
- src/app/marine/MarineContent.tsx (or page.tsx)
- src/app/rv/RVContent.tsx
- src/app/faq/FAQContent.tsx (or page.tsx)
- src/app/service-areas/page.tsx
- src/app/book/BookingForm.tsx (or page.tsx)
- src/app/contact/page.tsx

Do NOT remove navy backgrounds on hero sections, stats bars, or CTA sections. Only remove TRANSITION elements between sections.

npm run build && git add -A && git commit -m "[P1] Remove all gradient transitions and atmospheric effects sitewide"'

# ============================================================
# TASK P2: Lighten Content Sections
# ============================================================
run_task P2 "Lighten Content Sections" \
'Read every page file in src/app/. For each page, identify sections between the hero and footer that have navy/dark backgrounds (bg-[#0B2040], bg-[#0F2847], bg-[#132E54], or similar dark navy hex).

THE RULE: Maximum 2-3 navy sections per page. These are allowed:
- Hero section (top of page): KEEP navy
- Stats bar (if present): KEEP navy
- Final CTA section (bottom, before footer): KEEP navy
- Footer: KEEP navy (this is a shared component)

EVERYTHING ELSE should be light. Change navy content sections to:
- White: #FFFFFF or bg-white
- Light gray: #F7F8FA
- Warm sand: #FAF7F2

When changing a section from navy to light:
- Change text-white to text-[#0B2040] (headings) or text-[#444] (body)
- Change text-white/70 to text-[#666]
- Change any white/transparent card backgrounds to solid white with border
- Keep orange (#E07B2D) for prices and CTAs

Specific sections to change from navy to light:
- Fleet "Why Fleets Choose Us" section -> light gray bg, dark text
- RV "Why RV owners choose us" section -> light gray bg, dark text
- About "Three Verticals" section -> light gray bg, dark text (or keep navy if it is the only accent section on the page)
- Any service page content section that is navy -> white or light gray

Also change any section using inline style gradients like:
  style={{ background: "linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 50%, #FAFBFC 100%)" }}
to simple className backgrounds like:
  className="bg-[#FAFBFC]" or className="bg-white"

npm run build && git add -A && git commit -m "[P2] Lighten content sections - navy is accent only, content is bright"'

# ============================================================
# TASK P3: Homepage Hero - Bigger Badge + Clean Widget
# ============================================================
run_task P3 "Homepage Hero Polish" \
'Read src/app/page.tsx in full, focusing on the hero section.

Three changes:

1. OVAL BADGE WATERMARK: Find the oval badge image in the hero. Make it MUCH bigger:
   - Width: 600-700px (or 50-60vw)
   - Position: absolute, centered horizontally, top edge starting right below the header (top: 0 or top: -20px)
   - Opacity: 0.06 to 0.08
   - z-index: behind the hero content (z-0 or z-[1])
   - The badge should be unmistakable but not competing with text
   - If the badge is currently positioned midway or at the bottom, move it UP

2. QUOTE WIDGET: The quote widget container on the right side should be:
   - Background: white or very slightly translucent (bg-white or bg-white/95)
   - Add a subtle shadow: shadow-xl or shadow-[0_4px_20px_rgba(0,0,0,0.15)]
   - Border-radius: 16px
   - Remove any backdrop-blur or frosted glass effect on the widget container itself
   - This makes the widget POP against the navy hero
   - Do NOT change the form fields or functionality inside the widget

3. HERO BACKGROUND: Keep it navy but simplify. Just a solid gradient:
   - background: linear-gradient(180deg, #0A1628 0%, #0B2040 50%, #0F2847 100%)
   - Remove any radial-gradient glows or grid textures that were added
   - The badge watermark provides all the visual interest needed

Do NOT change any form functionality. The quote widget must still write to Firestore.

npm run build && git add -A && git commit -m "[P3] Homepage hero - massive badge watermark, clean white quote widget"'

# ============================================================
# TASK P4: About Page - Our Story Copy
# ============================================================
run_task P4 "About Page - Our Story Copy Replacement" \
'Read src/app/about/page.tsx in full.

Replace the current story content with this EXACT copy. Keep the existing page structure (hero, story section, value props, verticals, CTA) but swap the text:

HERO:
- Eyebrow: OUR STORY
- Heading: Dealership expertise, delivered to your door
- Subtext: 30 years of fixed operations experience. Now mobile in Apollo Beach and the South Shore.

STORY SECTION (replace whatever is there with these paragraphs):

Paragraph 1:
At Coastal Mobile Lube and Tire, we built this business to serve our local community with honesty, convenience, and dependable service. Living in Apollo Beach and working in Tampa, we recognized the need for a better way to help customers maintain their vehicles and equipment without sitting in traffic or waiting at a repair shop. Life is busy, and people deserve service that is professional, reliable, and built around their schedule. That is why Coastal Mobile Lube and Tire was created.

Paragraph 2:
With a background in automotive dealerships and fixed operations, our company is built on 30 years of experience in luxury customer service, operational excellence, and white-glove care. That experience shaped our commitment to doing things the right way, communicating clearly, and delivering service our customers can trust. We use a vacuum oil extraction system that pulls the oil out through the dipstick tube instead of removing the drain plug and crawling under the vehicle. It is cleaner, faster, and leaves no mess on your driveway. No drips, no spills.

Paragraph 3:
Coastal Mobile Lube and Tire is built on faith-based values that matter: integrity, honesty, hard work, kindness, and service to others. These principles are at the heart of how we operate, how we treat our customers, and how we serve our community. We are proud to serve the people who live, work, and enjoy life throughout the Apollo Beach and South Shore area. Whether it is your personal vehicle, boat, work truck, RV, trailer, fleet vehicle, or recreational equipment, our goal is to bring high-quality mobile lube, tire, and maintenance services directly to you with professionalism and a personal touch.

Final line (can be styled as a pullquote or standalone):
We are more than a mobile service company. We are a local business built on experience, strong values, and a commitment to serving our community the right way.

VALUE PROPS (update text if different from these):
1. White-Glove Service: Every customer gets the same luxury experience you would expect at a top dealership. We show up on time, treat your property with respect, and leave the work area cleaner than we found it.
2. Integrity First: We quote honestly, work transparently, and never upsell services you do not need. If it is not broken, we will tell you.
3. 30 Years of Know-How: Three decades managing dealership service departments means we have seen it all. That experience shows up in every oil change, every tire rotation, every marine service call.
4. Faith-Driven Values: Honesty, hard work, kindness, and service to others. Those are not just words on a wall. They guide every decision we make and every customer interaction we have.

Also make sure the About page follows the light design direction:
- Story section: WHITE background, dark text
- Value props: light gray (#F7F8FA) background
- Remove any gradient transitions

npm run build && git add -A && git commit -m "[P4] About page - Jason Our Story copy blend, light design"'

# ============================================================
# TASK P5: Card Styling Cleanup
# ============================================================
run_task P5 "Clean Card Styling Everywhere" \
'Search all files in src/app/ and src/components/ for card elements. Standardize them:

Cards on LIGHT backgrounds should be:
- bg-white (solid, not transparent)
- border: 1px solid #E8E8E8
- border-radius: 12px
- shadow: 0 1px 3px rgba(0,0,0,0.06)
- No backdrop-blur
- No bg-white/60 or bg-white/80 transparency

Remove these patterns from cards on light backgrounds:
- backdrop-blur-sm, backdrop-blur-xl, backdrop-blur-[10px]
- bg-white/60, bg-white/80, bg-white/[0.08]
- border-white/[0.12] or border-white/20
- Any glassmorphism/frosted glass effect

EXCEPTION: The homepage quote widget on the navy hero CAN keep bg-white/95 with a shadow. That is the ONLY place transparency is OK.

Cards on NAVY backgrounds (stats bar, CTA sections) can use:
- bg-white/[0.06] or bg-white/[0.08] for subtle navy cards
- These are fine because they are on intentionally dark sections

npm run build && git add -A && git commit -m "[P5] Clean card styling - solid white cards, no frosted glass on light sections"'

# ============================================================
# TASK P6: Global Copy QA Pass
# ============================================================
run_task P6 "Global Copy QA" \
'Read every page file and check for these issues. Fix all of them:

1. EM DASHES: Search for &mdash; and the literal character. Replace with commas, periods, colons, or rewrite the sentence. Use: grep -rn "mdash\|—" src/

2. AI TELLS: Search for and replace these phrases:
   - "hassle-free" -> "convenient" or rewrite
   - "seamless" -> remove or rewrite
   - "unlock" -> remove or rewrite
   - "delve" -> remove
   - "dive in" -> remove or rewrite
   - "explore our" -> "see our" or "view our"
   - "elevate" -> remove or rewrite
   - "leverage" -> "use"
   - "streamline" -> remove or rewrite

3. PRICING: Verify these are correct everywhere they appear:
   - Synthetic blend oil change: $89.95
   - Full synthetic: $119.95
   - Diesel: $219.95
   - Marine starting at: $149.95 (on homepage marine tab)
   - Tire rotation: $39.95
   - Front + rear brakes: $320

4. HOURS: Must be "Mon-Fri 8AM-5PM" or "Monday through Friday, 8AM to 5PM" everywhere. Search for any "7AM", "6PM", "7-6" references.

5. LOCATION: "Apollo Beach" and "South Shore" for the business location. "Tampa" is OK when referring to the broader metro area for SEO. Search for "Tampa Bay" and remove "Bay".

6. PHONE: 813-722-LUBE should appear on every page. Check header (shared component), footer (shared), and at least one place in page content.

7. CONTRACTIONS: Jason uses formal style. Check for "We'\''ll" -> "We will", "It'\''s" -> "It is", "Don'\''t" -> "Do not" in body copy. OK to keep contractions in casual CTA text.

npm run build && git add -A && git commit -m "[P6] Global copy QA - no em dashes, no AI tells, correct pricing and hours everywhere"'

# ============================================================
# TASK P7: FAQ Section Gap Fix + Final Visual QA
# ============================================================
run_task P7 "FAQ Fix + Final Visual QA" \
'Two things:

1. Read src/app/faq/FAQContent.tsx (or wherever the FAQ content lives). There is a large visual gap between the service-related FAQ questions and the general questions (payment, hours, licensing, etc). Remove this gap. All FAQ items should be in one continuous list with consistent spacing.

2. Do a final visual consistency check across ALL pages:
   - Every page hero should be navy with consistent padding
   - Every content section should be white or light gray (not navy)
   - Stats bars and final CTAs can be navy
   - All cards should be solid white with borders (not frosted glass)
   - No gradient transition divs remaining anywhere
   - Trust bar consistent across pages
   - Footer consistent across pages
   - Header consistent across pages
   - Orange used for prices and CTAs everywhere (not gold, not teal for prices)

3. Check that npm run build passes with zero errors.

4. Check for any remaining console.log statements: grep -rn "console.log" src/ | grep -v node_modules

npm run build && git add -A && git commit -m "[P7] FAQ gap fix + final visual consistency pass"'

# ============================================================
# DEPLOY
# ============================================================
echo "## Deploy" >> $LOG
echo "Started: $(date)" >> $LOG

# Pull any changes from other pipelines before pushing
git pull origin navy-redesign --rebase 2>&1 | tail -5 >> $LOG || true

git push origin navy-redesign 2>&1 | tail -5 >> $LOG
npx netlify-cli deploy --alias navy-preview 2>&1 | tail -10 >> $LOG
echo "---" >> $LOG
echo "## Pipeline Complete" >> $LOG
echo "Finished: $(date)" >> $LOG
echo "" >> $LOG
echo "Navy preview: https://navy-preview--coastal-mobile-lube.netlify.app" >> $LOG
echo "Review the site and compare against COASTAL-FINAL-POLISH-SPEC.md" >> $LOG
