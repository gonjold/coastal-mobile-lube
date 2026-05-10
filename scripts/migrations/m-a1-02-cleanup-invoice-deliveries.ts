/* eslint-disable no-console */
import type { Firestore } from 'firebase-admin/firestore';

/**
 * Verify-only migration. The collection `invoiceDeliveries` was deprecated
 * in A1 (firestore.rules entry removed). This migration reads the collection
 * via Admin SDK to confirm there are no live docs. If docs exist they are
 * logged and the migration errors so a human can decide what to do — we do
 * NOT auto-delete production data.
 */
const migration = {
  id: 'm-a1-02-cleanup-invoice-deliveries',
  description:
    'Verify invoiceDeliveries collection is empty before rule removal lands',
  async run(db: Firestore) {
    const result = {
      scanned: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };
    const dryRun = process.env.DRY_RUN === 'true';

    const snap = await db.collection('invoiceDeliveries').get();
    result.scanned = snap.size;

    if (snap.empty) {
      console.log('  invoiceDeliveries is empty — safe to leave the rule removed');
      return result;
    }

    console.log(`  invoiceDeliveries has ${snap.size} doc(s) — listing:`);
    for (const doc of snap.docs) {
      const data = doc.data();
      console.log(
        `    ${doc.id}: invoiceId=${data.invoiceId ?? '?'} status=${data.status ?? '?'}`,
      );
    }

    if (dryRun) {
      console.log('  [DRY] would NOT delete; manual review required');
    }
    result.errors.push(
      `invoiceDeliveries has ${snap.size} doc(s) — manual review required before completing A1`,
    );
    return result;
  },
};

export default migration;
