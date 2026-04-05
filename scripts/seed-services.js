#!/usr/bin/env node

/**
 * Firestore Seed Script — Services & Categories
 *
 * Reads the existing pricingCatalog data and seeds Firestore with:
 *   - 'services' collection  (one doc per ServiceItem)
 *   - 'serviceCategories' collection (one doc per ServiceCategory)
 *
 * Usage:
 *   node scripts/seed-services.js
 *
 * Auth: uses Application Default Credentials.
 *   Run `gcloud auth application-default login` first, or set
 *   GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON path.
 */

const admin = require("firebase-admin");

// ── Firebase Admin init ────────────────────────────────────
admin.initializeApp({
  projectId: "coastal-mobile-lube",
});

const db = admin.firestore();

// ── Pricing catalog (inline from src/data/pricingCatalog.ts) ──
// We duplicate the data here so the seed script is standalone Node.js
// and doesn't require TypeScript compilation.

const pricingCatalog = [
  // ── AUTO: Oil Changes ──
  {
    id: "auto-oil-changes",
    name: "Oil Changes",
    division: "auto",
    description:
      "Conventional, synthetic blend, full synthetic, and diesel oil changes with bundle options including tire rotation and additive packages.",
    startingAt: 89.95,
    displayOrder: 1,
    items: [
      { id: "auto-oc-synthetic-blend", category: "Oil Changes", subcategory: "Standalone", name: "Synthetic Blend", price: 89.95, note: "Up to 5 qts", division: "auto", displayOnSite: true, displayOrder: 1 },
      { id: "auto-oc-full-synthetic", category: "Oil Changes", subcategory: "Standalone", name: "Full Synthetic", price: 119.95, note: "Up to 5 qts", division: "auto", displayOnSite: true, displayOrder: 2 },
      { id: "auto-oc-diesel", category: "Oil Changes", subcategory: "Standalone", name: "Diesel Oil Change", price: 219.95, division: "auto", displayOnSite: true, displayOrder: 3 },
      { id: "auto-oc-syn-blend-basic", category: "Oil Changes", subcategory: "Bundles - Synthetic Blend", name: "Syn Blend Basic", price: 119.95, note: "Oil + rotation", division: "auto", displayOnSite: true, displayOrder: 4 },
      { id: "auto-oc-syn-blend-better", category: "Oil Changes", subcategory: "Bundles - Synthetic Blend", name: "Syn Blend Better", price: 139.95, note: "Basic + MOA additive", division: "auto", displayOnSite: true, displayOrder: 5 },
      { id: "auto-oc-syn-blend-best", category: "Oil Changes", subcategory: "Bundles - Synthetic Blend", name: "Syn Blend Best", price: 179.95, note: "Basic + MOA + fuel additives", division: "auto", displayOnSite: true, displayOrder: 6 },
      { id: "auto-oc-full-syn-basic", category: "Oil Changes", subcategory: "Bundles - Full Synthetic", name: "Full Syn Basic", price: 149.95, note: "Oil + rotation", division: "auto", displayOnSite: true, displayOrder: 7 },
      { id: "auto-oc-full-syn-better", category: "Oil Changes", subcategory: "Bundles - Full Synthetic", name: "Full Syn Better", price: 169.95, note: "Basic + MOA additive", division: "auto", displayOnSite: true, displayOrder: 8 },
      { id: "auto-oc-full-syn-best", category: "Oil Changes", subcategory: "Bundles - Full Synthetic", name: "Full Syn Best", price: 209.95, note: "Basic + MOA + fuel additives", division: "auto", displayOnSite: true, displayOrder: 9 },
      { id: "auto-oc-diesel-basic", category: "Oil Changes", subcategory: "Bundles - Diesel", name: "Diesel Basic", price: 259.95, note: "Oil + rotation", division: "auto", displayOnSite: true, displayOrder: 10 },
      { id: "auto-oc-diesel-better", category: "Oil Changes", subcategory: "Bundles - Diesel", name: "Diesel Better", price: 269.95, note: "Basic + MOA additive", division: "auto", displayOnSite: true, displayOrder: 11 },
      { id: "auto-oc-diesel-best", category: "Oil Changes", subcategory: "Bundles - Diesel", name: "Diesel Best", price: 309.95, note: "Basic + MOA + fuel additives", division: "auto", displayOnSite: true, displayOrder: 12 },
      { id: "auto-oc-semi-syn-extra-qt", category: "Oil Changes", subcategory: "Add-Ons", name: "Semi Syn per qt over 5", price: 7, division: "auto", displayOnSite: true, displayOrder: 13 },
      { id: "auto-oc-full-syn-extra-qt", category: "Oil Changes", subcategory: "Add-Ons", name: "Full Syn per qt over 5", price: 12, division: "auto", displayOnSite: true, displayOrder: 14 },
    ],
  },
  // ── AUTO: Wynns Fluid Services ──
  {
    id: "auto-wynns-fluid-services",
    name: "Wynns Fluid Services",
    division: "auto",
    description:
      "Professional Wynns fluid exchange and treatment services for all vehicle systems including transmission, coolant, brake, power steering, and fuel.",
    startingAt: 29.95,
    displayOrder: 2,
    items: [
      { id: "auto-wf-ac-evaporator", category: "Wynns Fluid Services", name: "A/C Evaporator Service", price: 259.95, division: "auto", displayOnSite: true, displayOrder: 1 },
      { id: "auto-wf-battery-service", category: "Wynns Fluid Services", name: "Battery Service", price: 79.95, division: "auto", displayOnSite: true, displayOrder: 2 },
      { id: "auto-wf-brake-flush", category: "Wynns Fluid Services", name: "Brake Flush", price: 239.95, division: "auto", displayOnSite: true, displayOrder: 3 },
      { id: "auto-wf-coolant-flush", category: "Wynns Fluid Services", name: "Coolant Flush", price: 269.95, division: "auto", displayOnSite: true, displayOrder: 4 },
      { id: "auto-wf-ethanol-service", category: "Wynns Fluid Services", name: "Ethanol Service", price: 29.95, division: "auto", displayOnSite: true, displayOrder: 5 },
      { id: "auto-wf-front-diff-flush", category: "Wynns Fluid Services", name: "Front Differential Flush", price: 269.95, division: "auto", displayOnSite: true, displayOrder: 6 },
      { id: "auto-wf-rear-diff-flush", category: "Wynns Fluid Services", name: "Rear Differential Flush", price: 269.95, division: "auto", displayOnSite: true, displayOrder: 7 },
      { id: "auto-wf-fuel-additive", category: "Wynns Fluid Services", name: "Fuel Additive", price: 42.11, division: "auto", displayOnSite: true, displayOrder: 8 },
      { id: "auto-wf-fuel-induction", category: "Wynns Fluid Services", name: "Fuel Induction Service", price: 239.95, division: "auto", displayOnSite: true, displayOrder: 9 },
      { id: "auto-wf-moa-additive", category: "Wynns Fluid Services", name: "MOA Additive", price: 29.95, division: "auto", displayOnSite: true, displayOrder: 10 },
      { id: "auto-wf-power-steering-flush", category: "Wynns Fluid Services", name: "Power Steering Flush", price: 219.95, division: "auto", displayOnSite: true, displayOrder: 11 },
      { id: "auto-wf-stop-squeal", category: "Wynns Fluid Services", name: "Stop Squeal", price: 297.95, division: "auto", displayOnSite: true, displayOrder: 12 },
      { id: "auto-wf-throttle-body", category: "Wynns Fluid Services", name: "Throttle Body Service", price: 129.95, division: "auto", displayOnSite: true, displayOrder: 13 },
      { id: "auto-wf-transfer-case-flush", category: "Wynns Fluid Services", name: "Transfer Case Flush", price: 249.95, division: "auto", displayOnSite: true, displayOrder: 14 },
      { id: "auto-wf-transmission-auto", category: "Wynns Fluid Services", name: "Transmission Auto Flush", price: 419.95, division: "auto", displayOnSite: true, displayOrder: 15 },
      { id: "auto-wf-transmission-manual", category: "Wynns Fluid Services", name: "Transmission Manual Flush", price: 249.95, division: "auto", displayOnSite: true, displayOrder: 16 },
    ],
  },
  // ── AUTO: Wynns Diesel Services ──
  {
    id: "auto-wynns-diesel-services",
    name: "Wynns Diesel Services",
    division: "auto",
    description:
      "Specialized Wynns diesel maintenance services including injection cleaning, coolant flush, and differential services for heavy-duty trucks.",
    startingAt: 49.95,
    displayOrder: 3,
    items: [
      { id: "auto-wd-diesel-injection", category: "Wynns Diesel Services", name: "Diesel Injection Service", price: 439.95, division: "auto", displayOnSite: true, displayOrder: 1 },
      { id: "auto-wd-diesel-moa", category: "Wynns Diesel Services", name: "Diesel MOA", price: 49.95, division: "auto", displayOnSite: true, displayOrder: 2 },
      { id: "auto-wd-dual-coolant-flush", category: "Wynns Diesel Services", name: "Dual Coolant Flush (Diesel)", price: 499.95, division: "auto", displayOnSite: true, displayOrder: 3 },
      { id: "auto-wd-f250-frt-diff", category: "Wynns Diesel Services", name: "F250+ Frt Diff Flush", price: 299.95, division: "auto", displayOnSite: true, displayOrder: 4 },
      { id: "auto-wd-f250-rear-diff", category: "Wynns Diesel Services", name: "F250+ Rear Diff Flush", price: 299.95, division: "auto", displayOnSite: true, displayOrder: 5 },
      { id: "auto-wd-f450-550-rear-diff", category: "Wynns Diesel Services", name: "F450-550 Rear Diff Flush", price: 399.95, division: "auto", displayOnSite: true, displayOrder: 6 },
    ],
  },
  // ── AUTO: Basic Maintenance ──
  {
    id: "auto-basic-maintenance",
    name: "Basic Maintenance",
    division: "auto",
    description:
      "Essential vehicle maintenance including battery replacement, wiper blades, air filters, cabin filters, and diesel fuel filters.",
    startingAt: 34.95,
    displayOrder: 4,
    items: [
      { id: "auto-bm-battery-replacement", category: "Basic Maintenance", name: "Battery Replacement", price: 50, note: "Labor only; some makes $100", laborHours: 0.5, division: "auto", displayOnSite: true, displayOrder: 1 },
      { id: "auto-bm-front-wiper-blades", category: "Basic Maintenance", name: "Front Wiper Blades", price: 79.95, division: "auto", displayOnSite: true, displayOrder: 2 },
      { id: "auto-bm-rear-wiper-blade", category: "Basic Maintenance", name: "Rear Wiper Blade", price: 34.95, division: "auto", displayOnSite: true, displayOrder: 3 },
      { id: "auto-bm-engine-air-filter", category: "Basic Maintenance", name: "Engine Air Filter", price: 79.95, division: "auto", displayOnSite: true, displayOrder: 4 },
      { id: "auto-bm-diesel-air-filter", category: "Basic Maintenance", name: "Diesel Air Filter", price: 119.95, division: "auto", displayOnSite: true, displayOrder: 5 },
      { id: "auto-bm-cabin-air-filter", category: "Basic Maintenance", name: "Cabin Air Filter", price: 99.95, division: "auto", displayOnSite: true, displayOrder: 6 },
      { id: "auto-bm-cabin-air-filter-frigi", category: "Basic Maintenance", name: "Cabin Air Filter w/ Frigi Fresh", price: 129.95, division: "auto", displayOnSite: true, displayOrder: 7 },
      { id: "auto-bm-diesel-fuel-filters", category: "Basic Maintenance", name: "Diesel Fuel Filters", price: 399.95, division: "auto", displayOnSite: true, displayOrder: 8 },
    ],
  },
  // ── AUTO: Tire/Wheel ──
  {
    id: "auto-tire-wheel",
    name: "Tire/Wheel",
    division: "auto",
    description:
      "Complete tire and wheel services including mount & balance, rotation, TPMS replacement, patching, and road force balancing.",
    startingAt: 39.95,
    displayOrder: 5,
    items: [
      { id: "auto-tw-mount-balance-single", category: "Tire/Wheel", name: "Mount and Balance Single", price: 49.95, division: "auto", displayOnSite: true, displayOrder: 1 },
      { id: "auto-tw-mount-balance-4", category: "Tire/Wheel", name: "Mount and Balance 4 Tires", price: 159.95, division: "auto", displayOnSite: true, displayOrder: 2 },
      { id: "auto-tw-aftermarket-oversized-mb", category: "Tire/Wheel", name: "Aftermarket/Oversized M&B", price: 50, note: "Additional per tire", division: "auto", displayOnSite: true, displayOrder: 3 },
      { id: "auto-tw-replace-tpms", category: "Tire/Wheel", name: "Replace TPMS/Valve Stem", price: 69.95, division: "auto", displayOnSite: true, displayOrder: 4 },
      { id: "auto-tw-tire-patch", category: "Tire/Wheel", name: "Tire Patch", price: 69.95, division: "auto", displayOnSite: true, displayOrder: 5 },
      { id: "auto-tw-tire-rotation", category: "Tire/Wheel", name: "Tire Rotation", price: 39.95, division: "auto", displayOnSite: true, displayOrder: 6 },
      { id: "auto-tw-tire-rotation-oversized", category: "Tire/Wheel", name: "Tire Rotation Oversized", price: 59.95, division: "auto", displayOnSite: true, displayOrder: 7 },
      { id: "auto-tw-rotate-balance", category: "Tire/Wheel", name: "Rotate and Balance", price: 89.95, division: "auto", displayOnSite: true, displayOrder: 8 },
      { id: "auto-tw-rotate-balance-oversized", category: "Tire/Wheel", name: "Rotate and Balance Oversized", price: 119.95, division: "auto", displayOnSite: true, displayOrder: 9 },
      { id: "auto-tw-road-force-balance", category: "Tire/Wheel", name: "Road Force Balance", price: 199.95, division: "auto", displayOnSite: true, displayOrder: 10 },
    ],
  },
  // ── AUTO: Brakes ──
  {
    id: "auto-brakes",
    name: "Brakes",
    division: "auto",
    description:
      "Complete brake services including pad replacement and rotor resurfacing for standard vehicles, transit vans, and dually trucks.",
    startingAt: 320,
    displayOrder: 6,
    items: [
      { id: "auto-br-front-rear", category: "Brakes", name: "Front and Rear Brake Job", price: 320, note: "Includes pads and resurfacing rotors", division: "auto", displayOnSite: true, displayOrder: 1 },
      { id: "auto-br-transit-front-rear", category: "Brakes", name: "Transit Front and Rear", price: 450, division: "auto", displayOnSite: true, displayOrder: 2 },
      { id: "auto-br-dually-front", category: "Brakes", name: "Dually Front Brake Job", price: 450, division: "auto", displayOnSite: true, displayOrder: 3 },
      { id: "auto-br-dually-rear", category: "Brakes", name: "Dually Rear Brake Job", price: 720, division: "auto", displayOnSite: true, displayOrder: 4 },
    ],
  },
  // ── AUTO: HVAC ──
  {
    id: "auto-hvac",
    name: "HVAC",
    division: "auto",
    description:
      "Automotive HVAC evacuation and recharge services to restore air conditioning performance.",
    startingAt: 299.99,
    displayOrder: 7,
    items: [
      { id: "auto-hvac-evac-recharge", category: "HVAC", name: "EVAC and Recharge HVAC", price: 299.99, division: "auto", displayOnSite: true, displayOrder: 1 },
    ],
  },
  // ── AUTO: Customer Pay Labor Rates ──
  {
    id: "auto-labor-rates",
    name: "Customer Pay Labor Rates",
    division: "auto",
    description: "Internal reference labor rates for auto division. Not displayed on website.",
    startingAt: 165,
    displayOrder: 99,
    items: [
      { id: "auto-lr-gas", category: "Customer Pay Labor Rates", name: "Gas", price: 185, note: "Per hour", laborHours: 1, division: "auto", displayOnSite: false, displayOrder: 1 },
      { id: "auto-lr-diesel", category: "Customer Pay Labor Rates", name: "Diesel", price: 199, note: "Per hour", laborHours: 1, division: "auto", displayOnSite: false, displayOrder: 2 },
      { id: "auto-lr-ev-hybrid", category: "Customer Pay Labor Rates", name: "EV/Hybrid", price: 199, note: "Per hour", laborHours: 1, division: "auto", displayOnSite: false, displayOrder: 3 },
      { id: "auto-lr-gas-maintenance", category: "Customer Pay Labor Rates", name: "Gas Maintenance", price: 165, note: "Per hour", laborHours: 1, division: "auto", displayOnSite: false, displayOrder: 4 },
      { id: "auto-lr-diesel-maintenance", category: "Customer Pay Labor Rates", name: "Diesel Maintenance", price: 175, note: "Per hour", laborHours: 1, division: "auto", displayOnSite: false, displayOrder: 5 },
    ],
  },
  // ── MARINE: Oil Service ──
  {
    id: "marine-oil-service",
    name: "Marine Oil Service",
    division: "marine",
    description:
      "Full-service oil changes for outboard, inboard, and diesel marine engines plus generator service, pre-trip inspections, and sea trial support.",
    startingAt: 59.95,
    displayOrder: 1,
    items: [
      { id: "marine-os-outboard-small", category: "Marine Oil Service", name: "Outboard Small (up to 6 qts)", price: 149.95, note: "Up to 6 qts", division: "marine", displayOnSite: true, displayOrder: 1 },
      { id: "marine-os-outboard-v6-v8", category: "Marine Oil Service", name: "Outboard V6/V8", price: 199.95, division: "marine", displayOnSite: true, displayOrder: 2 },
      { id: "marine-os-inboard-small-block", category: "Marine Oil Service", name: "Inboard Small Block", price: 229.95, division: "marine", displayOnSite: true, displayOrder: 3 },
      { id: "marine-os-inboard-big-block", category: "Marine Oil Service", name: "Inboard Big Block", price: 279.95, division: "marine", displayOnSite: true, displayOrder: 4 },
      { id: "marine-os-diesel", category: "Marine Oil Service", name: "Diesel Marine", price: 349.95, division: "marine", displayOnSite: true, displayOrder: 5 },
      { id: "marine-os-generator", category: "Marine Oil Service", name: "Generator Oil Service", price: 129.95, division: "marine", displayOnSite: true, displayOrder: 6 },
      { id: "marine-os-twin-surcharge", category: "Marine Oil Service", subcategory: "Surcharges", name: "Twin Engine Surcharge", price: 75, division: "marine", displayOnSite: true, displayOrder: 7 },
      { id: "marine-os-semi-syn-extra-qt", category: "Marine Oil Service", subcategory: "Add-Ons", name: "Semi Syn per qt over included", price: 8, division: "marine", displayOnSite: true, displayOrder: 8 },
      { id: "marine-os-full-syn-extra-qt", category: "Marine Oil Service", subcategory: "Add-Ons", name: "Full Syn per qt over included", price: 14, division: "marine", displayOnSite: true, displayOrder: 9 },
      { id: "marine-os-pre-trip-inspection", category: "Marine Oil Service", name: "Pre-Trip Inspection", price: 59.95, division: "marine", displayOnSite: true, displayOrder: 10 },
      { id: "marine-os-sea-trial", category: "Marine Oil Service", name: "Sea Trial/Ramp Run Support", price: 149.95, division: "marine", displayOnSite: true, displayOrder: 11 },
    ],
  },
  // ── MARINE: Fuel/Fluid Services ──
  {
    id: "marine-fuel-fluid-services",
    name: "Marine Fuel/Fluid Services",
    division: "marine",
    description:
      "Fuel filters, gear lube, cooling system maintenance, corrosion protection, and fluid treatment services for all marine powertrains.",
    startingAt: 29.95,
    displayOrder: 2,
    items: [
      { id: "marine-ff-water-sep-fuel-filter", category: "Marine Fuel/Fluid Services", name: "Water Separating Fuel Filter", price: 89.95, division: "marine", displayOnSite: true, displayOrder: 1 },
      { id: "marine-ff-engine-fuel-filter", category: "Marine Fuel/Fluid Services", name: "Engine Fuel Filter", price: 129.95, division: "marine", displayOnSite: true, displayOrder: 2 },
      { id: "marine-ff-racor-dual-filter", category: "Marine Fuel/Fluid Services", name: "Racor Dual Filter Set", price: 199.95, division: "marine", displayOnSite: true, displayOrder: 3 },
      { id: "marine-ff-lower-unit-gear-lube", category: "Marine Fuel/Fluid Services", name: "Lower Unit Gear Lube", price: 149.95, division: "marine", displayOnSite: true, displayOrder: 4 },
      { id: "marine-ff-twin-lower-unit-gear-lube", category: "Marine Fuel/Fluid Services", name: "Twin Lower Unit Gear Lube", price: 279.95, division: "marine", displayOnSite: true, displayOrder: 5 },
      { id: "marine-ff-stern-drive-gear-lube", category: "Marine Fuel/Fluid Services", name: "Stern Drive Gear Lube", price: 179.95, division: "marine", displayOnSite: true, displayOrder: 6 },
      { id: "marine-ff-cooling-descale-flush", category: "Marine Fuel/Fluid Services", name: "Cooling System Descale/Flush", price: 299.95, division: "marine", displayOnSite: true, displayOrder: 7 },
      { id: "marine-ff-fuel-stabilizer", category: "Marine Fuel/Fluid Services", name: "Fuel Stabilizer Additive", price: 29.95, division: "marine", displayOnSite: true, displayOrder: 8 },
      { id: "marine-ff-moa-additive", category: "Marine Fuel/Fluid Services", name: "MOA/Oil Additive", price: 29.95, division: "marine", displayOnSite: true, displayOrder: 9 },
      { id: "marine-ff-corrosion-guard", category: "Marine Fuel/Fluid Services", name: "Corrosion Guard Treatment", price: 69.95, division: "marine", displayOnSite: true, displayOrder: 10 },
      { id: "marine-ff-throttle-body-intake", category: "Marine Fuel/Fluid Services", name: "Throttle Body/Intake Service", price: 149.95, division: "marine", displayOnSite: true, displayOrder: 11 },
      { id: "marine-ff-battery-terminal", category: "Marine Fuel/Fluid Services", name: "Battery Terminal Service", price: 39.95, division: "marine", displayOnSite: true, displayOrder: 12 },
      { id: "marine-ff-battery-test-charge", category: "Marine Fuel/Fluid Services", name: "Battery Test/Charging Check", price: 59.95, division: "marine", displayOnSite: true, displayOrder: 13 },
      { id: "marine-ff-fuel-system-treatment", category: "Marine Fuel/Fluid Services", name: "Fuel System Treatment", price: 49.95, division: "marine", displayOnSite: true, displayOrder: 14 },
      { id: "marine-ff-water-in-fuel-check", category: "Marine Fuel/Fluid Services", name: "Water-in-Fuel Check", price: 39.95, division: "marine", displayOnSite: true, displayOrder: 15 },
      { id: "marine-ff-prop-removal-reinstall", category: "Marine Fuel/Fluid Services", name: "Prop Removal and Reinstall", price: 79.95, division: "marine", displayOnSite: true, displayOrder: 16 },
    ],
  },
  // ── MARINE: Diesel Services ──
  {
    id: "marine-diesel-services",
    name: "Marine Diesel Services",
    division: "marine",
    description:
      "Specialized diesel marine services including fuel filter service, injection cleaning, coolant flush, and DEF handling.",
    startingAt: 29.95,
    displayOrder: 3,
    items: [
      { id: "marine-ds-diesel-fuel-filter", category: "Marine Diesel Services", name: "Diesel Fuel Filter Service", price: 249.95, division: "marine", displayOnSite: true, displayOrder: 1 },
      { id: "marine-ds-diesel-injection", category: "Marine Diesel Services", name: "Diesel Injection Service", price: 449.95, division: "marine", displayOnSite: true, displayOrder: 2 },
      { id: "marine-ds-dual-coolant-flush", category: "Marine Diesel Services", name: "Dual Coolant Flush (Diesel)", price: 499.95, division: "marine", displayOnSite: true, displayOrder: 3 },
      { id: "marine-ds-primary-secondary-filters", category: "Marine Diesel Services", name: "Primary/Secondary Diesel Filters", price: 329.95, division: "marine", displayOnSite: true, displayOrder: 4 },
      { id: "marine-ds-diesel-moa", category: "Marine Diesel Services", name: "Diesel MOA", price: 49.95, division: "marine", displayOnSite: true, displayOrder: 5 },
      { id: "marine-ds-def-top-off", category: "Marine Diesel Services", name: "DEF Top-Off/Handling", price: 29.95, division: "marine", displayOnSite: true, displayOrder: 6 },
    ],
  },
  // ── MARINE: Basic Maintenance ──
  {
    id: "marine-basic-maintenance",
    name: "Marine Basic Maintenance",
    division: "marine",
    description:
      "Essential boat maintenance including battery service, spark plugs, impeller replacement, air filters, and safety inspections.",
    startingAt: 29.95,
    displayOrder: 4,
    items: [
      { id: "marine-bm-battery-replacement", category: "Marine Basic Maintenance", name: "Battery Replacement", price: 75, note: "Labor only", laborHours: 0.5, division: "marine", displayOnSite: true, displayOrder: 1 },
      { id: "marine-bm-dual-battery-replacement", category: "Marine Basic Maintenance", name: "Dual Battery Replacement", price: 125, note: "Labor only", laborHours: 1, division: "marine", displayOnSite: true, displayOrder: 2 },
      { id: "marine-bm-spark-plug-replacement", category: "Marine Basic Maintenance", name: "Spark Plug Replacement", price: 199.95, note: "Starting at", division: "marine", displayOnSite: true, displayOrder: 3 },
      { id: "marine-bm-impeller-service", category: "Marine Basic Maintenance", name: "Impeller Service", price: 249.95, division: "marine", displayOnSite: true, displayOrder: 4 },
      { id: "marine-bm-air-filter-flame-arrestor", category: "Marine Basic Maintenance", name: "Engine Air Filter/Flame Arrestor", price: 79.95, division: "marine", displayOnSite: true, displayOrder: 5 },
      { id: "marine-bm-grease-steering-pivots", category: "Marine Basic Maintenance", name: "Grease Steering/Pivot Points", price: 39.95, division: "marine", displayOnSite: true, displayOrder: 6 },
      { id: "marine-bm-bilge-safety-inspection", category: "Marine Basic Maintenance", name: "Bilge/Safety Inspection", price: 59.95, division: "marine", displayOnSite: true, displayOrder: 7 },
      { id: "marine-bm-trailer-light-check", category: "Marine Basic Maintenance", name: "Trailer Light Check", price: 29.95, division: "marine", displayOnSite: true, displayOrder: 8 },
      { id: "marine-bm-trailer-hub-bearing-check", category: "Marine Basic Maintenance", name: "Trailer Hub Temp/Bearing Check", price: 39.95, division: "marine", displayOnSite: true, displayOrder: 9 },
    ],
  },
  // ── MARINE: Trailer/Tire ──
  {
    id: "marine-trailer-tire",
    name: "Marine Trailer/Tire",
    division: "marine",
    description:
      "Trailer tire mount and balance, rotation, patching, wheel bearing repack, hub service, and alignment for boat trailers.",
    startingAt: 29.95,
    displayOrder: 5,
    items: [
      { id: "marine-tt-mb-single", category: "Marine Trailer/Tire", name: "Trailer Tire M&B Single", price: 49.95, division: "marine", displayOnSite: true, displayOrder: 1 },
      { id: "marine-tt-mb-4", category: "Marine Trailer/Tire", name: "Trailer Tire M&B 4", price: 159.95, division: "marine", displayOnSite: true, displayOrder: 2 },
      { id: "marine-tt-rotation", category: "Marine Trailer/Tire", name: "Trailer Tire Rotation", price: 39.95, division: "marine", displayOnSite: true, displayOrder: 3 },
      { id: "marine-tt-patch", category: "Marine Trailer/Tire", name: "Trailer Tire Patch", price: 69.95, division: "marine", displayOnSite: true, displayOrder: 4 },
      { id: "marine-tt-wheel-bearing-repack", category: "Marine Trailer/Tire", name: "Wheel Bearing Repack", price: 179.95, note: "Starting at", division: "marine", displayOnSite: true, displayOrder: 5 },
      { id: "marine-tt-hub-service", category: "Marine Trailer/Tire", name: "Hub Service", price: 129.95, division: "marine", displayOnSite: true, displayOrder: 6 },
      { id: "marine-tt-valve-stem-tpms", category: "Marine Trailer/Tire", name: "Replace Valve Stem/TPMS", price: 29.95, division: "marine", displayOnSite: true, displayOrder: 7 },
      { id: "marine-tt-spare-tire-mount", category: "Marine Trailer/Tire", name: "Spare Tire Mount", price: 39.95, division: "marine", displayOnSite: true, displayOrder: 8 },
      { id: "marine-tt-alignment-check", category: "Marine Trailer/Tire", name: "Trailer Alignment Check", price: 49.95, division: "marine", displayOnSite: true, displayOrder: 9 },
      { id: "marine-tt-aftermarket-oversized", category: "Marine Trailer/Tire", name: "Aftermarket/Oversized Trailer", price: 50, note: "Additional per tire", division: "marine", displayOnSite: true, displayOrder: 10 },
    ],
  },
  // ── MARINE: Brakes ──
  {
    id: "marine-brakes",
    name: "Marine Brakes",
    division: "marine",
    description:
      "Trailer brake adjustment, service, and surge brake inspection for single-axle and tandem boat trailers.",
    startingAt: 129.95,
    displayOrder: 6,
    items: [
      { id: "marine-br-trailer-brake-adjust", category: "Marine Brakes", name: "Trailer Brake Adjustment", price: 129.95, division: "marine", displayOnSite: true, displayOrder: 1 },
      { id: "marine-br-trailer-brake-service", category: "Marine Brakes", name: "Trailer Brake Service", price: 249.95, division: "marine", displayOnSite: true, displayOrder: 2 },
      { id: "marine-br-tandem-brake-service", category: "Marine Brakes", name: "Tandem Trailer Brake Service", price: 399.95, note: "Starting at", division: "marine", displayOnSite: true, displayOrder: 3 },
      { id: "marine-br-surge-brake-inspection", category: "Marine Brakes", name: "Surge Brake Inspection/Service", price: 199.95, division: "marine", displayOnSite: true, displayOrder: 4 },
    ],
  },
  // ── MARINE: Travel/Surcharges ──
  {
    id: "marine-travel-surcharges",
    name: "Marine Travel/Surcharges",
    division: "marine",
    description: "Travel fees and after-hours/weekend surcharges for marine service calls.",
    startingAt: 49.95,
    displayOrder: 7,
    items: [
      { id: "marine-ts-travel-trip-charge", category: "Marine Travel/Surcharges", name: "Travel/Trip Charge", price: 49.95, division: "marine", displayOnSite: true, displayOrder: 1 },
      { id: "marine-ts-after-hours-weekend", category: "Marine Travel/Surcharges", name: "After Hours/Weekend Surcharge", price: 75, division: "marine", displayOnSite: true, displayOrder: 2 },
    ],
  },
  // ── MARINE: Labor Rates ──
  {
    id: "marine-labor-rates",
    name: "Marine Labor Rates",
    division: "marine",
    description: "Internal reference labor rates for marine division. Not displayed on website.",
    startingAt: 195,
    displayOrder: 99,
    items: [
      { id: "marine-lr-outboard", category: "Marine Labor Rates", name: "Outboard", price: 195, note: "Per hour", laborHours: 1, division: "marine", displayOnSite: false, displayOrder: 1 },
      { id: "marine-lr-inboard-stern", category: "Marine Labor Rates", name: "Inboard/Stern", price: 225, note: "Per hour", laborHours: 1, division: "marine", displayOnSite: false, displayOrder: 2 },
      { id: "marine-lr-diesel-marine", category: "Marine Labor Rates", name: "Diesel Marine", price: 249, note: "Per hour", laborHours: 1, division: "marine", displayOnSite: false, displayOrder: 3 },
      { id: "marine-lr-electrical-diagnostic", category: "Marine Labor Rates", name: "Electrical Diagnostic", price: 225, note: "Per hour", laborHours: 1, division: "marine", displayOnSite: false, displayOrder: 4 },
    ],
  },
  // ── FLEET: Preventive Maintenance Tiers ──
  {
    id: "fleet-pm-tiers",
    name: "Preventive Maintenance Tiers",
    division: "fleet",
    description:
      "Tiered preventive maintenance packages for fleet vehicles. PM-A (basic), PM-B (intermediate), and PM-C (comprehensive) for gas and diesel.",
    startingAt: 99.95,
    displayOrder: 1,
    items: [
      { id: "fleet-pm-a-gas", category: "Preventive Maintenance Tiers", subcategory: "Gas", name: "PM-A Gas", price: 99.95, division: "fleet", displayOnSite: true, displayOrder: 1 },
      { id: "fleet-pm-b-gas", category: "Preventive Maintenance Tiers", subcategory: "Gas", name: "PM-B Gas", price: 139.95, division: "fleet", displayOnSite: true, displayOrder: 2 },
      { id: "fleet-pm-c-gas", category: "Preventive Maintenance Tiers", subcategory: "Gas", name: "PM-C Gas", price: 189.95, division: "fleet", displayOnSite: true, displayOrder: 3 },
      { id: "fleet-pm-a-diesel", category: "Preventive Maintenance Tiers", subcategory: "Diesel", name: "PM-A Diesel", price: 199.95, division: "fleet", displayOnSite: true, displayOrder: 4 },
      { id: "fleet-pm-b-diesel", category: "Preventive Maintenance Tiers", subcategory: "Diesel", name: "PM-B Diesel", price: 249.95, division: "fleet", displayOnSite: true, displayOrder: 5 },
      { id: "fleet-pm-c-diesel", category: "Preventive Maintenance Tiers", subcategory: "Diesel", name: "PM-C Diesel", price: 329.95, division: "fleet", displayOnSite: true, displayOrder: 6 },
    ],
  },
];

// ── Transform & Seed ───────────────────────────────────────

async function seed() {
  const now = admin.firestore.FieldValue.serverTimestamp();
  let serviceCount = 0;
  let categoryCount = 0;

  // Use a batched write (max 500 ops per batch — we're well under that)
  const batch = db.batch();

  for (const cat of pricingCatalog) {
    // ── serviceCategories doc ──
    const catRef = db.collection("serviceCategories").doc(cat.id);
    batch.set(catRef, {
      name: cat.name,
      division: cat.division,
      description: cat.description,
      startingAt: cat.startingAt,
      sortOrder: cat.displayOrder,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    categoryCount++;

    // ── services docs (one per item) ──
    for (const item of cat.items) {
      const svcRef = db.collection("services").doc(item.id);

      // Determine bundle items from note field for bundle services
      const bundleItems = [];
      if (item.note && item.note.includes("+")) {
        // e.g. "Basic + MOA additive" -> ["Basic", "MOA additive"]
        bundleItems.push(
          ...item.note.split("+").map((s) => s.trim())
        );
      }

      batch.set(svcRef, {
        name: item.name,
        description: item.note || "",
        price: item.price,
        priceLabel: item.note || `$${item.price}`,
        category: item.category,
        subcategory: item.subcategory || "",
        division: item.division,
        sortOrder: item.displayOrder,
        isActive: true,
        showOnBooking: item.displayOnSite,
        showOnPricing: item.displayOnSite,
        bundleItems,
        notes: item.note || "",
        laborHours: item.laborHours || 0,
        createdAt: now,
        updatedAt: now,
      });
      serviceCount++;
    }
  }

  console.log(`Committing batch...`);
  await batch.commit();
  console.log(`\nSeeding complete!`);
  console.log(`  serviceCategories: ${categoryCount} documents`);
  console.log(`  services:          ${serviceCount} documents`);
  console.log(`  total:             ${categoryCount + serviceCount} documents`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
