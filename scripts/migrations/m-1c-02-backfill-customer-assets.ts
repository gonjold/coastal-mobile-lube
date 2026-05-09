/* eslint-disable no-console */
import type { Firestore } from 'firebase-admin/firestore';

const migration = {
  id: 'm-1c-02-backfill-customer-assets',
  description:
    'Populate Customer.assets[] with asset doc IDs based on customerId linkage',
  async run(db: Firestore) {
    const result = {
      scanned: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };
    const dryRun = process.env.DRY_RUN === 'true';
    const customers = await db.collection('customers').get();

    for (const cdoc of customers.docs) {
      result.scanned++;
      const customerId = cdoc.id;
      const customer = cdoc.data();

      const assetsSnap = await db
        .collection('assets')
        .where('customerId', '==', customerId)
        .get();
      const assetIds = assetsSnap.docs.map((d) => d.id);

      const existing: string[] = customer.assets || [];
      const merged = Array.from(new Set([...existing, ...assetIds]));
      if (merged.length === existing.length) {
        result.skipped++;
        continue;
      }

      if (dryRun) {
        console.log(
          `  [DRY] would update customers/${customerId} -> assets[${merged.length}]`,
        );
      } else {
        await cdoc.ref.update({ assets: merged });
      }
      result.updated++;
    }
    return result;
  },
};

export default migration;
