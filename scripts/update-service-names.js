#!/usr/bin/env node

/**
 * Firestore Migration -- Add displayName to all services
 *
 * Adds a customer-facing `displayName` field and `packageGroup` where applicable.
 * Also ensures `sortOrder` exists on every service document.
 *
 * Usage:
 *   node scripts/update-service-names.js
 *
 * Auth: uses Application Default Credentials.
 */

const admin = require("firebase-admin");

admin.initializeApp({
  projectId: "coastal-mobile-lube",
});

const db = admin.firestore();

// Explicit display name overrides for auto oil change services
const DISPLAY_NAME_MAP = {
  // Standalone oil changes
  "Synthetic Blend": "Synthetic Blend Oil Change",
  "Full Synthetic": "Full Synthetic Oil Change",
  "Diesel Oil Change": "Diesel Oil Change",

  // Synthetic Blend bundles
  "Syn Blend Basic": "Synthetic Blend Oil Change - Basic",
  "Syn Blend Better": "Synthetic Blend Oil Change - Better",
  "Syn Blend Best": "Synthetic Blend Oil Change - Best",

  // Full Synthetic bundles
  "Full Syn Basic": "Full Synthetic Oil Change - Basic",
  "Full Syn Better": "Full Synthetic Oil Change - Better",
  "Full Syn Best": "Full Synthetic Oil Change - Best",

  // Diesel bundles
  "Diesel Basic": "Diesel Oil Change - Basic",
  "Diesel Better": "Diesel Oil Change - Better",
  "Diesel Best": "Diesel Oil Change - Best",

  // Fleet PM tiers (internal shorthand)
  "PM-A Gas": "Preventive Maintenance A - Gas",
  "PM-B Gas": "Preventive Maintenance B - Gas",
  "PM-C Gas": "Preventive Maintenance C - Gas",
  "PM-A Diesel": "Preventive Maintenance A - Diesel",
  "PM-B Diesel": "Preventive Maintenance B - Diesel",
  "PM-C Diesel": "Preventive Maintenance C - Diesel",

  // Auto shorthand names
  "Semi Syn per qt over 5": "Semi-Synthetic per Quart (over 5)",
  "Full Syn per qt over 5": "Full Synthetic per Quart (over 5)",
  "EVAC and Recharge HVAC": "A/C Evacuation and Recharge",
  "F250+ Frt Diff Flush": "F250+ Front Differential Flush",
  "F250+ Rear Diff Flush": "F250+ Rear Differential Flush",
  "F450-550 Rear Diff Flush": "F450-550 Rear Differential Flush",
  "Aftermarket/Oversized M&B": "Aftermarket/Oversized Mount and Balance",

  // Marine shorthand
  "Semi Syn per qt over included": "Semi-Synthetic per Quart (over included)",
  "Full Syn per qt over included": "Full Synthetic per Quart (over included)",
  "Aftermarket/Oversized Trailer": "Aftermarket/Oversized Trailer Tire",
  "MOA/Oil Additive": "Motor Oil Additive (MOA)",
  "Diesel MOA": "Diesel Motor Oil Additive",
  "MOA Additive": "Motor Oil Additive (MOA)",
};

// Package group assignments for oil change bundles
const PACKAGE_GROUP_MAP = {
  "Synthetic Blend": "oil-change",
  "Full Synthetic": "oil-change",
  "Diesel Oil Change": "oil-change",
  "Syn Blend Basic": "oil-change-tier",
  "Syn Blend Better": "oil-change-tier",
  "Syn Blend Best": "oil-change-tier",
  "Full Syn Basic": "oil-change-tier",
  "Full Syn Better": "oil-change-tier",
  "Full Syn Best": "oil-change-tier",
  "Diesel Basic": "oil-change-tier",
  "Diesel Better": "oil-change-tier",
  "Diesel Best": "oil-change-tier",
};

async function migrate() {
  const snapshot = await db.collection("services").get();
  console.log(`Found ${snapshot.size} service documents.`);

  const batch = db.batch();
  let updateCount = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const name = data.name;
    const updates = {};

    // Set displayName
    if (DISPLAY_NAME_MAP[name]) {
      updates.displayName = DISPLAY_NAME_MAP[name];
    } else {
      // Name is already customer-friendly, use as-is
      updates.displayName = name;
    }

    // Set packageGroup for oil change services
    if (PACKAGE_GROUP_MAP[name]) {
      updates.packageGroup = PACKAGE_GROUP_MAP[name];
    }

    // Ensure sortOrder exists
    if (data.sortOrder == null) {
      updates.sortOrder = data.displayOrder || 999;
    }

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    batch.update(doc.ref, updates);
    updateCount++;
  });

  console.log(`Updating ${updateCount} documents...`);
  await batch.commit();
  console.log("Migration complete!");
  console.log(`  Updated: ${updateCount} service documents with displayName`);
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
