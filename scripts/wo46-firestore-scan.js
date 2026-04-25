#!/usr/bin/env node

/**
 * WO-46 Phase A — scan Firestore for warranty / 12-month / 1,000-mile / 30-day / guarantee
 * mentions in copy-bearing collections.
 *
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=~/.coastal-firebase-admin.json node scripts/wo46-firestore-scan.js
 */

const admin = require("firebase-admin");

admin.initializeApp({ projectId: "coastal-mobile-lube" });
const db = admin.firestore();

const PATTERNS = [/warranty/i, /12-month/i, /12 month/i, /1,000[ -]mile/i, /1000[ -]mile/i, /30-day/i, /30 day/i, /guarantee/i];

function scanString(s) {
  if (typeof s !== "string") return null;
  const hits = [];
  for (const p of PATTERNS) {
    if (p.test(s)) hits.push(p.source);
  }
  return hits.length ? hits : null;
}

function scanObject(obj, path = "") {
  const results = [];
  if (obj == null) return results;
  if (typeof obj === "string") {
    const hit = scanString(obj);
    if (hit) results.push({ path, value: obj, hit });
    return results;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => results.push(...scanObject(v, `${path}[${i}]`)));
    return results;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      results.push(...scanObject(v, path ? `${path}.${k}` : k));
    }
  }
  return results;
}

async function scanCollection(name) {
  console.log(`\n── scanning ${name} ──`);
  try {
    const snap = await db.collection(name).get();
    if (snap.empty) {
      console.log(`  (collection empty or missing)`);
      return;
    }
    console.log(`  ${snap.size} doc(s)`);
    for (const doc of snap.docs) {
      const hits = scanObject(doc.data());
      if (hits.length) {
        console.log(`  HIT in ${name}/${doc.id}:`);
        for (const h of hits) {
          console.log(`    field: ${h.path}`);
          console.log(`    matches: ${h.hit.join(", ")}`);
          console.log(`    value: ${JSON.stringify(h.value).slice(0, 250)}`);
        }
      }
    }
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
  }
}

async function main() {
  const collections = ["siteConfig", "heroCopy", "contentFragments", "siteCopy", "config"];
  for (const c of collections) await scanCollection(c);

  // Also dump the well-known siteConfig/heroCopy doc directly
  console.log(`\n── siteConfig/heroCopy direct read ──`);
  try {
    const snap = await db.doc("siteConfig/heroCopy").get();
    if (snap.exists) {
      console.log(JSON.stringify(snap.data(), null, 2));
    } else {
      console.log("  (doc does not exist)");
    }
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
