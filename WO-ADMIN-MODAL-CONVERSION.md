# WO-ADMIN-MODAL-CONVERSION: Convert Detail Panels to Large Centered Modals

## Context
All three detail panels (CustomerProfilePanel, ScheduleDetailPanel, InvoiceDetailPanel) currently slide in from the right as 480px side panels. This WO converts them to large centered modals. The modal behavior is universal -- same component, same size, same behavior regardless of whether it was triggered from a list row click, three-dot menu, global search, or dashboard drill-down.

**Repo:** gonjold/coastal-mobile-lube
**Branch:** main
**Stack:** Next.js / TypeScript / Tailwind CSS v4
**Deploy:** Netlify

## IMPORTANT RULES
- Read EVERY file mentioned in full BEFORE making any changes
- Surgical edits only. Do NOT rewrite entire files
- Do NOT touch globals.css, tailwind.config, or AdminSidebar.tsx
- Do NOT change any data fetching, Firestore queries, or business logic
- The ONLY changes are to the outer container/positioning CSS and close behavior
- Build, commit, push, deploy at the end

---

## STEP 0: Read all target files first

Read these files IN FULL before touching anything:

```
src/components/admin/CustomerProfilePanel.tsx
src/components/admin/ScheduleDetailPanel.tsx
src/components/admin/InvoiceDetailPanel.tsx
src/app/admin/page.tsx
src/app/admin/schedule/page.tsx
src/app/admin/customers/page.tsx
src/app/admin/invoicing/page.tsx
```

For each panel file, note:
1. The outermost container element and its current CSS classes (will be `fixed top-0 right-0 w-[480px] h-screen` or similar)
2. Whether there is already a backdrop/overlay element
3. The onClose prop or close handler
4. Any slide-in animation classes (translate-x, transition, etc.)

For each page file, note:
1. How the panel is conditionally rendered (what state variable controls visibility)
2. What triggers the panel to open (row click, three-dot, etc.)
3. Whether there is already a backdrop overlay rendered alongside the panel

---

## STEP 1: Convert CustomerProfilePanel.tsx

**File:** `src/components/admin/CustomerProfilePanel.tsx`

Find the outermost wrapping element. It currently looks something like this:

```tsx
<div className="fixed top-0 right-0 w-[480px] h-screen bg-white border-l border-gray-200 shadow-xl z-[60] flex flex-col">
```

There may also be a separate backdrop element either in this file or in the parent page file:

```tsx
<div className="fixed inset-0 bg-black/15 z-[55]" onClick={onClose} />
```

**Replace the entire outer structure with this pattern:**

```tsx
{/* Backdrop */}
<div
  className="fixed inset-0 bg-black/40 z-50"
  onClick={onClose}
  onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
/>
{/* Modal */}
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
  <div
    className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-[960px] h-[90vh] flex flex-col pointer-events-auto overflow-hidden"
    onClick={(e) => e.stopPropagation()}
  >
    {/* Everything inside stays exactly the same */}
  </div>
</div>
```

**Specific changes:**

1. **Remove** the old container classes: `fixed top-0 right-0 w-[480px] h-screen border-l`
2. **Remove** any slide-in animation classes like `translate-x-0`, `translate-x-full`, `transition-transform`, `duration-300`, etc.
3. **Add** the new centered modal wrapper as shown above
4. **Keep** `flex flex-col` on the inner white card (the content layout stays the same)
5. **Keep** `overflow-hidden` on the outer card -- the scrollable area should be the tab content div inside, which already has `overflow-y-auto`

**If the backdrop is rendered in the parent page file** (e.g., in `customers/page.tsx`), remove it from there. The backdrop is now part of the panel component itself.

**Add Escape key listener.** Add this useEffect inside the component:

```tsx
useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleEsc);
  return () => document.removeEventListener('keydown', handleEsc);
}, [onClose]);
```

If a similar useEffect already exists, keep it and don't duplicate.

**Close button (X):** Verify the X button in the header still works. It should call `onClose()`. No changes needed if it already does.

**Do NOT change anything inside the modal content:** header, stats bar, tabs, tab content, action buttons at the bottom -- all stay exactly the same. The only change is the outer positioning wrapper.

---

## STEP 2: Convert ScheduleDetailPanel.tsx

**File:** `src/components/admin/ScheduleDetailPanel.tsx`

Apply the exact same conversion as Step 1:

1. Find the outermost container. It will be `fixed top-0 right-0 w-[480px]` or similar.

2. Replace with the same centered modal pattern:

```tsx
{/* Backdrop */}
<div
  className="fixed inset-0 bg-black/40 z-50"
  onClick={onClose}
/>
{/* Modal */}
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
  <div
    className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-[960px] h-[90vh] flex flex-col pointer-events-auto overflow-hidden"
    onClick={(e) => e.stopPropagation()}
  >
    {/* Everything inside stays exactly the same */}
  </div>
</div>
```

3. Remove any slide-in animation classes.
4. Remove any separate backdrop element from the parent page file (`schedule/page.tsx`).
5. Add Escape key useEffect (same as Step 1).
6. Do NOT change any content, status flow buttons, or Firestore logic inside.

---

## STEP 3: Convert InvoiceDetailPanel.tsx

**File:** `src/components/admin/InvoiceDetailPanel.tsx`

Apply the exact same conversion as Steps 1 and 2:

1. Find the outermost container. Replace with centered modal pattern.
2. Remove slide-in animation classes.
3. Remove any separate backdrop from the parent page file (`invoicing/page.tsx`).
4. Add Escape key useEffect.
5. Do NOT change any content, Mark as Paid flow, or line item display inside.

Same CSS:

```tsx
{/* Backdrop */}
<div
  className="fixed inset-0 bg-black/40 z-50"
  onClick={onClose}
/>
{/* Modal */}
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
  <div
    className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-[960px] h-[90vh] flex flex-col pointer-events-auto overflow-hidden"
    onClick={(e) => e.stopPropagation()}
  >
    {/* Everything inside stays exactly the same */}
  </div>
</div>
```

---

## STEP 4: Clean up parent page files

After converting all three panels, check each parent page file for leftover backdrop elements or positioning helpers that are no longer needed.

**File: `src/app/admin/customers/page.tsx`**
- Find any `<div className="fixed inset-0 bg-black/15 ..."` or similar backdrop overlay that was rendered alongside CustomerProfilePanel
- REMOVE it (the backdrop is now inside the panel component)
- The panel render should now just be: `{selectedCustomer && <CustomerProfilePanel customer={selectedCustomer} ... onClose={() => setSelectedCustomer(null)} />}`
- No wrapper div, no backdrop, no positioning -- the panel handles everything itself

**File: `src/app/admin/schedule/page.tsx`**
- Same cleanup. Remove any backdrop div that was alongside ScheduleDetailPanel
- The panel render should just be: `{selectedBooking && <ScheduleDetailPanel booking={selectedBooking} ... onClose={() => setSelectedBooking(null)} />}`

**File: `src/app/admin/invoicing/page.tsx`**
- Same cleanup. Remove any backdrop div alongside InvoiceDetailPanel
- The panel render should just be: `{selectedInvoice && <InvoiceDetailPanel invoice={selectedInvoice} ... onClose={() => setSelectedInvoice(null)} />}`

**File: `src/app/admin/page.tsx`** (Dashboard)
- If CustomerProfilePanel is rendered here (from the Fix 3 drill-down work), same cleanup -- remove any separate backdrop, let the panel render standalone

---

## STEP 5: Verify z-index stacking

The modal z-index is z-50. Check that this does not conflict with:
- AdminSidebar (should be z-40 or lower)
- AdminTopBar (should be z-40)
- DashboardDrilldownModal (should be z-50 -- if a customer profile modal opens FROM a drill-down modal, the profile needs to stack above it)

**If DashboardDrilldownModal is also z-50:** Change the detail panel modals to z-[60] and their backdrops to z-[60]. This ensures the customer profile modal stacks above the drill-down modal when opened from within it.

Check the drill-down modal's z-index in `DashboardDrilldownModal.tsx`. If it is z-50 or higher, bump all three detail panel modals (CustomerProfilePanel, ScheduleDetailPanel, InvoiceDetailPanel) to z-[60] for both the backdrop and the modal container.

---

## STEP 6: Build, Commit, Push, Deploy

```bash
cd ~/coastal-mobile-lube
npm run build
```

Fix ALL TypeScript or build errors. Do not skip errors or comment out code.

```bash
git add src/
git commit -m "WO-MODAL-CONVERSION: Convert all detail panels to large centered modals (960px, 90vh)"
git push origin main
npx netlify-cli deploy --prod --message="WO-MODAL-CONVERSION: Detail panels to centered modals"
```

Verify:
1. /admin/customers -- click a customer row, large centered modal opens, backdrop behind it, X closes, Escape closes, clicking backdrop closes
2. /admin/schedule -- click a booking row, same behavior
3. /admin/invoicing -- click an invoice row, same behavior
4. /admin (dashboard) -- click a customer name in drill-down, customer profile modal opens ON TOP of the drill-down
5. Global search -- click a customer result, profile modal opens
6. Three-dot menu "View Details" on any page -- modal opens
7. All modals: content scrollable inside, backdrop dims the page, modal is visually centered

---

*End of WO-ADMIN-MODAL-CONVERSION*
