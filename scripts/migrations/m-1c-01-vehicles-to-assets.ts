/* eslint-disable no-console */
import { customAlphabet } from 'nanoid';
import type { Firestore } from 'firebase-admin/firestore';

const nanoid = customAlphabet(
  'abcdefghijklmnopqrstuvwxyz0123456789',
  12,
);

const migration = {
  id: 'm-1c-01-vehicles-to-assets',
  description:
    'Copy vehicles/* to assets/* with type=vehicle, preserving legacyVehicleId',
  async run(db: Firestore) {
    const result = {
      scanned: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };
    const dryRun = process.env.DRY_RUN === 'true';
    const snap = await db.collection('vehicles').get();

    for (const doc of snap.docs) {
      result.scanned++;
      const v = doc.data();
      const legacyId = doc.id;

      const existing = await db
        .collection('assets')
        .where('legacyVehicleId', '==', legacyId)
        .limit(1)
        .get();
      if (!existing.empty) {
        result.skipped++;
        continue;
      }

      if (!v.customerId) {
        result.errors.push(
          `vehicle ${legacyId} missing customerId; skipped`,
        );
        continue;
      }

      const newId = `vehicle_${nanoid()}`;
      const now = new Date().toISOString();
      const asset = {
        id: newId,
        customerId: v.customerId,
        type: 'vehicle' as const,
        year:
          typeof v.year === 'number'
            ? v.year
            : v.year
              ? Number(v.year)
              : 0,
        make: v.make || '',
        model: v.model || '',
        trim: v.trim,
        vin: v.vin,
        licensePlate: v.licensePlate || v.plate,
        color: v.color,
        mileage: typeof v.mileage === 'number' ? v.mileage : undefined,
        nickname: v.nickname,
        notes: v.notes,
        legacyVehicleId: legacyId,
        createdAt: v.createdAt || now,
        updatedAt: now,
      };

      if (dryRun) {
        console.log(
          `  [DRY] would create assets/${newId} from vehicles/${legacyId}`,
        );
      } else {
        await db.collection('assets').doc(newId).set(asset);
      }
      result.updated++;
    }
    return result;
  },
};

export default migration;
