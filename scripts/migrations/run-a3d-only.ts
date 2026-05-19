/* eslint-disable no-console */
/* Ad-hoc runner for the A3d backfill migrations only. Bypasses the standard
 * run.ts so we don't re-execute (or re-dry-run-noise) other migrations.
 * Targets PROD by default; refuses without I_KNOW_THIS_IS_PROD=true. */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import m01 from './m-a3d-01-backfill-invoice-bookingid';
import m02 from './m-a3d-02-backfill-booking-invoiceid';

const PROJECT_ID = process.env.MIGRATION_PROJECT_ID || 'coastal-mobile-lube';
const DRY_RUN = process.env.DRY_RUN === 'true';

async function main() {
  if (PROJECT_ID === 'coastal-mobile-lube' && process.env.I_KNOW_THIS_IS_PROD !== 'true') {
    console.error('Refusing to target production without I_KNOW_THIS_IS_PROD=true');
    process.exit(2);
  }

  const serviceAccountPath =
    process.env.FIREBASE_ADMIN_KEY ||
    path.resolve(process.env.HOME || '', '.coastal-firebase-admin.json');
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

  if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount), projectId: PROJECT_ID });
  }

  const db = getFirestore();
  console.log(`\n=== A3d Backfill Runner ===`);
  console.log(`Target project: ${PROJECT_ID}`);
  console.log(`Dry-run:        ${DRY_RUN}`);
  console.log(`Migrations:     2 (m-a3d-01, m-a3d-02)\n`);

  for (const migration of [m01, m02]) {
    const ranDoc = await db.collection('_migrations').doc(migration.id).get();
    if (ranDoc.exists && !DRY_RUN) {
      console.log(`[SKIP] ${migration.id} - already ran on this project`);
      continue;
    }
    console.log(`\n[RUN]  ${migration.id} - ${migration.description}`);
    const result = await migration.run(db);
    console.log(
      `       scanned=${result.scanned} updated=${result.updated} skipped=${result.skipped} errors=${result.errors.length}`,
    );
    if (result.errors.length) console.log(`       FIRST ERROR: ${result.errors[0]}`);

    if (!DRY_RUN && result.errors.length === 0) {
      await db.collection('_migrations').doc(migration.id).set({
        id: migration.id,
        description: migration.description,
        ranAt: new Date().toISOString(),
        result,
      });
    }
  }
  console.log(`\n=== Done ===\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error('A3d runner failed:', err);
  process.exit(1);
});
