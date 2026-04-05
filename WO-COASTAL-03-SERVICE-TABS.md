# WO-COASTAL-03: Service Pages -- Tabs Instead of Scroll Pills

## Summary
On /services (automotive) and /marine pages, convert the category pills from anchor-scrolling to content-swapping tabs. Only the active tab's services should be visible. Sticky tab bar.

## Pre-read (read ALL of these in full before making any edits)
- src/app/services/page.tsx (automotive services page)
- src/app/marine/page.tsx (marine services page)
- Any shared components these pages use for rendering service categories/pills/cards

## Changes

### 1. Automotive Services Page (/services)
- Find the category pills/buttons (Oil Changes, Brakes, Tires, etc.)
- Convert from anchor links (scrolling to sections) to state-driven tabs
- Add React state: track which category tab is active (default to first category)
- When a tab is clicked, show ONLY that category's services below -- hide all others
- Do NOT use scroll behavior at all -- pure show/hide content swap
- First tab should be active/selected on page load
- Active tab styling: solid fill (brand navy or accent color), white text
- Inactive tab styling: outlined or subtle background, dark text

### 2. Sticky Tab Bar
- Wrap the tab pills in a container that is position: sticky
- top: 64px (or whatever the nav height is -- just below the fixed nav)
- Add a white/navy background to the sticky bar so content doesn't show through behind it
- Add a subtle bottom border or shadow to the sticky bar
- z-index high enough to stay above page content but below nav

### 3. Marine Services Page (/marine)
- Apply the exact same tab treatment as automotive
- Same sticky behavior, same active/inactive styling
- Default to first category on load

### 4. Smooth Transition (optional, only if easy)
- If simple to add, a subtle fade transition when switching tabs
- Do NOT add if it requires installing a new library

## Rules
- Do NOT rewrite entire files. Surgical edits only.
- Do NOT touch globals.css or tailwind config.
- Do NOT change the actual service data, pricing, or descriptions -- layout/interaction only.
- Do NOT remove the category pills visually -- they stay as pills/buttons, they just swap content instead of scrolling.

## Deploy
```bash
npm run build && npx netlify-cli deploy --prod --message="WO-03: Service pages tabs instead of scroll pills"
```

Then run: git add -A && git commit -m "WO-03: Service pages tabs instead of scroll pills" && git push origin main
