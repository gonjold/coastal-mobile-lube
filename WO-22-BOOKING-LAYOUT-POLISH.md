# WO-22: Booking Wizard Step 1 Layout Polish

**Goal:** Fix the scrolling issue on desktop. The "YOUR SELECTION" sidebar is showing on Step 1 (Vehicle) where nothing has been selected yet, which eats horizontal space and forces the vehicle form to become taller. On Step 1 only, hide the sidebar and let the form take full modal width. Sidebar reappears on Step 2+.

**Expected execution time:** 10-15 minutes.
**Files touched:** 1-2 files (the booking wizard modal layout).

---

## Step 1: Read the current layout

```bash
cd ~/coastal-mobile-lube
cat src/components/BookingWizardModal.tsx
grep -n "YOUR SELECTION\|Your Selection\|selection" src/components/BookingWizardModal.tsx
grep -rn "YOUR SELECTION" src/
```

Identify:
- Where the right sidebar with "YOUR SELECTION" is rendered
- How the current step is tracked (likely a `step` state variable with values 1-4)
- How the two-column grid layout is structured (likely a `grid grid-cols-1 lg:grid-cols-[1fr_320px]` or similar Tailwind pattern)

Print the relevant sections before making changes.

## Step 2: Conditional sidebar rendering

Target behavior:
- On Step 1 (Vehicle): single-column layout, form takes full width up to a max-width (600-720px), centered
- On Steps 2, 3, 4: existing two-column layout with sidebar visible

Cleanest implementation:

```tsx
// In BookingWizardModal.tsx, around the main content grid

<div className={`grid gap-6 ${
  step === 1
    ? 'grid-cols-1 max-w-2xl mx-auto'
    : 'grid-cols-1 lg:grid-cols-[1fr_320px]'
}`}>
  <div>
    {/* Step content — VehicleSelector, ServicesStep, DetailsStep, ReviewStep */}
  </div>

  {/* Sidebar: only render on steps 2+ */}
  {step > 1 && (
    <aside className="...existing sidebar classes...">
      {/* YOUR SELECTION content */}
    </aside>
  )}
</div>
```

Match the exact Tailwind class names already in use — do not introduce new design tokens.

## Step 3: Tighten vertical spacing in VehicleSelector

If the vehicle form is still tall enough to scroll on a standard 1440x900 viewport after Step 2, apply these surgical tweaks in `src/components/booking/VehicleSelector.tsx`:

1. Reduce the gap between the two dropdown rows: `space-y-4` → `space-y-3` on the outer form wrapper.
2. Reduce label-to-input spacing in `SearchableDropdown`: `mb-1.5` → `mb-1` on the label.
3. Reduce vertical padding on the main card: find the `p-6 md:p-8` or similar on the card inner div, change to `p-5 md:p-6`.
4. Reduce the "Been here before?" row top spacing: `mt-6 pt-5` → `mt-4 pt-4`.

Do NOT:
- Change font sizes
- Change the modal's overall width
- Change dropdown z-index or positioning (those are fine)

## Step 4: Verify dropdown absolute positioning

The Fuel Type dropdown in screenshot 4 appeared to overlay correctly. Confirm by inspecting `SearchableDropdown` component — the dropdown panel should have `className="absolute z-50 w-full mt-1.5 ..."`. If any of these are missing, add them:

- `absolute` (so it overlays instead of pushing content)
- `z-50` (so it stacks above adjacent fields)
- Positioned relative to its wrapper which must have `className="relative"`

## Step 5: Build, commit, push, deploy

```bash
cd ~/coastal-mobile-lube
npm run build
git add src/components/BookingWizardModal.tsx src/components/booking/VehicleSelector.tsx
git commit -m "WO-22: Hide Your Selection sidebar on Step 1, tighten vehicle form spacing

- Sidebar only renders on Step 2+ (nothing to select on vehicle step)
- Step 1 form uses single-column centered layout, max-w-2xl
- Reduced vertical spacing in VehicleSelector: labels, rows, card padding
- Fits a 1440x900 desktop viewport without scroll"
git push origin main
npx netlify-cli deploy --prod
```

## Step 6: Verify

1. Open https://coastal-mobile-lube.netlify.app in a desktop browser (DevTools dimensions: 1440x900)
2. Click "Book Service"
3. Step 1 (Vehicle) should:
   - Show NO right sidebar
   - Fit entirely in the modal without scroll
   - Center the vehicle form in the modal
4. Click through to Step 2: sidebar should reappear with "YOUR SELECTION"
5. Click Back to Step 1: sidebar disappears again
6. On a 1920x1080 desktop, Step 1 should look intentionally uncluttered, not awkwardly empty

## Do NOT

- Do NOT change the step indicator / progress bar
- Do NOT touch anything on Steps 2, 3, 4
- Do NOT use `git add -A`
- Do NOT change the VehicleSelector component's core logic, only spacing tweaks from Step 3
