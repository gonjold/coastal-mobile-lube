/* eslint-disable no-console */
import { getAuth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

const ALLOWED_ADMIN_EMAILS = new Set([
  'jon@jgoldco.com',
  'coastalmobilelube@gmail.com',
  'jonrgold@gmail.com',
  'info@coastalmobilelube.com',
]);

type CanonicalRole = 'owner' | 'admin_only' | 'tech';

const migration = {
  id: 'm-a1-01-role-canonicalize',
  description:
    'Canonicalize user roles: sync custom claim role <-> users/{uid}.role; ' +
    'promote allowed admin emails to owner; map legacy "admin" -> "admin_only"',
  async run(db: Firestore) {
    const result = {
      scanned: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };
    const dryRun = process.env.DRY_RUN === 'true';
    const auth = getAuth();

    let nextPageToken: string | undefined;
    do {
      const page = await auth.listUsers(1000, nextPageToken);
      for (const userRecord of page.users) {
        result.scanned++;
        const uid = userRecord.uid;
        const email = (userRecord.email || '').toLowerCase();
        const claimedRole = (userRecord.customClaims as Record<string, unknown> | undefined)
          ?.role as CanonicalRole | undefined;

        const userDocRef = db.collection('users').doc(uid);
        const userDoc = await userDocRef.get();
        const docRole = (userDoc.exists ? (userDoc.data()?.role as string | undefined) : undefined) ?? null;

        let nextRole: CanonicalRole | null = null;

        if (claimedRole === 'owner' || claimedRole === 'admin_only' || claimedRole === 'tech') {
          // Source of truth: claim. Mirror to doc if missing/different.
          nextRole = claimedRole;
          if (docRole === claimedRole) {
            result.skipped++;
            continue;
          }
        } else if (ALLOWED_ADMIN_EMAILS.has(email)) {
          nextRole = 'owner';
        } else if (docRole === 'admin') {
          nextRole = 'admin_only';
        } else if (docRole === 'tech') {
          nextRole = 'tech';
        } else {
          result.skipped++;
          continue;
        }

        if (dryRun) {
          console.log(
            `  [DRY] ${uid} (${email || 'no-email'}): ` +
              `claim=${claimedRole ?? 'none'} doc=${docRole ?? 'none'} -> ${nextRole}`,
          );
          result.updated++;
          continue;
        }

        try {
          if (claimedRole !== nextRole) {
            await auth.setCustomUserClaims(uid, {
              ...(userRecord.customClaims || {}),
              role: nextRole,
            });
          }
          if (docRole !== nextRole) {
            if (userDoc.exists) {
              await userDocRef.update({ role: nextRole });
            } else {
              await userDocRef.set({
                uid,
                email: userRecord.email || null,
                displayName: userRecord.displayName || null,
                role: nextRole,
                createdAt: new Date().toISOString(),
              });
            }
          }
          result.updated++;
        } catch (e) {
          result.errors.push(`${uid}: ${e instanceof Error ? e.message : 'unknown'}`);
        }
      }
      nextPageToken = page.pageToken;
    } while (nextPageToken);

    return result;
  },
};

export default migration;
