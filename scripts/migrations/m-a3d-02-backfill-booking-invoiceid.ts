/* eslint-disable no-console */
import type { Firestore } from 'firebase-admin/firestore';

/* A3d STEP 3 backfill #2: bookings/{id}.invoiceId (and invoiceNumber)
 *
 * Mirror of m-a3d-01. Scans bookings; for each status==='completed' doc
 * missing invoiceId, attempts to look up the related invoice by
 * customerName + customerPhone + source==='tech_completion'. When exactly
 * one invoice matches, writes both fields back (booking gets invoiceId +
 * invoiceNumber, invoice gets bookingId if missing).
 *
 * Runs after m-a3d-01 so that invoices already linked by #1 won't
 * re-trigger here. The two scripts are idempotent and order-tolerant; #1
 * is just expected to handle the lion's share of records.
 *
 * Additive only.
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
  id: 'm-a3d-02-backfill-booking-invoiceid',
  description:
    'Backfill bookings/{id}.invoiceId + invoiceNumber for completed bookings missing the link',
  async run(db: Firestore): Promise<MigrationResult> {
    const dryRun = process.env.DRY_RUN === 'true';
    const result: MigrationResult = {
      scanned: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    const unresolved: Array<{ id: string; reason: string; customerName?: string; customerPhone?: string }> = [];

    const bookingsSnap = await db
      .collection('bookings')
      .where('status', '==', 'completed')
      .get();
    for (const bookingDoc of bookingsSnap.docs) {
      result.scanned++;
      const booking = bookingDoc.data();

      if (typeof booking.invoiceId === 'string' && booking.invoiceId.length > 0) {
        result.skipped++;
        continue;
      }

      const customerName = (booking.customerName || booking.name || '').trim();
      const customerPhone = (booking.customerPhone || booking.phone || '').trim();
      if (!customerName || !customerPhone) {
        unresolved.push({ id: bookingDoc.id, reason: 'missing customerName or customerPhone on booking' });
        result.skipped++;
        continue;
      }

      const matches = await db
        .collection('invoices')
        .where('source', '==', 'tech_completion')
        .where('customerName', '==', customerName)
        .where('customerPhone', '==', customerPhone)
        .get();

      if (matches.empty) {
        unresolved.push({ id: bookingDoc.id, reason: 'no tech_completion invoice with matching name+phone', customerName, customerPhone });
        result.skipped++;
        continue;
      }

      if (matches.size > 1) {
        unresolved.push({ id: bookingDoc.id, reason: `${matches.size} candidate invoices (ambiguous)`, customerName, customerPhone });
        result.errors.push(`${bookingDoc.id}: ${matches.size} candidate invoices, manual review required`);
        continue;
      }

      const invDoc = matches.docs[0];
      const inv = invDoc.data();

      if (inv.bookingId && inv.bookingId !== bookingDoc.id) {
        unresolved.push({
          id: bookingDoc.id,
          reason: `candidate invoice ${invDoc.id} already has bookingId=${inv.bookingId}; would conflict`,
          customerName,
          customerPhone,
        });
        result.errors.push(`${bookingDoc.id}: invoice ${invDoc.id} has conflicting bookingId ${inv.bookingId}`);
        continue;
      }

      if (dryRun) {
        console.log(`  [DRY] bookings/${bookingDoc.id} <-> invoices/${invDoc.id}`);
        result.updated++;
        continue;
      }

      try {
        const batch = db.batch();
        batch.update(bookingDoc.ref, {
          invoiceId: invDoc.id,
          invoiceNumber: inv.invoiceNumber,
        });
        if (!inv.bookingId) {
          batch.update(invDoc.ref, { bookingId: bookingDoc.id });
        }
        await batch.commit();
        console.log(`  [LINK] bookings/${bookingDoc.id} <-> invoices/${invDoc.id}`);
        result.updated++;
      } catch (e) {
        result.errors.push(
          `${bookingDoc.id} -> ${invDoc.id}: ${e instanceof Error ? e.message : 'unknown'}`,
        );
      }
    }

    if (unresolved.length > 0) {
      console.log(`\n  Unresolved completed bookings (${unresolved.length}):`);
      for (const u of unresolved) {
        console.log(`    ${u.id} - ${u.reason}${u.customerName ? ` (${u.customerName} ${u.customerPhone})` : ''}`);
      }
    }

    return result;
  },
};

export default migration;
