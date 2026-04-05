# WO-COASTAL-04: Service Page Images

## Summary
Add images alongside category sections on /services and /marine pages. Pull image URLs from the white-version branch if available, otherwise use existing Cloudinary images from the codebase.

## Pre-read (read ALL of these in full before making any edits)
- src/app/services/ServicesContent.tsx (or whatever renders automotive services)
- src/app/marine/MarineContent.tsx
- Run: git show white-version:src/app/services/page.tsx | head -100 (check for Cloudinary URLs)
- Run: git show white-version:src/app/marine/page.tsx | head -100
- Run: grep -r "cloudinary" src/ --include="*.tsx" --include="*.ts" -l (find existing image references)
- Run: grep -r "res.cloudinary.com" src/ --include="*.tsx" --include="*.ts" | head -30

## Changes

### 1. Find All Available Images
- Search the white-version branch for any Cloudinary image URLs used on service/marine pages
- Search current codebase for any Cloudinary URLs already referenced
- Catalog what images are available for each service category

### 2. Automotive Services Page (/services)
- For each category section (Basic Maintenance, Brakes, Oil Changes, etc.), add a hero image at the top of that category's content area
- Layout: when an image is available, use a two-column layout -- text/services on left (60%), image on right (40%)
- When no image is available for a category, keep the current full-width layout
- Images should have rounded corners (rounded-lg) and a subtle shadow
- On mobile, image goes full-width above the services list

### 3. Marine Services Page (/marine)
- Same treatment as automotive
- Use marine/boat-related images from the white-version branch

### 4. Image Styling
- object-cover, aspect-ratio 4/3 or 16/9
- rounded-lg shadow-md
- max-height: 300px on desktop
- Full width on mobile, stacked above content

## Rules
- Do NOT rewrite entire files. Surgical edits only.
- Do NOT touch globals.css or tailwind config.
- If no Cloudinary images are found in the codebase at all, skip this WO and report what you found.
- Do NOT use placeholder images or stock photo URLs -- only use images already in the codebase or on Cloudinary account dgcdcqjrz.

## Deploy
```bash
npm run build && npx netlify-cli deploy --prod --message="WO-04: Service page images"
```

Then run: git add -A && git commit -m "WO-04: Service page images" && git push origin main
