# WO-ADMIN-14: Global Collapsible Admin Sidebar

## Objective
Make the admin sidebar collapsible across ALL admin pages. Collapsed state shows icon-only (56px wide). Expanded state shows full labels (220px wide). Collapse state persists across page navigation via localStorage.

## Pre-read (MANDATORY)
Read these files in full before making any changes:
- src/components/admin/AdminSidebar.tsx
- src/components/admin/AdminLayout.tsx (or whatever wraps admin pages with sidebar)
- src/components/admin/AdminTopBar.tsx

## Step 1: Add collapse state to AdminSidebar.tsx

Add state management for sidebar collapse:

```
const [collapsed, setCollapsed] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin-sidebar-collapsed') === 'true';
  }
  return false;
});

useEffect(() => {
  localStorage.setItem('admin-sidebar-collapsed', String(collapsed));
}, [collapsed]);
```

## Step 2: Update sidebar width and layout

The sidebar should render in two modes:

**Collapsed (56px):**
- Width: 56px
- Show toggle button at top: a right-pointing chevron or >> icon
- Each nav item renders as just an icon (SVG, 18x18) centered in a 34x34 rounded box
- Active item: background rgba(26,82,118,0.1), icon color #1a5276
- Inactive item: icon color matches --color-text-tertiary
- Section dividers: thin 24px-wide horizontal line
- Hover on any icon: show tooltip with the page name (use title attribute)
- No text labels visible
- No section headers (OPERATIONS, FINANCIAL, WEBSITE, SETTINGS)

**Expanded (220px):**
- Current behavior, unchanged
- Show toggle button at top: a left-pointing chevron or << icon

## Step 3: Create SVG icons for each nav item

Create simple 18x18 SVG icons for each sidebar item. Use stroke-based icons (stroke-width 1.3, no fill) matching the existing admin aesthetic. Each icon should be a small inline SVG component or defined in the sidebar file.

Icons needed:
- Dashboard: 4-panel grid (two squares, two rectangles)
- Schedule: calendar with top bar and date lines
- Customers: person silhouette (head circle + shoulders arc)
- Invoicing: document with horizontal lines
- Integrations: two interlocking circles or link chain
- Services & Pricing: wrench or star
- Fees & Promos: percent/dollar with diagonal slash
- Hero Editor: pencil/edit icon
- Sign Out: arrow exiting a door

## Step 4: Update AdminLayout to handle width transition

The layout wrapper must adjust the main content area width when sidebar collapses:
- Use CSS transition on sidebar width: `transition: width 200ms ease`
- Main content area uses `flex: 1` so it automatically fills remaining space
- No jump or reflow -- smooth transition

## Step 5: Toggle button styling

The toggle button sits at the top of the sidebar (above all nav items):
- In expanded mode: shows << icon, aligned to the right edge of the sidebar
- In collapsed mode: shows >> icon, centered
- Size: 32x32, border-radius: var(--border-radius-md)
- Hover: background var(--color-background-secondary)
- Color: var(--color-text-tertiary)

## Step 6: Verify no breaking changes

After implementing:
1. Navigate to every admin page and verify the sidebar renders correctly in both states
2. Verify the active page highlight works in both states
3. Verify the sidebar collapse state persists after page navigation
4. Verify the sidebar collapse state persists after browser refresh
5. Verify the global "Create New" button (if it exists in sidebar) works in both states
6. Verify Sign Out works in both states

## Build and deploy

```bash
npm run build
npx netlify-cli deploy --prod
git add src/
git commit -m "WO-14: Global collapsible admin sidebar with icon mode and localStorage persistence"
git push origin main
```

## Do NOT:
- Touch globals.css or tailwind config
- Rewrite AdminSidebar.tsx from scratch -- modify the existing file surgically
- Change any page-level components -- this is purely a sidebar + layout wrapper change
- Remove any existing nav items or change their routes
- Break the mobile layout if one exists
