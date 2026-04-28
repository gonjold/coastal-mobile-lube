# UI Pipeline Diagnosis — 2026-04-28

## Bug 1: Invoice row dropdown
- **Component file:** `src/app/admin/invoicing/page.tsx`
- **Line range:** 1341–1400 (Actions cell); menu items at 1367–1396
- **Currently rendering:** All 4 items render unconditionally — View Details (1367–1372), Edit Invoice (1373–1380), Mark as Paid (1381–1388), Delete Invoice (1389–1396).
- **Currently hidden by condition:** None. The pattern already follows disabled-not-hidden (uses `disabled` prop + `text-gray-300 cursor-not-allowed` styling).
- **Dropdown library:** Custom — plain `<button>` elements inside an absolute-positioned `<div>` toggled by `actionMenuId === inv.id`. The 3-dot icon is `&#8942;` (U+22EE Vertical Ellipsis), not lucide-react. That's why the standard `MoreHorizontal`/`MoreVertical`/`DropdownMenu` greps in the WO returned nothing.
- **Why production shows only 2 items:** All 4 DOM nodes are present, but the disable conditions are over-aggressive and combine with very light disabled styling (`text-gray-300`) so disabled items look absent. For a typical paid+QB-synced invoice, three of four items are disabled simultaneously:
  - `editDisabled = isPaid && qbSynced`
  - `markPaidDisabled = isPaid`
  - `deleteDisabled = qbSynced || isPaid`
  
  Per WO Step 2 spec, Delete must be **always enabled** (it's a soft-delete that skips QB sync) and Edit's disable should be `paid || void` rather than `paid && qbSynced`. Tightening these brings the visible-action count up to the spec.
- **Status enum:** `"draft" | "sent" | "paid" | "overdue"` — there is **no `"void"` status** in this codebase. Per WO "If your status enum differs, use the equivalent": no equivalent exists, so the void check is omitted.

## Bug 2: Vehicle delete
- **Component file:** `src/components/admin/CustomerProfilePanel.tsx`
- **Confirmation prompt:** inline (not a modal), lines 916–940 inside `VehiclesTab`. "Remove?" text on line 918, No button at 919–924, Yes button at 925–930.
- **Handler function:** **There is none.** The "Yes" button on line 925 has `onClick={() => setRemovingVehicle(null)}` — identical to the No button. It only clears local prompt state. No Firestore call. This is **Case C** (handler never fires) compounded by the handler simply not existing.
- **Storage model:** **Neither subcollection nor array field.** Vehicles are a *derived* list — `vehicles` is a `useMemo` (lines 148–155) that aggregates `vehicleYear/vehicleMake/vehicleModel` (or vessel equivalents) from the customer's bookings via `getVehicleName(b)`. Add Vehicle (lines 871–897) creates a *synthetic booking* with `vehicleMake` set and `notes: "Vehicle added from customer profile"`.
- **Why delete silently fails:** The Yes button has no delete code path at all — it dismisses the prompt and nothing else.
- **Refresh mechanism (already in place):** Parent `src/app/admin/customers/page.tsx` line 287–288 uses `onSnapshot` on the bookings collection. Any Firestore mutation auto-refreshes the panel's `bookings` prop and re-derives the vehicles list. So whichever fix we choose, no manual state refresh is needed.

### **AMBIGUITY — Case E (not covered by WO Cases A–D)**
The WO assumes vehicles are either (A) a subcollection or (B) an array field on the customer doc. They are neither. Four reasonable approaches:

| Option | Approach | Cost | Risk |
|---|---|---|---|
| **E1** | Clear vehicle fields on all bookings whose `getVehicleName(b)` matches the deleted vehicle (set `vehicleMake/Model/Year` and vessel equivalents to `null`) | Touches 1 file; simple Firestore batch | Booking history loses vehicle context (vehicle column on past bookings becomes blank) |
| **E2** | Delete only synthetic bookings (notes === "Vehicle added from customer profile") matching the vehicle | Touches 1 file | Vehicle won't actually disappear if any *real* booking references it — feels broken to the user |
| **E3** | Hybrid: hard-delete synthetic bookings + clear vehicle fields on real bookings | Touches 1 file | Same as E1 for real bookings, but cleaner data |
| **E4** | Add a `hiddenVehicles` array on the customer doc (requires plumbing the customer doc id into `CustomerProfilePanel`) | Touches 2+ files; broader change | Most "correct" model but biggest blast radius — out of spirit of a surgical WO |

**Recommendation:** E3. It removes the vehicle from the UI in all cases, preserves real booking records, and matches the user's mental model ("Remove this vehicle from this customer"). The Firestore writes are scoped to bookings already loaded into the panel — no extra queries.

## Bug 3: Schedule row dropdown
- **Component file:** `src/app/admin/schedule/page.tsx`
- **Line range:** 627–702 (Actions cell); menu items 637–699.
- **Same pattern as Bug 1?** Yes — same custom `&#8942;` 3-dot trigger, same `actionMenuId` toggle, same disabled-not-hidden styling. **However the schedule menu is already correct:**
  - View Details — always enabled
  - Confirm — disabled when not pending/new-lead/lead (sensible)
  - Mark as Dead — always shown, opens an inline reason submenu
  - Cancel — disabled when status is already cancelled/dead (sensible)
  - Delete — always enabled

  All five items render unconditionally. Disable conditions are scoped tightly (no over-disabling). **No changes required.**

## Files I will edit in Step 2
- `src/app/admin/invoicing/page.tsx` — adjust disable conditions for the row dropdown (Bug 1)

## Files pending direction (Step 3)
- `src/components/admin/CustomerProfilePanel.tsx` — pending Jon's pick between E1 / E2 / E3 / E4 above

## Files I will NOT touch (confirmation)
- src/components/admin/InvoiceDetailPanel.tsx
- src/app/globals.css
- tailwind.config.*
- functions/**
