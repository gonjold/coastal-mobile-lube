// Simulates the Start Job action via Admin SDK to verify Firestore writes succeed
// and the resulting doc has the expected shape. Idempotent — rolls back its own writes
// so Jon can re-test in browser afterward.

const admin = require('firebase-admin');
const path = require('path');

admin.initializeApp({
  credential: admin.credential.cert(path.join(process.env.HOME, '.coastal-firebase-admin.json')),
});

(async () => {
  // Query confirmed bookings, then filter for those with an assignedTechId in JS
  // to avoid needing a composite index for the inequality.
  const snap = await admin.firestore().collection('bookings')
    .where('status', '==', 'confirmed')
    .limit(50)
    .get();

  const candidate = snap.docs.find((d) => !!d.data().assignedTechId);
  if (!candidate) {
    console.log('No confirmed booking with assignedTechId to test against.');
    console.log('Assign a tech to any confirmed booking via admin UI, then re-run.');
    process.exit(0);
  }

  const docRef = candidate.ref;
  const before = candidate.data();
  console.log('Testing against booking:', docRef.id);
  console.log('Customer:', before.customerName || before.name);
  console.log('Status before:', before.status);

  const testWrite = {
    vehicleInfo: {
      year: before.vehicleYear ? parseInt(before.vehicleYear, 10) : 2022,
      make: before.vehicleMake || 'TEST_MAKE',
      model: before.vehicleModel || 'TEST_MODEL',
      trim: before.vehicleTrim || null,
      vin: before.vin || '1HGBH41JXMN109186',
      licenseTag: 'TEST123',
      odometerIn: 152340,
      odometerOut: null,
    },
    odometerIn: 152340,
    licenseTag: 'TEST123',
    customerComplaint: 'Verification script test — please ignore',
    techCheckInAt: admin.firestore.FieldValue.serverTimestamp(),
    jobStartedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'in-progress',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await docRef.update(testWrite);
  const after = (await docRef.get()).data();
  console.log('Status after:', after.status);
  console.log('vehicleInfo populated:', JSON.stringify(after.vehicleInfo, null, 2));
  console.log('Lifecycle timestamps:');
  console.log('  techCheckInAt:', after.techCheckInAt?.toDate?.() || after.techCheckInAt);
  console.log('  jobStartedAt:', after.jobStartedAt?.toDate?.() || after.jobStartedAt);

  console.log('\n--- ROLLING BACK ---');
  await docRef.update({
    status: 'confirmed',
    techCheckInAt: null,
    jobStartedAt: null,
    odometerIn: null,
    licenseTag: null,
    customerComplaint: null,
    vehicleInfo: before.vehicleInfo || null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('Booking reverted to confirmed state. Ready for Jon to test in browser.');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
