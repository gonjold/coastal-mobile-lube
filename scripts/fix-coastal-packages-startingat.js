#!/usr/bin/env node

/**
 * WO-42 Step 4: Fix stale serviceCategories/auto-coastal-packages.startingAt
 *
 * Current value: 89.95 (stale)
 * Target value:  99.95 (matches Coastal Basic Service price)
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=~/.coastal-firebase-admin.json \
 *     node scripts/fix-coastal-packages-startingat.js [--dry-run|--execute|--revert]
 *
 * Defaults to --dry-run. Idempotent.
 */

const admin = require("firebase-admin");

const CATEGORY_ID = "auto-coastal-packages";
const TARGET = 99.95;
const PREVIOUS = 89.95;

const args = new Set(process.argv.slice(2));
const isExecute = args.has("--execute");
const isRevert = args.has("--revert");
const isDryRun = !isExecute && !isRevert;

const desired = isRevert ? PREVIOUS : TARGET;
const mode = isDryRun ? "DRY-RUN" : isRevert ? "REVERT" : "EXECUTE";

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "coastal-mobile-lube",
});

const db = admin.firestore();

async function main() {
  console.log(`=== fix-coastal-packages-startingat [${mode}] ===`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Target value: ${desired}`);

  const ref = db.collection("serviceCategories").doc(CATEGORY_ID);
  const snap = await ref.get();

  if (!snap.exists) {
    console.error(`[ABORT] serviceCategories/${CATEGORY_ID} does not exist`);
    process.exit(1);
  }

  const before = snap.data();
  console.log(`\nBefore: startingAt=${before.startingAt}`);

  if (before.startingAt === desired) {
    console.log(`[NO-OP] already at desired value ${desired}`);
    process.exit(0);
  }

  if (isDryRun) {
    console.log(
      `\n[DRY-RUN] Would update serviceCategories/${CATEGORY_ID}.startingAt: ${before.startingAt} → ${desired}`
    );
    console.log(`Run with --execute to apply, or --revert to restore to ${PREVIOUS}.`);
    process.exit(0);
  }

  await ref.update({
    startingAt: desired,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const after = (await ref.get()).data();
  console.log(`\nAfter:  startingAt=${after.startingAt}`);
  console.log(`[DONE] updated serviceCategories/${CATEGORY_ID}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
