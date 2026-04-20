# WO-ADMIN-20: Polish Pass — How It Works + Services Overview

## Context

Visual polish pass for the two pages built in WO-19. Fixes navy-on-navy bug, upgrades illustrations from flat icons to layered SVG scenes, improves typography hierarchy, and adds depth/atmosphere to hero and CTA sections.

**Two reference TSX files have been SCP'd to the Mac Mini:**
- `~/coastal-mobile-lube/how-it-works-page-new.tsx`
- `~/coastal-mobile-lube/services-overview-page-new.tsx`

These are complete, self-contained Next.js page files. The WO is to replace the existing page files with these, rebuild, and deploy.

**Execution rules:**
- Do NOT touch the nav component, the dropdown component, the footer, or any other file besides the two pages below
- Do NOT touch globals.css or tailwind.config.js
- Do NOT modify the reference TSX files — copy them as-is

---

## STEP 1: Replace the How It Works page

```bash
cp ~/coastal-mobile-lube/how-it-works-page-new.tsx ~/coastal-mobile-lube/src/app/how-it-works/page.tsx
```

Verify the copy succeeded:
```bash
head -5 ~/coastal-mobile-lube/src/app/how-it-works/page.tsx
```
Should show the import statements from the new file.

---

## STEP 2: Replace the Services Overview page

```bash
cp ~/coastal-mobile-lube/services-overview-page-new.tsx ~/coastal-mobile-lube/src/app/services-overview/page.tsx
```

Verify:
```bash
head -5 ~/coastal-mobile-lube/src/app/services-overview/page.tsx
```

---

## STEP 3: Check and remove unused icon component

The old icon component from WO-19 is no longer used (the new pages use inline SVG scenes instead).

Check if anything still imports from it:
```bash
cd ~/coastal-mobile-lube
grep -r "HowItWorksIcons" src/ --include="*.tsx" --include="*.ts"
```

- **If the only result is the file itself** (`src/components/icons/HowItWorksIcons.tsx`), delete it:
  ```bash
  rm src/components/icons/HowItWorksIcons.tsx
  ```
- **If any OTHER file imports it**, leave the file alone. Report back what file imports it.

---

## STEP 4: Build

```bash
cd ~/coastal-mobile-lube
npm run build
```

**If the build fails:**
- Read the exact error
- If it is a TypeScript or JSX syntax error in either of the two new pages, DO NOT edit the file blindly. Report the error and file/line to the user.
- If it is an unrelated error (missing import from an unrelated file, etc.), attempt a minimal fix only.

**Do not deploy a failing build.**

---

## STEP 5: Deploy

```bash
npx netlify-cli deploy --prod
```

Confirm the deploy URL returns 200.

---

## STEP 6: Commit and push

```bash
git add src/
git commit -m "Polish pass: How It Works and Services Overview pages with layered SVG scenes"
git push origin main
```

**No `--dir` flag on netlify-cli deploy.**
**No `git add -A`.**

---

## SUCCESS CRITERIA

1. `/how-it-works` loads with:
   - WHITE headline text in all navy sections (bug fixed)
   - Orange accent on "That is it." in the hero
   - Horizontal orange rules flanking the "How It Works" label
   - Subtle dot grid and diagonal line patterns visible in hero
   - Phone mockup illustration in Step 1 with floating calendar/checkmark/60 SEC badges
   - Full van scene in Step 2 with house, road, location pin
   - Car scene in Step 3 with invoice card, warranty badge, 5 stars
   - Trust band has orange icons in peach squares
   - FAQ plus-icons are orange circles (rotate to X when open)
   - Deep navy CTA at bottom with ambient orange glow

2. `/services-overview` loads with:
   - WHITE headline "Everything we handle on-site." with orange "on-site." accent
   - Four service cards, each with unique illustrated scene header:
     - Automotive: orange car with tools
     - Marine: boat on waves
     - RV: white RV with trees
     - Fleet: three overlapping vans
   - Each card lifts on hover
   - CTA arrow slides right on link hover
   - Order matches: Automotive, Marine, RV, Fleet

3. Build completed without errors
4. Live at https://coastal-mobile-lube.netlify.app/how-it-works and `/services-overview`
5. Nav dropdown still works (should be unaffected)
