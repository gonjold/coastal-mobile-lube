/* eslint-disable no-console */
import type { Firestore } from 'firebase-admin/firestore';

const OWNER_UID = process.env.OWNER_UID || '';
const OWNER_EMAIL = process.env.OWNER_EMAIL || '';
const OWNER_NAME = process.env.OWNER_NAME || 'Owner';

const migration = {
  id: 'm-1a-03-init-team',
  description: 'Initialize team singleton with owner as first member',
  async run(db: Firestore) {
    const result = {
      scanned: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };
    if (!OWNER_UID || !OWNER_EMAIL) {
      result.errors.push('OWNER_UID or OWNER_EMAIL env var not set');
      return result;
    }
    const dryRun = process.env.DRY_RUN === 'true';
    const teamRef = db.collection('team').doc('coastal');
    const existing = await teamRef.get();
    result.scanned = 1;
    if (existing.exists) {
      result.skipped = 1;
      return result;
    }
    const team = {
      businessId: 'coastal',
      ownerUid: OWNER_UID,
      members: [
        {
          uid: OWNER_UID,
          email: OWNER_EMAIL,
          displayName: OWNER_NAME,
          role: 'owner' as const,
          active: true,
          addedAt: new Date().toISOString(),
          addedBy: OWNER_UID,
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    if (dryRun) {
      console.log(
        `  [DRY] would create team/coastal:\n${JSON.stringify(team, null, 2)}`,
      );
    } else {
      await teamRef.set(team);
    }
    result.updated = 1;
    return result;
  },
};

export default migration;
