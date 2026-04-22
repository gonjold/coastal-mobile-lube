# PASS 1 — Automotive Booking Services Inventory

**Source:** `src/data/pricingCatalog.ts` (auto division)
**Snapshot date:** 2026-04-22
**Used by:** Booking wizard Step 2 (Automotive tab), homepage service cards, `/services` page

This is the canonical list of every automotive category with all sub-options and current prices, as exposed by the booking wizard. WO-29 Pass 3 split these categories into **primary** (always inline) and **secondary** (collapsed under "Looking for something specific?") in the Automotive tab.

Pricing in this file is sourced from the seed catalog. Live prices in the booking wizard come from Firestore `services` and may differ if Jon has edited them via the admin pricing editor.

---

## Primary categories (always visible in Automotive tab)

### 1. Oil Changes
**Starting at:** $89.95 · **displayOrder:** 1
**Description:** Conventional, synthetic blend, full synthetic, and diesel oil changes with bundle options including tire rotation and additive packages.

**Standalone**
| Item | Price | Note |
|---|---|---|
| Synthetic Blend | $89.95 | Up to 5 qts |
| Full Synthetic | $119.95 | Up to 5 qts |
| Diesel Oil Change | $219.95 | |

**Bundles — Synthetic Blend**
| Item | Price | Note |
|---|---|---|
| Syn Blend Basic | $119.95 | Oil + rotation |
| Syn Blend Better | $139.95 | Basic + MOA additive |
| Syn Blend Best | $179.95 | Basic + MOA + fuel additives |

**Bundles — Full Synthetic**
| Item | Price | Note |
|---|---|---|
| Full Syn Basic | $149.95 | Oil + rotation |
| Full Syn Better | $169.95 | Basic + MOA additive |
| Full Syn Best | $209.95 | Basic + MOA + fuel additives |

**Bundles — Diesel**
| Item | Price | Note |
|---|---|---|
| Diesel Basic | $259.95 | Oil + rotation |
| Diesel Better | $269.95 | Basic + MOA additive |
| Diesel Best | $309.95 | Basic + MOA + fuel additives |

**Add-Ons**
| Item | Price |
|---|---|
| Semi Syn per qt over 5 | $7 |
| Full Syn per qt over 5 | $12 |

---

### 2. Tire/Wheel
**Starting at:** $39.95 · **displayOrder:** 5
**Description:** Complete tire and wheel services including mount & balance, rotation, TPMS replacement, patching, and road force balancing.

| Item | Price | Note |
|---|---|---|
| Mount and Balance Single | $49.95 | |
| Mount and Balance 4 Tires | $159.95 | |
| Aftermarket/Oversized M&B | $50 | Additional per tire |
| Replace TPMS/Valve Stem | $69.95 | |
| Tire Patch | $69.95 | |
| Tire Rotation | $39.95 | |
| Tire Rotation Oversized | $59.95 | |
| Rotate and Balance | $89.95 | |
| Rotate and Balance Oversized | $119.95 | |
| Road Force Balance | $199.95 | |

---

### 3. Brakes
**Starting at:** $320 · **displayOrder:** 6
**Description:** Complete brake services including pad replacement and rotor resurfacing for standard vehicles, transit vans, and dually trucks.

| Item | Price | Note |
|---|---|---|
| Front and Rear Brake Job | $320 | Includes pads and resurfacing rotors |
| Transit Front and Rear | $450 | |
| Dually Front Brake Job | $450 | |
| Dually Rear Brake Job | $720 | |

---

### 4. Basic Maintenance
**Starting at:** $34.95 · **displayOrder:** 4
**Description:** Essential vehicle maintenance including battery replacement, wiper blades, air filters, cabin filters, and diesel fuel filters.

| Item | Price | Note |
|---|---|---|
| Battery Replacement | $50 | Labor only; some makes $100 (0.5 hr) |
| Front Wiper Blades | $79.95 | |
| Rear Wiper Blade | $34.95 | |
| Engine Air Filter | $79.95 | |
| Diesel Air Filter | $119.95 | |
| Cabin Air Filter | $99.95 | |
| Cabin Air Filter w/ Frigi Fresh | $129.95 | |
| Diesel Fuel Filters | $399.95 | |

---

## Secondary categories (collapsed behind "Looking for something specific?")

### 5. Wynns Fluid Services
**Starting at:** $29.95 · **displayOrder:** 2
**Description:** Professional Wynns fluid exchange and treatment services for all vehicle systems including transmission, coolant, brake, power steering, and fuel.

| Item | Price |
|---|---|
| A/C Evaporator Service | $259.95 |
| Battery Service | $79.95 |
| Brake Flush | $239.95 |
| Coolant Flush | $269.95 |
| Ethanol Service | $29.95 |
| Front Differential Flush | $269.95 |
| Rear Differential Flush | $269.95 |
| Fuel Additive | $42.11 |
| Fuel Induction Service | $239.95 |
| MOA Additive | $29.95 |
| Power Steering Flush | $219.95 |
| Stop Squeal | $297.95 |
| Throttle Body Service | $129.95 |
| Transfer Case Flush | $249.95 |
| Transmission Auto Flush | $419.95 |
| Transmission Manual Flush | $249.95 |

---

### 6. Wynns Diesel Services
**Starting at:** $49.95 · **displayOrder:** 3
**Description:** Specialized Wynns diesel maintenance services including injection cleaning, coolant flush, and differential services for heavy-duty trucks.

| Item | Price |
|---|---|
| Diesel Injection Service | $439.95 |
| Diesel MOA | $49.95 |
| Dual Coolant Flush (Diesel) | $499.95 |
| F250+ Frt Diff Flush | $299.95 |
| F250+ Rear Diff Flush | $299.95 |
| F450-550 Rear Diff Flush | $399.95 |

---

### 7. HVAC
**Starting at:** $299.99 · **displayOrder:** 7
**Description:** Automotive HVAC evacuation and recharge services to restore air conditioning performance.

| Item | Price |
|---|---|
| EVAC and Recharge HVAC | $299.99 |

---

## Internal-only (not exposed in booking wizard)

### Customer Pay Labor Rates
**displayOrder:** 99 · **displayOnSite:** false (filtered out by `/labor\s*rate/i.test(c.name)` on homepage and by `displayOnSite: false` on services page)

| Item | Price | Note |
|---|---|---|
| Gas | $185 | Per hour |
| Diesel | $199 | Per hour |
| EV/Hybrid | $199 | Per hour |
| Gas Maintenance | $165 | Per hour |
| Diesel Maintenance | $175 | Per hour |

---

## Pass 3 partition logic (Automotive tab only)

From `src/components/BookingWizardModal.tsx`:

```ts
const isPrimary = (cat: string) =>
  /^oil/i.test(cat) ||
  /tire/i.test(cat) ||
  /^brake/i.test(cat) ||
  /basic\s*(general\s*)?maint/i.test(cat);
```

- **Primary** (rendered inline, in catalog displayOrder):
  Oil Changes → Tire/Wheel → Brakes → Basic Maintenance
- **Secondary** (rendered inside collapsible "Looking for something specific?" panel):
  Wynns Fluid Services, Wynns Diesel Services, HVAC, Other (any uncategorized items)

Marine and Fleet tabs are **untouched** — they continue to use the prior render path (with `fuelCategory === "diesel"` promote-to-top behavior preserved for Marine/Fleet diesel selections).
