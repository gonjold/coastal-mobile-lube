/**
 * Hardcoded fallback service catalog for the field "Add line item" dialog.
 * The Firestore `services` collection is the source of truth (see
 * `useServices` and `getServices()` in `@/lib/firebase-admin`); this file is
 * only used when that collection is empty or unreachable.
 */
export type FallbackServiceItem = {
  id: string;
  name: string;
  category: string;
  price: number;
};

export const FALLBACK_SERVICE_CATALOG: FallbackServiceItem[] = [
  // Auto / Truck
  { id: "fb_oil_full_synthetic", name: "Oil change — full synthetic", category: "Auto", price: 89 },
  { id: "fb_oil_synthetic_blend", name: "Oil change — synthetic blend", category: "Auto", price: 69 },
  { id: "fb_tire_rotation", name: "Tire rotation", category: "Auto", price: 35 },
  { id: "fb_mount_balance_4", name: "Mount + balance — 4 tires", category: "Auto", price: 120 },
  { id: "fb_flat_repair", name: "Flat repair (patch + plug)", category: "Auto", price: 35 },
  { id: "fb_battery_install", name: "Battery installation", category: "Auto", price: 45 },
  { id: "fb_brake_pad_axle", name: "Brake pad replacement (per axle)", category: "Auto", price: 220 },
  { id: "fb_air_filter", name: "Air filter replacement", category: "Auto", price: 25 },
  { id: "fb_cabin_filter", name: "Cabin filter replacement", category: "Auto", price: 35 },
  { id: "fb_wiper_blades", name: "Wiper blades — front pair", category: "Auto", price: 30 },

  // Marine
  { id: "fb_marine_oil_outboard", name: "Outboard oil change", category: "Marine", price: 145 },
  { id: "fb_marine_lower_unit", name: "Lower unit oil service", category: "Marine", price: 95 },
  { id: "fb_marine_impeller", name: "Water pump impeller replacement", category: "Marine", price: 245 },

  // Trailer / RV
  { id: "fb_trailer_bearings", name: "Trailer bearing repack", category: "Trailer", price: 120 },
  { id: "fb_rv_oil_diesel", name: "RV oil change — diesel", category: "RV", price: 245 },
  { id: "fb_rv_oil_gas", name: "RV oil change — gas", category: "RV", price: 185 },

  // Inspection / labor
  { id: "fb_inspection", name: "Vehicle inspection", category: "Service", price: 0 },
  { id: "fb_diagnostic", name: "Diagnostic time", category: "Service", price: 75 },
  { id: "fb_shop_supplies", name: "Shop supplies", category: "Service", price: 8 },
];
