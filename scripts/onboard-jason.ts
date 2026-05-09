/* eslint-disable no-console */
/**
 * One-off: onboard Jason Binder as an admin in production.
 *
 * Why legacy users/{uid} doc (not Phase 1 claim/team-doc):
 * the live /admin gate is `src/components/AdminAuthGuard.tsx`, which checks
 * `users/{uid}.role === 'admin' && isActive === true` (the legacy 'admin' |
 * 'tech' system from `src/app/admin/shared.ts`). Phase 1's claim-based
 * role ('owner' | 'tech' | 'admin_only') is not yet wired into /admin and
 * doesn't include 'admin'. Mirrors the doc shape from
 * `scripts/bootstrap-users-collection.js`.
 *
 * Idempotent: merges, never overwrites unrelated fields. Re-run safe.
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

const CANDIDATE_EMAILS = [
  'coastalmobilelube@gmail.com',
  'info@coastalmobilelube.com',
];
const ADDED_BY_UID = '9NoOSK0GMHftApNxMd91cywv3MG2';
const DISPLAY_NAME = 'Jason Binder';

type RowState = 'WROTE' | 'ALREADY_OK' | 'AUTH_MISS';

interface Row {
  email: string;
  uid: string;
  state: RowState;
  beforeRole?: string;
  beforeActive?: boolean;
  afterRole?: string;
  afterActive?: boolean;
}

function initAdmin() {
  if (getApps().length > 0) return;
  const json = process.env.FIREBASE_ADMIN_KEY_JSON;
  if (json) {
    initializeApp({ credential: cert(JSON.parse(json)) });
    return;
  }
  const saPath =
    process.env.FIREBASE_ADMIN_KEY ||
    path.resolve(process.env.HOME || '', '.coastal-firebase-admin.json');
  const sa = JSON.parse(fs.readFileSync(saPath, 'utf-8'));
  initializeApp({ credential: cert(sa) });
}

async function main() {
  initAdmin();
  const auth = getAuth();
  const db = getFirestore();
  const rows: Row[] = [];

  for (const email of CANDIDATE_EMAILS) {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (e) {
      const code = (e as { code?: string }).code || 'unknown';
      console.log(`AUTH MISS  ${email}  (${code}) — Jason has not signed in with this email yet`);
      rows.push({ email, uid: '', state: 'AUTH_MISS' });
      continue;
    }

    const uid = userRecord.uid;
    const ref = db.doc(`users/${uid}`);
    const snap = await ref.get();
    const before = snap.exists ? snap.data() : null;
    const beforeRole = before?.role as string | undefined;
    const beforeActive = before?.isActive as boolean | undefined;

    const alreadyOk = beforeRole === 'admin' && beforeActive === true;
    let state: RowState;
    if (alreadyOk) {
      state = 'ALREADY_OK';
      console.log(`SKIP       ${email}  uid=${uid}  users doc already role=admin isActive=true`);
    } else {
      const payload: Record<string, unknown> = {
        uid,
        email,
        displayName: before?.displayName || DISPLAY_NAME,
        role: 'admin',
        isActive: true,
      };
      if (!snap.exists) {
        payload.createdAt = FieldValue.serverTimestamp();
        payload.createdBy = ADDED_BY_UID;
        payload.lastLoginAt = null;
      }
      await ref.set(payload, { merge: true });
      state = 'WROTE';
      console.log(`WROTE      ${email}  uid=${uid}  role=admin isActive=true (was role=${beforeRole ?? 'MISSING'} active=${beforeActive ?? 'MISSING'})`);
    }

    const after = (await ref.get()).data();
    rows.push({
      email,
      uid,
      state,
      beforeRole,
      beforeActive,
      afterRole: after?.role as string | undefined,
      afterActive: after?.isActive as boolean | undefined,
    });
  }

  console.log('\n--- Summary ---');
  console.log('email                              | uid                            | state       | role        | isActive');
  console.log('-----------------------------------+--------------------------------+-------------+-------------+---------');
  for (const r of rows) {
    const email = r.email.padEnd(34);
    const uid = (r.uid || '-').padEnd(30);
    const state = r.state.padEnd(11);
    const role = (r.afterRole ?? '-').padEnd(11);
    const active = String(r.afterActive ?? '-');
    console.log(`${email} | ${uid} | ${state} | ${role} | ${active}`);
  }

  const wroteOrOk = rows.filter((r) => r.state !== 'AUTH_MISS');
  const allGood = wroteOrOk.every(
    (r) => r.afterRole === 'admin' && r.afterActive === true,
  );
  if (wroteOrOk.length === 0) {
    console.error('\nFAIL: neither candidate email resolved in Firebase Auth');
    process.exit(2);
  }
  if (!allGood) {
    console.error('\nFAIL: at least one resolved user did not end with role=admin isActive=true');
    process.exit(3);
  }
  console.log('\nOK — all resolved users now have role=admin, isActive=true');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
