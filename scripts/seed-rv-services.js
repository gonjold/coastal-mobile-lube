#!/usr/bin/env node

/**
 * Firestore Seed Script — RV & Trailer Services
 *
 * Seeds Firestore with RV service categories and services.
 *
 * Usage:
 *   node scripts/seed-rv-services.js
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

// ── RV Pricing Catalog ─────────────────────────────────────

const rvCatalog = [
  // ── RV: Oil & Lube ──
  {
    id: "rv-oil-lube",
    name: "RV Oil & Lube",
    division: "rv",
    description:
      "Oil changes for gas and diesel RVs, chassis lubrication, and generator oil service. We come to your RV park, campsite, or storage lot.",
    startingAt: 39.95,
    displayOrder: 1,
    items: [
      { id: "rv-ol-gas-oil-change", category: "RV Oil & Lube", name: "RV Oil Change (Gas)", price: 129.95, division: "rv", displayOnSite: true, displayOrder: 1 },
      { id: "rv-ol-diesel-oil-change", category: "RV Oil & Lube", name: "RV Oil Change (Diesel)", price: 189.95, division: "rv", displayOnSite: true, displayOrder: 2 },
      { id: "rv-ol-chassis-lube", category: "RV Oil & Lube", name: "Chassis Lube", price: 39.95, division: "rv", displayOnSite: true, displayOrder: 3 },
      { id: "rv-ol-generator-oil-change", category: "RV Oil & Lube", name: "Generator Oil Change", price: 89.95, division: "rv", displayOnSite: true, displayOrder: 4 },
    ],
  },
  // ── RV: Brakes ──
  {
    id: "rv-brakes",
    name: "RV Brakes",
    division: "rv",
    description:
      "Front and rear brake jobs for motorhomes, trailer brake adjustment, and full trailer brake service for travel trailers and fifth wheels.",
    startingAt: 89.95,
    displayOrder: 2,
    items: [
      { id: "rv-br-front-brake-job", category: "RV Brakes", name: "RV Front Brake Job", price: 450, division: "rv", displayOnSite: true, displayOrder: 1 },
      { id: "rv-br-rear-brake-job", category: "RV Brakes", name: "RV Rear Brake Job", price: 450, division: "rv", displayOnSite: true, displayOrder: 2 },
      { id: "rv-br-trailer-brake-adjust", category: "RV Brakes", name: "Trailer Brake Adjustment", price: 89.95, division: "rv", displayOnSite: true, displayOrder: 3 },
      { id: "rv-br-trailer-brake-service", category: "RV Brakes", name: "Trailer Brake Service", price: 249.95, division: "rv", displayOnSite: true, displayOrder: 4 },
    ],
  },
  // ── RV: Tires & Wheels ──
  {
    id: "rv-tires-wheels",
    name: "RV Tires & Wheels",
    division: "rv",
    description:
      "Tire mount and balance, rotation, and wheel bearing repack for RVs and trailers. Single and dual tire service available.",
    startingAt: 69.95,
    displayOrder: 3,
    items: [
      { id: "rv-tw-tire-mb-single", category: "RV Tires & Wheels", name: "RV Tire M&B Single", price: 79.95, division: "rv", displayOnSite: true, displayOrder: 1 },
      { id: "rv-tw-tire-mb-dual", category: "RV Tires & Wheels", name: "RV Tire M&B Dual", price: 149.95, division: "rv", displayOnSite: true, displayOrder: 2 },
      { id: "rv-tw-tire-rotation", category: "RV Tires & Wheels", name: "RV Tire Rotation", price: 69.95, division: "rv", displayOnSite: true, displayOrder: 3 },
      { id: "rv-tw-wheel-bearing-repack", category: "RV Tires & Wheels", name: "Wheel Bearing Repack", price: 149.95, division: "rv", displayOnSite: true, displayOrder: 4 },
    ],
  },
  // ── RV: Maintenance ──
  {
    id: "rv-maintenance",
    name: "RV Maintenance",
    division: "rv",
    description:
      "Generator service, roof seal inspection, slide-out lubrication, battery service, HVAC, winterization, and de-winterization for all RV classes.",
    startingAt: 59.95,
    displayOrder: 4,
    items: [
      { id: "rv-mt-generator-service", category: "RV Maintenance", name: "Generator Service & Inspection", price: 199.95, division: "rv", displayOnSite: true, displayOrder: 1 },
      { id: "rv-mt-roof-seal-inspection", category: "RV Maintenance", name: "Roof Seal & Leak Inspection", price: 149.95, division: "rv", displayOnSite: true, displayOrder: 2 },
      { id: "rv-mt-slide-out-lube", category: "RV Maintenance", name: "Slide-Out Lubrication", price: 79.95, division: "rv", displayOnSite: true, displayOrder: 3 },
      { id: "rv-mt-battery-service", category: "RV Maintenance", name: "RV Battery Service", price: 59.95, division: "rv", displayOnSite: true, displayOrder: 4 },
      { id: "rv-mt-hvac-service", category: "RV Maintenance", name: "RV HVAC Service", price: 199.95, division: "rv", displayOnSite: true, displayOrder: 5 },
      { id: "rv-mt-winterization", category: "RV Maintenance", name: "RV Winterization", price: 149.95, division: "rv", displayOnSite: true, displayOrder: 6 },
      { id: "rv-mt-de-winterization", category: "RV Maintenance", name: "RV De-Winterization", price: 129.95, division: "rv", displayOnSite: true, displayOrder: 7 },
    ],
  },
];

// ── Transform & Seed ───────────────────────────────────────

async function seed() {
  const now = admin.firestore.FieldValue.serverTimestamp();
  let serviceCount = 0;
  let categoryCount = 0;

  const batch = db.batch();

  for (const cat of rvCatalog) {
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

      batch.set(svcRef, {
        name: item.name,
        description: "",
        price: item.price,
        priceLabel: `$${item.price % 1 === 0 ? item.price : item.price.toFixed(2)}`,
        category: item.category,
        subcategory: "",
        division: item.division,
        sortOrder: item.displayOrder,
        isActive: true,
        isBookable: true,
        showOnBooking: item.displayOnSite,
        showOnPricing: item.displayOnSite,
        bundleItems: [],
        notes: "",
        laborHours: 0,
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
