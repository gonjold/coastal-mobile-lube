#!/usr/bin/env node
/**
 * WO-FDACS-D3 verification.
 *
 * Phase A: Backfill the existing tech_completion test invoice (Honda Civic,
 *   bookingId mbUNP6kOpufjyTLqcAk3) by invoking the deployed
 *   regenerateFdacsInvoicePdf callable. Confirm the three pdf fields land,
 *   download the PDF, sanity-check size + magic bytes.
 *
 * Phase B: Create an ephemeral tech_completion invoice cloned from the test
 *   invoice and poll for the onCreate trigger to populate customerInvoicePdfUrl.
 *
 * Phase C: Create an ephemeral manual_admin invoice and confirm the trigger's
 *   source filter correctly skips it.
 *
 * Notes:
 * - lib/pdf.js uses @sparticuz/chromium which is Linux-only, so we invoke
 *   the deployed Cloud Function (which runs on Linux) rather than calling
 *   buildAndStoreFdacsPdf locally.
 * - Admin auth for the callable: mint a custom token via Admin SDK, exchange
 *   for an ID token via Identity Toolkit REST, then POST to the callable URL.
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const CRED_PATH = '/Users/jgsystems/.coastal-firebase-admin.json';
const PROJECT_ID = 'coastal-mobile-lube';
const REGION = 'us-east1';
const FIREBASE_API_KEY = 'AIzaSyAc0DaFdRXhiOuICQNn-rlBi5udx6ce4j4';
const ADMIN_UID = 'hhSOVRodJ8gUeCb0kBmQsFHUgNs2'; // jonrgold@gmail.com
const TEST_BOOKING_ID = 'mbUNP6kOpufjyTLqcAk3';
const REGEN_CALLABLE_URL = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/regenerateFdacsInvoicePdf`;

const REPORTS_DIR = path.join(__dirname, '..', '_reports');
fs.mkdirSync(REPORTS_DIR, { recursive: true });

admin.initializeApp({
  credential: admin.credential.cert(require(CRED_PATH)),
  storageBucket: `${PROJECT_ID}.firebasestorage.app`,
});
const db = admin.firestore();
const bucket = admin.storage().bucket();

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

async function callRegenCallable(invoiceId, idToken) {
  const resp = await fetch(REGEN_CALLABLE_URL, {
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
  log('=== Phase A: backfill via regenerateFdacsInvoicePdf callable ===');

  const test = await findTestInvoice();
  log(`Found test invoice ${test.id}`);
  log(`  pre-state customerInvoicePdfUrl: ${test.data.customerInvoicePdfUrl || '<absent>'}`);

  const idToken = await mintAdminIdToken(ADMIN_UID);
  log('Minted admin ID token');

  const result = await callRegenCallable(test.id, idToken);
  log(`Callable returned: ok=${result.ok} path=${result.customerInvoicePdfPath}`);

  // Re-read doc and validate fields
  const post = (await db.collection('invoices').doc(test.id).get()).data();
  if (post.customerInvoicePdfUrl !== result.customerInvoicePdfUrl) {
    throw new Error(`customerInvoicePdfUrl mismatch on doc vs callable result`);
  }
  if (post.customerInvoicePdfPath !== result.customerInvoicePdfPath) {
    throw new Error(`customerInvoicePdfPath mismatch`);
  }
  if (!post.customerInvoicePdfGeneratedAt) {
    throw new Error('customerInvoicePdfGeneratedAt missing');
  }
  const genAtMs = post.customerInvoicePdfGeneratedAt.toMillis
    ? post.customerInvoicePdfGeneratedAt.toMillis()
    : new Date(post.customerInvoicePdfGeneratedAt).getTime();
  const ageSec = (Date.now() - genAtMs) / 1000;
  if (ageSec > 60 || ageSec < 0) {
    throw new Error(`customerInvoicePdfGeneratedAt not fresh: age=${ageSec}s`);
  }
  if (post.customerInvoicePdfError) {
    throw new Error(`customerInvoicePdfError unexpectedly set: ${post.customerInvoicePdfError}`);
  }
  log(`Doc fields validated. PDF age: ${ageSec.toFixed(1)}s`);

  // Download from Storage path and sanity-check
  const file = bucket.file(post.customerInvoicePdfPath);
  const [buf] = await file.download();
  const localPath = path.join(REPORTS_DIR, `fdacs-d3-test-invoice-${ts}.pdf`);
  fs.writeFileSync(localPath, buf);
  log(`Downloaded ${buf.length} bytes to ${localPath}`);

  if (buf.length < 30 * 1024) {
    throw new Error(`PDF too small: ${buf.length} bytes (expected > 30KB)`);
  }
  const head = buf.slice(0, 5).toString('ascii');
  if (head !== '%PDF-') {
    throw new Error(`PDF magic bytes wrong: got ${JSON.stringify(head)}`);
  }
  log(`PDF size ${(buf.length / 1024).toFixed(1)}KB and magic bytes %PDF- OK`);

  // Also fetch via the long-lived URL to confirm it's accessible
  const urlResp = await fetch(post.customerInvoicePdfUrl);
  if (!urlResp.ok) {
    throw new Error(`download URL not reachable: ${urlResp.status}`);
  }
  const urlBytes = Buffer.from(await urlResp.arrayBuffer());
  if (urlBytes.length !== buf.length) {
    throw new Error(`URL fetch byte count mismatch: ${urlBytes.length} vs ${buf.length}`);
  }
  log(`Long-lived download URL confirmed reachable (${urlBytes.length} bytes match)`);

  log(`✅ Phase A passed — backfill via regen callable works`);
  return { invoiceId: test.id, localPdfPath: localPath, urlBytes: urlBytes.length };
}

function ephemeralFromTest(testData, source, isVerificationFixture) {
  // Strip pdf-output fields and id-bound fields. Keep all audit data.
  const clone = { ...testData };
  delete clone.customerInvoicePdfUrl;
  delete clone.customerInvoicePdfPath;
  delete clone.customerInvoicePdfGeneratedAt;
  delete clone.customerInvoicePdfError;
  clone.source = source;
  clone.isVerificationFixture = isVerificationFixture;
  clone.createdAt = admin.firestore.FieldValue.serverTimestamp();
  return clone;
}

async function phaseB(testInvoiceData) {
  log('=== Phase B: ephemeral tech_completion invoice exercises onCreate trigger ===');

  const ephemeral = ephemeralFromTest(testInvoiceData, 'tech_completion', 'D3-phaseB');
  const ref = db.collection('invoices').doc();
  await ref.set(ephemeral);
  log(`Created ephemeral invoice ${ref.id}`);

  let observed = null;
  let lastState = null;
  for (let elapsed = 0; elapsed < 90; elapsed += 10) {
    await new Promise((r) => setTimeout(r, 10000));
    const snap = await ref.get();
    lastState = snap.data();
    log(`  +${elapsed + 10}s pdfUrl=${lastState.customerInvoicePdfUrl ? 'present' : 'absent'} err=${lastState.customerInvoicePdfError || 'none'}`);
    if (lastState.customerInvoicePdfUrl) {
      observed = lastState;
      break;
    }
  }

  if (!observed) {
    log(`⚠️  Phase B FAILED — leaving ephemeral doc ${ref.id} for debugging.`);
    log(`Last state: ${JSON.stringify(lastState, null, 2)}`);
    throw new Error('Phase B timed out');
  }

  // cleanup
  if (observed.customerInvoicePdfPath) {
    try {
      await bucket.file(observed.customerInvoicePdfPath).delete();
      log(`  cleaned up storage object ${observed.customerInvoicePdfPath}`);
    } catch (e) {
      log(`  WARN: failed to delete storage object: ${e.message}`);
    }
  }
  await ref.delete();
  log(`  deleted ephemeral invoice ${ref.id}`);

  log(`✅ Phase B passed — onCreate trigger fires`);
}

async function phaseC(testInvoiceData) {
  log('=== Phase C: ephemeral manual_admin invoice — source filter must skip ===');

  const ephemeral = ephemeralFromTest(testInvoiceData, 'manual_admin', 'D3-phaseC');
  const ref = db.collection('invoices').doc();
  await ref.set(ephemeral);
  log(`Created ephemeral invoice ${ref.id} (source=manual_admin)`);

  await new Promise((r) => setTimeout(r, 30000));
  const snap = await ref.get();
  const data = snap.data();
  log(`  +30s pdfUrl=${data.customerInvoicePdfUrl ? 'PRESENT (BUG)' : 'absent (correct)'} err=${data.customerInvoicePdfError || 'none'}`);

  await ref.delete();
  log(`  deleted ephemeral invoice ${ref.id}`);

  if (data.customerInvoicePdfUrl) {
    throw new Error('source filter failed — manual_admin invoice got a PDF');
  }
  if (data.customerInvoicePdfError) {
    throw new Error(`unexpected error on manual_admin invoice: ${data.customerInvoicePdfError}`);
  }

  log(`✅ Phase C passed — source filter correctly skips manual_admin`);
}

(async () => {
  log(`Starting verify-fdacs-d3 (ts=${ts})`);
  let testInvoiceData = null;

  try {
    const a = await phaseA();
    log(`Phase A summary: invoice=${a.invoiceId} pdf=${a.localPdfPath} bytes=${a.urlBytes}`);
  } catch (e) {
    failures.push(['A', e.message]);
    log(`❌ Phase A FAILED: ${e.message}`);
  }

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

  if (failures.length === 0) {
    log('🎉 ALL PHASES PASSED');
    process.exit(0);
  } else {
    const failLog = path.join(REPORTS_DIR, `fdacs-d3-failure-${ts}.log`);
    fs.writeFileSync(
      failLog,
      failures.map(([p, m]) => `Phase ${p}: ${m}`).join('\n') + '\n'
    );
    log(`Wrote failure log to ${failLog}`);
    process.exit(1);
  }
})().catch((e) => {
  log(`UNHANDLED ERROR: ${e.stack || e.message}`);
  process.exit(2);
});
