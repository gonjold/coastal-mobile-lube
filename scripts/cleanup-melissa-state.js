#!/usr/bin/env node

/**
 * One-off cleanup for WO-DROPDOWN-AND-QB-FIX (2026-04-28).
 * - Soft-delete Melissa's stale invoices (CMLT-2026-001, -002, etc.)
 * - Clear stale qbCustomerId from her customer doc so next sync creates a fresh QB link.
 * Does NOT touch QuickBooks. QB cleanup is manual (printed at end).
 *
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=~/.coastal-firebase-admin.json node scripts/cleanup-melissa-state.js
 */

const admin = require("firebase-admin");

admin.initializeApp({ projectId: "coastal-mobile-lube" });
const db = admin.firestore();

const MELISSA_PHONE_DIGITS = "8134808383";
const MELISSA_NAME_RE = /melissa.*gonzales/i;

function normalizePhone(p) {
  return (p || "").replace(/\D/g, "");
}

async function main() {
  console.log("=== Melissa state cleanup — WO-DROPDOWN-AND-QB-FIX ===\n");

  console.log("Loading invoices + customers...");
  const [invoicesSnap, customersSnap] = await Promise.all([
    db.collection("invoices").get(),
    db.collection("customers").get(),
  ]);

  const allInvoices = invoicesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const allCustomers = customersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  console.log(`  ${allInvoices.length} invoices, ${allCustomers.length} customers\n`);

  // 1. Find Melissa's invoices by name OR phone
  const melissaInvoices = allInvoices.filter((inv) => {
    const nameMatch = MELISSA_NAME_RE.test(inv.customerName || "");
    const phoneMatch = normalizePhone(inv.customerPhone) === MELISSA_PHONE_DIGITS;
    return nameMatch || phoneMatch;
  });

  console.log(`Found ${melissaInvoices.length} invoices matching Melissa:`);
  melissaInvoices.forEach((inv) => {
    console.log(
      `  - ${inv.id} #${inv.invoiceNumber || "?"} status=${inv.status} ` +
      `total=$${inv.total} qbInvoiceId=${inv.qbInvoiceId || "—"} ` +
      `deleted=${inv.deleted ? "yes" : "no"}`
    );
  });

  // 2. Soft-delete the not-already-deleted ones
  const toCleanup = melissaInvoices.filter((inv) => inv.deleted !== true);
  console.log(`\nSoft-deleting ${toCleanup.length} invoices (skipping already-deleted)...`);
  let cleanupCount = 0;
  for (const inv of toCleanup) {
    await db.collection("invoices").doc(inv.id).set(
      {
        deleted: true,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedBy: "system-cleanup-2026-04-28",
        cleanupReason: "pre-launch broken state, replaced by CMLT-2026-004+",
      },
      { merge: true }
    );
    console.log(`  ✓ Soft-deleted ${inv.id} (#${inv.invoiceNumber || "?"})`);
    cleanupCount++;
  }

  // 3. Find Melissa's customer doc(s) by phone
  const melissaCustomers = allCustomers.filter((c) => {
    const phoneMatch = normalizePhone(c.phone) === MELISSA_PHONE_DIGITS;
    const nameMatch = MELISSA_NAME_RE.test(c.name || "");
    return phoneMatch || nameMatch;
  });

  console.log(`\nFound ${melissaCustomers.length} Melissa customer doc(s):`);
  melissaCustomers.forEach((c) => {
    console.log(
      `  - ${c.id} name="${c.name}" phone="${c.phone}" email="${c.email}" ` +
      `qbCustomerId=${c.qbCustomerId || "—"}`
    );
  });

  // 4. Clear stale qbCustomerId
  let qbCleared = 0;
  for (const c of melissaCustomers) {
    if (c.qbCustomerId) {
      await db.collection("customers").doc(c.id).set(
        { qbCustomerId: null, qbCustomerIdClearedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
      console.log(`  ✓ Cleared qbCustomerId on ${c.id} (was ${c.qbCustomerId})`);
      qbCleared++;
    }
  }

  // 5. Final state read-back
  console.log("\n=== Final state ===");
  const [finalInvSnap, finalCustSnap] = await Promise.all([
    db.collection("invoices").get(),
    db.collection("customers").get(),
  ]);
  const finalInv = finalInvSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((inv) => MELISSA_NAME_RE.test(inv.customerName || "") || normalizePhone(inv.customerPhone) === MELISSA_PHONE_DIGITS);
  const finalCust = finalCustSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => normalizePhone(c.phone) === MELISSA_PHONE_DIGITS || MELISSA_NAME_RE.test(c.name || ""));

  console.log("\nMelissa invoices:");
  finalInv.forEach((inv) => {
    console.log(
      `  - #${inv.invoiceNumber || "?"} status=${inv.status} deleted=${inv.deleted ? "yes" : "no"}`
    );
  });
  console.log("\nMelissa customer doc:");
  finalCust.forEach((c) => {
    console.log(`  - ${c.id} name="${c.name}" phone="${c.phone}" email="${c.email}" qbCustomerId=${c.qbCustomerId || "null"}`);
  });

  console.log(`\n=== Summary ===`);
  console.log(`  Invoices soft-deleted: ${cleanupCount}`);
  console.log(`  qbCustomerId fields cleared: ${qbCleared}`);

  // 6. Print manual QB instructions
  console.log("\n");
  console.log("=========================================");
  console.log("JON: MANUAL QB CLEANUP REQUIRED (5 MIN)");
  console.log("=========================================");
  console.log("");
  console.log("Open https://app.qbo.intuit.com → Sales → Invoices");
  console.log("");
  console.log('1. Find invoice "CMLT-2026-002" ($435.11, Melissa Gonzales)');
  console.log("   → click into it → More button → Void");
  console.log("   (Don't delete, void preserves audit trail)");
  console.log("");
  console.log("2. Find any other CMLT-2026-* invoices for Melissa → Void each one");
  console.log("");
  console.log('3. Open Customers → search "Melissa Gonzales"');
  console.log("   → Edit her email field. Confirm it's set to: gonzalezjosh@hotmail.com");
  console.log("   → Save");
  console.log("");
  console.log("4. (Optional but recommended) If you see TWO Melissa Gonzales records due");
  console.log("   to earlier reconnection issues, merge them: open the duplicate, click");
  console.log("   Merge, set the canonical name. QB will fold them into one.");
  console.log("");
  console.log("After this, Coastal admin will be ready to send a fresh CMLT-2026-004");
  console.log("that creates cleanly.");
  console.log("=========================================");

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
