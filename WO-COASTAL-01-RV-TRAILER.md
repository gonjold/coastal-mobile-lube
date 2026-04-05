# WO-COASTAL-01: Add RV & Trailer Sitewide

## Summary
Add "RV & Trailer" as a service division across nav, hero, and homepage service tabs.

## Pre-read (read ALL of these in full before making any edits)
- Find and read the main navigation component (likely src/components/layout/Navbar.tsx or Header.tsx or similar)
- src/app/page.tsx (homepage)
- Find and read the Footer component
- Find and read the homepage services tabs component (may be inline in page.tsx or a separate component)

## Changes

### 1. Main Navigation
- Add "RV & Trailer" as a nav link between "Marine" and "About"
- Link to /rv
- Match existing nav link styling exactly
- If there is a mobile menu/drawer, add it there too in the same position

### 2. Hero Section
- Find the hero subhead text (the line listing service types like "Automotive. Marine.")
- Change it to: "Automotive. Marine. RV & Trailer."
- Find the hero description paragraph and naturally mention RV & trailer service alongside auto and marine

### 3. Homepage Service Tabs
- Find the tabbed services section on the homepage
- Add an "RV & Trailer" tab alongside the existing Automotive and Marine tabs
- RV & Trailer tab content should show these services:
  - Generator Service & Inspection
  - Roof Seal & Leak Inspection
  - RV Oil & Filter Change
  - Slide-Out Lubrication & Maintenance
- Each service gets a short 1-line description
- Add a "View All RV & Trailer Services" link pointing to /rv
- Match the card/list styling of the other tabs exactly

### 4. Footer
- If the footer lists service divisions or has service links, add RV & Trailer in the appropriate spot

## Rules
- Do NOT rewrite entire files. Surgical edits only.
- Do NOT touch globals.css or tailwind config.
- Do NOT create any new files unless absolutely necessary.

## Deploy
```bash
npm run build && npx netlify-cli deploy --prod --message="WO-01: Add RV & Trailer to nav, hero, homepage tabs"
```

Then run: git add -A && git commit -m "WO-01: Add RV & Trailer to nav, hero, homepage tabs" && git push origin main
