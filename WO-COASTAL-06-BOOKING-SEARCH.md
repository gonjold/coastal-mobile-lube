# WO-COASTAL-06: Booking Page Search + Division Tabs

## Summary
Add search functionality and division tabs to the /book page so users can find and filter services easily.

## Pre-read (read ALL of these in full before making any edits)
- src/app/book/BookingForm.tsx (or whatever renders the booking page)
- src/app/book/page.tsx
- src/hooks/useServices.ts

## Changes

### 1. Division Tabs
- Add tabs at the top of the service selection area: Automotive | Marine | RV & Trailer
- Fleet is quote-only so do NOT include it as a tab
- Default to Automotive tab on load
- When a tab is selected, filter the service picker to only show services from that division
- Active tab: solid navy fill, white text
- Inactive tab: outlined/subtle, dark text
- Match the pill styling used on other pages

### 2. Search Bar
- Add a search input above or beside the division tabs
- Placeholder text: "Search services..."
- Fuzzy filter: as the user types, filter the visible services by name (case-insensitive substring match is fine, no need for a fuzzy library)
- Search should filter within the currently selected division tab
- Clear button (X) inside the search input to reset
- Style: rounded input with subtle border, matches the form's design language

### 3. Remove Redirect Line
- Find and remove any line that says "Looking for fleet or marine?" or similar redirect text
- Fleet customers should use the /fleet page or the homepage quote form instead

### 4. Service List Improvements
- Group services by category within each division tab
- Show category name as a subtle header above its services
- Services should be selectable (checkbox or radio depending on current behavior -- don't change the selection mechanism, just improve the visual grouping)

## Rules
- Do NOT rewrite entire files. Surgical edits only.
- Do NOT touch globals.css or tailwind config.
- Do NOT change the form submission logic, email sending, or any booking backend behavior.
- Only modify the service selection/filtering UI.

## Deploy
```bash
npm run build && npx netlify-cli deploy --prod --message="WO-06: Booking page search and division tabs"
```

Then run: git add -A && git commit -m "WO-06: Booking page search and division tabs" && git push origin main
