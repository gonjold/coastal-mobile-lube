#!/usr/bin/env node

/**
 * Hotfix follow-up to WO-CLEAN-01.
 *
 * Two bookings escaped the cleanup heuristics because their linked customer
 * records had already been deleted. Both are fictional names matching their
 * vehicles — clearly test data. Flag them with isTest: true so the admin UI
 * hides them by default.
 *
 *   "Bucky Bronco"  / 2021 Ford Bronco Sport  / Apr 18
 *   "Guy Guy"       / 2018 Porsche 718 Cayman / Apr 15
 *
 * Matching is case-insensitive across the `name` and `customerName` fields.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=~/.coastal-firebase-admin.json \
 *     node scripts/hotfix-orphan-bookings.js            # dry-run
 *   GOOGLE_APPLICATION_CREDENTIALS=~/.coastal-firebase-admin.json \
 *     node scripts/hotfix-orphan-bookings.js --execute
 *   GOOGLE_APPLICATION_CREDENTIALS=~/.coastal-firebase-admin.json \
 *     node scripts/hotfix-orphan-bookings.js --revert
 *
 * Before/after state is tee'd to ~/coastal-mobile-lube/_reports/hotfix-orphans-<ts>.log
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const os = require("os");

const args = process.argv.slice(2);
const EXECUTE = args.includes("--execute");
const REVERT = args.includes("--revert");
const DRY_RUN = !EXECUTE && !REVERT;

const FLAG_SOURCE = "hotfix-orphans-v1";
const TARGET_NAMES = ["bucky bronco", "guy guy"];

admin.initializeApp({ projectId: "coastal-mobile-lube" });
const db = admin.firestore();
const FV = admin.firestore.FieldValue;

/* ── Log tee ──────────────────────────────────────────────── */

const reportsDir = path.join(os.homedir(), "coastal-mobile-lube", "_reports");
fs.mkdirSync(reportsDir, { recursive: true });
const ts = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .replace("T", "-")
  .slice(0, 13); // YYYYMMDD-HHMM
const logPath = path.join(reportsDir, `hotfix-orphans-${ts}.log`);
const logStream = fs.createWriteStream(logPath, { flags: "a" });

function log(line = "") {
  console.log(line);
  logStream.write(line + "\n");
}

/* ── Match helpers ────────────────────────────────────────── */

function normName(v) {
  return typeof v === "string" ? v.toLowerCase().trim() : "";
}

function matchesTarget(data) {
  const candidates = [normName(data.name), normName(data.customerName)];
  return TARGET_NAMES.some((t) => candidates.includes(t));
}

function summarize(doc) {
  const d = doc.data;
  const nm = d.name || d.customerName || "—";
  const vehicle = [d.vehicleYear, d.vehicleMake, d.vehicleModel].filter(Boolean).join(" ") || "—";
  const date = d.confirmedDate || d.preferredDate || "—";
  const phone = d.phone || d.customerPhone || "—";
  const flag = d.isTest === true ? " [isTest=true]" : "";
  return `  ${doc.id.padEnd(22)} | ${nm.padEnd(20)} | ${vehicle.padEnd(30)} | ${date} | ${phone}${flag}`;
}

/* ── Main ─────────────────────────────────────────────────── */

async function main() {
  const mode = REVERT ? "REVERT" : EXECUTE ? "EXECUTE" : "DRY-RUN";
  log(`Hotfix orphan bookings — mode: ${mode}`);
  log(`Timestamp: ${new Date().toISOString()}`);
  log(`Report: ${logPath}`);
  log("");

  if (REVERT) {
    const snap = await db
      .collection("bookings")
      .where("isTestFlaggedBy", "==", FLAG_SOURCE)
      .get();
    log(`Found ${snap.size} booking(s) flagged by ${FLAG_SOURCE} — reverting`);
    log("");
    log("BEFORE:");
    for (const d of snap.docs) {
      log(summarize({ id: d.id, data: d.data() }));
    }
    for (const d of snap.docs) {
      await d.ref.update({
        isTest: FV.delete(),
        isTestFlaggedAt: FV.delete(),
        isTestFlaggedBy: FV.delete(),
      });
    }
    log("");
    log(`Reverted ${snap.size} docs.`);
    logStream.end();
    return;
  }

  /* Load all bookings — small collection, exhaustive scan is fine */
  const snap = await db.collection("bookings").get();
  log(`Loaded bookings: ${snap.size} docs`);

  const matches = [];
  for (const d of snap.docs) {
    const data = d.data() || {};
    if (matchesTarget(data)) {
      matches.push({ id: d.id, ref: d.ref, data });
    }
  }

  log("");
  log(`Matched ${matches.length} target(s) (expected 2):`);
  log("");
  log("BEFORE:");
  for (const m of matches) log(summarize(m));

  if (matches.length === 0) {
    log("");
    log("Nothing to do.");
    logStream.end();
    return;
  }

  if (DRY_RUN) {
    log("");
    log("DRY-RUN — no writes performed. Re-run with --execute to flag.");
    logStream.end();
    return;
  }

  /* EXECUTE */
  log("");
  log("Writing isTest flags...");
  for (const m of matches) {
    if (m.data.isTest === true) {
      log(`  [skip-already-flagged] bookings/${m.id}`);
      continue;
    }
    await m.ref.update({
      isTest: true,
      isTestFlaggedAt: FV.serverTimestamp(),
      isTestFlaggedBy: FLAG_SOURCE,
    });
    log(`  [flagged] bookings/${m.id}`);
  }

  /* Re-read to capture AFTER state */
  log("");
  log("AFTER:");
  for (const m of matches) {
    const fresh = await m.ref.get();
    log(summarize({ id: m.id, data: fresh.data() || {} }));
  }

  log("");
  log(`Done. Flagged ${matches.length} booking(s).`);
  logStream.end();
}

main().catch((err) => {
  log("FAILED: " + (err && err.stack ? err.stack : String(err)));
  logStream.end();
  process.exit(1);
});
