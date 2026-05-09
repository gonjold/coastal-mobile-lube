/* eslint-disable no-console */
import type { Firestore } from 'firebase-admin/firestore';

const migration = {
  id: 'm-1a-02-backfill-service-category',
  description:
    "Backfill Job.serviceCategory = 'auto' on all jobs missing the field",
  async run(db: Firestore) {
    const result = {
      scanned: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };
    const dryRun = process.env.DRY_RUN === 'true';
    const snap = await db.collection('jobs').get();
    for (const doc of snap.docs) {
      result.scanned++;
      const data = doc.data();
      if (data.serviceCategory == null) {
        if (dryRun) {
          console.log(
            `  [DRY] would update jobs/${doc.id} -> serviceCategory='auto'`,
          );
        } else {
          await doc.ref.update({ serviceCategory: 'auto' });
        }
        result.updated++;
      } else {
        result.skipped++;
      }
    }
    return result;
  },
};

export default migration;
