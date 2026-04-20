# WO-ADMIN-16: Fees & Promotions Page

## Objective
Create a new /admin/fees page for managing service fees, surcharges, discounts, and promotional offers. This replaces the simple fee toggle currently on the services page.

## Pre-read (MANDATORY)
Read these files in full before making any changes:
- src/components/admin/AdminSidebar.tsx (to add the new nav item)
- src/app/admin/services/page.tsx (to understand how the current fee toggle works and what Firestore path it uses)
- src/components/admin/services/FeeSettings.tsx (if this exists -- it was extracted during WO-15)
- src/components/admin/services/InlineEditForm.tsx (reference the inline expansion pattern)

## Step 1: Create the page file

Create src/app/admin/fees/page.tsx

This is a full-width page (no category tree panel needed -- not enough items to justify a second panel). The content area gets the full width between the sidebar and the right edge.

## Step 2: Update AdminSidebar.tsx

In the WEBSITE section of the sidebar, update the "Service Fees" nav item:
- Change label to "Fees & Promos"
- Change route to /admin/fees
- Keep the same percent/slash SVG icon from the collapsed sidebar

## Step 3: Firestore data structure

Fees and promos store in Firestore at settings/fees with this structure:

```
settings/fees: {
  fees: [
    {
      id: "mobile-service-fee",
      name: "Mobile service fee",
      type: "flat",           // "flat" | "percentage" | "per-mile"
      amount: 39.95,
      appliesTo: "all",       // "all" | "automotive" | "marine" | "fleet" | "rv"
      customerType: "all",    // "all" | "residential" | "commercial"
      conditions: {
        timeOfDay: null,      // { before: "07:00", after: "17:00" } or null
        daysOfWeek: null,     // ["saturday", "sunday"] or null
        minDistance: null,     // number (miles) or null
        minOrder: null        // number ($) or null
      },
      showOnBooking: true,
      isActive: true,
      sortOrder: 0
    }
  ],
  promos: [
    {
      id: "grand-opening-10",
      name: "Grand opening - 10% off first service",
      type: "percentage",     // "percentage" | "flat" | "waive-fee" | "free-service"
      value: 10,
      waivesFeeId: null,      // fee ID string if type is "waive-fee", null otherwise
      appliesTo: "all",
      customerType: "new",    // "all" | "new" | "returning" | "commercial"
      code: "WELCOME10",      // promo code string or null (null = auto-apply)
      autoApply: false,
      startDate: "2026-04-20",
      endDate: "2026-05-31",  // null = no expiration
      showAs: "banner",       // "banner" | "popup" | "badge" | "none"
      usageCount: 0,
      isActive: true,
      sortOrder: 0
    }
  ]
}
```

Migrate any existing fee data from the current location (check what FeeSettings.tsx or the services page currently reads/writes) into this new structure. Keep backward compatibility -- if the old fee toggle data exists, read it and display it, but save in the new format going forward.

## Step 4: Page layout and AdminTopBar

AdminTopBar:
- Title: "Fees & promotions"
- Subtitle: "Manage service fees, surcharges, and promotional discounts"
- Right side: "+ Add new" button (navy bg, white text)

Below AdminTopBar: Tab pills row
- Background: var(--color-background-primary)
- Border-bottom: 1px solid #E2E8F0
- Tab pill container: background var(--color-background-secondary), border-radius var(--border-radius-md), padding 3px, width fit-content
- Two tabs: "Service fees ([count])" and "Promotions ([count])"
- Active tab: background white, border 0.5px solid var(--color-border-tertiary), border-radius 6px, font-weight 500, color var(--color-text-primary)
- Inactive tab: no bg, no border, color var(--color-text-secondary)

## Step 5: Service fees tab -- collapsible fee cards

Each fee renders as a card. All cards are COLLAPSED by default (showing only the summary row). Click anywhere on the card (except the toggle) to expand/collapse.

**Card (collapsed state):**
- Background: var(--color-background-primary)
- Border: 1px solid #E2E8F0
- Border-radius: var(--border-radius-lg)
- Padding: 14px 18px
- Margin-bottom: 10px
- Display: flex, align-items center, justify-content space-between
- Left side: icon (36x36 rounded box with colored bg) + name (14px, font-weight 500) + subtitle (12px, color secondary: condition summary + type)
- Right side: amount display (16px, font-weight 500) + active toggle (34x18)
- Cursor: pointer on the whole card
- Chevron indicator: small down arrow on the far right (rotates up when expanded)

**Icon colors by fee type:**
- Flat rate ($): blue bg #E6F1FB, blue icon color #185FA5
- Percentage (%): amber bg #FAEEDA, amber icon color #854F0B
- Per mile (mi): teal bg #E1F5EE, teal icon color #0F6E56

**Card (expanded state):**
- Card border changes to 1px solid #CBD5E1 (slightly stronger)
- Chevron rotates up
- Below the summary row, a detail section expands with border-top 1px solid #E2E8F0 and padding-top 14px
- Detail section contains the edit form (inline, not a modal)

**Expanded edit form fields:**
- Row 1: Fee name (flex: 2) + Amount (flex: 1) with type selector ($ / % / per-mile) as a prefix/suffix toggle inside the input
- Row 2: Applies to division dropdown + Customer type dropdown (side by side)
- Row 3: Conditions section
  - Label: "Conditions (optional)"
  - Chip buttons for each possible condition: "+ Time of day", "+ Day of week", "+ Distance", "+ Min order"
  - If a condition is active, the chip shows as filled (blue bg) with the value and an X to remove
  - Clicking an inactive chip reveals a small inline input for that condition's value
  - Time of day: two time inputs (before/after) -- "Applies before [07:00] or after [17:00]"
  - Day of week: checkbox group (Mon-Sun)
  - Distance: number input + "miles from base" label
  - Min order: number input with $ prefix
- Row 4: Radio buttons -- "Show on booking summary" (Yes, as line item / No, internal only)
- Action bar (border-top, padding-top 12px): "Delete fee" (danger, left) + Cancel + Save (navy, right)

**Only ONE card expanded at a time.** Expanding a card collapses any other open card.

## Step 6: Promotions tab -- same card pattern

Same collapsible card layout as fees, with promo-specific fields.

**Card (collapsed state):**
- Icon: green bg #EAF3DE, green icon color #3B6D11 (all promos use green)
- Name + subtitle (customer type + date range or "No expiration")
- Right side: status pill + active toggle
- Status pill logic:
  - "Active" (green pill) if isActive && (no endDate || endDate >= today)
  - "Scheduled" (blue pill) if isActive && startDate > today
  - "Expired" (gray pill) if endDate < today
  - "Inactive" (no pill, just the off toggle)

**Expanded edit form fields:**
- Row 1: Promo name (full width)
- Row 2: Type dropdown (Percentage discount / Flat discount / Waive fee / Free service) + Value input
  - If type is "waive-fee": value input is replaced by a dropdown of existing active fees (by name)
  - If type is "free-service": value input is replaced by a text input for which service
- Row 3: Applies to division dropdown + Customer type dropdown (All / New customers / Returning / Commercial)
- Row 4: Promo code input (placeholder "Leave empty for auto-apply") + Auto-apply checkbox
  - If auto-apply is checked, promo code input is disabled and cleared
- Row 5: Date range -- Start date input + End date input (or "No expiration" checkbox that disables end date)
- Row 6: Display dropdown -- How to show on public site: Banner on homepage / Popup / Badge on services / None (internal only)
- Row 7: Usage count display (read-only): "Used [X] times" with a "Reset count" link
- Action bar: same as fees (Delete promo / Cancel / Save)

## Step 7: Add new flow

"+ Add new" button in AdminTopBar opens a small dropdown: "Service fee" or "Promotion"

Selecting one:
- Switches to the appropriate tab
- Inserts a new expanded card at the TOP of the list with empty fields
- Card has a subtle blue-tinted left border (2px solid #2563EB) to indicate it's new
- Focus goes to the name input

## Step 8: Remove old fee settings from services page

After the fees page is working:
- Remove the FeeSettings section/component from /admin/services (or the services page.tsx)
- Remove the "Service Fees" anchor link if one exists
- The services page should ONLY manage services and categories, not fees

## Build and deploy

```bash
npm run build
npx netlify-cli deploy --prod
git add src/
git commit -m "WO-16: Fees & Promotions admin page with collapsible cards and inline editing"
git push origin main
```

## Do NOT:
- Touch globals.css or tailwind config
- Modify any public-facing pages
- Change the services page UI (only remove the fee settings section from it)
- Install any new npm packages
- Touch the QuickBooks or invoicing code
- Break the booking wizard's fee calculation (verify it still reads fee data correctly after the Firestore restructure)
