/* eslint-disable no-console */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

const OWNER_EMAIL = process.env.OWNER_EMAIL || '';

async function main() {
  if (!OWNER_EMAIL) {
    console.error('OWNER_EMAIL env var required');
    process.exit(1);
  }

  if (getApps().length === 0) {
    const json = process.env.FIREBASE_ADMIN_KEY_JSON;
    if (json) {
      initializeApp({ credential: cert(JSON.parse(json)) });
    } else {
      const saPath =
        process.env.FIREBASE_ADMIN_KEY ||
        path.resolve(process.env.HOME || '', '.coastal-firebase-admin.json');
      const sa = JSON.parse(fs.readFileSync(saPath, 'utf-8'));
      initializeApp({ credential: cert(sa) });
    }
  }

  const user = await getAuth().getUserByEmail(OWNER_EMAIL);
  await getAuth().setCustomUserClaims(user.uid, { role: 'owner' });
  console.log(`Set role=owner on user ${user.uid} (${OWNER_EMAIL})`);
  console.log(
    `User must log out and log back in for the claim to be active.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
