// One-shot script to backfill FDACS fields on existing bookings + invoices.
// Idempotent: only writes fields that are currently `undefined`.
// Safe to run multiple times.
//
// WO-FDACS-B Option C shape:
// - Bookings: flat new fields only (existing flat vehicleYear/Make/Model/etc untouched)
// - Invoices: nested vehicleInfo + flat new fields. Old invoices get vehicleInfo: null
//   (do NOT back-construct from any source — only new invoices going forward will
//   carry vehicleInfo, populated at invoice-creation time from the source booking).

const admin = require('firebase-admin');
const path = require('path');

admin.initializeApp({
  credential: admin.credential.cert(path.join(process.env.HOME, '.coastal-firebase-admin.json')),
});
const db = admin.firestore();

const BOOKING_DEFAULTS = {
  licenseTag: null,
  odometerIn: null,
  odometerOut: null,
  customerComplaint: null,
  assignedTechId: null,
  techCheckInAt: null,
  jobStartedAt: null,
  jobCompletedAt: null,
  photos: [],
  customerSignatureUrl: null,
};

const INVOICE_DEFAULTS = {
  bookingId: null,
  vehicleInfo: null,
  customerComplaint: null,
  photos: [],
  customerSignatureUrl: null,
  techCheckInAt: null,
  jobCompletedAt: null,
  assignedTechId: null,
};

async function backfillCollection(collName, defaults) {
  const snap = await db.collection(collName).get();
  let written = 0;
  let skipped = 0;
  let batch = db.batch();
  let batchSize = 0;
  const FLUSH_AT = 400;

  for (const doc of snap.docs) {
    const data = doc.data();
    const toAdd = {};
    for (const key of Object.keys(defaults)) {
      if (data[key] === undefined) {
        toAdd[key] = defaults[key];
      }
    }
    if (Object.keys(toAdd).length > 0) {
      batch.set(doc.ref, toAdd, { merge: true });
      batchSize++;
      written++;
      if (batchSize >= FLUSH_AT) {
        await batch.commit();
        batch = db.batch();
        batchSize = 0;
      }
    } else {
      skipped++;
    }
  }
  if (batchSize > 0) await batch.commit();
  console.log(`${collName}: ${written} backfilled, ${skipped} already had fields, ${snap.size} total`);
}

(async () => {
  console.log('Backfilling FDACS fields...');
  await backfillCollection('bookings', BOOKING_DEFAULTS);
  await backfillCollection('invoices', INVOICE_DEFAULTS);
  console.log('Done.');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
