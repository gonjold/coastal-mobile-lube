#!/usr/bin/env node

/**
 * WO-40c — Booking CMS v1 migration.
 *
 * One-time: backfills new CMS schema fields on every serviceCategories doc
 * (isFeatured, bookingVisibility, featuredSubtitle) and every services doc
 * (bookingVisibility), then converts the existing "Coastal Oil & Maintenance
 * Packages" auto category into a featured block in place. No new docs are
 * created. WO-42 bullets (bundleItems) on the Coastal service docs are left
 * untouched.
 *
 * Modes (mutually exclusive):
 *   --dry-run   (default): log every planned change. No writes.
 *   --execute           : perform writes in three batches (A, B, C). Writes
 *                         a manifest to _reports/ so --revert can undo the
 *                         exact docs+fields touched.
 *   --revert            : read the most recent execute manifest from _reports/
 *                         and remove only the fields this migration added.
 *                         Will not touch docs/fields the migration did not set.
 *
 * Idempotent: running twice with --execute is a no-op on the second run.
 * Auth: reads GOOGLE_APPLICATION_CREDENTIALS from env.
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

admin.initializeApp({ projectId: "coastal-mobile-lube" });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const REPORTS_DIR = path.join(__dirname, "..", "_reports");
const MANIFEST_PREFIX = "wo40c-execute-manifest-";

const PHASE_A_DEFAULTS = {
  isFeatured: false,
  bookingVisibility: "inline",
  featuredSubtitle: "",
};
const PHASE_B_DEFAULTS = {
  bookingVisibility: "inline",
};
const PHASE_C_CATEGORY = {
  isFeatured: true,
  featuredSubtitle: "Bundled services at a better price",
  bookingVisibility: "inline",
};
const PHASE_C_SERVICE = {
  bookingVisibility: "inline",
};

// ─── CLI ───────────────────────────────────────────────────
const args = process.argv.slice(2);
let mode = "dry-run";
if (args.includes("--execute")) mode = "execute";
else if (args.includes("--revert")) mode = "revert";
else if (args.includes("--dry-run")) mode = "dry-run";

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// ─── Data load ─────────────────────────────────────────────
async function loadAll() {
  const [catSnap, svcSnap] = await Promise.all([
    db.collection("serviceCategories").get(),
    db.collection("services").get(),
  ]);
  return {
    categories: catSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    services: svcSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  };
}

// ─── Phase planners (pure — compute deltas without writing) ─
function planPhaseA(categories) {
  const touched = [];
  for (const c of categories) {
    const patch = {};
    for (const [k, v] of Object.entries(PHASE_A_DEFAULTS)) {
      if (c[k] === undefined) patch[k] = v;
    }
    if (Object.keys(patch).length > 0) {
      touched.push({ id: c.id, name: c.name, division: c.division, patch });
    }
  }
  return touched;
}

function planPhaseB(services) {
  const touched = [];
  for (const s of services) {
    const patch = {};
    for (const [k, v] of Object.entries(PHASE_B_DEFAULTS)) {
      if (s[k] === undefined) patch[k] = v;
    }
    if (Object.keys(patch).length > 0) {
      touched.push({ id: s.id, name: s.name, division: s.division, category: s.category, patch });
    }
  }
  return touched;
}

function findCoastalCategoryAndChildren(categories, services) {
  // Match auto-division categories whose name contains both "coastal" and
  // "packages". Multiple matches: disambiguate by picking the one that has
  // ≥1 child service (linked by s.category === c.name).
  const matches = categories.filter(
    (c) =>
      c.division === "auto" &&
      /coastal/i.test(c.name || "") &&
      /packages?/i.test(c.name || "")
  );
  const withChildren = matches.map((c) => {
    const kids = services.filter(
      (s) => s.division === "auto" && s.category === c.name
    );
    return { cat: c, kids };
  });
  const candidates = withChildren.filter((x) => x.kids.length > 0);
  if (candidates.length === 0) {
    throw new Error(
      `Phase C: no auto category matching /coastal/i + /packages/i with ≥1 child service. Found ${matches.length} name match(es), 0 with children.`
    );
  }
  if (candidates.length > 1) {
    throw new Error(
      `Phase C: ambiguous — ${candidates.length} auto Coastal-Packages categories have children: ${candidates.map((x) => x.cat.id).join(", ")}`
    );
  }
  return candidates[0];
}

function planPhaseC(categories, services) {
  const { cat, kids } = findCoastalCategoryAndChildren(categories, services);
  const catPatch = {};
  for (const [k, v] of Object.entries(PHASE_C_CATEGORY)) {
    if (cat[k] !== v) catPatch[k] = v;
  }
  const childPatches = kids
    .map((s) => {
      const patch = {};
      for (const [k, v] of Object.entries(PHASE_C_SERVICE)) {
        if (s[k] !== v) patch[k] = v;
      }
      return { id: s.id, name: s.name, displayName: s.displayName, price: s.price, patch };
    });
  return { category: { id: cat.id, name: cat.name, patch: catPatch }, services: childPatches };
}

// ─── Dry-run report ────────────────────────────────────────
function reportDryRun(plan) {
  const { phaseA, phaseB, phaseC } = plan;

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  WO-40c migration — DRY RUN");
  console.log(`  Timestamp: ${new Date().toISOString()}`);
  console.log("  No writes performed.");
  console.log("═══════════════════════════════════════════════════════════════");

  console.log(`\n── Phase A: backfill serviceCategories ──`);
  console.log(`Categories that would be written: ${phaseA.length}`);
  for (const t of phaseA) {
    const fields = Object.entries(t.patch).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(", ");
    console.log(`  [${t.division}] ${t.id.padEnd(30)} "${t.name}"`);
    console.log(`    add: ${fields}`);
  }

  console.log(`\n── Phase B: backfill services ──`);
  console.log(`Services that would be written: ${phaseB.length}`);
  const byDiv = {};
  for (const t of phaseB) {
    byDiv[t.division] = (byDiv[t.division] || 0) + 1;
  }
  console.log(`  Per division:`, byDiv);
  const byCat = {};
  for (const t of phaseB) {
    const k = `${t.division}: ${t.category}`;
    byCat[k] = (byCat[k] || 0) + 1;
  }
  console.log(`  Per category:`);
  for (const [k, n] of Object.entries(byCat).sort()) {
    console.log(`    ${k.padEnd(60)} ${n}`);
  }
  // Full ID list (trimmed if huge)
  console.log(`\n  Full service ID list (add: bookingVisibility="inline"):`);
  for (const t of phaseB) {
    console.log(`    ${t.id}`);
  }

  console.log(`\n── Phase C: convert Coastal Packages in place ──`);
  console.log(`Target category:`);
  console.log(`  ${phaseC.category.id}  "${phaseC.category.name}"`);
  if (Object.keys(phaseC.category.patch).length === 0) {
    console.log(`  (category already fully converted — no write needed)`);
  } else {
    console.log(`  patch:`);
    for (const [k, v] of Object.entries(phaseC.category.patch)) {
      console.log(`    ${k} ← ${JSON.stringify(v)}`);
    }
  }
  console.log(`\nTarget child services (${phaseC.services.length}):`);
  for (const s of phaseC.services) {
    const needsUpdate = Object.keys(s.patch).length > 0;
    const label = needsUpdate ? "UPDATE" : "already set — will skip";
    console.log(`  ${s.id.padEnd(26)} "${s.name}" ($${s.price})  [${label}]`);
    if (needsUpdate) {
      for (const [k, v] of Object.entries(s.patch)) {
        console.log(`    ${k} ← ${JSON.stringify(v)}`);
      }
    }
  }

  const phaseBForCoastal = new Set(phaseC.services.map((s) => s.id));
  const phaseBServicesOverlap = phaseB.filter((t) => phaseBForCoastal.has(t.id)).length;
  if (phaseBServicesOverlap > 0) {
    console.log(`\nNote: ${phaseBServicesOverlap} Coastal child service(s) will be set to bookingVisibility="inline" by Phase B. Phase C would then skip them (already set).`);
  }

  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`Summary counts`);
  console.log(`  Phase A category writes : ${phaseA.length}`);
  console.log(`  Phase B service writes  : ${phaseB.length}`);
  console.log(`  Phase C category write  : ${Object.keys(phaseC.category.patch).length > 0 ? 1 : 0}`);
  console.log(`  Phase C service writes  : ${phaseC.services.filter((s) => Object.keys(s.patch).length > 0).length}  (usually 0 because Phase B already handled them)`);
  console.log(`Total unique doc writes  : ${countUniqueDocWrites(plan)}`);
  console.log(`═══════════════════════════════════════════════════════════════\n`);
}

function countUniqueDocWrites({ phaseA, phaseB, phaseC }) {
  const docs = new Set();
  for (const t of phaseA) docs.add(`cat:${t.id}`);
  for (const t of phaseB) docs.add(`svc:${t.id}`);
  if (Object.keys(phaseC.category.patch).length > 0) docs.add(`cat:${phaseC.category.id}`);
  for (const s of phaseC.services) {
    if (Object.keys(s.patch).length > 0) docs.add(`svc:${s.id}`);
  }
  return docs.size;
}

// ─── Execute ───────────────────────────────────────────────
async function runExecute(plan) {
  const { phaseA, phaseB, phaseC } = plan;
  const manifest = {
    version: "v1",
    executedAt: new Date().toISOString(),
    categoriesTouched: [],
    servicesTouched: [],
    phaseC: {
      categoryId: phaseC.category.id,
      categoryName: phaseC.category.name,
      categoryFieldsWritten: Object.keys(phaseC.category.patch),
      childServiceIds: phaseC.services.map((s) => s.id),
    },
  };

  // Aggregate: dedupe writes per doc. Phase C may override Phase A for the
  // Coastal category; Phase B almost always already handles the children so
  // Phase C's service patches will be empty.
  const catWrites = new Map(); // id -> {fields, patch}
  for (const t of phaseA) {
    catWrites.set(t.id, { ...t.patch });
  }
  if (Object.keys(phaseC.category.patch).length > 0) {
    const existing = catWrites.get(phaseC.category.id) || {};
    catWrites.set(phaseC.category.id, { ...existing, ...phaseC.category.patch });
  }

  const svcWrites = new Map();
  for (const t of phaseB) {
    svcWrites.set(t.id, { ...t.patch });
  }
  for (const s of phaseC.services) {
    if (Object.keys(s.patch).length > 0) {
      const existing = svcWrites.get(s.id) || {};
      svcWrites.set(s.id, { ...existing, ...s.patch });
    }
  }

  console.log(`Executing. Categories: ${catWrites.size}. Services: ${svcWrites.size}.`);

  // Firestore batch limit = 500; we're well under.
  const batchSize = 400;
  const allCatEntries = [...catWrites.entries()];
  const allSvcEntries = [...svcWrites.entries()];

  async function commitEntries(entries, coll) {
    for (let i = 0; i < entries.length; i += batchSize) {
      const chunk = entries.slice(i, i + batchSize);
      const batch = db.batch();
      for (const [id, patch] of chunk) {
        batch.update(db.collection(coll).doc(id), patch);
      }
      await batch.commit();
      console.log(`  ${coll}: committed ${chunk.length} writes`);
    }
  }

  if (allCatEntries.length > 0) await commitEntries(allCatEntries, "serviceCategories");
  else console.log("  serviceCategories: nothing to write.");
  if (allSvcEntries.length > 0) await commitEntries(allSvcEntries, "services");
  else console.log("  services: nothing to write.");

  for (const [id, patch] of allCatEntries) manifest.categoriesTouched.push({ id, fieldsAdded: Object.keys(patch) });
  for (const [id, patch] of allSvcEntries) manifest.servicesTouched.push({ id, fieldsAdded: Object.keys(patch) });

  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const manifestPath = path.join(REPORTS_DIR, `${MANIFEST_PREFIX}${stamp()}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written: ${manifestPath}`);
  console.log(`Use --revert to undo (reads latest manifest).`);

  return manifest;
}

// ─── Revert ────────────────────────────────────────────────
function findLatestManifest() {
  if (!fs.existsSync(REPORTS_DIR)) return null;
  const files = fs
    .readdirSync(REPORTS_DIR)
    .filter((f) => f.startsWith(MANIFEST_PREFIX) && f.endsWith(".json"))
    .map((f) => ({ f, mtime: fs.statSync(path.join(REPORTS_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return files.length > 0 ? path.join(REPORTS_DIR, files[0].f) : null;
}

async function runRevert() {
  const manifestPath = findLatestManifest();
  if (!manifestPath) {
    console.error("No execute manifest found in _reports/. Nothing to revert.");
    process.exit(1);
  }
  console.log(`Reading manifest: ${manifestPath}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  console.log(`Manifest executedAt: ${manifest.executedAt}`);
  console.log(`Will remove fields from:`);
  console.log(`  ${manifest.categoriesTouched.length} serviceCategories docs`);
  console.log(`  ${manifest.servicesTouched.length} services docs`);

  const batchSize = 400;
  async function revertEntries(entries, coll) {
    for (let i = 0; i < entries.length; i += batchSize) {
      const chunk = entries.slice(i, i + batchSize);
      const batch = db.batch();
      for (const e of chunk) {
        const patch = {};
        for (const field of e.fieldsAdded) patch[field] = FieldValue.delete();
        batch.update(db.collection(coll).doc(e.id), patch);
      }
      await batch.commit();
      console.log(`  ${coll}: reverted ${chunk.length} docs`);
    }
  }

  await revertEntries(manifest.categoriesTouched, "serviceCategories");
  await revertEntries(manifest.servicesTouched, "services");

  // Archive the used manifest so the next --revert doesn't try to reverse an already-reverted set.
  const archived = manifestPath.replace(".json", `.reverted-${stamp()}.json`);
  fs.renameSync(manifestPath, archived);
  console.log(`\nManifest archived to: ${archived}`);
  console.log(`Revert complete.`);
}

// ─── Main ──────────────────────────────────────────────────
(async () => {
  console.log(`Mode: ${mode}`);
  if (mode === "revert") {
    await runRevert();
    process.exit(0);
  }

  const { categories, services } = await loadAll();
  const plan = {
    phaseA: planPhaseA(categories),
    phaseB: planPhaseB(services),
    phaseC: planPhaseC(categories, services),
  };

  if (mode === "dry-run") {
    reportDryRun(plan);
    console.log(`Dry-run only. No writes. Re-run with --execute to apply.`);
    process.exit(0);
  }

  if (mode === "execute") {
    reportDryRun(plan);
    console.log(`──── EXECUTING ────\n`);
    await runExecute(plan);
    console.log(`\nDone.`);
    process.exit(0);
  }
})().catch((e) => {
  console.error("\nERROR:", e.message);
  if (process.env.DEBUG) console.error(e);
  process.exit(1);
});
