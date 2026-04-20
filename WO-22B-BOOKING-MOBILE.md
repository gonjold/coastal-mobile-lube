# WO-22b: Booking Wizard Desktop Dropdown Fix + Mobile Responsiveness

**Project:** Coastal Mobile Lube & Tire
**Scope:** Booking wizard ONLY. Not the rest of the site.
**Estimated time:** 35-50 min
**Prerequisite:** WO-22 (sidebar hide on Step 1) deployed clean.

---

## CONTEXT

Two issues to fix in this WO:

1. **DESKTOP BUG (priority):** On Step 1, the Model and Fuel Type dropdown menus open downward and overflow the modal bottom edge. The Model dropdown gets clipped and the Skip text shows behind it (z-index broken). The Fuel Type dropdown also gets clipped. Year and Make dropdowns are fine because they have room below.

2. **MOBILE RESPONSIVENESS:** The booking wizard works on desktop after WO-22, but breaks down on mobile. Sidebar wastes space, dropdowns don't stack cleanly, modal feels oversized and cramped at the same time.

This WO does ONE focused pass on both. Sitewide mobile is a separate future sprint.

---

## SCOPE

### IN
- `src/components/BookingWizardModal.tsx`
- `src/components/booking/VehicleSelector.tsx`
- Any sub-components rendered inside the wizard
- Tailwind responsive breakpoints (sm: 640px, md: 768px, lg: 1024px)

### OUT
- Any page outside `/book` and the booking modal
- Admin portal
- Any copy changes (visual layout only)
- Any new features
- Any new dependencies (no Radix, no Headless UI, no floating-ui — solve with vanilla CSS/React)

---

## TARGET BREAKPOINTS

Test and verify at:
- 375px (iPhone SE / mini)
- 390px (iPhone 14/15)
- 414px (iPhone Plus / Pro Max)
- 768px (iPad portrait)
- 1280px+ (desktop — verify nothing regresses)

---

## STEPS

### Step 0: Inspect current state

Before writing any code:

1. Read `src/components/BookingWizardModal.tsx` in full.
2. Read `src/components/booking/VehicleSelector.tsx` in full.
3. Read any other components rendered inside the wizard.
4. Identify:
   - How dropdowns are currently positioned (absolute? relative? portal?)
   - Where the sidebar lives and how it's laid out
   - Where the action buttons (Back / Continue) sit in the DOM
   - Whether the vehicle dropdowns are in a grid or flex
5. Print a brief summary of findings before editing.

This pre-flight read prevents blind edits.

---

### Step 1: FIX DESKTOP DROPDOWN OVERFLOW (priority)

The dropdowns in `VehicleSelector.tsx` open downward and get clipped by the modal bottom. Fix with collision detection: dropdown should flip upward when there's not enough space below.

**Implementation pattern (no new dependencies):**

In each dropdown component (Year / Make / Model / Fuel Type), add a `useRef` to the trigger button and a `useState` for `dropdownDirection: 'down' | 'up'`. On open, calculate:

```javascript
const triggerRect = triggerRef.current.getBoundingClientRect();
const spaceBelow = window.innerHeight - triggerRect.bottom;
const spaceAbove = triggerRect.top;
const dropdownMaxHeight = 280;

if (spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow) {
  setDropdownDirection('up');
} else {
  setDropdownDirection('down');
}
```

Then conditionally apply Tailwind classes to the dropdown panel:

- `down`: `top-full mt-1` (current behavior)
- `up`: `bottom-full mb-1` (flips above the trigger)

**Also:**
- Add `max-h-[280px] overflow-y-auto` to the dropdown panel so the internal list scrolls instead of pushing the panel taller than the available space
- Bump the dropdown panel z-index to `z-50` so it sits above sibling elements (fixes the "Skip text showing behind dropdown" bug)
- Recalculate direction on window resize while dropdown is open (use `useEffect` with resize listener)

**Verify on desktop:**
- Year dropdown opens DOWN (top row, plenty of space below)
- Make dropdown opens DOWN (top row, plenty of space below)
- Model dropdown opens UP (bottom row, not enough space below)
- Fuel Type dropdown opens UP (bottom row, not enough space below)
- No dropdown menu is ever clipped by the modal edge
- No dropdown menu shows behind sibling text/links

---

### Step 2: Modal container — full-screen on mobile

The wizard modal is currently a centered overlay with margins. On mobile under 640px, it should be full-screen edge-to-edge.

**Change:**
- Modal wrapper: `max-w-2xl mx-auto rounded-2xl` (or whatever it currently is) becomes `w-full h-full sm:max-w-2xl sm:mx-auto sm:h-auto sm:rounded-2xl sm:my-8`
- No rounded corners on mobile (full bleed)
- No vertical margins on mobile (uses full viewport height)
- Backdrop padding goes to `p-0 sm:p-4`

---

### Step 3: Hide sidebar on mobile, replace with sticky footer summary

The "YOUR SELECTION" sidebar burns half the viewport on mobile. Kill it on mobile entirely and replace with a sticky footer bar at the bottom of the wizard that shows:
- Compact selection summary on the left (e.g. "2 services selected · $185 est." — just truncate gracefully if no selection)
- Back button + Continue button on the right

**Change:**
- Sidebar wrapper: add `hidden lg:block` so it only shows at lg breakpoint and up
- Form column: should be full width on mobile, current width on lg+ (`w-full lg:w-2/3` or whatever the current ratio is)
- Add a new sticky footer component INSIDE the modal, only visible on mobile: `fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 z-10`
- Footer content:
  - Left: small text showing service count + estimated total (or step name if Step 1 with no selection)
  - Right: Back button (ghost) + Continue button (primary navy `#0B2040`, orange `#E07B2D` when active CTA)
- Form content area needs bottom padding on mobile so the sticky footer doesn't cover it: `pb-24 lg:pb-0`

Pull the existing Back/Continue button logic and reuse it — do NOT duplicate state. The footer buttons should call the same handlers as the desktop sidebar buttons. On lg+ the desktop sidebar buttons remain active; on mobile the footer takes over.

---

### Step 4: Vehicle selector — 2x2 grid on mobile

Currently the 4 dropdowns are in a 2x2 grid on desktop. Make them a clean 2x2 grid on all breakpoints, with the dropdown collision detection from Step 1 ensuring nothing clips on mobile either.

**Change in `VehicleSelector.tsx`:**
- Dropdowns container: `grid grid-cols-2 gap-3 md:gap-4`
- Each dropdown: full width within its grid cell (`w-full`)
- Skip option text: should wrap cleanly on mobile, no horizontal scroll
- VIN input: full width on mobile
- "Been here before?" lookup link: stays inline, smaller text on mobile (`text-sm`)

---

### Step 5: Step indicator / progress bar

If the step indicator currently squishes or wraps awkwardly on mobile:
- Reduce label text on mobile (just numbers, no labels) OR keep labels but make them `text-xs` and tighten gaps
- Connector lines between steps: thinner on mobile (`h-0.5` instead of `h-1`)
- Container: `px-4 sm:px-6` for breathing room

---

### Step 6: Touch targets and spacing audit

For every interactive element inside the wizard:
- Minimum touch target: 44px height. If buttons or list items are smaller, bump to `min-h-[44px]`
- Service cards (Step 2): full width on mobile, current grid on tablet+ (`grid-cols-1 sm:grid-cols-2`)
- Date picker tiles: ensure they're tappable, not crammed
- Time slot buttons: 2 columns on mobile, more on desktop (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4`)
- Contact form inputs: full width, 16px font minimum
- Address autocomplete: full width, results dropdown anchored properly (apply same flip-up logic from Step 1 if needed)

---

### Step 7: Form input font size (prevent iOS zoom)

iOS Safari zooms in when an input has font-size below 16px. Audit every `<input>`, `<select>`, `<textarea>` in the wizard:
- Ensure `text-base` (16px) minimum on mobile
- Can be smaller on desktop if design calls for it: `text-sm md:text-base`

---

### Step 8: Step-by-step mobile pass

Walk each step manually:

**Step 1 (Vehicle):**
- YMM/VIN toggle pills: tappable, 44px+
- 2x2 dropdown grid
- Dropdowns flip upward when in bottom row OR near viewport bottom
- Skip banner: full width, readable
- VIN input: full width when in VIN mode
- "Been here before?" link: visible without scrolling

**Step 2 (Services):**
- Service cards: 1 column, full width
- Add/Remove tap targets clear
- Category filter (Automotive / Marine / RV / Fleet): horizontal scroll or wrap cleanly, no squish
- "Bundle and save with Coastal Packages" expander: full width, tappable

**Step 3 (Details):**
- Name fields stack 1 column on mobile
- Phone / Email stack 1 column on mobile
- Date picker + Time picker stack 1 column on mobile
- "Best way to reach you" pills (Call / Text / Email): full width, equal sized
- Service Address input: full width with autocomplete

**Step 4 (Review):**
- Vehicle confirmation card: full width, clear hierarchy
- Service summary: full width, items list cleanly
- Total / breakdown: easy to scan
- Final Submit button: full width, sticky at bottom (or in the new mobile footer)

---

### Step 9: Build, test, commit, deploy

1. Run `npm run build` and confirm zero errors.
2. `git add src/`
3. `git commit -m "WO-22b: booking wizard dropdown fix + mobile responsiveness"`
4. `git push`
5. `npx netlify-cli deploy --prod` (no `--dir` flag)

---

## ACCEPTANCE CRITERIA

### Desktop (1280px+)
- [ ] Year and Make dropdowns open DOWNWARD (top row)
- [ ] Model and Fuel Type dropdowns open UPWARD (bottom row, no clipping)
- [ ] No dropdown menu is clipped by the modal edge
- [ ] No dropdown menu shows behind sibling text or links (z-index correct)
- [ ] Sidebar still works on Steps 2, 3, 4 as before
- [ ] All other wizard layout unchanged from post-WO-22 state

### Mobile (375px-414px, verify on actual phone or Chrome DevTools)
- [ ] Modal goes full-screen on mobile, no awkward margins or rounded corners at the edges
- [ ] "YOUR SELECTION" sidebar is hidden on mobile, replaced with a sticky bottom footer
- [ ] Footer shows compact summary + Back + Continue buttons, all reachable with thumb
- [ ] Vehicle dropdowns sit in a clean 2x2 grid on mobile
- [ ] Vehicle dropdowns flip upward when needed
- [ ] No horizontal scroll on any step
- [ ] All inputs are 16px minimum (no iOS zoom on focus)
- [ ] Service cards stack 1 column on mobile
- [ ] Time slots stack 2 columns on mobile
- [ ] Step indicator doesn't break or wrap awkwardly at 375px
- [ ] All buttons are at least 44px tall
- [ ] Final Continue / Submit button on Step 4 is reachable without hunting

---

## DO NOT

- Do NOT rewrite `BookingWizardModal.tsx` from scratch. Surgical Tailwind class changes + the new sticky footer block + the dropdown flip-direction logic only.
- Do NOT touch the booking wizard logic, state management, or data flow. Visual layout + dropdown positioning only.
- Do NOT change any copy.
- Do NOT add new dependencies.
- Do NOT touch any page outside the booking wizard.
- Do NOT touch the admin portal.

---

## ROLLBACK

If anything breaks the desktop wizard or the booking flow itself:

```
git revert HEAD
git push
npx netlify-cli deploy --prod
```
