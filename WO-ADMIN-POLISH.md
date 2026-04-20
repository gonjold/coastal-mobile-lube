# WO-ADMIN-POLISH: Cross-Page Fixes and Visual Polish

## Context
All 5 admin redesign WOs are deployed. This WO fixes issues caught during the walkthrough. Each fix is small and surgical.

**Repo:** gonjold/coastal-mobile-lube
**Branch:** main
**Stack:** Next.js / TypeScript / Tailwind CSS v4
**Deploy:** Netlify

## IMPORTANT RULES
- Read every file mentioned IN FULL before making any changes
- Surgical edits only. Do NOT rewrite entire files
- Do NOT touch globals.css or tailwind.config
- Build, commit, push, deploy at the end

---

## Fix 1: Kill the "Get a Quote" FAB on admin pages

The teal "Get a Quote" floating action button from the public site is showing on all admin pages (bottom-right corner). It should NOT appear on any /admin route.

Search the entire codebase for "Get a Quote" or "FAB" or any fixed/sticky button with a chat/quote icon. It is likely in one of these locations:
- src/app/layout.tsx (root layout)
- src/components/QuoteButton.tsx or similar
- src/components/FloatingButton.tsx or similar

Once found, wrap it in a condition that hides it when the pathname starts with "/admin". Use the usePathname() hook from next/navigation. If the FAB component is in the root layout, the simplest fix is:

```
const pathname = usePathname();
const isAdmin = pathname?.startsWith('/admin');
```

Then conditionally render the FAB only when !isAdmin.

If the root layout is a server component and can't use usePathname, extract the FAB into a client component wrapper that handles the pathname check.

---

## Fix 2: Fix the Schedule page filter bar and List/Calendar toggle

Read src/app/admin/schedule/page.tsx in full.

The filter bar (status pills + time filter + division filter) and the List/Calendar toggle may have been broken or removed during the quick fix that removed the day/week/month selector. Verify all of these are present and working:

a) **List/Calendar toggle** should be in the filter bar row, pushed to the far right with ml-auto. It should be AFTER the division filter pills. Style: bg-[#F7F8FA] rounded-lg p-0.5 border border-gray-200, two buttons (List and Calendar), active one gets bg-white shadow-sm.

b) **Status filter pills** should show: All, New Lead, Pending, Confirmed, In Progress, Completed, Cancelled -- each with a count badge.

c) **Time filter**: Today, This Week, This Month, All Time

d) **Division filter**: All, Auto, Marine, Fleet, RV

e) **Day selector bar** inside the calendar view should show 5-7 days of the current week with booking counts per day. This should be INSIDE the calendar component (below the filter bar), not in the top bar.

If any of these are missing, add them back following the specs in WO-ADMIN-03-SCHEDULE.md.

---

## Fix 3: Invoice table column widths

Read src/app/admin/invoicing/page.tsx in full.

The current grid template is making the Invoice ID column too narrow (text wraps to two lines) and giving Customer and Service columns too much space.

Change the grid template columns from:
```
100px 1.5fr 1.5fr 100px 100px 100px 90px
```

To:
```
150px 1.2fr 1.2fr 90px 90px 110px 90px
```

This gives Invoice ID enough room for "CMLT-2026-006" on one line, tightens Customer and Service, and gives Amount a bit more room.

Also add whitespace-nowrap to the Invoice ID column cells so they never wrap.

Apply the same grid template to both the AdminTableHeader and all AdminTableRow elements on this page.

---

## Fix 4: Move Services & Pricing into WEBSITE nav section

Read src/components/admin/AdminSidebar.tsx in full.

Current sidebar nav:
```
OPERATIONS: Dashboard, Schedule, Customers
FINANCIAL: Invoicing
WEBSITE: Content Editor
---
Settings -> /admin/services
```

Change to:
```
OPERATIONS: Dashboard, Schedule, Customers
FINANCIAL: Invoicing
WEBSITE: Content Editor, Services & Pricing
---
(remove Settings link entirely)
```

Specifically:
- Add a new nav item "Services & Pricing" under the WEBSITE section, linking to /admin/services
- Remove the "Settings" link from the bottom actions area entirely (there is no standalone settings page yet)
- Keep "View Site" and "Sign Out" in the bottom actions

---

## Fix 5: Remove old breadcrumb on Services page

Read src/app/admin/services/page.tsx in full.

There is a breadcrumb showing "Dashboard / Service Management" at the top of the services page. This is left over from the old navigation and is now redundant with the sidebar. Remove it.

If the services page does not use AdminTopBar yet, add it with title "Services & Pricing" and no subtitle.

---

## Fix 6: Center-align verification on all table pages

Check these three pages and verify that the correct columns are center-aligned in BOTH the header AND the cell content:

**Schedule table** (src/app/admin/schedule/page.tsx):
- Left-aligned: Customer, Service, Vehicle
- Center-aligned: Date, Division, Status

**Customers table** (src/app/admin/customers/page.tsx):
- Left-aligned: Customer, Contact
- Center-aligned: Type, Total Spent, Jobs, Status

**Invoicing table** (src/app/admin/invoicing/page.tsx):
- Left-aligned: Invoice, Customer, Service
- Center-aligned: Date, Due, Amount, Status

For any column that should be center-aligned but is not, add text-center to both the header span and the cell content. If using the AdminTableHeader component, make sure the align property is set to "center" for those columns.

---

## Fix 7: Dashboard pipeline cards -- remove dashed border

Read src/app/admin/page.tsx and src/components/admin/PipelineCard.tsx.

From the screenshot, the pipeline cards appear to have a dashed or dotted border style instead of a solid border. If so, change to: border border-gray-200 (solid, 1px, gray-200). The cards should match the style from the mockup: solid subtle border, not dashed.

---

## Fix 8: Dashboard "Today's Schedule" time format

From the screenshot, one booking shows "late" as the time instead of an actual time like "2:00 PM". This is likely a parsing issue where the time field from Firestore is not being formatted correctly.

Read the dashboard page and find where today's schedule times are rendered. Ensure the time is displayed as a formatted string (e.g., "2:00 PM"). If the Firestore booking stores time as a different format (timestamp, 24h string, etc.), add proper formatting. If the time field is missing or empty, show "TBD" instead of "late".

---

## Step 9: Build, commit, push, deploy

```bash
cd ~/coastal-mobile-lube
npm run build
```

Fix any TypeScript or build errors.

```bash
git add src/
git commit -m "Admin polish: kill FAB, fix schedule filters, invoice columns, nav restructure, center-align tables"
git push origin main
npx netlify-cli deploy --prod --message="Admin polish pass - post-redesign fixes"
```

Verify all admin pages at coastal-mobile-lube.netlify.app/admin.
