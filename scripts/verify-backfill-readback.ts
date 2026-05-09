/* eslint-disable no-console */
/**
 * Sprint 1 verification: read 3 random newly-linked invoices and print
 * { invoiceNumber, bookingId, customerName, bookingScheduledDate,
 *   invoiceIssuedDate } from Firestore.
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

const CRED_PATH = path.join(
  process.env.HOME ?? '/Users/jgsystems',
  '.coastal-firebase-admin.json',
);

const TARGETS = [
  'CMLT-2026-011',
  'CMLT-2026-012',
  'CMLT-2026-014',
  'CMLT-2026-015',
  'CMLT-2026-017',
];

function init(): void {
  if (getApps().length > 0) return;
  const json = JSON.parse(fs.readFileSync(CRED_PATH, 'utf8'));
  initializeApp({ credential: cert(json) });
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length > 0 && out.length < n) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

async function main(): Promise<void> {
  init();
  const db = getFirestore();
  const sample = pickRandom(TARGETS, 3);
  console.log(`Sampling: ${sample.join(', ')}`);
  console.log('');

  for (const invNumber of sample) {
    const invSnap = await db
      .collection('invoices')
      .where('invoiceNumber', '==', invNumber)
      .limit(1)
      .get();
    if (invSnap.empty) {
      console.log(`[miss] ${invNumber} not found`);
      continue;
    }
    const invDoc = invSnap.docs[0];
    const inv = invDoc.data() as Record<string, unknown>;
    const bookingId = inv.bookingId as string | undefined;
    if (!bookingId) {
      console.log(`[unlinked] ${invNumber} bookingId is empty`);
      continue;
    }
    const bSnap = await db.collection('bookings').doc(bookingId).get();
    const b = (bSnap.data() ?? {}) as Record<string, unknown>;
    console.log(JSON.stringify({
      invoiceNumber: inv.invoiceNumber,
      bookingId,
      customerName: inv.customerName,
      bookingScheduledDate: b.confirmedDate ?? b.preferredDate ?? null,
      invoiceIssuedDate: inv.invoiceDate ?? null,
      bookingInvoiceId: b.invoiceId ?? null,
      bidirectional:
        b.invoiceId === invDoc.id ? 'OK' : `MISMATCH (${b.invoiceId})`,
    }, null, 2));
    console.log('');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
