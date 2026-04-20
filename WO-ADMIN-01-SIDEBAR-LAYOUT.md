# WO-01: Sidebar + Layout Shell + Shared Admin Components

## Context
This is the first WO in a 5-part admin portal redesign for Coastal Mobile Lube & Tire (coastal-mobile-lube.netlify.app/admin). Every subsequent WO depends on the components built here. The redesign replaces the current admin navigation and layout with a professional left sidebar, top bar, and reusable component library.

**Repo:** gonjold/coastal-mobile-lube
**Branch:** main
**Stack:** Next.js / TypeScript / Tailwind CSS v4
**Deploy:** Netlify (npx netlify-cli deploy --prod)

## IMPORTANT RULES
- Read every file mentioned IN FULL before making any changes
- Surgical edits only. Do NOT rewrite entire files
- Do NOT touch globals.css or tailwind.config
- Do NOT remove any existing page content or functionality
- Max 3-4 focused changes per step. If a file is 2000+ lines, use micro edits
- Build, commit, push, deploy at the end

---

## Step 1: Read and understand the current admin layout

Read these files in full before making any changes:
- src/app/admin/layout.tsx (or layout.js -- find the admin layout file)
- src/app/admin/page.tsx (the dashboard page)
- Any existing admin sidebar or navigation component (search for sidebar, nav, AdminNav, AdminSidebar, AdminLayout in the src directory)
- src/components/ directory listing to understand existing shared components
- globals.css (read only, do NOT edit)
- tailwind.config (read only, do NOT edit)

List what you find so we know the starting point.

---

## Step 2: Create shared admin components

Create the following files. Each component uses inline Tailwind classes only.

### 2a: Create src/components/admin/AdminBadge.tsx

A reusable status badge component. Props: label (string), variant (string, one of: green, red, amber, gray, blue, teal). Defaults to gray.

Color mapping:
- green: bg-emerald-100 text-emerald-700
- red: bg-red-100 text-red-700
- amber: bg-amber-100 text-amber-700
- gray: bg-gray-100 text-gray-600
- blue: bg-blue-100 text-blue-700
- teal: bg-teal-100 text-teal-700

Styling: inline-block, px-2.5 py-0.5, rounded-md, text-xs, font-semibold, tracking-wide.

Export as default.

### 2b: Create src/components/admin/AdminTable.tsx

A reusable sortable table wrapper. This is a compound component with three exports: AdminTable, AdminTableHeader, AdminTableRow.

**AdminTable** wraps children in a div with: bg-white rounded-xl border border-gray-200 overflow-hidden.

**AdminTableHeader** accepts a columns prop: array of { key: string, label: string, align: "left" | "center", sortable?: boolean }. Also accepts sortKey and sortDir state props and an onSort callback.

Renders a grid row (use CSS grid via style prop for column template) with:
- bg-gray-50 (surface color), px-5 py-3, border-b border-gray-200
- Each header: text-[11px] font-bold text-gray-500 uppercase tracking-wider
- If align is "center", add text-center to both header and pass this info down
- If sortable, make the header a clickable button. Show a subtle arrow indicator: up arrow for asc, down arrow for desc, neutral dash when not active sort column
- cursor-pointer on sortable headers with hover:text-gray-700 transition

**AdminTableRow** accepts children, an onClick handler, and an isSelected boolean prop.
- Renders a grid row matching the parent column template (pass gridTemplateColumns as a prop or via context)
- px-5 py-3.5, border-b border-gray-200, cursor-pointer
- Default bg-white, hover:bg-gray-50 transition
- When isSelected: bg-blue-50
- Items vertically centered (items-center)

### 2c: Create src/components/admin/AdminCSVExport.tsx

A button component that accepts data (array of objects) and filename (string) props.

On click, it converts the data array to CSV format (Object.keys for headers, Object.values for rows, properly escaping commas and quotes) and triggers a browser download with the given filename.

Styling: px-4 py-2, rounded-lg, border border-gray-200, bg-white, text-xs font-semibold text-gray-500, hover:bg-gray-50 transition, cursor-pointer.

Button text: "Export CSV"

---

## Step 3: Create the new admin sidebar

Create src/components/admin/AdminSidebar.tsx

This is a fixed left sidebar, 230px wide, full viewport height, bg-[#0B2040] (navy), text-white. Font: the site's existing font (Plus Jakarta Sans).

Structure from top to bottom:

**Logo area** (top, with bottom border rgba(255,255,255,0.08)):
- Padding 20px
- "Coastal Mobile" in text-[15px] font-bold text-white
- "Lube & Tire Admin" in text-[11px] text-white/45 font-medium, margin-top 2px

**Create New button:**
- Padding 16px horizontal
- Full-width button, bg-[#E07B2D] (orange), rounded-[10px], text-[13px] font-semibold, text-white
- hover:bg-[#CC6A1F] transition
- Text: "+ Create New"
- On click, toggles a dropdown overlay positioned below the button
- Dropdown: bg-white, rounded-[10px], shadow-lg, three items: "New Booking", "New Customer", "New Invoice"
- Each dropdown item: px-4 py-2.5, text-[13px] font-medium text-gray-900, hover:bg-gray-50, border-b border-gray-200 (except last)
- Clicking any item closes the dropdown (for now, no navigation -- we will wire these in later WOs)

**Navigation sections** (scrollable area, flex-1 overflow-y-auto):

Section label styling: px-5 py-3 pb-1.5, text-[10px] font-bold text-white/35 uppercase tracking-[0.08em]

Nav item styling: px-5 py-2.5, text-sm, cursor-pointer, border-l-[3px] solid transparent, transition-all
- Default: text-white/60 font-normal, hover:bg-white/[0.04] hover:text-white/85
- Active: text-white font-semibold, bg-white/[0.08], border-l-[3px] border-[#E07B2D]

Sections and items:
```
OPERATIONS
  Dashboard     -> /admin
  Schedule      -> /admin/schedule
  Customers     -> /admin/customers

FINANCIAL
  Invoicing     -> /admin/invoicing

WEBSITE
  Content Editor -> /admin/hero-editor
```

Use Next.js Link components for navigation. Determine active state from the current pathname using usePathname().

**Bottom actions** (border-t rgba(255,255,255,0.08)):
- "Settings" -> /admin/services (links to existing services page), text-white/55, hover:text-white/85
- "View Site" -> / (opens in new tab with target="_blank"), text-white/55, hover:text-white/85
- "Sign Out" -> triggers sign out (use whatever auth signout the app currently uses), text-white/40, hover:text-white/85

Each bottom item: px-5 py-2.5, text-[13px], cursor-pointer, transition

No icons anywhere in the sidebar. Text only.

---

## Step 4: Create the new admin top bar

Create src/components/admin/AdminTopBar.tsx

Props: title (string), subtitle (string, optional), children (optional, for right-side action buttons).

Fixed to top, full width minus sidebar (margin-left: 230px), bg-white, border-b border-gray-200, sticky top-0 z-40.

Layout: flex justify-between items-center, px-8 py-3.5.

Left side:
- h1: text-xl font-bold text-[#0B2040]
- Subtitle (if provided): text-[13px] text-gray-500, margin-top 2px

Right side: flex items-center gap-3
- Search bar: flex items-center, bg-gray-50, border border-gray-200, rounded-lg, px-3.5 py-2, gap-2, min-w-[220px]
  - Search icon: a small SVG magnifying glass, 14x14, stroke-gray-500
  - Placeholder text: "Search customers, bookings..." in text-[13px] text-gray-500
  - For now this is display only (not functional). We will wire search in a later phase
- User avatar: w-[34px] h-[34px] rounded-full bg-[#0B2040] text-white flex items-center justify-center text-[13px] font-bold
  - Display "JB" (Jason Binder's initials). In production this would come from auth state
- Then render {children} if provided (for page-specific action buttons)

---

## Step 5: Create the new admin layout

Modify the existing admin layout file (src/app/admin/layout.tsx or equivalent).

Replace the current navigation/sidebar/header with the new components:
- Import and render AdminSidebar
- Wrap the page content area in a div with margin-left: 230px (to account for fixed sidebar), min-height: 100vh, bg-[#F7F8FA] (surface color)
- The AdminTopBar will be rendered by each individual page (not in the layout), because each page has a different title and subtitle

Remove the "Get a Quote" floating action button (FAB) from the admin layout if it exists there. Search for "Get a Quote", "FAB", "floating", or "fixed bottom-right" in the admin layout and remove it. The FAB should only appear on public pages.

Remove any existing admin header, top navigation bar, or sidebar that the new components replace. Keep auth protection logic (login checks, redirects) intact.

---

## Step 6: Verify existing admin pages still render

After the layout changes, verify that all existing admin pages still load:
- /admin (dashboard)
- /admin/schedule
- /admin/customers
- /admin/invoicing
- /admin/services
- /admin/hero-editor

Each page will still show its OLD content inside the NEW layout shell. That is correct and expected. The individual page redesigns happen in WO-02 through WO-05.

If any page has its own inline navigation or header that now duplicates the sidebar, note it but do NOT remove it in this WO. We will clean those up in the page-specific WOs.

---

## Step 7: Build, commit, push, deploy

```bash
cd ~/coastal-mobile-lube
npm run build
```

Fix any TypeScript or build errors. Do not skip this step.

```bash
git add src/
git commit -m "WO-01: Admin sidebar, top bar, shared components (Badge, Table, CSV export)"
git push origin main
npx netlify-cli deploy --prod --message="WO-01: Admin layout redesign - sidebar and shared components"
```

Confirm the deploy URL and verify /admin loads with the new sidebar.

---

## Design Reference

Colors used in this WO:
- Navy (sidebar bg, text primary): #0B2040
- Orange (CTA, active indicator): #E07B2D
- Orange hover: #CC6A1F
- Surface (content bg): #F7F8FA
- Border: #E5E7EB (Tailwind gray-200)
- Text primary: #0B2040
- Text secondary: #6B7280 (Tailwind gray-500)

No icons in navigation items or section headers. Text labels only.
Font: Plus Jakarta Sans (already loaded in the project).
