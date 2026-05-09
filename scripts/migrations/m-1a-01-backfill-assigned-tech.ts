/* eslint-disable no-console */
import type { Firestore } from 'firebase-admin/firestore';

const OWNER_UID = process.env.OWNER_UID || '';

/**
 * Backfill `assignedTechId` on the `jobs` collection. Note: in this codebase
 * the operational entity is `bookings` (FDACS-critical) — this migration
 * targets the forward-looking `jobs` collection introduced in Phase 2 and
 * will be a no-op on a project that has not yet started writing jobs.
 */
const migration = {
  id: 'm-1a-01-backfill-assigned-tech',
  description: 'Backfill Job.assignedTechId = OWNER_UID where null',
  async run(db: Firestore) {
    const result = {
      scanned: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };
    if (!OWNER_UID) {
      result.errors.push('OWNER_UID env var not set');
      return result;
    }
    const dryRun = process.env.DRY_RUN === 'true';
    const snap = await db.collection('jobs').get();
    for (const doc of snap.docs) {
      result.scanned++;
      const data = doc.data();
      if (data.assignedTechId == null) {
        if (dryRun) {
          console.log(
            `  [DRY] would update jobs/${doc.id} -> assignedTechId=${OWNER_UID}`,
          );
        } else {
          await doc.ref.update({ assignedTechId: OWNER_UID });
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
