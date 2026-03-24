# WORK ORDER: Fix Cloudinary Image Quality Across All Pages

## CONTEXT
All Cloudinary images across the site look low-res and compressed. The source images are fine. The issue is the Cloudinary transform parameters being too aggressive on compression or requesting too small a size.

## WHAT TO DO

### Step 1: Read the Cloudinary helper
Read `src/lib/cloudinary.ts` (or wherever the cloudinaryUrl / image helper function lives). Check what default transforms it applies.

### Step 2: Fix the helper function
Update the default transforms:
- Change `q_auto` to `q_auto:good` (q_auto alone defaults to eco/lowest quality)
- Make sure `f_auto` is present (this is fine to keep)
- Default width should be at least `w_800` for general use

### Step 3: Fix image sizes by context
Search the entire `src/` directory for any Cloudinary URLs or cloudinaryUrl() calls. Update the width parameters based on where the image is used:

**Hero/banner images** (full-width backgrounds, hero sections): `w_1600,q_auto:good,f_auto`
**Service card images** (card thumbnails, section images): `w_800,q_auto:good,f_auto`  
**Small thumbnails** (if any exist): `w_400,q_auto:good,f_auto`

If images are using `c_fill` with height constraints, keep those but make sure the width is appropriate for the container.

### Step 4: Check for hardcoded URLs
Some images might have transforms hardcoded directly in the URL string instead of going through the helper. Search for `res.cloudinary.com` across all files and fix any that have small widths or `q_auto` without `:good`.

## DO NOT
- Do not change any image public IDs or swap which images are used where
- Do not change layouts, spacing, or any non-image code
- Do not add new images or remove existing ones

## WHEN DONE
```bash
npm run build && npx netlify deploy --prod --dir=.next && git add -A && git commit -m "fix: improve Cloudinary image quality across all pages" && git push origin main
```
