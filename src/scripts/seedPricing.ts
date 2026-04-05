/**
 * Seed Firestore "services" collection with the full pricing catalog.
 *
 * Usage:
 *   npx tsx src/scripts/seedPricing.ts
 *
 * Prerequisites:
 *   - Install firebase-admin: npm install firebase-admin
 *   - Set GOOGLE_APPLICATION_CREDENTIALS env var to your service account key path,
 *     OR run from an environment with default credentials (Cloud Shell, App Engine, etc.)
 *
 * Each ServiceCategory becomes a document in the "services" collection.
 * Items are stored as a nested array within each category document.
 */

import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { pricingCatalog } from "../data/pricingCatalog";

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
  // Falls back to Application Default Credentials
  initializeApp({ projectId: "coastal-mobile-lube" });
}

const db = getFirestore();
const COLLECTION = "services";

async function seedPricing() {
  console.log(`Seeding ${pricingCatalog.length} categories into "${COLLECTION}" collection...\n`);

  const batch = db.batch();

  for (const category of pricingCatalog) {
    const docRef = db.collection(COLLECTION).doc(category.id);

    batch.set(docRef, {
      name: category.name,
      division: category.division,
      description: category.description,
      startingAt: category.startingAt,
      displayOrder: category.displayOrder,
      items: category.items.map((item) => ({
        id: item.id,
        category: item.category,
        ...(item.subcategory && { subcategory: item.subcategory }),
        name: item.name,
        price: item.price,
        ...(item.note && { note: item.note }),
        ...(item.laborHours !== undefined && { laborHours: item.laborHours }),
        division: item.division,
        displayOnSite: item.displayOnSite,
        displayOrder: item.displayOrder,
      })),
      itemCount: category.items.length,
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(
      `  [${category.division.toUpperCase()}] ${category.name} - ${category.items.length} items`
    );
  }

  await batch.commit();
  console.log(`\nDone! ${pricingCatalog.length} category documents written to Firestore.`);
}

seedPricing().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
