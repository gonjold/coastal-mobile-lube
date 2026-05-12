/* eslint-disable no-console */
import type { Firestore } from 'firebase-admin/firestore';

const VALID_CATEGORIES = new Set(['auto', 'marine', 'fleet', 'rv']);

/** Coerce a category-ish string to canonical lowercase. */
function canonicalize(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const lower = raw.trim().toLowerCase();
  if (VALID_CATEGORIES.has(lower)) return lower;
  // RV variants
  if (lower === 'recreational' || lower === 'rv & camper' || lower === 'camper') return 'rv';
  // Marine variants
  if (lower === 'boat' || lower === 'vessel' || lower === 'watercraft') return 'marine';
  // Fleet variants
  if (lower === 'commercial' || lower === 'fleet vehicle') return 'fleet';
  // Automotive variants
  if (lower === 'automotive' || lower === 'car' || lower === 'auto vehicle') return 'auto';
  return null;
}

interface BookingDoc {
  serviceCategory?: unknown;
  division?: unknown;
  selectedServices?: Array<{ category?: unknown; id?: unknown }>;
  vesselMake?: unknown;
  vesselYear?: unknown;
  fleetSize?: unknown;
  rvType?: unknown;
}

/** Derive a category from booking signals if serviceCategory is missing.
 * Order: division (canonical source) -> selectedServices[0].category ->
 * marine signal -> fleet signal -> RV signal -> 'auto' as last-resort default.
 *
 * Why division first: the 2026-05-12 prod inspection showed all 18 backfill
 * candidates carry a canonical division ('auto' or 'rv'), while
 * selectedServices[0].category holds user-facing labels like 'Tires & Wheels'
 * or 'RV Oil Changes' that don't match the canonical enum. Without
 * division-first, an RV booking would miscategorize as 'auto'. */
function deriveCategory(b: BookingDoc): string | null {
  const fromDivision = canonicalize(b.division);
  if (fromDivision) return fromDivision;
  const fromSelected = b.selectedServices && b.selectedServices.length > 0
    ? canonicalize(b.selectedServices[0].category)
    : null;
  if (fromSelected) return fromSelected;
  if (b.vesselMake || b.vesselYear) return 'marine';
  if (b.fleetSize) return 'fleet';
  if (b.rvType) return 'rv';
  return 'auto';
}

const migration = {
  id: 'm-a3-02-service-category-backfill',
  description:
    'Backfill bookings.serviceCategory when missing. Derives from division ' +
    'first (canonical source per 2026-05-12 prod inspection), then from ' +
    'selectedServices[0].category, then marine/fleet/RV signals, then ' +
    "'auto' as last resort. Idempotent — re-running on a backfilled doc " +
    'is a no-op.',
  async run(db: Firestore) {
    const result = {
      scanned: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };
    const dryRun = process.env.DRY_RUN === 'true';
    const snap = await db.collection('bookings').get();
    for (const doc of snap.docs) {
      result.scanned++;
      const data = doc.data() as BookingDoc;
      const existing = canonicalize(data.serviceCategory);
      if (existing) {
        result.skipped++;
        continue;
      }
      const derived = deriveCategory(data);
      if (!derived) {
        result.skipped++;
        continue;
      }
      if (dryRun) {
        console.log(
          `  [DRY] bookings/${doc.id}: serviceCategory missing -> "${derived}"`,
        );
      } else {
        try {
          await doc.ref.update({ serviceCategory: derived });
        } catch (e) {
          result.errors.push(
            `bookings/${doc.id}: ${e instanceof Error ? e.message : 'unknown'}`,
          );
          continue;
        }
      }
      result.updated++;
    }
    return result;
  },
};

export default migration;
