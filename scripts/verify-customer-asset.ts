/* eslint-disable no-console */
/**
 * Sprint 1 verification (D2): exercise ensureBookingAsset against a synthetic
 * booking + customer pair. Confirms that booking.assetId gets set and a new
 * assets/{id} doc gets created. Cleans up afterwards.
 *
 * NOTE: invokes the helper directly (rather than via curl through the
 * /api/field/jobs/[id]/check-in route) because triggering the route requires
 * a server session ID token for an owner/tech user. This still exercises the
 * helper that the route delegates to.
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { ensureBookingAsset } from '../src/lib/jobs/ensureBookingAsset';

const CRED_PATH = path.join(
  process.env.HOME ?? '/Users/jgsystems',
  '.coastal-firebase-admin.json',
);

function init(): void {
  if (getApps().length > 0) return;
  const json = JSON.parse(fs.readFileSync(CRED_PATH, 'utf8'));
  initializeApp({ credential: cert(json) });
}

async function main(): Promise<void> {
  init();
  const db = getFirestore();

  const stamp = Date.now();
  const customerId = `verify_cust_${stamp}`;
  const bookingId = `verify_bk_${stamp}`;
  const customerEmail = `verify+${stamp}@coastal-test.invalid`;

  console.log('=== Setup: writing synthetic customer + booking ===');

  await db.collection('customers').doc(customerId).set({
    id: customerId,
    name: 'Verification Tester',
    email: customerEmail,
    phone: '555-555-0199',
    phoneNormalized: '5555550199',
    isTest: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await db.collection('bookings').doc(bookingId).set({
    name: 'Verification Tester',
    customerName: 'Verification Tester',
    email: customerEmail,
    customerEmail,
    phone: '555-555-0199',
    customerPhone: '555-555-0199',
    status: 'confirmed',
    confirmedDate: '2026-05-09',
    vehicleYear: '2018',
    vehicleMake: 'Toyota',
    vehicleModel: 'Camry',
    vehicleTrim: 'LE',
    vin: '4T1B11HK0JU000000',
    licenseTag: 'VRFY123',
    vehicleInfo: {
      year: 2018,
      make: 'Toyota',
      model: 'Camry',
      trim: 'LE',
      vin: '4T1B11HK0JU000000',
      licenseTag: 'VRFY123',
    },
    isTest: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  console.log(`customerId=${customerId} bookingId=${bookingId}`);
  console.log('');

  console.log('=== BEFORE: booking + assets ===');
  const beforeBkSnap = await db.collection('bookings').doc(bookingId).get();
  const beforeBk = beforeBkSnap.data();
  console.log(JSON.stringify({
    'booking.assetId': beforeBk?.assetId ?? null,
    'booking.status': beforeBk?.status,
    'booking.vehicleInfo': beforeBk?.vehicleInfo,
  }, null, 2));
  const beforeAssetsSnap = await db
    .collection('assets')
    .where('customerId', '==', customerId)
    .get();
  console.log(`assets-for-customer: ${beforeAssetsSnap.size}`);
  console.log('');

  console.log('=== Invoking ensureBookingAsset ===');
  const result = await ensureBookingAsset(db, bookingId);
  console.log(JSON.stringify(result, null, 2));
  console.log('');

  console.log('=== AFTER: booking + assets ===');
  const afterBkSnap = await db.collection('bookings').doc(bookingId).get();
  const afterBk = afterBkSnap.data();
  console.log(JSON.stringify({
    'booking.assetId': afterBk?.assetId ?? null,
    'booking.updatedAt': afterBk?.updatedAt
      ? (afterBk.updatedAt as Timestamp).toDate().toISOString()
      : null,
  }, null, 2));

  const afterAssetsSnap = await db
    .collection('assets')
    .where('customerId', '==', customerId)
    .get();
  console.log(`assets-for-customer: ${afterAssetsSnap.size}`);
  for (const d of afterAssetsSnap.docs) {
    console.log(JSON.stringify({ id: d.id, ...d.data() }, null, 2));
  }
  console.log('');

  const customerSnap = await db.collection('customers').doc(customerId).get();
  console.log(`customer.assets[]: ${JSON.stringify(customerSnap.data()?.assets ?? null)}`);
  console.log('');

  // Idempotency: call again, expect 'already linked'.
  console.log('=== Idempotency: 2nd ensureBookingAsset call ===');
  const result2 = await ensureBookingAsset(db, bookingId);
  console.log(JSON.stringify(result2, null, 2));
  console.log('');

  // Cleanup
  console.log('=== Cleanup ===');
  for (const d of afterAssetsSnap.docs) {
    await d.ref.delete();
    console.log(`deleted assets/${d.id}`);
  }
  await db.collection('bookings').doc(bookingId).delete();
  console.log(`deleted bookings/${bookingId}`);
  await db.collection('customers').doc(customerId).delete();
  console.log(`deleted customers/${customerId}`);

  // Sanity assertions
  if (!afterBk?.assetId) {
    console.error('FAIL: booking.assetId was not set');
    process.exit(2);
  }
  if (afterAssetsSnap.size !== 1) {
    console.error(`FAIL: expected 1 asset, got ${afterAssetsSnap.size}`);
    process.exit(2);
  }
  if (result2.reason !== 'already linked') {
    console.error(
      `FAIL: idempotency expected 'already linked', got '${result2.reason}'`,
    );
    process.exit(2);
  }
  console.log('PASS');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Silence unused import warning when run via tsx/node
void FieldValue;
