#!/usr/bin/env node
/**
 * One-shot soft-delete of test invoices.
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/Users/jgsystems/.coastal-firebase-admin.json node scripts/wo-t1.2.5-cleanup-test-invoices.js
 *
 * Add --apply to actually write. Default is dry-run.
 */

const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

const TEST_INVOICE_NUMBERS = [
  "CMLT-2026-002",
  "CMLT-2026-003",
  "CMLT-2026-004",
  "CMLT-2026-005",
  "CMLT-2026-006",
  "CMLT-2026-008",
  "CMLT-2026-009",
];

const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(APPLY ? "=== APPLY MODE ===" : "=== DRY RUN (use --apply to write) ===");

  for (const invNumber of TEST_INVOICE_NUMBERS) {
    const snapshot = await db.collection("invoices")
      .where("invoiceNumber", "==", invNumber)
      .get();

    if (snapshot.empty) {
      console.log(`SKIP ${invNumber}: not found in Firestore`);
      continue;
    }

    if (snapshot.size > 1) {
      console.log(`WARN ${invNumber}: ${snapshot.size} matching docs (expected 1) — skipping for safety`);
      continue;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const wasDeleted = data.deleted === true;

    console.log(`${invNumber} (docId=${doc.id}): customer=${data.customerName || "?"}, status=${data.status}, current deleted=${wasDeleted}`);

    if (APPLY) {
      await doc.ref.update({
        deleted: true,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedReason: "test invoice cleanup (WO-T1.2.5)",
      });
      console.log(`  -> updated`);
    }
  }

  console.log(APPLY ? "\nDone." : "\nDry run complete. Re-run with --apply to write.");
}

main().catch(err => { console.error(err); process.exit(1); });
