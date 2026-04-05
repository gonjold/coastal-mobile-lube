# WO-COASTAL-02: Frosted Glass Sticky Quote Form

## Summary
Restyle the homepage hero quote form to frosted glass and make it sticky. Reposition the oval badge watermark lower.

## Pre-read (read ALL of these in full before making any edits)
- src/app/page.tsx (homepage -- find the hero section and quote form)
- Find and read whatever component renders the quote/booking form on the homepage (might be BookingForm.tsx, QuoteForm.tsx, or inline)
- Identify the oval badge/watermark element in the hero

## Changes

### 1. Quote Form -- Frosted Glass
- Find the quote form in the hero section
- Remove any solid white or opaque background
- Apply these styles:
  - background: rgba(255, 255, 255, 0.12)
  - backdrop-filter: blur(16px)
  - -webkit-backdrop-filter: blur(16px)
  - border: 1px solid rgba(255, 255, 255, 0.2)
  - border-radius: keep existing or 12px
- All form labels: white text (text-white)
- All form inputs: semi-transparent white background (bg-white/20), white text, white placeholder text (placeholder:text-white/60)
- Submit button: keep its existing accent/brand color, make sure it pops against the glass
- Any form headings/subtext inside the form: white

### 2. Quote Form -- Sticky Positioning
- Make the quote form container position: sticky
- top: 100px (or whatever clears the fixed nav)
- The form should stay visible as the user scrolls down through the hero section
- It should NOT remain sticky after the hero section ends -- use a wrapper div on the hero that contains the form so sticky naturally stops when the hero ends
- Self-align the sticky form to the top of the hero area

### 3. Oval Badge Watermark
- Find the oval/circular badge watermark element in the hero section
- Move it lower -- position it toward the bottom-right of the hero instead of centered or top area
- Reduce opacity slightly if needed so it doesn't compete with the form

## Rules
- Do NOT rewrite entire files. Surgical edits only.
- Do NOT touch globals.css or tailwind config.
- Do NOT change the form fields, validation logic, or submission behavior -- styling only.

## Deploy
```bash
npm run build && npx netlify-cli deploy --prod --message="WO-02: Frosted glass sticky quote form"
```

Then run: git add -A && git commit -m "WO-02: Frosted glass sticky quote form" && git push origin main
