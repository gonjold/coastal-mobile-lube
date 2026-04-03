# COASTAL-NAVY-HEADER-WO.md
# Work Order: Navy Header + Hero Theme Update
# Priority: Phase 1 / WO 1
# Date: 2026-04-03

---

## OBJECTIVE

Change the site header from white background to navy (#0B2040) to match the footer. The hero section on the homepage should blend seamlessly into the navy header with no visible border between them. This is based on direct client feedback (Jason wants the top to match the bottom).

---

## INSTRUCTIONS

### BEFORE YOU START

Read these files IN FULL before making any changes:
- `src/app/page.tsx` (homepage)
- `src/components/Header.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`

Do NOT rewrite any file entirely. Make surgical edits only.
Do NOT touch tailwind.config.ts.

---

## PART A: Header Component (Header.tsx)

### Changes:

1. **Header background**: Change from white/transparent to navy `#0B2040`
2. **Logo**: Remove the logo `<img>` tag entirely. Replace with a text wordmark:
   ```
   Coastal Mobile Lube & Tire
   ```
   Style: "Coastal Mobile" in white, font-weight 800, font-size 18px. "Lube & Tire" in rgba(255,255,255,0.5), font-weight 400, font-size 12px, uppercase, letter-spacing 1px. Wrap in a Link to "/".
3. **Nav links**: Change text color to `rgba(255,255,255,0.85)`. Hover state: `rgba(255,255,255,1)`.
4. **Phone number link**: Change to `rgba(255,255,255,0.9)`.
5. **"Book Service" CTA button**: Keep orange `#E07B2D` background with white text. This pops well on navy.
6. **Border/shadow**: Remove any bottom border or box-shadow from the header. The header should blend into the hero with no divider.
7. **Scroll behavior**: If the header changes style on scroll (e.g., adds shadow or changes bg), keep the navy background constant. No white-on-scroll. Navy always.
8. **Mobile hamburger icon**: Change to white. The mobile drawer/menu background should also be navy `#0B2040` with white text links.

### Do NOT change:
- Nav link destinations
- Mobile sticky bottom bar (leave as-is)
- Any other component

---

## PART B: Homepage Hero Section (page.tsx)

### Changes:

1. **Hero section background**: Change to navy `#0B2040` so it blends seamlessly with the header above it. There should be ZERO visible boundary between header and hero.
2. **Headline text**: Change to white `#FFFFFF`, keep font-weight 800.
3. **Subheadline text**: Change to `rgba(255,255,255,0.7)`.
4. **"Book Service" button**: Keep orange `#E07B2D` with white text.
5. **"Call 813-722-LUBE" button**: Change to white outline style: border 1px solid rgba(255,255,255,0.3), text color white, transparent background.
6. **Trust badges below hero buttons** (Factory-trained, Licensed & insured, Same-day availability): Change checkmark color to `#6BA3E0` (light blue). Text color to `rgba(255,255,255,0.6)`.
7. **Quick quote widget** (the "Get a quick quote" card on the right side of the hero): Keep the widget card white with its current styling. It should float on top of the navy background. This creates the contrast.

### Do NOT change:
- The quote widget internals (form fields, tabs, submit behavior)
- Any section below the hero (services, how it works, reviews, etc. all stay as they are)
- The footer

---

## PART C: Inner Page Heroes (services, fleet, marine, about, contact, book)

### Changes:

1. Check each inner page hero/banner section. If it has a navy background already, leave it. If it has a white or surface background with navy text, flip it:
   - Background: `#0B2040`
   - Heading text: white
   - Subheading text: `rgba(255,255,255,0.7)`
   - Eyebrow label: `#6BA3E0` (light blue, not the dark blue)
   - CTA buttons: keep orange primary, white outline secondary

This ensures the header blends into every page's top section, not just the homepage.

### Do NOT change:
- Any content sections below the hero on inner pages
- The footer on any page
- Any form functionality

---

## VALIDATION

After making changes, verify:
- [ ] Header is navy on desktop and mobile
- [ ] No visible line/border between header and hero on homepage
- [ ] No visible line/border between header and hero on inner pages
- [ ] Logo area shows text wordmark, not an image
- [ ] Nav links are readable (white on navy)
- [ ] Orange CTA button is visible and clickable
- [ ] Mobile drawer opens with navy background
- [ ] Mobile hamburger icon is white
- [ ] Quick quote widget on homepage is still white and functional
- [ ] No build errors

---

## FINISH

```bash
npm run build && git add -A && git commit -m "WO: Navy header + hero theme update - client feedback" && git push origin main
```

Wait for Netlify auto-deploy, then verify at https://coastal-mobile-lube.netlify.app

---

*WO written by Jon Gold / Gold Co LLC — 2026-04-03*
