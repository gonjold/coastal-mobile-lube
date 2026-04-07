#!/usr/bin/env node

/**
 * Firestore Migration: Fix priceLabel fields
 *
 * For services where priceLabel does not contain "$":
 *   - If the service has a numeric price > 0, set priceLabel to "$<price>"
 *   - Otherwise, leave as-is (legitimately "Call for price")
 *
 * Usage:
 *   node scripts/fix-price-labels.js
 *
 * Auth: uses Application Default Credentials.
 */

const admin = require("firebase-admin");

admin.initializeApp({
  projectId: "coastal-mobile-lube",
});

const db = admin.firestore();

async function fixPriceLabels() {
  const snapshot = await db.collection("services").get();
  let updated = 0;
  let skipped = 0;
  const batch = db.batch();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const { priceLabel, price } = data;

    // Skip if priceLabel already contains "$"
    if (priceLabel && priceLabel.includes("$")) {
      skipped++;
      continue;
    }

    // If there is a numeric price > 0, fix the label
    if (typeof price === "number" && price > 0) {
      const newLabel = `$${price % 1 === 0 ? price : price.toFixed(2)}`;
      console.log(`  ${doc.id}: "${priceLabel}" -> "${newLabel}"`);
      batch.update(doc.ref, {
        priceLabel: newLabel,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      updated++;
    } else {
      skipped++;
    }
  }

  if (updated > 0) {
    console.log(`\nCommitting ${updated} updates...`);
    await batch.commit();
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
}

fixPriceLabels()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
