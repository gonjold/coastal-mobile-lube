/* eslint-disable no-console */
import type { Firestore } from 'firebase-admin/firestore';

/* A3d STEP 3 backfill #1: invoices/{id}.bookingId
 *
 * Scans invoices; for each `source: 'tech_completion'` doc without
 * `bookingId`, attempts to look up the parent booking by customer-name +
 * customer-phone + status==='completed'. When exactly one booking matches,
 * writes both invoices/{id}.bookingId AND bookings/{id}.invoiceId in a
 * single batch (mirrors the atomic write that A3d STEP 2 enforces going
 * forward in createInvoiceDraftFromBooking).
 *
 * Expected scope per WO: 0-5 documents need backfill. Higher counts
 * suggest something is wrong upstream and warrant manual review.
 *
 * Additive only. No deletes. No field-shape changes. Safe to dry-run.
 */

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

const migration: Migration = {
  id: 'm-a3d-01-backfill-invoice-bookingid',
  description:
    'Backfill invoices/{id}.bookingId for tech_completion invoices missing the link',
  async run(db: Firestore): Promise<MigrationResult> {
    const dryRun = process.env.DRY_RUN === 'true';
    const result: MigrationResult = {
      scanned: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    const unresolved: Array<{ id: string; reason: string; customerName?: string; customerPhone?: string }> = [];

    const invoicesSnap = await db.collection('invoices').get();
    for (const invDoc of invoicesSnap.docs) {
      result.scanned++;
      const inv = invDoc.data();

      if (inv.source !== 'tech_completion') {
        result.skipped++;
        continue;
      }
      if (typeof inv.bookingId === 'string' && inv.bookingId.length > 0) {
        result.skipped++;
        continue;
      }

      const customerName = (inv.customerName || '').trim();
      const customerPhone = (inv.customerPhone || '').trim();
      if (!customerName || !customerPhone) {
        unresolved.push({ id: invDoc.id, reason: 'missing customerName or customerPhone on invoice' });
        result.errors.push(`${invDoc.id}: missing customer fields on invoice`);
        continue;
      }

      const matches = await db
        .collection('bookings')
        .where('customerName', '==', customerName)
        .where('customerPhone', '==', customerPhone)
        .where('status', '==', 'completed')
        .get();

      if (matches.empty) {
        unresolved.push({ id: invDoc.id, reason: 'no completed booking with matching name+phone', customerName, customerPhone });
        result.skipped++;
        continue;
      }

      if (matches.size > 1) {
        unresolved.push({ id: invDoc.id, reason: `${matches.size} candidate bookings (ambiguous)`, customerName, customerPhone });
        result.errors.push(`${invDoc.id}: ${matches.size} candidate bookings, manual review required`);
        continue;
      }

      const bookingDoc = matches.docs[0];
      const bookingData = bookingDoc.data();

      // Idempotency: if the booking already has an invoiceId that points to a
      // different invoice, refuse to overwrite. The human should manually
      // reconcile.
      if (bookingData.invoiceId && bookingData.invoiceId !== invDoc.id) {
        unresolved.push({
          id: invDoc.id,
          reason: `candidate booking ${bookingDoc.id} already has invoiceId=${bookingData.invoiceId}; would conflict`,
          customerName,
          customerPhone,
        });
        result.errors.push(`${invDoc.id}: booking ${bookingDoc.id} has conflicting invoiceId ${bookingData.invoiceId}`);
        continue;
      }

      if (dryRun) {
        console.log(`  [DRY] invoices/${invDoc.id} <-> bookings/${bookingDoc.id}`);
        result.updated++;
        continue;
      }

      try {
        const batch = db.batch();
        batch.update(invDoc.ref, { bookingId: bookingDoc.id });
        if (!bookingData.invoiceId) {
          batch.update(bookingDoc.ref, {
            invoiceId: invDoc.id,
            invoiceNumber: inv.invoiceNumber,
          });
        }
        await batch.commit();
        console.log(`  [LINK] invoices/${invDoc.id} <-> bookings/${bookingDoc.id}`);
        result.updated++;
      } catch (e) {
        result.errors.push(
          `${invDoc.id} -> ${bookingDoc.id}: ${e instanceof Error ? e.message : 'unknown'}`,
        );
      }
    }

    if (unresolved.length > 0) {
      console.log(`\n  Unresolved tech_completion invoices (${unresolved.length}):`);
      for (const u of unresolved) {
        console.log(`    ${u.id} - ${u.reason}${u.customerName ? ` (${u.customerName} ${u.customerPhone})` : ''}`);
      }
    }

    return result;
  },
};

export default migration;
