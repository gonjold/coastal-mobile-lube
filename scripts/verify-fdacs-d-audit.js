#!/usr/bin/env node
/**
 * WO-FDACS-D-AUDIT verification.
 *
 * Creates three ephemeral tech_completion invoices to exercise the new
 * audit-trail rendering paths in fdacs-template.js:
 *
 *   Fixture A — minimal: no photos, no reAuthEvents, no estimateConsent.
 *     Expected: signatures (completion only or both if mocked), no consent box,
 *     no reauth, no photos sections.
 *
 *   Fixture B — full: both signatures, estimateConsent='authorize_up_to' with
 *     authorizedOtherPerson, 5 photos, 2 reAuthEvents (in_person + phone).
 *
 *   Fixture C — overflow: 12 photos (exercises +N more line), 4 reAuthEvents,
 *     mix of addedDuringWork true/false and varying partsCondition.
 *
 * Each fixture creates a doc, waits up to 90s for the onCreate trigger, falls
 * back to the regen callable if needed, downloads the PDF, then deletes the
 * ephemeral doc + Storage object. Original test invoice is untouched.
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
const generated = [];

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
    throw new Error(`signInWithCustomToken failed (${resp.status}): ${await resp.text()}`);
  }
  return (await resp.json()).idToken;
}

async function callRegen(invoiceId, idToken) {
  const resp = await fetch(REGEN_CALLABLE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ data: { invoiceId } }),
  });
  const text = await resp.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`callable returned non-JSON (${resp.status}): ${text.slice(0, 400)}`);
  }
  if (!resp.ok || json.error) throw new Error(`callable failed: ${JSON.stringify(json)}`);
  return json.result;
}

async function getTestInvoice() {
  const snap = await db
    .collection('invoices')
    .where('bookingId', '==', TEST_BOOKING_ID)
    .where('source', '==', 'tech_completion')
    .limit(1)
    .get();
  if (snap.empty) throw new Error('test invoice not found');
  return snap.docs[0].data();
}

function basePayload(testInvoice, fixtureLabel) {
  const clone = { ...testInvoice };
  delete clone.customerInvoicePdfUrl;
  delete clone.customerInvoicePdfPath;
  delete clone.customerInvoicePdfGeneratedAt;
  delete clone.customerInvoicePdfError;
  delete clone.qbInvoiceId;
  delete clone.qbCustomerId;
  delete clone.qbDocNumber;
  delete clone.qbPaymentLink;
  delete clone.qbSubtotal;
  delete clone.qbTaxAmount;
  delete clone.qbTotalAmount;
  delete clone.sentDate;
  delete clone.status;
  clone.source = 'tech_completion';
  clone.isVerificationFixture = `D-AUDIT-${fixtureLabel}`;
  clone.invoiceNumber = `D-AUDIT-${fixtureLabel}-${ts}`;
  clone.createdAt = admin.firestore.FieldValue.serverTimestamp();
  return clone;
}

function buildFixtureA(testInvoice) {
  const data = basePayload(testInvoice, 'A');
  data.lineItems = [
    {
      id: 'a-line-1',
      serviceName: 'Mount and Balance Single',
      quantity: 1,
      unitPrice: 34.95,
      lineTotal: 34.95,
      taxable: false,
      partsCondition: null,
      addedDuringWork: false,
      reAuthEventId: null,
    },
  ];
  data.subtotal = 34.95;
  data.total = 34.95;
  data.taxAmount = 0;
  data.photos = [];
  data.reAuthEvents = [];
  data.estimateConsent = {
    choice: null,
    authorizeUpTo: null,
    contactAbove: null,
    authorizedOtherPerson: null,
  };
  return data;
}

function buildFixtureB(testInvoice) {
  const data = basePayload(testInvoice, 'B');
  const photoUrl = 'https://res.cloudinary.com/dgcdcqjrz/image/upload/f_png,h_192,q_auto/v1775916096/Coastal_logo_bh3biu.png';
  const sigUrl = testInvoice.customerEstimateSignatureUrl;

  data.lineItems = [
    {
      id: 'b-line-1',
      serviceName: 'Brake Pad Replacement (Front)',
      quantity: 1,
      unitPrice: 220.0,
      lineTotal: 220.0,
      taxable: true,
      partsCondition: 'New',
      addedDuringWork: false,
      reAuthEventId: null,
    },
    {
      id: 'b-line-2',
      serviceName: 'Brake Caliper Labor',
      quantity: 1,
      unitPrice: 90.0,
      lineTotal: 90.0,
      taxable: false,
      partsCondition: null,
      addedDuringWork: true,
      reAuthEventId: 'b-reauth-1',
    },
    {
      id: 'b-line-3',
      serviceName: 'Brake Rotor (Driver Side)',
      quantity: 1,
      unitPrice: 75.0,
      lineTotal: 75.0,
      taxable: true,
      partsCondition: 'Rebuilt',
      addedDuringWork: true,
      reAuthEventId: 'b-reauth-2',
    },
  ];
  data.subtotal = 385.0;
  data.taxAmount = 20.65;
  data.total = 405.65;

  data.estimateConsent = {
    choice: 'authorize_up_to',
    authorizeUpTo: 500,
    contactAbove: null,
    authorizedOtherPerson: {
      name: 'Jane Spouse',
      relationship: 'Spouse',
      phone: '555-555-0102',
    },
  };

  data.photos = [photoUrl, photoUrl, photoUrl, photoUrl, photoUrl];
  data.reAuthEvents = [
    {
      id: 'b-reauth-1',
      timestamp: admin.firestore.Timestamp.fromMillis(Date.now() - 60 * 60 * 1000),
      method: 'in_person_signature',
      customerName: 'Test Customer (Smoke)',
      lineItemIds: ['b-line-2'],
      signatureUrl: sigUrl,
      note: null,
    },
    {
      id: 'b-reauth-2',
      timestamp: admin.firestore.Timestamp.fromMillis(Date.now() - 30 * 60 * 1000),
      method: 'phone',
      customerName: 'Test Customer (Smoke)',
      lineItemIds: ['b-line-3'],
      signatureUrl: null,
      note: 'Customer confirmed by phone at 2:14pm; tech logged call. Approved rotor replacement on driver side only.',
    },
  ];
  return data;
}

function buildFixtureC(testInvoice) {
  const data = basePayload(testInvoice, 'C');
  const photoUrl = 'https://res.cloudinary.com/dgcdcqjrz/image/upload/f_png,h_192,q_auto/v1775916096/Coastal_logo_bh3biu.png';
  const sigUrl = testInvoice.customerEstimateSignatureUrl;

  const conditions = ['New', 'Used', 'Rebuilt', 'Reconditioned', null, 'New'];
  data.lineItems = conditions.map((cond, i) => ({
    id: `c-line-${i + 1}`,
    serviceName: `Service Item ${i + 1}`,
    quantity: 1,
    unitPrice: 50 + i * 10,
    lineTotal: 50 + i * 10,
    taxable: i % 2 === 0,
    partsCondition: cond,
    addedDuringWork: i >= 3,
    reAuthEventId: i >= 3 ? `c-reauth-${(i - 2)}` : null,
  }));
  data.subtotal = data.lineItems.reduce((s, li) => s + li.lineTotal, 0);
  data.taxAmount = 0;
  data.total = data.subtotal;

  data.estimateConsent = {
    choice: 'contact_above',
    authorizeUpTo: null,
    contactAbove: 200,
    authorizedOtherPerson: null,
  };

  data.photos = Array(12).fill(photoUrl);

  data.reAuthEvents = [1, 2, 3, 4].map((n) => ({
    id: `c-reauth-${n}`,
    timestamp: admin.firestore.Timestamp.fromMillis(Date.now() - n * 20 * 60 * 1000),
    method: n % 2 === 0 ? 'phone' : 'in_person_signature',
    customerName: 'Test Customer (Smoke)',
    lineItemIds: [`c-line-${n + 2}`],
    signatureUrl: n % 2 === 0 ? null : sigUrl,
    note: n % 2 === 0 ? `Phone-authorized re-auth event #${n}.` : null,
  }));

  return data;
}

async function downloadPdf(invoiceData, fixtureLabel) {
  const local = path.join(REPORTS_DIR, `d-audit-fixture-${fixtureLabel}-${ts}.pdf`);
  const file = bucket.file(invoiceData.customerInvoicePdfPath);
  const [buf] = await file.download();
  fs.writeFileSync(local, buf);
  return { local, bytes: buf.length };
}

async function runFixture(label, build, idToken) {
  log(`=== Fixture ${label} ===`);
  const testInvoice = await getTestInvoice();
  const payload = build(testInvoice);

  const ref = db.collection('invoices').doc();
  await ref.set(payload);
  log(`  created ${ref.id} (${payload.invoiceNumber})`);

  let observed = null;
  for (let elapsed = 0; elapsed < 90; elapsed += 10) {
    await new Promise((r) => setTimeout(r, 10000));
    const snap = await ref.get();
    const d = snap.data();
    log(`  +${elapsed + 10}s pdfUrl=${d.customerInvoicePdfUrl ? 'present' : 'absent'} err=${d.customerInvoicePdfError || 'none'}`);
    if (d.customerInvoicePdfUrl) {
      observed = d;
      break;
    }
  }

  if (!observed) {
    log(`  trigger timeout — falling back to regen callable`);
    await callRegen(ref.id, idToken);
    observed = (await ref.get()).data();
  }

  if (!observed.customerInvoicePdfPath) {
    throw new Error(`fixture ${label}: no PDF generated even after fallback`);
  }

  const { local, bytes } = await downloadPdf(observed, label);
  log(`  ✅ ${label} → ${local} (${bytes} bytes)`);
  generated.push({ label, path: local, bytes });

  // Cleanup ephemeral artifacts.
  try {
    await bucket.file(observed.customerInvoicePdfPath).delete();
    log(`  cleaned storage ${observed.customerInvoicePdfPath}`);
  } catch (e) {
    log(`  WARN: storage cleanup failed: ${e.message}`);
  }
  await ref.delete();
  log(`  deleted ${ref.id}`);
}

(async () => {
  log(`Starting verify-fdacs-d-audit (ts=${ts})`);
  let idToken;
  try {
    idToken = await mintAdminIdToken(ADMIN_UID);
    log('admin id token minted (for fallback regen)');
  } catch (e) {
    log(`WARN: failed to mint id token early: ${e.message}`);
  }

  for (const [label, builder] of [
    ['A', buildFixtureA],
    ['B', buildFixtureB],
    ['C', buildFixtureC],
  ]) {
    try {
      await runFixture(label, builder, idToken);
    } catch (e) {
      failures.push([label, e.message]);
      log(`❌ Fixture ${label} FAILED: ${e.message}`);
    }
  }

  log('=== SUMMARY ===');
  for (const g of generated) log(`  ✅ Fixture ${g.label}: ${g.path} (${g.bytes} bytes)`);
  for (const [label, msg] of failures) log(`  ❌ Fixture ${label}: ${msg}`);

  if (failures.length === 0) {
    log('🎉 ALL FIXTURES PASSED');
    process.exit(0);
  } else {
    process.exit(1);
  }
})().catch((e) => {
  log(`UNHANDLED ERROR: ${e.stack || e.message}`);
  process.exit(2);
});
