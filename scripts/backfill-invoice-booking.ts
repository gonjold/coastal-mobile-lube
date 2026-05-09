/* eslint-disable no-console */
/**
 * Heuristic invoice ↔ booking backfill (WO-FM-1-BACKLOG · D1).
 *
 * Walks invoices with bookingId == null and deleted != true. For each, locates
 * a single confidently-matching booking under these constraints:
 *   - Customer match (id OR email lowercase OR exact name)
 *   - booking.status ∈ {confirmed, in_progress, completed}
 *   - |invoice.invoiceDate − booking.scheduledDate| ≤ 14 days
 *   - |invoice.total − booking total| ≤ $5  OR  lineItem set substantially
 *     overlaps booking.selectedServices
 *
 * Modes:
 *   --dry-run (default)     proposes matches, writes nothing, emits markdown
 *                           report to _reports/backfill-proposals-<ts>.md
 *   --apply                 writes approved proposals (invoice.bookingId AND
 *                           booking.invoiceId in a Firestore batch). Idempotent.
 *   --exclude=CMLT-001,...  applies all proposals EXCEPT the listed invoice
 *                           numbers (or invoice doc ids).
 *
 * Customer linkage note: in this project, bookings do not carry a customerId
 * field — booking↔customer linkage is via flat email/name. So the "customerId
 * first" criterion in the WO is effectively unused on the invoice side; we
 * fall through to lowercase email, then exact-name match.
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

const CRED_PATH = path.join(
  process.env.HOME ?? '/Users/jgsystems',
  '.coastal-firebase-admin.json',
);

const ALLOWED_BOOKING_STATUSES = new Set([
  'confirmed',
  'in_progress',
  'completed',
]);

const DATE_WINDOW_DAYS = 14;
const TOTAL_TOLERANCE_DOLLARS = 5;

type AnyDoc = Record<string, unknown> & { id: string };

function initAdmin(): void {
  if (getApps().length > 0) return;
  if (!fs.existsSync(CRED_PATH)) {
    throw new Error(`Firebase admin credentials not found at ${CRED_PATH}`);
  }
  const json = JSON.parse(fs.readFileSync(CRED_PATH, 'utf8'));
  initializeApp({ credential: cert(json) });
}

function normalizeEmail(s: unknown): string {
  return typeof s === 'string' ? s.trim().toLowerCase() : '';
}

function normalizeName(s: unknown): string {
  return typeof s === 'string'
    ? s.trim().toLowerCase().replace(/\s+/g, ' ')
    : '';
}

function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function bookingTotal(b: AnyDoc): number {
  const est = asNumber(b.estimateTotal);
  if (est !== null) return est;
  const services = b.selectedServices as
    | Array<{ price?: number | null }>
    | undefined;
  if (Array.isArray(services)) {
    return services.reduce((sum, sv) => {
      const p = asNumber(sv?.price);
      return sum + (p ?? 0);
    }, 0);
  }
  return 0;
}

function bookingScheduledDate(b: AnyDoc): string | null {
  const c = typeof b.confirmedDate === 'string' ? b.confirmedDate : null;
  const p = typeof b.preferredDate === 'string' ? b.preferredDate : null;
  return c ?? p ?? null;
}

function invoiceIssuedDate(inv: AnyDoc): string | null {
  if (typeof inv.invoiceDate === 'string') return inv.invoiceDate;
  if (typeof inv.issuedDate === 'string') return inv.issuedDate;
  // Fallback: createdAt timestamp → YYYY-MM-DD
  const ts = inv.createdAt as { toDate?: () => Date } | undefined;
  if (ts && typeof ts.toDate === 'function') {
    const d = ts.toDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return null;
}

function parseISODate(s: string | null): number | null {
  if (!s) return null;
  const t = Date.parse(s + 'T12:00:00');
  return Number.isFinite(t) ? t : null;
}

function lineItemsOverlap(
  invLineItems: unknown,
  bookingServices: unknown,
): boolean {
  if (!Array.isArray(invLineItems) || invLineItems.length === 0) return false;
  if (!Array.isArray(bookingServices) || bookingServices.length === 0)
    return false;

  const svcNames = bookingServices
    .map((s: unknown) =>
      normalizeName((s as { name?: unknown } | null)?.name),
    )
    .filter(Boolean);

  if (svcNames.length === 0) return false;

  let matches = 0;
  for (const li of invLineItems) {
    const ln = normalizeName((li as { serviceName?: unknown } | null)?.serviceName);
    if (!ln) continue;
    if (svcNames.some((sn) => ln.includes(sn) || sn.includes(ln))) matches++;
  }
  return matches >= Math.ceil(invLineItems.length / 2);
}

type Proposal = {
  kind: 'propose';
  invoiceId: string;
  invoiceNumber: string | null;
  bookingId: string;
  customerName: string;
  invoiceDate: string | null;
  bookingDate: string | null;
  invoiceTotal: number | null;
  bookingTotal: number;
  matchReasons: string[];
};

type Skip = {
  kind: 'skip-multi' | 'unmatched';
  invoiceId: string;
  invoiceNumber: string | null;
  customerName: string;
  invoiceDate: string | null;
  invoiceTotal: number | null;
  reason: string;
};

type Decision = Proposal | Skip;

async function fetchCandidateBookings(
  db: FirebaseFirestore.Firestore,
  inv: AnyDoc,
): Promise<AnyDoc[]> {
  const seen = new Map<string, AnyDoc>();

  const email = normalizeEmail(inv.customerEmail);
  if (email) {
    const queries = await Promise.all([
      db.collection('bookings').where('email', '==', email).get(),
      db.collection('bookings').where('customerEmail', '==', email).get(),
    ]);
    for (const snap of queries) {
      for (const d of snap.docs) {
        if (!seen.has(d.id))
          seen.set(d.id, { id: d.id, ...d.data() } as AnyDoc);
      }
    }
  }

  // Email may have been stored cased — best-effort exact-cased fallback if
  // nothing came back.
  if (seen.size === 0 && typeof inv.customerEmail === 'string') {
    const exact = inv.customerEmail.trim();
    if (exact) {
      const queries = await Promise.all([
        db.collection('bookings').where('email', '==', exact).get(),
        db.collection('bookings').where('customerEmail', '==', exact).get(),
      ]);
      for (const snap of queries) {
        for (const d of snap.docs) {
          if (!seen.has(d.id))
            seen.set(d.id, { id: d.id, ...d.data() } as AnyDoc);
        }
      }
    }
  }

  const name = normalizeName(inv.customerName);
  if (seen.size === 0 && name && typeof inv.customerName === 'string') {
    // Last-resort exact name match — fetch all bookings is too broad, so we
    // try the verbatim casing first, then the lower-cased form.
    const tried = new Set<string>();
    for (const variant of [inv.customerName.trim(), name]) {
      if (tried.has(variant)) continue;
      tried.add(variant);
      const queries = await Promise.all([
        db.collection('bookings').where('name', '==', variant).get(),
        db.collection('bookings').where('customerName', '==', variant).get(),
      ]);
      for (const snap of queries) {
        for (const d of snap.docs) {
          if (!seen.has(d.id))
            seen.set(d.id, { id: d.id, ...d.data() } as AnyDoc);
        }
      }
      if (seen.size > 0) break;
    }
  }

  return [...seen.values()];
}

function evaluateMatch(inv: AnyDoc, b: AnyDoc): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const status = typeof b.status === 'string' ? b.status : '';
  if (!ALLOWED_BOOKING_STATUSES.has(status))
    return { ok: false, reasons: [`status=${status || '∅'}`] };

  const iMs = parseISODate(invoiceIssuedDate(inv));
  const bMs = parseISODate(bookingScheduledDate(b));
  if (iMs === null || bMs === null)
    return { ok: false, reasons: ['date missing'] };

  const diffDays = Math.abs(iMs - bMs) / 86_400_000;
  if (diffDays > DATE_WINDOW_DAYS)
    return { ok: false, reasons: [`Δdays=${diffDays.toFixed(1)}`] };
  reasons.push(`Δdays=${diffDays.toFixed(1)}`);

  const invTotal = asNumber(inv.total);
  const bkTotal = bookingTotal(b);
  const totalDelta = invTotal !== null ? Math.abs(invTotal - bkTotal) : null;

  let totalOk = false;
  if (totalDelta !== null && totalDelta <= TOTAL_TOLERANCE_DOLLARS) {
    totalOk = true;
    reasons.push(`Δtotal=$${totalDelta.toFixed(2)}`);
  }

  let overlapOk = false;
  if (lineItemsOverlap(inv.lineItems, b.selectedServices)) {
    overlapOk = true;
    reasons.push('lineItemsOverlap');
  }

  if (!totalOk && !overlapOk)
    return {
      ok: false,
      reasons: [
        totalDelta !== null ? `Δtotal=$${totalDelta.toFixed(2)}` : 'Δtotal=∅',
        'noOverlap',
      ],
    };

  return { ok: true, reasons };
}

function fmtUSD(n: number | null): string {
  if (n === null) return '—';
  return `$${n.toFixed(2)}`;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const excludeArg = args.find((a) => a.startsWith('--exclude='));
  const excludes = new Set<string>(
    (excludeArg ? excludeArg.slice('--exclude='.length).split(',') : [])
      .map((s) => s.trim())
      .filter(Boolean),
  );

  initAdmin();
  const db = getFirestore();

  const allInvSnap = await db.collection('invoices').get();
  const candidates: AnyDoc[] = allInvSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as AnyDoc)
    .filter(
      (i) =>
        (i.bookingId === null ||
          i.bookingId === undefined ||
          i.bookingId === '') &&
        i.deleted !== true,
    );

  console.log(
    `[backfill] mode=${apply ? 'apply' : 'dry-run'} · candidates=${candidates.length}`,
  );

  const decisions: Decision[] = [];

  for (const inv of candidates) {
    const invNumber =
      typeof inv.invoiceNumber === 'string' ? inv.invoiceNumber : null;
    const customerName =
      typeof inv.customerName === 'string' ? inv.customerName : '';
    const invDate = invoiceIssuedDate(inv);
    const invTotal = asNumber(inv.total);

    const bookings = await fetchCandidateBookings(db, inv);

    const matched: { booking: AnyDoc; reasons: string[] }[] = [];
    for (const b of bookings) {
      const r = evaluateMatch(inv, b);
      if (r.ok) matched.push({ booking: b, reasons: r.reasons });
    }

    if (matched.length === 1) {
      const { booking, reasons } = matched[0];
      decisions.push({
        kind: 'propose',
        invoiceId: inv.id,
        invoiceNumber: invNumber,
        bookingId: booking.id,
        customerName,
        invoiceDate: invDate,
        bookingDate: bookingScheduledDate(booking),
        invoiceTotal: invTotal,
        bookingTotal: bookingTotal(booking),
        matchReasons: reasons,
      });
    } else if (matched.length > 1) {
      decisions.push({
        kind: 'skip-multi',
        invoiceId: inv.id,
        invoiceNumber: invNumber,
        customerName,
        invoiceDate: invDate,
        invoiceTotal: invTotal,
        reason: `multiple matches: ${matched.map((m) => m.booking.id).join(', ')}`,
      });
    } else {
      decisions.push({
        kind: 'unmatched',
        invoiceId: inv.id,
        invoiceNumber: invNumber,
        customerName,
        invoiceDate: invDate,
        invoiceTotal: invTotal,
        reason:
          bookings.length === 0
            ? 'no customer bookings'
            : `${bookings.length} bookings checked, none qualified`,
      });
    }
  }

  const proposed = decisions.filter(
    (d): d is Proposal => d.kind === 'propose',
  );
  const manualReview = decisions.filter((d) => d.kind === 'skip-multi');
  const unmatched = decisions.filter((d) => d.kind === 'unmatched');

  // Build markdown report
  const ts = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace(/Z$/, 'Z');
  const reportPath = path.join(
    process.cwd(),
    '_reports',
    `backfill-proposals-${ts}.md`,
  );
  const reportLines: string[] = [];
  reportLines.push(`# Invoice ↔ Booking backfill — ${apply ? 'APPLY' : 'DRY-RUN'} ${ts}`);
  reportLines.push('');
  reportLines.push(
    `Candidates: ${candidates.length} · Proposed: ${proposed.length} · Manual-review: ${manualReview.length} · Unmatched: ${unmatched.length}`,
  );
  reportLines.push('');
  reportLines.push(
    `Excluded invoice numbers/ids: ${excludes.size > 0 ? [...excludes].join(', ') : '(none)'}`,
  );
  reportLines.push('');
  reportLines.push('## Proposed matches');
  reportLines.push('');
  reportLines.push(
    '| Invoice # | Booking ID | Customer | Invoice Date | Booking Date | Inv Total | Bk Total | Confidence | Decision |',
  );
  reportLines.push(
    '|-----------|------------|----------|--------------|--------------|-----------|----------|------------|----------|',
  );
  for (const p of proposed) {
    const excluded =
      excludes.has(p.invoiceNumber ?? '') || excludes.has(p.invoiceId);
    reportLines.push(
      `| ${p.invoiceNumber ?? '∅'} | ${p.bookingId} | ${p.customerName || '∅'} | ${p.invoiceDate ?? '∅'} | ${p.bookingDate ?? '∅'} | ${fmtUSD(p.invoiceTotal)} | ${fmtUSD(p.bookingTotal)} | ${p.matchReasons.join(' / ')} | ${excluded ? 'EXCLUDED' : 'LINK'} |`,
    );
  }
  reportLines.push('');
  reportLines.push('## Manual review (multiple booking matches)');
  reportLines.push('');
  if (manualReview.length === 0) {
    reportLines.push('_None_');
  } else {
    reportLines.push('| Invoice # | Customer | Reason |');
    reportLines.push('|-----------|----------|--------|');
    for (const d of manualReview) {
      reportLines.push(
        `| ${d.invoiceNumber ?? '∅'} | ${d.customerName || '∅'} | ${d.reason} |`,
      );
    }
  }
  reportLines.push('');
  reportLines.push('## Unmatched');
  reportLines.push('');
  if (unmatched.length === 0) {
    reportLines.push('_None_');
  } else {
    reportLines.push('| Invoice # | Customer | Reason |');
    reportLines.push('|-----------|----------|--------|');
    for (const d of unmatched) {
      reportLines.push(
        `| ${d.invoiceNumber ?? '∅'} | ${d.customerName || '∅'} | ${d.reason} |`,
      );
    }
  }
  reportLines.push('');

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, reportLines.join('\n'), 'utf8');

  // Print stdout summary table
  console.log('');
  console.log(
    `Proposed: ${proposed.length}  Manual-review: ${manualReview.length}  Unmatched: ${unmatched.length}`,
  );
  console.log('');
  if (proposed.length > 0) {
    console.log(
      'Inv #'.padEnd(16) +
        'Booking ID'.padEnd(28) +
        'Customer'.padEnd(28) +
        'Inv Date'.padEnd(13) +
        'Bk Date'.padEnd(13) +
        'Inv Total'.padEnd(11) +
        'Bk Total'.padEnd(11) +
        'Confidence',
    );
    for (const p of proposed) {
      const excluded =
        excludes.has(p.invoiceNumber ?? '') || excludes.has(p.invoiceId);
      console.log(
        `${(p.invoiceNumber ?? '∅').padEnd(16)}${p.bookingId.padEnd(28)}${(p.customerName || '∅').slice(0, 26).padEnd(28)}${(p.invoiceDate ?? '∅').padEnd(13)}${(p.bookingDate ?? '∅').padEnd(13)}${fmtUSD(p.invoiceTotal).padEnd(11)}${fmtUSD(p.bookingTotal).padEnd(11)}${p.matchReasons.join(' / ')}${excluded ? '  [EXCLUDED]' : ''}`,
      );
    }
  }

  console.log('');
  console.log(`Report: ${reportPath}`);
  console.log('');

  if (!apply) {
    console.log(
      `BACKFILL DRY-RUN COMPLETE. Review ${reportPath}. Reply 'go' to apply, 'skip' to defer the apply step, or paste a list of invoice numbers to exclude.`,
    );
    return;
  }

  // APPLY: write each non-excluded propose decision in a small batch.
  let applied = 0;
  let skippedAlreadyLinked = 0;
  let skippedConflict = 0;
  let skippedExcluded = 0;
  for (const p of proposed) {
    const key = p.invoiceNumber ?? '';
    if (excludes.has(key) || excludes.has(p.invoiceId)) {
      skippedExcluded++;
      continue;
    }

    // Idempotency check — re-read both docs.
    const [invSnap, bkSnap] = await Promise.all([
      db.collection('invoices').doc(p.invoiceId).get(),
      db.collection('bookings').doc(p.bookingId).get(),
    ]);
    if (!invSnap.exists || !bkSnap.exists) {
      console.log(
        `[skip] ${p.invoiceNumber ?? p.invoiceId} → missing doc on re-read`,
      );
      continue;
    }
    const invNow = invSnap.data() as AnyDoc;
    const bkNow = bkSnap.data() as AnyDoc;
    const invHas =
      invNow.bookingId !== null &&
      invNow.bookingId !== undefined &&
      invNow.bookingId !== '';
    const bkHas =
      bkNow.invoiceId !== null &&
      bkNow.invoiceId !== undefined &&
      bkNow.invoiceId !== '';
    if (invHas && bkHas && invNow.bookingId === p.bookingId && bkNow.invoiceId === p.invoiceId) {
      skippedAlreadyLinked++;
      continue;
    }
    if (
      (invHas && invNow.bookingId !== p.bookingId) ||
      (bkHas && bkNow.invoiceId !== p.invoiceId)
    ) {
      console.log(
        `[skip-conflict] ${p.invoiceNumber ?? p.invoiceId} ↔ ${p.bookingId}: invoice.bookingId=${String(invNow.bookingId)} booking.invoiceId=${String(bkNow.invoiceId)}`,
      );
      skippedConflict++;
      continue;
    }

    const batch = db.batch();
    batch.update(db.collection('invoices').doc(p.invoiceId), {
      bookingId: p.bookingId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.update(db.collection('bookings').doc(p.bookingId), {
      invoiceId: p.invoiceId,
      ...(p.invoiceNumber ? { invoiceNumber: p.invoiceNumber } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    applied++;
    console.log(
      `[link] ${p.invoiceNumber ?? p.invoiceId} ↔ ${p.bookingId}`,
    );
  }

  console.log('');
  console.log(
    `APPLY complete · linked=${applied} alreadyLinked=${skippedAlreadyLinked} conflict=${skippedConflict} excluded=${skippedExcluded}`,
  );
  console.log(`Report: ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
