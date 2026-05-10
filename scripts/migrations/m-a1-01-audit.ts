/* eslint-disable no-console */
/**
 * READ-ONLY AUDIT for m-a1-01-role-canonicalize.
 *
 * Walks Firebase Auth + users/ collection and logs the transition each user
 * WOULD undergo if m-a1-01-role-canonicalize ran. Writes nothing.
 *
 * Standalone invocation:
 *   MIGRATION_PROJECT_ID=coastal-mobile-lube I_KNOW_THIS_IS_PROD=true \
 *     npx tsx scripts/migrations/m-a1-01-audit.ts \
 *     > _reports/a1-m01-audit-$(date -u +%Y%m%dT%H%M%SZ).txt 2>&1
 *
 * The migration runner (run.ts) will also pick this file up because it lives
 * under scripts/migrations/. The exported default migration is intentionally a
 * NO-OP that returns errors[] = ['AUDIT_ONLY'] so the runner does NOT write a
 * `_migrations/m-a1-01-audit` marker and the audit log is only produced via
 * the standalone invocation above.
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

const ALLOWED_ADMIN_EMAILS = new Set([
  'jon@jgoldco.com',
  'coastalmobilelube@gmail.com',
  'jonrgold@gmail.com',
  'info@coastalmobilelube.com',
]);

type CanonicalRole = 'owner' | 'admin_only' | 'tech';

interface AuditRow {
  uid: string;
  email: string;
  displayName: string;
  claimRole: string;
  docExists: boolean;
  docRole: string;
  action: 'SKIP_ALREADY_CANONICAL' | 'CLAIM_TO_DOC' | 'PROMOTE_OWNER' | 'MAP_LEGACY_ADMIN' | 'BACKFILL_TECH_CLAIM' | 'SKIP_NO_RULE_MATCHED';
  intendedNextRole: string;
  willMutateClaim: boolean;
  willMutateDoc: boolean;
}

function decideAction(opts: {
  email: string;
  claimRole: CanonicalRole | undefined;
  docExists: boolean;
  docRole: string | undefined;
}): { action: AuditRow['action']; nextRole: CanonicalRole | null } {
  const { email, claimRole, docExists, docRole } = opts;
  if (claimRole === 'owner' || claimRole === 'admin_only' || claimRole === 'tech') {
    if (docExists && docRole === claimRole) {
      return { action: 'SKIP_ALREADY_CANONICAL', nextRole: claimRole };
    }
    return { action: 'CLAIM_TO_DOC', nextRole: claimRole };
  }
  if (ALLOWED_ADMIN_EMAILS.has(email)) {
    return { action: 'PROMOTE_OWNER', nextRole: 'owner' };
  }
  if (docRole === 'admin') {
    return { action: 'MAP_LEGACY_ADMIN', nextRole: 'admin_only' };
  }
  if (docRole === 'tech') {
    return { action: 'BACKFILL_TECH_CLAIM', nextRole: 'tech' };
  }
  return { action: 'SKIP_NO_RULE_MATCHED', nextRole: null };
}

async function audit(): Promise<{ rows: AuditRow[]; counts: Record<string, number> }> {
  const auth = getAuth();
  const db = getFirestore();
  const rows: AuditRow[] = [];
  const counts: Record<string, number> = {};

  let nextPageToken: string | undefined;
  do {
    const page = await auth.listUsers(1000, nextPageToken);
    for (const u of page.users) {
      const uid = u.uid;
      const email = (u.email || '').toLowerCase();
      const displayName = u.displayName || '';
      const claimRole = (u.customClaims as Record<string, unknown> | undefined)?.role as
        | CanonicalRole
        | undefined;
      const userDoc = await db.collection('users').doc(uid).get();
      const docExists = userDoc.exists;
      const docRole = (docExists ? (userDoc.data()?.role as string | undefined) : undefined) ?? '';

      const decision = decideAction({ email, claimRole, docExists, docRole });

      const willMutateClaim =
        decision.nextRole != null && decision.nextRole !== claimRole;
      const willMutateDoc =
        decision.nextRole != null && decision.nextRole !== docRole;

      rows.push({
        uid,
        email: email || '(no-email)',
        displayName: displayName || '(no-name)',
        claimRole: claimRole ?? '(none)',
        docExists,
        docRole: docRole || '(none)',
        action: decision.action,
        intendedNextRole: decision.nextRole ?? '(no-change)',
        willMutateClaim,
        willMutateDoc,
      });
      counts[decision.action] = (counts[decision.action] ?? 0) + 1;
    }
    nextPageToken = page.pageToken;
  } while (nextPageToken);

  return { rows, counts };
}

function formatRow(r: AuditRow): string {
  return [
    r.uid,
    r.email,
    r.displayName,
    `claim=${r.claimRole}`,
    `doc=${r.docExists ? r.docRole : '(no-doc)'}`,
    `→ ${r.action}`,
    `next=${r.intendedNextRole}`,
    r.willMutateClaim ? 'WRITE_CLAIM' : '',
    r.willMutateDoc ? 'WRITE_DOC' : '',
  ]
    .filter(Boolean)
    .join('\t');
}

async function main() {
  const projectId = process.env.MIGRATION_PROJECT_ID || 'coastal-mobile-lube-staging';
  if (projectId === 'coastal-mobile-lube' && process.env.I_KNOW_THIS_IS_PROD !== 'true') {
    console.error('Refusing to audit prod without I_KNOW_THIS_IS_PROD=true');
    process.exit(2);
  }

  const serviceAccountPath =
    process.env.FIREBASE_ADMIN_KEY ||
    path.resolve(process.env.HOME || '', '.coastal-firebase-admin.json');
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`Service account JSON not found at ${serviceAccountPath}`);
    process.exit(2);
  }
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

  if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount), projectId });
  }

  console.log(`# m-a1-01 audit (READ-ONLY)`);
  console.log(`# project: ${projectId}`);
  console.log(`# ranAt: ${new Date().toISOString()}`);
  console.log('# columns: uid\\temail\\tdisplayName\\tclaim=...\\tdoc=...\\t→ action\\tnext=...\\tflags');
  console.log('');

  const { rows, counts } = await audit();
  for (const r of rows) console.log(formatRow(r));

  console.log('');
  console.log('# === counts ===');
  for (const [k, v] of Object.entries(counts).sort()) {
    console.log(`# ${k}: ${v}`);
  }
  console.log(`# TOTAL: ${rows.length}`);
  console.log(`# claim writes: ${rows.filter((r) => r.willMutateClaim).length}`);
  console.log(`# doc writes:   ${rows.filter((r) => r.willMutateDoc).length}`);
}

// Standalone invocation only. The migration runner imports `default` below
// (a no-op) so this main() does NOT run when imported.
const isDirectInvocation =
  typeof require !== 'undefined' && require.main === module;
if (isDirectInvocation) {
  main().catch((err) => {
    console.error('audit failed:', err);
    process.exit(1);
  });
}

// Default export: NO-OP migration entry. Returns errors[] so the runner does
// not write a `_migrations/m-a1-01-audit` marker. Keeps the audit out of the
// idempotency record and prevents accidental execution by `npm run migrate`.
const migration = {
  id: 'm-a1-01-audit',
  description: 'AUDIT script — runs only via direct tsx invocation (see file header)',
  async run(_db: Firestore) {
    return {
      scanned: 0,
      updated: 0,
      skipped: 0,
      errors: [
        'AUDIT_ONLY: skipping. Invoke directly via `npx tsx scripts/migrations/m-a1-01-audit.ts`.',
      ],
    };
  },
};

export default migration;
