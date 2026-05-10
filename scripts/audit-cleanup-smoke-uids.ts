/* eslint-disable no-console */
/**
 * One-shot cleanup: delete the two pre-A1 smoke-test Auth users +
 * their users/{uid} docs (if any).
 *
 *   smoke-test-uid     — no email, no doc
 *   wo-fm-2-smoke-uid  — wo-fm-2-smoke@example.com, no doc
 *
 * Authorized by Jon at the m-a1-01 audit pause point.
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

const TARGET_UIDS = ['smoke-test-uid', 'wo-fm-2-smoke-uid'];

async function main() {
  const projectId = process.env.MIGRATION_PROJECT_ID || 'coastal-mobile-lube-staging';
  if (projectId === 'coastal-mobile-lube' && process.env.I_KNOW_THIS_IS_PROD !== 'true') {
    console.error('Refusing to mutate prod without I_KNOW_THIS_IS_PROD=true');
    process.exit(2);
  }

  const serviceAccountPath =
    process.env.FIREBASE_ADMIN_KEY ||
    path.resolve(process.env.HOME || '', '.coastal-firebase-admin.json');
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

  if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount), projectId });
  }
  const auth = getAuth();
  const db = getFirestore();

  for (const uid of TARGET_UIDS) {
    console.log(`\n--- ${uid} ---`);
    try {
      const userRecord = await auth.getUser(uid);
      console.log(`  auth: email=${userRecord.email ?? '(none)'} disp=${userRecord.displayName ?? '(none)'}`);
    } catch (e) {
      console.log(`  auth: NOT FOUND (${e instanceof Error ? e.message : 'unknown'})`);
    }

    const docSnap = await db.collection('users').doc(uid).get();
    console.log(`  users/${uid}: ${docSnap.exists ? 'EXISTS' : 'absent'}`);

    try {
      await auth.deleteUser(uid);
      console.log(`  ✔ auth.deleteUser(${uid})`);
    } catch (e) {
      console.log(`  ✗ auth.deleteUser(${uid}): ${e instanceof Error ? e.message : 'unknown'}`);
    }

    if (docSnap.exists) {
      try {
        await db.collection('users').doc(uid).delete();
        console.log(`  ✔ users/${uid} deleted`);
      } catch (e) {
        console.log(`  ✗ users/${uid} delete: ${e instanceof Error ? e.message : 'unknown'}`);
      }
    }
  }
  console.log('\n=== done ===');
}

main().catch((err) => {
  console.error('cleanup failed:', err);
  process.exit(1);
});
