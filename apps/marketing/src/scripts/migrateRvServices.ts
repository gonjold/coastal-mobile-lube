/**
 * Migrate RV services in Firestore to ensure all required admin fields exist.
 *
 * Checks every document in "services" with division === "rv" and every
 * document in "serviceCategories" with division === "rv" for required fields.
 * Missing fields are filled with sensible defaults.
 *
 * Usage:
 *   npx tsx src/scripts/migrateRvServices.ts
 *
 * Prerequisites:
 *   - Set GOOGLE_APPLICATION_CREDENTIALS env var to your service account key path,
 *     OR run from an environment with default credentials.
 */

import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin
const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (credentialPath) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const serviceAccount = require(credentialPath) as ServiceAccount;
  initializeApp({
    credential: cert(serviceAccount),
    projectId: "coastal-mobile-lube",
  });
} else {
  initializeApp({ projectId: "coastal-mobile-lube" });
}

const db = getFirestore();

/** Required fields for services with their defaults */
const SERVICE_DEFAULTS: Record<string, unknown> = {
  name: "",
  displayName: "",
  price: 0,
  priceLabel: "",
  category: "General",
  division: "rv",
  isActive: true,
  showOnBooking: true,
  showOnPricing: true,
  sortOrder: 0,
  description: "",
  subcategory: "",
  type: "",
  bundleItems: [],
  notes: "",
  laborHours: 0,
};

/** Required fields for serviceCategories with their defaults */
const CATEGORY_DEFAULTS: Record<string, unknown> = {
  name: "",
  division: "rv",
  description: "",
  startingAt: 0,
  sortOrder: 0,
  isActive: true,
};

async function migrateRvServices() {
  console.log("=== RV Services Migration ===\n");

  // ── Migrate services ──
  const servicesSnap = await db
    .collection("services")
    .where("division", "==", "rv")
    .get();

  console.log(`Found ${servicesSnap.size} RV service documents.\n`);

  let servicesUpdated = 0;

  for (const doc of servicesSnap.docs) {
    const data = doc.data();
    const updates: Record<string, unknown> = {};

    for (const [field, defaultValue] of Object.entries(SERVICE_DEFAULTS)) {
      if (data[field] === undefined || data[field] === null) {
        // Use the service name for displayName default if name exists
        if (field === "displayName" && data.name) {
          updates[field] = data.name;
        } else if (field === "name" && !data.name) {
          updates[field] = doc.id; // fallback to doc ID
        } else {
          updates[field] = defaultValue;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = FieldValue.serverTimestamp();
      await doc.ref.update(updates);
      console.log(`  UPDATED "${data.name || doc.id}" — added: ${Object.keys(updates).filter(k => k !== "updatedAt").join(", ")}`);
      servicesUpdated++;
    } else {
      console.log(`  OK      "${data.name || doc.id}" — all fields present`);
    }
  }

  // ── Migrate serviceCategories ──
  const categoriesSnap = await db
    .collection("serviceCategories")
    .where("division", "==", "rv")
    .get();

  console.log(`\nFound ${categoriesSnap.size} RV category documents.\n`);

  let categoriesUpdated = 0;

  for (const doc of categoriesSnap.docs) {
    const data = doc.data();
    const updates: Record<string, unknown> = {};

    for (const [field, defaultValue] of Object.entries(CATEGORY_DEFAULTS)) {
      if (data[field] === undefined || data[field] === null) {
        if (field === "name" && !data.name) {
          updates[field] = doc.id;
        } else {
          updates[field] = defaultValue;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = FieldValue.serverTimestamp();
      await doc.ref.update(updates);
      console.log(`  UPDATED "${data.name || doc.id}" — added: ${Object.keys(updates).filter(k => k !== "updatedAt").join(", ")}`);
      categoriesUpdated++;
    } else {
      console.log(`  OK      "${data.name || doc.id}" — all fields present`);
    }
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`Services:   ${servicesUpdated} updated out of ${servicesSnap.size}`);
  console.log(`Categories: ${categoriesUpdated} updated out of ${categoriesSnap.size}`);
}

migrateRvServices().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
