#!/usr/bin/env node
/**
 * WO-DRIVE-MIRROR verification.
 *
 * Phase A: Backfill the existing tech_completion test invoice (CMLT-2026-020,
 *   bookingId mbUNP6kOpufjyTLqcAk3) by invoking the deployed
 *   mirrorInvoiceToDriveCallable. Confirm Drive folder/file IDs land on
 *   the doc. Required to pass before Phase B/C run (shared infrastructure).
 *
 * Phase B: Create an ephemeral tech_completion invoice (status='draft'),
 *   reusing the test invoice's PDF path. Flip status to 'sent' and poll for
 *   driveMirrorAt to be populated by the onUpdate trigger.
 *
 * Phase C: Create an ephemeral manual_admin invoice, flip to 'sent', wait,
 *   confirm driveMirrorAt was NOT written (source filter holds).
 *
 * Cleanup: Drive folders for B fixtures are deleted via the helper. C never
 *   creates a Drive folder.
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const CRED_PATH = '/Users/jgsystems/.coastal-firebase-admin.json';
// Make the helper's google.auth.GoogleAuth pick up the same SA cert for Drive
// API calls (cleanup of fixture folders). Otherwise it falls back to gcloud
// user creds which lack Drive scope.
process.env.GOOGLE_APPLICATION_CREDENTIALS = CRED_PATH;
const PROJECT_ID = 'coastal-mobile-lube';
const REGION = 'us-east1';
const FIREBASE_API_KEY = 'AIzaSyAc0DaFdRXhiOuICQNn-rlBi5udx6ce4j4';
const ADMIN_UID = 'hhSOVRodJ8gUeCb0kBmQsFHUgNs2'; // jonrgold@gmail.com
const TEST_BOOKING_ID = 'mbUNP6kOpufjyTLqcAk3';
const MIRROR_CALLABLE_URL = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/mirrorInvoiceToDriveCallable`;

const REPORTS_DIR = path.join(__dirname, '..', '_reports');
fs.mkdirSync(REPORTS_DIR, { recursive: true });

admin.initializeApp({
  credential: admin.credential.cert(require(CRED_PATH)),
  storageBucket: `${PROJECT_ID}.firebasestorage.app`,
});
const db = admin.firestore();

const { deleteDriveFolder } = require(path.join(__dirname, '..', 'functions', 'lib', 'drive-mirror.js'));

const ts = Date.now();
const failures = [];

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function mintAdminIdToken(uid) {
  const customToken = await admin.auth().createCustomToken(uid);
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`signInWithCustomToken failed (${resp.status}): ${body}`);
  }
  const json = await resp.json();
  return json.idToken;
}

async function callMirrorCallable(invoiceId, idToken) {
  const resp = await fetch(MIRROR_CALLABLE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ data: { invoiceId } }),
  });
  const text = await resp.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`callable returned non-JSON (${resp.status}): ${text.slice(0, 400)}`);
  }
  if (!resp.ok || json.error) {
    throw new Error(`callable failed: ${JSON.stringify(json)}`);
  }
  return json.result;
}

async function findTestInvoice() {
  const snap = await db
    .collection('invoices')
    .where('bookingId', '==', TEST_BOOKING_ID)
    .where('source', '==', 'tech_completion')
    .limit(1)
    .get();
  if (snap.empty) throw new Error('test invoice not found for booking ' + TEST_BOOKING_ID);
  return { id: snap.docs[0].id, data: snap.docs[0].data() };
}

async function phaseA() {
  log('=== Phase A: backfill via mirrorInvoiceToDriveCallable ===');

  const test = await findTestInvoice();
  log(`Found test invoice ${test.id} (${test.data.invoiceNumber})`);
  log(`  pre-state driveMirrorAt: ${test.data.driveMirrorAt ? 'present' : '<absent>'}`);
  log(`  pre-state driveJobFolderUrl: ${test.data.driveJobFolderUrl || '<absent>'}`);

  if (!test.data.customerInvoicePdfPath) {
    throw new Error('test invoice has no customerInvoicePdfPath; D3 must run first');
  }

  const idToken = await mintAdminIdToken(ADMIN_UID);
  log('Minted admin ID token');

  const result = await callMirrorCallable(test.id, idToken);
  log(`Callable returned: ok=${result.ok} folder=${result.driveJobFolderUrl}`);

  const post = (await db.collection('invoices').doc(test.id).get()).data();
  if (!post.driveJobFolderId) throw new Error('driveJobFolderId not set on invoice doc');
  if (!post.driveJobFolderUrl) throw new Error('driveJobFolderUrl not set on invoice doc');
  if (!post.drivePdfFileId) throw new Error('drivePdfFileId not set on invoice doc');
  if (!post.drivePdfUrl) throw new Error('drivePdfUrl not set on invoice doc');
  if (!post.driveMirrorAt) throw new Error('driveMirrorAt not set on invoice doc');
  if (post.driveMirrorError) throw new Error(`driveMirrorError unexpectedly set: ${post.driveMirrorError}`);

  if (post.driveJobFolderUrl !== result.driveJobFolderUrl) {
    throw new Error('driveJobFolderUrl mismatch on doc vs callable result');
  }

  const mirroredAtMs = post.driveMirrorAt.toMillis
    ? post.driveMirrorAt.toMillis()
    : new Date(post.driveMirrorAt).getTime();
  const ageSec = (Date.now() - mirroredAtMs) / 1000;
  if (ageSec > 120 || ageSec < 0) {
    throw new Error(`driveMirrorAt not fresh: age=${ageSec}s`);
  }
  log(`Doc fields validated. Drive mirror age: ${ageSec.toFixed(1)}s`);
  log(`✅ Phase A passed — backfill via callable works`);
  return {
    invoiceId: test.id,
    invoiceNumber: test.data.invoiceNumber,
    customerInvoicePdfPath: test.data.customerInvoicePdfPath,
    customerName: test.data.customerName,
    bookingId: test.data.bookingId,
    sentDate: test.data.sentDate,
    driveJobFolderUrl: post.driveJobFolderUrl,
    drivePdfUrl: post.drivePdfUrl,
  };
}

function ephemeralBaseFromTest(testData, source, fixtureLabel, suffix) {
  const clone = { ...testData };
  // Strip output fields that would otherwise hint at "already mirrored"
  delete clone.driveJobFolderId;
  delete clone.driveJobFolderUrl;
  delete clone.drivePdfFileId;
  delete clone.drivePdfUrl;
  delete clone.driveMirrorAt;
  delete clone.driveMirrorError;
  delete clone.driveMirrorPartial;
  delete clone.qbInvoiceId;
  delete clone.qbAttachableId;
  delete clone.qbAttachableError;
  clone.source = source;
  clone.status = 'draft';
  clone.invoiceNumber = `CMLT-VERIFY-${suffix}`;
  clone.isVerificationFixture = fixtureLabel;
  clone.createdAt = admin.firestore.FieldValue.serverTimestamp();
  return clone;
}

async function phaseB(testInvoiceData) {
  log('=== Phase B: ephemeral tech_completion invoice exercises onUpdate trigger ===');

  const fixture = ephemeralBaseFromTest(testInvoiceData, 'tech_completion', 'DRIVE-MIRROR-phaseB', `B${ts}`);
  const ref = db.collection('invoices').doc();
  await ref.set(fixture);
  log(`Created ephemeral invoice ${ref.id} (status=draft, invoiceNumber=${fixture.invoiceNumber})`);

  // Flip to sent — this is the trigger condition
  await ref.update({
    status: 'sent',
    sentDate: admin.firestore.FieldValue.serverTimestamp(),
  });
  log('Flipped status: draft -> sent');

  let observed = null;
  let lastState = null;
  for (let elapsed = 0; elapsed < 120; elapsed += 10) {
    await new Promise((r) => setTimeout(r, 10000));
    const snap = await ref.get();
    lastState = snap.data();
    log(`  +${elapsed + 10}s mirroredAt=${lastState.driveMirrorAt ? 'present' : 'absent'} err=${lastState.driveMirrorError || 'none'}`);
    if (lastState.driveMirrorAt) {
      observed = lastState;
      break;
    }
    if (lastState.driveMirrorError) {
      throw new Error(`trigger failed: ${lastState.driveMirrorError}`);
    }
  }

  if (!observed) {
    log(`⚠️  Phase B FAILED — leaving ephemeral doc ${ref.id} for debugging.`);
    log(`Last state: ${JSON.stringify(lastState, null, 2)}`);
    throw new Error('Phase B timed out');
  }

  // Cleanup Drive + Firestore
  if (observed.driveJobFolderId) {
    try {
      await deleteDriveFolder(observed.driveJobFolderId);
      log(`  cleaned up Drive folder ${observed.driveJobFolderId}`);
    } catch (e) {
      log(`  WARN: failed to delete Drive folder ${observed.driveJobFolderId}: ${e.message}`);
    }
  }
  await ref.delete();
  log(`  deleted ephemeral invoice ${ref.id}`);

  log(`✅ Phase B passed — onUpdate trigger fires on status flip to sent`);
}

async function phaseC(testInvoiceData) {
  log('=== Phase C: ephemeral manual_admin invoice — source filter must skip ===');

  const fixture = ephemeralBaseFromTest(testInvoiceData, 'manual_admin', 'DRIVE-MIRROR-phaseC', `C${ts}`);
  const ref = db.collection('invoices').doc();
  await ref.set(fixture);
  log(`Created ephemeral invoice ${ref.id} (source=manual_admin)`);

  await ref.update({
    status: 'sent',
    sentDate: admin.firestore.FieldValue.serverTimestamp(),
  });
  log('Flipped status: draft -> sent');

  await new Promise((r) => setTimeout(r, 30000));
  const snap = await ref.get();
  const data = snap.data();
  log(`  +30s mirroredAt=${data.driveMirrorAt ? 'PRESENT (BUG)' : 'absent (correct)'} err=${data.driveMirrorError || 'none'}`);

  // Cleanup any spurious Drive folder, just in case
  if (data.driveJobFolderId) {
    try {
      await deleteDriveFolder(data.driveJobFolderId);
    } catch (e) {
      log(`  WARN: failed to clean spurious Drive folder: ${e.message}`);
    }
  }
  await ref.delete();
  log(`  deleted ephemeral invoice ${ref.id}`);

  if (data.driveMirrorAt) {
    throw new Error('source filter failed — manual_admin invoice was mirrored');
  }
  if (data.driveMirrorError) {
    throw new Error(`unexpected error on manual_admin invoice: ${data.driveMirrorError}`);
  }

  log(`✅ Phase C passed — source filter correctly skips manual_admin`);
}

(async () => {
  log(`Starting verify-drive-mirror (ts=${ts})`);

  let phaseAResult = null;
  try {
    phaseAResult = await phaseA();
    log(`Phase A summary: invoice=${phaseAResult.invoiceId} folder=${phaseAResult.driveJobFolderUrl} pdf=${phaseAResult.drivePdfUrl}`);
  } catch (e) {
    failures.push(['A', e.message]);
    log(`❌ Phase A FAILED: ${e.message}`);
  }

  if (!phaseAResult) {
    log('Skipping Phase B and C — Phase A is required to pass first (shared infrastructure)');
  } else {
    let testInvoiceData = null;
    try {
      const test = await findTestInvoice();
      testInvoiceData = test.data;
    } catch (e) {
      log(`Cannot find test invoice for B/C cloning: ${e.message}`);
    }

    if (testInvoiceData) {
      try {
        await phaseB(testInvoiceData);
      } catch (e) {
        failures.push(['B', e.message]);
        log(`❌ Phase B FAILED: ${e.message}`);
      }

      try {
        await phaseC(testInvoiceData);
      } catch (e) {
        failures.push(['C', e.message]);
        log(`❌ Phase C FAILED: ${e.message}`);
      }
    } else {
      failures.push(['B/C', 'no test invoice to clone']);
    }
  }

  log('');
  log('=== FINAL SUMMARY ===');
  if (phaseAResult) {
    log(`Drive folder URL: ${phaseAResult.driveJobFolderUrl}`);
    log(`PDF Drive URL:    ${phaseAResult.drivePdfUrl}`);
  }
  if (failures.length === 0) {
    log('🎉 ALL PHASES PASSED');
    process.exit(0);
  } else {
    failures.forEach(([p, m]) => log(`Phase ${p}: ${m}`));
    process.exit(1);
  }
})().catch((e) => {
  log(`UNHANDLED ERROR: ${e.stack || e.message}`);
  process.exit(2);
});
