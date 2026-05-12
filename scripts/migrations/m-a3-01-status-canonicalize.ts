/* eslint-disable no-console */
import type { Firestore } from 'firebase-admin/firestore';

/* Canonical Booking statuses per walkthrough Decision 5. */
const BOOKING_CANONICAL = new Set([
  'pending',
  'confirmed',
  'in-progress',
  'completed',
  'cancelled',
  'dead',
  'new-lead',
]);

/* Canonical Invoice statuses per walkthrough Decision 5. `overdue` is
 * derived at read time (status === 'sent' && dueDate < today); it ships
 * as a real stored value too, hence inclusion here. */
const INVOICE_CANONICAL = new Set(['draft', 'sent', 'paid', 'overdue']);

/* Map of known drift -> canonical. Case-folded and trimmed before lookup.
 * Current production inventory (2026-05-12) reports zero drift; this map
 * is a future-proofing safety net for legacy imports, buggy writers, etc. */
const BOOKING_DRIFT: Record<string, string> = {
  in_progress: 'in-progress',
  inprogress: 'in-progress',
  'in progress': 'in-progress',
  newlead: 'new-lead',
  new_lead: 'new-lead',
  'new lead': 'new-lead',
  scheduled: 'confirmed',
  done: 'completed',
  finished: 'completed',
  cancel: 'cancelled',
  canceled: 'cancelled',
  'no-show': 'dead',
  noshow: 'dead',
};

const INVOICE_DRIFT: Record<string, string> = {
  outstanding: 'sent',
  unpaid: 'sent',
  past_due: 'overdue',
  'past-due': 'overdue',
  pastdue: 'overdue',
  cleared: 'paid',
  closed: 'paid',
};

interface CollectionConfig {
  name: 'bookings' | 'invoices';
  canonical: Set<string>;
  drift: Record<string, string>;
}

const COLLECTIONS: CollectionConfig[] = [
  { name: 'bookings', canonical: BOOKING_CANONICAL, drift: BOOKING_DRIFT },
  { name: 'invoices', canonical: INVOICE_CANONICAL, drift: INVOICE_DRIFT },
];

function normalizeKey(s: string): string {
  return s.trim().toLowerCase();
}

const migration = {
  id: 'm-a3-01-status-canonicalize',
  description:
    'Canonicalize Booking + Invoice status enums. Maps known drift (case ' +
    'variants, underscores, typos) to the canonical values from walkthrough ' +
    'Decision 5. Idempotent. Currently a no-op against production per the ' +
    '2026-05-12 inventory; ships as future-proofing.',
  async run(db: Firestore) {
    const result = {
      scanned: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };
    const dryRun = process.env.DRY_RUN === 'true';
    const unmappable: string[] = [];

    for (const col of COLLECTIONS) {
      const snap = await db.collection(col.name).get();
      for (const doc of snap.docs) {
        result.scanned++;
        const data = doc.data();
        const status = typeof data.status === 'string' ? data.status : null;
        if (status === null) {
          result.skipped++;
          continue;
        }
        if (col.canonical.has(status)) {
          result.skipped++;
          continue;
        }
        const key = normalizeKey(status);
        const mapped = col.drift[key];
        if (!mapped) {
          unmappable.push(`${col.name}/${doc.id}: status="${status}"`);
          result.errors.push(`unmappable status in ${col.name}/${doc.id}: "${status}"`);
          continue;
        }
        if (dryRun) {
          console.log(
            `  [DRY] ${col.name}/${doc.id}: "${status}" -> "${mapped}"`,
          );
        } else {
          try {
            await doc.ref.update({ status: mapped });
          } catch (e) {
            result.errors.push(
              `${col.name}/${doc.id}: ${e instanceof Error ? e.message : 'unknown'}`,
            );
            continue;
          }
        }
        result.updated++;
      }
    }

    if (unmappable.length > 0) {
      console.log(`  Unmappable statuses requiring manual review:`);
      for (const u of unmappable) console.log(`    ${u}`);
    }
    return result;
  },
};

export default migration;
