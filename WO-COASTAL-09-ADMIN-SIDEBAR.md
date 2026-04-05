# WO-COASTAL-09: Admin Sidebar Services Link

## Summary
Add "Services" link to the admin sidebar navigation. The page exists at /admin/services but has no menu link.

## Pre-read
- Find and read the admin layout/sidebar component (likely src/app/admin/layout.tsx or a Sidebar component)
- Verify /admin/services page exists: ls src/app/admin/services/

## Changes

### 1. Add Services to Sidebar
- Add a "Services" link to the admin sidebar navigation
- Position it between "Dashboard" and "Schedule" (or after Dashboard if no Schedule exists)
- Link to /admin/services
- Match the existing sidebar link styling exactly (icon, text, active state)
- Use a wrench icon, grid icon, or similar if the sidebar uses icons -- match the pattern of other links

That is the only change.

## Rules
- Do NOT rewrite entire files. Surgical edits only.
- Do NOT touch globals.css or tailwind config.

## Deploy
```bash
npm run build && npx netlify-cli deploy --prod --message="WO-09: Admin sidebar services link"
```

Then run: git add -A && git commit -m "WO-09: Admin sidebar services link" && git push origin main
