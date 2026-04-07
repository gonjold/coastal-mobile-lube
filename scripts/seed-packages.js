#!/usr/bin/env node

/**
 * Firestore Seed Script -- Coastal Packages
 *
 * Seeds the `services` collection with three bundled Coastal Packages:
 *   - Coastal Basic ($89.95)
 *   - Coastal Complete ($149.95)
 *   - Coastal Ultimate ($249.95)
 *
 * These are stored as services with type: "package" so they can be
 * queried alongside regular services but rendered separately.
 *
 * Usage:
 *   node scripts/seed-packages.js
 *
 * Auth: uses Application Default Credentials.
 */

const admin = require("firebase-admin");

admin.initializeApp({
  projectId: "coastal-mobile-lube",
});

const db = admin.firestore();

const packages = [
  {
    id: "pkg-coastal-basic",
    name: "Coastal Basic",
    displayName: "Coastal Basic",
    description: "Bundle and save on routine maintenance essentials.",
    price: 89.95,
    priceLabel: "Starting at $89.95",
    category: "Coastal Packages",
    subcategory: "",
    division: "auto",
    type: "package",
    sortOrder: 1,
    isActive: true,
    showOnBooking: true,
    showOnPricing: true,
    bundleItems: [
      "Synthetic blend or full synthetic oil + filter",
      "Tire pressure check and adjust",
      "Fluid level top-offs",
      "Multi-point visual inspection",
    ],
    notes: "",
    laborHours: 0,
  },
  {
    id: "pkg-coastal-complete",
    name: "Coastal Complete",
    displayName: "Coastal Complete",
    description: "Our most popular package. Everything in Basic plus key maintenance items.",
    price: 149.95,
    priceLabel: "Starting at $149.95",
    category: "Coastal Packages",
    subcategory: "",
    division: "auto",
    type: "package",
    sortOrder: 2,
    isActive: true,
    showOnBooking: true,
    showOnPricing: true,
    featured: true,
    bundleItems: [
      "Everything in Coastal Basic",
      "Tire rotation",
      "Engine air filter replacement",
      "Battery health test",
      "Brake wear inspection",
    ],
    notes: "",
    laborHours: 0,
  },
  {
    id: "pkg-coastal-ultimate",
    name: "Coastal Ultimate",
    displayName: "Coastal Ultimate",
    description: "Complete bumper-to-bumper maintenance coverage.",
    price: 249.95,
    priceLabel: "Starting at $249.95",
    category: "Coastal Packages",
    subcategory: "",
    division: "auto",
    type: "package",
    sortOrder: 3,
    isActive: true,
    showOnBooking: true,
    showOnPricing: true,
    bundleItems: [
      "Everything in Coastal Complete",
      "Cabin air filter replacement",
      "Wiper blade replacement",
      "Brake pad thickness measurement",
      "Coolant system inspection",
    ],
    notes: "",
    laborHours: 0,
  },
];

async function seed() {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  // Also add a serviceCategory entry for Coastal Packages
  const catRef = db.collection("serviceCategories").doc("auto-coastal-packages");
  batch.set(catRef, {
    name: "Coastal Packages",
    division: "auto",
    description: "Bundle and save on routine maintenance.",
    startingAt: 89.95,
    sortOrder: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  for (const pkg of packages) {
    const ref = db.collection("services").doc(pkg.id);
    batch.set(ref, {
      ...pkg,
      createdAt: now,
      updatedAt: now,
    });
    // Remove the id field from the doc data (it's the doc ID)
    delete pkg.id;
  }

  console.log("Committing batch...");
  await batch.commit();
  console.log("\nPackage seeding complete!");
  console.log("  serviceCategories: 1 document (Coastal Packages)");
  console.log(`  services: ${packages.length} package documents`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
