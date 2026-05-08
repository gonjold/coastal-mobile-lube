const admin = require('firebase-admin');
const path = require('path');
const os = require('os');

admin.initializeApp({
  credential: admin.credential.cert(require(path.join(os.homedir(), '.coastal-firebase-admin.json'))),
});

const db = admin.firestore();

async function run() {
  const ref = db.doc('settings/business');
  const before = await ref.get();
  console.log('=== BEFORE ===');
  console.log(before.exists ? JSON.stringify(before.data(), null, 2) : 'doc does not exist');

  const update = {
    businessLegalName: 'Coastal Mobile Lube & Tire LLC',
    businessAddress: '805 Golf Island Dr, Apollo Beach, FL 33572',
    businessPhone: '(813) 722-5823',
    businessEmail: 'info@coastalmobilelube.com',
  };

  await ref.set(update, { merge: true });

  const after = await ref.get();
  console.log('=== AFTER ===');
  console.log(JSON.stringify(after.data(), null, 2));
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
