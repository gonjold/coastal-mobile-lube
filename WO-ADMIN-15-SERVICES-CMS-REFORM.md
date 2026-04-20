# WO-ADMIN-15: Services & Pricing CMS Reform

## Objective
Rebuild the /admin/services page from a flat list into a two-panel CMS: category tree on the left, service table on the right with inline row expansion for editing, bulk actions, inline price editing, and drag-to-reorder.

## Pre-read (MANDATORY -- read ALL of these before writing any code)
- src/app/admin/services/page.tsx (current services page -- understand ALL existing state, hooks, Firestore calls)
- src/hooks/useServices.ts (or wherever services/categories are fetched)
- src/components/admin/AdminSidebar.tsx (verify the collapsible sidebar from WO-14 is working)
- Any other files imported by the services page (helpers, types, etc.)

## IMPORTANT: Preserve the data layer
The existing page has working Firestore CRUD for services and categories. DO NOT rewrite hooks or Firestore logic. Reuse every existing hook, helper, and type. Only rebuild the UI/layout.

---

## Step 1: Create the two-panel layout

Replace the current page content with a two-panel layout:

**Left panel: Category tree (200px wide)**
- Background: var(--color-background-primary)
- Border-right: 0.5px solid var(--color-border-tertiary)
- Overflow-y: auto
- Sticky top (fills available height)

**Right panel: Service table (flex: 1)**
- Padding: 16px 24px
- Overflow-y: auto

## Step 2: Division tabs + search bar

Above both panels, add a row (inside the main content area, below AdminTopBar):
- Background: var(--color-background-primary)
- Border-bottom: 0.5px solid var(--color-border-tertiary)
- Left side: Division tab pills (Automotive, Marine, Fleet, RV) with service counts per division
  - Active tab: font-weight 500, color #1a5276, border-bottom 2px solid #1a5276
  - Inactive tab: color var(--color-text-secondary), border-bottom 2px solid transparent
  - Clicking a tab filters categories and services to that division
- Right side: Search input (240px wide)
  - Placeholder: "Search all services..."
  - Searches across ALL services regardless of selected category/division
  - Filters the service table in real-time as you type (by service name or description)
  - When search is active, category tree selection is visually deselected and table shows "Search results for '[query]'" header

## Step 3: Category tree (left panel)

Components of the category tree:

**Header row:**
- "CATEGORIES" label (11px, uppercase, letter-spacing 0.05em, color var(--color-text-tertiary))
- "+" button to add new category (opens a small inline input at the bottom of the tree)

**"All services" item:**
- Always at top
- Shows total count for current division
- Clicking it shows all services in the division (no category filter)

**Category items (one per category in the selected division):**
- Font-size: 13px
- Display: flex, justify-content: space-between
- Left: category name
- Right: service count (font-size 12px, color var(--color-text-tertiary))
- Selected category: font-weight 500, color #1a5276, background rgba(26,82,118,0.06), border-left 3px solid #1a5276
- Unselected: color var(--color-text-secondary)
- Click to select (loads services for that category in the table)

**Category actions (below the list, visible when a category is selected):**
- Small section with border-top
- Shows selected category name (11px, color var(--color-text-tertiary))
- Three action links: "Rename" (color info), "Duplicate" (color info), "Delete" (color danger)
- Rename: turns the category name into an inline text input, Enter to save, Escape to cancel
- Duplicate: creates a copy with name "Copy of [name]", includes all services
- Delete: confirmation dialog, only works if category has 0 services (or offers to move services first)

## Step 4: Service table (right panel)

**Category header (above table):**
- Category name (font-size 15px, font-weight 500)
- Subtitle: "[count] services [dot] [active count] active [dot] [division name]"
- Right side: "Bulk edit" button and "+ Add to category" button (both outlined style, font-size 12px)

**Table container:**
- Background: var(--color-background-primary)
- Border: 0.5px solid var(--color-border-tertiary)
- Border-radius: var(--border-radius-lg)
- Overflow: hidden

**Table header row:**
- Background: var(--color-background-secondary)
- Font-size: 11px, color var(--color-text-tertiary), font-weight 500
- Grid columns: 28px (checkbox) | 28px (drag) | 1fr (service) | 90px (price) | 72px (book) | 72px (site) | 60px (active) | 36px (menu)
- Checkbox: select all toggle

**Table rows (one per service):**
- Padding: 9px 12px
- Border-bottom: 0.5px solid var(--color-border-tertiary)
- Grid matching header columns
- Checkbox: for bulk selection
- Drag handle: hamburger icon (&#x2630;), cursor: grab
- Service: name (13px, font-weight 500) + description below (11px, color tertiary)
- Price: font-weight 500, dashed underline (cursor pointer -- click to inline-edit price)
- Book column: "Show" pill (green bg #EAF3DE, green text #3B6D11) or "Hide" pill (gray bg, gray text). Click to toggle.
- Site column: same Show/Hide pill pattern. Click to toggle.
- Active toggle: 34x18px toggle switch. On = #1a5276 bg. Off = var(--color-border-tertiary) bg.
- Three-dot menu: vertical ellipsis, opens dropdown

**Inactive services:** Render at opacity 0.45 so they're visually dimmed but still editable.

**Drag to reorder:** Implement drag-and-drop reordering within the table. Update Firestore sortOrder on drop. Use onDragStart/onDragOver/onDrop native HTML drag events (no library needed). Show a blue 2px line indicator where the item will be inserted.

## Step 5: Inline price editing

When user clicks the dashed-underline price on any row:
- Replace the price text with a small input field (width 80px, text-align right, font-size 13px)
- Show "Save" button (small, navy) and "Cancel" text link next to it
- Pre-fill with current price (numbers only, no $ sign in the input)
- Enter key saves, Escape cancels
- On save: update Firestore, update local state, show brief success indication (green flash on the cell)
- Only one price can be inline-edited at a time

## Step 6: Inline row expansion for editing

When user clicks "Edit details" from the three-dot menu:
- The clicked row gets a highlighted background: rgba(26,82,118,0.05)
- The row's description changes to "Editing" in navy
- The three-dot icon changes to an up chevron
- Below the row, an edit form expands with a subtle slide-down animation
- The form has a slightly different background: var(--color-background-secondary)
- Form padding: 16px 20px 16px 68px (left padding aligns with service name column)
- Only ONE row can be expanded at a time. Clicking edit on another row collapses the current one.
- Clicking the up chevron collapses the edit form.

**Edit form fields (two-column layout where possible):**
- Row 1: Service name (flex: 2) + Price input (flex: 1)
- Row 2: Description (full width)
- Row 3: Price label / public display text (flex: 1) + Category dropdown (flex: 1)
- Row 4: Internal notes textarea (full width, 2 rows)
- Row 5: Two checkboxes: "Show in booking wizard" + "Show on pricing page"
- Bottom action bar (border-top, padding-top 12px): "Delete service" link (danger, left) + Cancel button + Save button (navy, right)

**On save:** Update Firestore doc, collapse the edit form, refresh local state. If category was changed via dropdown, the service moves to the new category (disappears from current view if different category is selected).

## Step 7: Three-dot dropdown menu

When clicking the vertical ellipsis on any row, show a dropdown menu:
- Position: absolute, aligned to the right edge of the three-dot button
- Background: var(--color-background-primary)
- Border: 0.5px solid var(--color-border-secondary)
- Border-radius: var(--border-radius-md)
- Box-shadow: 0 2px 8px rgba(0,0,0,0.08)
- Width: 180px
- Close on click outside or Escape

Menu items:
1. "Edit details" -- expands the inline edit form (Step 6)
2. "Duplicate" -- creates a copy with name "Copy of [name]", isActive: false, same category
3. "Move to category..." -- opens a submenu or small modal listing all categories in the current division. Clicking one moves the service.
4. "Copy to division..." -- opens a submenu listing other divisions (e.g., if on Automotive, shows Marine/Fleet/RV). Creates a duplicate in the target division's matching category (or default/first category if no match).
5. Divider line
6. "Delete service" -- confirmation dialog, then Firestore delete

## Step 8: Bulk actions

When one or more checkboxes are selected, show a blue action bar between the category header and the table:
- Background: #E6F1FB
- Border-radius: var(--border-radius-md)
- Padding: 8px 14px
- Left: "[count] services selected" (font-weight 500, color #185FA5)
- Right: action links (font-size 12px, font-weight 500, color #185FA5):
  - "Adjust prices" -- opens an inline form below the action bar with: dropdown (Increase by / Decrease by / Set to), amount input, unit dropdown ($ flat / % percent), Apply button. Shows preview text: "Preview: [name] $X.XX -> $Y.YY" for each selected service.
  - "Activate" -- sets isActive: true on all selected, batch Firestore update
  - "Deactivate" -- sets isActive: false on all selected
  - "Move to..." -- same as single-service move but batch
  - "Delete" (color danger) -- confirmation with count, batch delete
  - "Clear" (color secondary) -- deselects all

## Step 9: Add new service

The "+ Add service" button in AdminTopBar and the "+ Add to category" button above the table both open the inline expansion form (same as edit, but empty fields):
- Insert an expanded form row at the TOP of the table (above all existing services)
- Category dropdown pre-selects the currently selected category (or first category if "All" is selected)
- On save: create new Firestore doc with auto-generated ID, sortOrder = 0 (pushes to top), update local state

## Step 10: Add new category

The "+" button in the category tree header:
- Appends a text input at the bottom of the category list
- Placeholder: "New category name"
- Enter to save (creates Firestore category doc with division = current division tab)
- Escape to cancel
- After save, auto-selects the new category

## Build and deploy

```bash
npm run build
npx netlify-cli deploy --prod
git add src/
git commit -m "WO-15: Services CMS reform -- category tree, inline edit, bulk actions, drag reorder"
git push origin main
```

## Do NOT:
- Touch globals.css or tailwind config
- Rewrite or modify useServices.ts or any data hooks -- reuse them as-is
- Delete the existing Firestore service/category data or seed scripts
- Change any Firestore collection names or document schemas
- Touch any other admin pages
- Touch any public-facing pages (/services, /marine, /fleet, /rv, /book)
- Install any new npm packages for drag-and-drop (use native HTML drag events)
- Make the services page file longer than 800 lines. If it exceeds that, extract the inline edit form, the category tree, and the bulk actions bar into separate components in src/components/admin/services/
