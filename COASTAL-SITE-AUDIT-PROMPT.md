# SITE AUDIT: Full Codebase Analysis

Do NOT make any changes. This is a READ-ONLY audit. Generate a comprehensive markdown report and save it to ~/coastal-mobile-lube/SITE-AUDIT-2026-03-24.md

## Step 1: Directory Structure
Run `find src -type f -name "*.tsx" -o -name "*.ts" -o -name "*.css" | sort` and include the full output.

## Step 2: For EVERY page file (every file in src/app/*/page.tsx and src/app/page.tsx), document:
- **Route** (the URL path)
- **Page title** (from metadata or head)
- **Total lines of code**
- **Sections** (list every visual section from top to bottom — what's in it, what background color it uses)
- **CTAs** (every button/link — what text, where it links to, what style)
- **Forms** (any form elements — what fields, where does it submit to, what happens on success)
- **Images** (any Cloudinary or other image URLs — list them)
- **Data connections** (any Firebase/Firestore reads or writes — what collection, what fields)

## Step 3: Shared Components Analysis
For every file in src/components/ (or wherever shared components live):
- **Component name**
- **What it does**
- **Which pages use it** (search for imports across all page files)
- **Key props it accepts**

## Step 4: Navigation & Routing Map
- List every internal link on every page (what text, where it points)
- Flag any broken links (links pointing to routes that don't have real content — just placeholder text)
- Flag any orphan pages (pages that exist but aren't linked from anywhere)
- Document the header nav links and mobile menu links
- Document the footer links
- Document the mobile sticky bottom bar links

## Step 5: CTA Flow Analysis
Map every "conversion path" through the site:
- Where can a user book automotive service? (list every entry point)
- Where can a user request a fleet quote? (list every entry point)
- Where can a user request a marine quote? (list every entry point)
- Where does the "Book Now" header button go?
- Where does the "Book Online" text/button go on each page?
- Where does "Get a Quote" / "Get My Quote" go?
- Is there any inconsistency in CTA text vs destination?

## Step 6: Design Consistency Check
- List all background colors used across sections (hex values)
- List all border-radius values used on cards/containers
- List all font sizes used for headings, body, labels
- Flag any inconsistencies (different cards using different border-radius, different pages using different heading sizes, etc.)

## Step 7: Firebase/Firestore Analysis
- Read src/lib/firebase.ts (or wherever the config is)
- List every Firestore collection the app reads from or writes to
- Document the data schema for each collection (what fields get written)
- Note any security rules concerns (test mode, open rules, etc.)

## Step 8: Cloudinary Helper Analysis
- Read the cloudinary helper file (src/lib/cloudinary.ts or similar)
- Document what default transforms are applied
- List every image being used and on which page
- Note quality settings (q_auto vs q_auto:good, width params)

## Step 9: Known Issues
Based on your analysis, list anything that looks wrong:
- Broken or dead links
- Placeholder content still showing
- Inconsistent styling
- Missing pages referenced in nav
- CTA confusion (buttons that say different things but go to the same place, or same thing but go different places)
- Mobile sticky bar behavior
- Any hardcoded values that should be dynamic

## Output
Save the complete report to ~/coastal-mobile-lube/SITE-AUDIT-2026-03-24.md

Then run: `wc -l ~/coastal-mobile-lube/SITE-AUDIT-2026-03-24.md` and tell me the line count.

Do NOT commit, deploy, or change any code. Read only.
