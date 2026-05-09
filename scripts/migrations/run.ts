/* eslint-disable no-console */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationResult {
  scanned: number;
  updated: number;
  skipped: number;
  errors: string[];
}

interface Migration {
  id: string;
  description: string;
  run: (db: Firestore) => Promise<MigrationResult>;
}

const PROJECT_ID =
  process.env.MIGRATION_PROJECT_ID || 'coastal-mobile-lube-staging';
const DRY_RUN = process.env.DRY_RUN === 'true';

async function main() {
  if (PROJECT_ID === 'coastal-mobile-lube' && process.env.I_KNOW_THIS_IS_PROD !== 'true') {
    console.error(
      'Refusing to run against production project coastal-mobile-lube.\n' +
        'Set MIGRATION_PROJECT_ID=coastal-mobile-lube-staging or, if intentional,\n' +
        'set I_KNOW_THIS_IS_PROD=true.',
    );
    process.exit(2);
  }

  const serviceAccountPath =
    process.env.FIREBASE_ADMIN_KEY ||
    path.resolve(process.env.HOME || '', '.coastal-firebase-admin.json');
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, 'utf-8'),
  );

  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: PROJECT_ID,
    });
  }

  const db = getFirestore();
  const migrationsDir = path.resolve(__dirname);
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => /^m-.*\.(ts|js)$/.test(f));
  files.sort();

  console.log(`\n=== Migration Runner ===`);
  console.log(`Target project: ${PROJECT_ID}`);
  console.log(`Dry-run:        ${DRY_RUN}`);
  console.log(`Migrations:     ${files.length}\n`);

  for (const file of files) {
    const id = file.replace(/\.(ts|js)$/, '');
    const ranDoc = await db.collection('_migrations').doc(id).get();
    if (ranDoc.exists && !DRY_RUN) {
      console.log(`[SKIP] ${id} — already ran on this project`);
      continue;
    }

    const mod: { default: Migration } = await import(
      path.join(migrationsDir, file)
    );
    const migration = mod.default;
    console.log(`\n[RUN]  ${migration.id} — ${migration.description}`);
    const result = await migration.run(db);
    console.log(
      `       scanned=${result.scanned} updated=${result.updated} ` +
        `skipped=${result.skipped} errors=${result.errors.length}`,
    );
    if (result.errors.length) {
      console.log(`       FIRST ERROR: ${result.errors[0]}`);
    }

    if (!DRY_RUN && result.errors.length === 0) {
      await db.collection('_migrations').doc(id).set({
        id,
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
  console.error('Migration runner failed:', err);
  process.exit(1);
});
