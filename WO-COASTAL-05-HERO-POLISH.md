# WO-COASTAL-05: Hero Polish + Broken Images

## Summary
Fine-tune the homepage hero section and fix broken images across the site.

## Pre-read (read ALL of these in full before making any edits)
- src/app/page.tsx (homepage -- hero section)
- src/app/about/page.tsx (or AboutContent.tsx -- find the van image reference)
- Run: grep -r "coastal-van-wrap-side" src/ --include="*.tsx" --include="*.ts"
- Run: grep -r "cloudinary" src/ --include="*.tsx" --include="*.ts" | grep -i "van\|wrap\|about"
- Check if the image exists: ls public/ | grep -i van

## Changes

### 1. Fix Broken Van Image on /about
- The /about page references "coastal-van-wrap-side.png" which returns a 404
- Find the correct image: check Cloudinary (dgcdcqjrz), check the white-version branch (git show white-version:public/ or similar), check if the file is named differently
- If the image exists somewhere, update the src path
- If the image genuinely doesn't exist anywhere, remove the broken img tag and replace with a simple styled placeholder div with text "Van photos coming soon" in muted text, or remove the "Our Rig" section entirely

### 2. Hero Form Frosted Glass Verification
- Check that the quote form on the homepage has:
  - backdrop-filter: blur(16px) and -webkit-backdrop-filter: blur(16px)
  - Semi-transparent background (rgba or bg-white/10 to bg-white/15 range)
  - White text on all labels
  - Semi-transparent input backgrounds
  - The form should feel like frosted glass over the dark hero, not a solid card
- If any of these are missing or wrong, fix them

### 3. Hero Badge/Watermark Position
- The oval Coastal Mobile badge watermark in the hero should be:
  - Bottom-right area of the hero section
  - Low opacity (0.04 to 0.06)
  - Not overlapping or competing with the form or headline text
  - Large enough to be a subtle brand presence, not tiny
- Verify current position and adjust if needed

### 4. Hero Section Spacing
- Make sure the hero section has enough vertical padding that nothing feels cramped
- The headline, description, CTAs, and form should all have comfortable breathing room
- On mobile, the form should stack below the headline content with adequate spacing

## Rules
- Do NOT rewrite entire files. Surgical edits only.
- Do NOT touch globals.css or tailwind config.

## Deploy
```bash
npm run build && npx netlify-cli deploy --prod --message="WO-05: Hero polish and broken image fixes"
```

Then run: git add -A && git commit -m "WO-05: Hero polish and broken image fixes" && git push origin main
