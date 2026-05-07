// One-shot: create users docs for existing Firebase Auth users.
// Defaults all existing users to role='admin' (Jon + Coastal admins).
// Idempotent — won't overwrite existing users docs.
// Skips Auth users with no email (e.g. orphan smoke-test-uid).

const admin = require('firebase-admin');
const path = require('path');

admin.initializeApp({
  credential: admin.credential.cert(path.join(process.env.HOME, '.coastal-firebase-admin.json')),
});

(async () => {
  const authResult = await admin.auth().listUsers(50);
  console.log(`Found ${authResult.users.length} Auth users`);

  for (const user of authResult.users) {
    if (!user.email) {
      console.log(`SKIP uid=${user.uid} — no email (orphan or test artifact)`);
      continue;
    }

    const ref = admin.firestore().doc(`users/${user.uid}`);
    const existing = await ref.get();
    if (existing.exists) {
      console.log(`SKIP ${user.email} — users doc already exists`);
      continue;
    }

    await ref.set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      role: 'admin',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'bootstrap',
      lastLoginAt: null,
    });
    console.log(`CREATE ${user.email} as admin (uid: ${user.uid})`);
  }

  console.log('Bootstrap complete.');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
