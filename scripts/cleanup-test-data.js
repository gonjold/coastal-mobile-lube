#!/usr/bin/env node

/**
 * WO-CLEAN-01: Test Data Cleanup
 *
 * Soft-delete test bookings, customers, and invoices by setting isTest: true.
 * Detection by phone/email/name/address heuristics. For bookings and invoices,
 * we also traverse to the linked customer (by customerId, then by phone/email)
 * and flag the booking/invoice when the linked customer matches.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=~/.coastal-firebase-admin.json \
 *     node scripts/cleanup-test-data.js --dry-run
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=~/.coastal-firebase-admin.json \
 *     node scripts/cleanup-test-data.js --execute
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=~/.coastal-firebase-admin.json \
 *     node scripts/cleanup-test-data.js --revert
 *
 * Extra flags:
 *   --exclude-ids=abc123,def456   Skip these specific doc IDs
 *   --include-ids=abc123,def456   Force-include these doc IDs
 */

const admin = require("firebase-admin");

/* ── CLI parse ────────────────────────────────────────────── */

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);
const flagValue = (name) => {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  return match ? match.split("=")[1] : "";
};

const DRY_RUN = !hasFlag("execute") && !hasFlag("revert");
const EXECUTE = hasFlag("execute");
const REVERT = hasFlag("revert");

const excludeIds = new Set(
  flagValue("exclude-ids").split(",").map((s) => s.trim()).filter(Boolean)
);
const includeIds = new Set(
  flagValue("include-ids").split(",").map((s) => s.trim()).filter(Boolean)
);

/* ── Firebase init ────────────────────────────────────────── */

admin.initializeApp({ projectId: "coastal-mobile-lube" });
const db = admin.firestore();
const FV = admin.firestore.FieldValue;

const FLAG_SOURCE = "cleanup-v1";
const COLLECTIONS = ["bookings", "customers", "invoices", "leads"];

/* ── Heuristics ───────────────────────────────────────────── */

const TEST_PHONES = new Set(["9492926686", "4436758401"]);

const EMAIL_CONTAINS = ["jonrgold", "jgsystems", "jgoldco"];
const EMAIL_PREFIX = ["test@", "test+"];
const EMAIL_SUFFIX = ["@test.com", "@example.com", "@example.org"];

const NAME_EXACT = ["jon gold", "jonathan gold"];
const NAME_CONTAINS_DELETE = ["test — delete", "test—delete", "test - delete"];
const NAME_WORD_TEST = /\btest\b/i;

const ADDRESS_CONTAINS = ["123 test", "123 fake"];

function normPhone(v) {
  if (!v || typeof v !== "string") return "";
  return v.replace(/\D/g, "");
}

function matchPhone(val) {
  const p = normPhone(val);
  return p && TEST_PHONES.has(p);
}

function matchEmail(val) {
  if (!val || typeof val !== "string") return false;
  const e = val.toLowerCase();
  if (EMAIL_CONTAINS.some((s) => e.includes(s))) return true;
  if (EMAIL_PREFIX.some((p) => e.startsWith(p))) return true;
  if (EMAIL_SUFFIX.some((s) => e.endsWith(s))) return true;
  return false;
}

function matchName(val) {
  if (!val || typeof val !== "string") return false;
  const n = val.toLowerCase().trim();
  if (!n) return false;
  if (NAME_EXACT.includes(n)) return true;
  if (NAME_CONTAINS_DELETE.some((s) => n.includes(s))) return true;
  if (NAME_WORD_TEST.test(n)) return true;
  return false;
}

function matchAddress(val) {
  if (!val || typeof val !== "string") return false;
  const a = val.toLowerCase();
  return ADDRESS_CONTAINS.some((s) => a.includes(s));
}

/**
 * Check any doc (booking/customer/invoice) against heuristics.
 * Returns list of matched reasons (empty = not a candidate).
 */
function detectDoc(data) {
  const reasons = [];

  // Phone (multiple fields)
  for (const field of ["phone", "customerPhone"]) {
    if (matchPhone(data[field])) reasons.push(`phone:${field}`);
  }

  // Email (multiple fields)
  for (const field of ["email", "customerEmail"]) {
    if (matchEmail(data[field])) reasons.push(`email:${field}`);
  }

  // Name (multiple fields)
  for (const field of ["name", "customerName", "firstName", "lastName", "fullName"]) {
    if (matchName(data[field])) reasons.push(`name:${field}`);
  }

  // Address
  for (const field of ["address", "customerAddress"]) {
    if (matchAddress(data[field])) reasons.push(`address:${field}`);
  }

  return reasons;
}

/* ── Data loading ─────────────────────────────────────────── */

async function loadAll() {
  const out = {};
  for (const name of COLLECTIONS) {
    try {
      const snap = await db.collection(name).get();
      out[name] = snap.docs.map((d) => ({
        id: d.id,
        ref: d.ref,
        data: d.data() || {},
      }));
    } catch {
      out[name] = []; // collection may not exist
    }
  }
  return out;
}

/* ── Customer linking ─────────────────────────────────────── */

function buildCustomerIndex(customerDocs) {
  const byId = new Map();
  const byPhone = new Map();
  const byEmail = new Map();
  for (const c of customerDocs) {
    byId.set(c.id, c);
    const p = normPhone(c.data.phone);
    if (p) byPhone.set(p, c);
    const e = (c.data.email || "").toLowerCase().trim();
    if (e) byEmail.set(e, c);
  }
  return { byId, byPhone, byEmail };
}

function findLinkedCustomer(data, cidx) {
  if (data.customerId && cidx.byId.has(data.customerId)) {
    return cidx.byId.get(data.customerId);
  }
  const p = normPhone(data.phone || data.customerPhone);
  if (p && cidx.byPhone.has(p)) return cidx.byPhone.get(p);
  const e = (data.email || data.customerEmail || "").toLowerCase().trim();
  if (e && cidx.byEmail.has(e)) return cidx.byEmail.get(e);
  return null;
}

/* ── Detection pass ───────────────────────────────────────── */

function detectCandidates(all) {
  const candidates = { bookings: [], customers: [], invoices: [], leads: [] };

  const cidx = buildCustomerIndex(all.customers || []);

  for (const c of all.customers || []) {
    if (excludeIds.has(c.id)) continue;
    let reasons = detectDoc(c.data);
    if (includeIds.has(c.id) && reasons.length === 0) reasons = ["include-override"];
    if (reasons.length) candidates.customers.push({ ...c, reasons });
  }

  const flaggedCustomerIds = new Set(candidates.customers.map((x) => x.id));

  for (const name of ["bookings", "invoices", "leads"]) {
    for (const d of all[name] || []) {
      if (excludeIds.has(d.id)) continue;
      let reasons = detectDoc(d.data);

      const linked = findLinkedCustomer(d.data, cidx);
      if (linked && flaggedCustomerIds.has(linked.id)) {
        reasons.push(`linked-customer:${linked.id}`);
      }

      if (includeIds.has(d.id) && reasons.length === 0) reasons = ["include-override"];
      if (reasons.length) candidates[name].push({ ...d, reasons });
    }
  }

  return candidates;
}

/* ── Formatting ───────────────────────────────────────────── */

function fmtTs(ts) {
  if (!ts) return "—".padEnd(16);
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return "—".padEnd(16);
  const iso = d.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

function fmtRow(coll, doc) {
  const d = doc.data;
  const id = doc.id.padEnd(22).slice(0, 22);
  const when = fmtTs(d.createdAt);
  const name = (
    d.name ||
    d.customerName ||
    [d.firstName, d.lastName].filter(Boolean).join(" ") ||
    d.fullName ||
    "—"
  ).padEnd(22).slice(0, 22);
  const phone =
    (d.phone || d.customerPhone ? normPhone(d.phone || d.customerPhone) : "—")
      .padEnd(12)
      .slice(0, 12);
  let detail;
  if (coll === "bookings" || coll === "leads") {
    detail = (
      d.service ||
      (Array.isArray(d.selectedServices) && d.selectedServices[0]?.name) ||
      d.serviceCategory ||
      "—"
    );
  } else if (coll === "invoices") {
    detail = d.invoiceNumber || d.total != null ? `#${d.invoiceNumber || "?"} $${d.total || 0}` : "—";
  } else {
    detail = d.email || d.address || "—";
  }
  detail = String(detail).padEnd(28).slice(0, 28);
  const flagged = d.isTest === true ? " [ALREADY FLAGGED]" : "";
  const reasons = doc.reasons.join(", ");
  return `  ${id} | ${when} | ${name} | ${phone} | ${detail} | Matched: ${reasons}${flagged}`;
}

function printCandidates(candidates) {
  let total = 0;
  let alreadyFlagged = 0;
  for (const coll of ["bookings", "customers", "invoices", "leads"]) {
    const list = candidates[coll] || [];
    console.log("");
    console.log(`=== ${coll.toUpperCase()} — ${list.length} candidate${list.length === 1 ? "" : "s"} ===`);
    if (list.length === 0) continue;
    for (const doc of list) {
      if (doc.data.isTest === true) alreadyFlagged++;
      console.log(fmtRow(coll, doc));
    }
    total += list.length;
  }
  console.log("");
  console.log(
    `TOTAL: ${total} docs would be flagged (${alreadyFlagged} already flagged and will be skipped)`
  );
  return { total, alreadyFlagged };
}

/* ── Execute writes ───────────────────────────────────────── */

async function flagCandidates(candidates) {
  let flagged = 0;
  let skipped = 0;
  for (const coll of COLLECTIONS) {
    const list = candidates[coll] || [];
    if (list.length === 0) continue;
    for (const doc of list) {
      if (doc.data.isTest === true) {
        skipped++;
        console.log(`  [skip-already-flagged] ${coll}/${doc.id}`);
        continue;
      }
      await doc.ref.update({
        isTest: true,
        isTestFlaggedAt: FV.serverTimestamp(),
        isTestFlaggedBy: FLAG_SOURCE,
      });
      flagged++;
      console.log(`  [flagged] ${coll}/${doc.id}`);
    }
  }
  console.log("");
  console.log(`Flagged ${flagged} docs, skipped ${skipped} already-flagged`);
  return { flagged, skipped };
}

/* ── Revert ───────────────────────────────────────────────── */

async function revertAll() {
  let reverted = 0;
  for (const coll of COLLECTIONS) {
    let snap;
    try {
      snap = await db
        .collection(coll)
        .where("isTestFlaggedBy", "==", FLAG_SOURCE)
        .get();
    } catch {
      continue;
    }
    for (const d of snap.docs) {
      await d.ref.update({
        isTest: FV.delete(),
        isTestFlaggedAt: FV.delete(),
        isTestFlaggedBy: FV.delete(),
      });
      reverted++;
      console.log(`  [reverted] ${coll}/${d.id}`);
    }
  }
  console.log("");
  console.log(`Reverted ${reverted} docs flagged by ${FLAG_SOURCE}`);
}

/* ── Main ─────────────────────────────────────────────────── */

async function main() {
  const mode = REVERT ? "REVERT" : EXECUTE ? "EXECUTE" : "DRY-RUN";
  console.log(`Mode: ${mode}`);
  if (excludeIds.size) console.log(`Excluding IDs: ${[...excludeIds].join(", ")}`);
  if (includeIds.size) console.log(`Forcing-include IDs: ${[...includeIds].join(", ")}`);
  console.log("");

  if (REVERT) {
    await revertAll();
    return;
  }

  const all = await loadAll();
  for (const name of COLLECTIONS) {
    console.log(`Loaded ${name}: ${all[name]?.length ?? 0} docs`);
  }

  const candidates = detectCandidates(all);
  printCandidates(candidates);

  if (DRY_RUN) {
    console.log("");
    console.log("DRY-RUN — no writes performed.");
    const total =
      (candidates.bookings?.length || 0) +
      (candidates.customers?.length || 0) +
      (candidates.invoices?.length || 0) +
      (candidates.leads?.length || 0);
    console.log(`To flag these ${total} docs, re-run with:`);
    console.log(
      "  GOOGLE_APPLICATION_CREDENTIALS=~/.coastal-firebase-admin.json node scripts/cleanup-test-data.js --execute"
    );
    return;
  }

  if (EXECUTE) {
    console.log("");
    console.log("EXECUTE — writing flags...");
    await flagCandidates(candidates);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FAILED:", err);
    process.exit(1);
  });
