#!/usr/bin/env node
/**
 * WO-FDACS-E — End-to-end verification for QB Vehicle Custom Field +
 * CustomerMemo (FDACS disclosures) + PrivateNote (customer complaint) +
 * Attachable PDF upload.
 *
 * Test invoice: bookingId mbUNP6kOpufjyTLqcAk3 / CMLT-2026-020.
 *
 * The test invoice already has a QB invoice from the D-EMAIL test (resend
 * path). To exercise the new create-time payload (Custom Field, CustomerMemo,
 * PrivateNote), we DELETE the existing QB invoice and clear qbInvoiceId on the
 * Firestore doc before calling the function. The function then creates a fresh
 * QB invoice via the post-E code path.
 *
 * Run:
 *   GOOGLE_APPLICATION_CREDENTIALS=/Users/jgsystems/.coastal-firebase-admin.json \
 *     node scripts/verify-fdacs-e.js
 */

const admin = require('firebase-admin');

const CRED_PATH = '/Users/jgsystems/.coastal-firebase-admin.json';
const PROJECT_ID = 'coastal-mobile-lube';
const REGION = 'us-east1';
const FIREBASE_API_KEY = 'AIzaSyAc0DaFdRXhiOuICQNn-rlBi5udx6ce4j4';
const ADMIN_UID = 'hhSOVRodJ8gUeCb0kBmQsFHUgNs2'; // jonrgold@gmail.com
const TEST_BOOKING_ID = 'mbUNP6kOpufjyTLqcAk3';
const QB_FN_URL = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/sendInvoiceWithQBPayment`;

admin.initializeApp({ credential: admin.credential.cert(require(CRED_PATH)) });
const db = admin.firestore();

const log = (...a) => console.log(...a);
const phase = (n, msg) => console.log(`\n=== Phase ${n}: ${msg} ===`);

async function mintAdminIdToken(uid) {
  const customToken = await admin.auth().createCustomToken(uid);
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  if (!resp.ok) throw new Error(`signInWithCustomToken failed (${resp.status}): ${await resp.text()}`);
  return (await resp.json()).idToken;
}

async function refreshQbToken() {
  const ref = db.collection('settings').doc('quickbooks');
  const snap = await ref.get();
  const data = snap.data();
  const exp = new Date(data.accessTokenExpiresAt);
  const fiveMin = new Date(Date.now() + 5 * 60 * 1000);
  if (exp > fiveMin) {
    return { accessToken: data.accessToken, realmId: data.realmId };
  }
  log('  refreshing QB token (expired)...');
  const r = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        Buffer.from(`${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`).toString('base64'),
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: data.refreshToken }),
  });
  const t = await r.json();
  if (t.error) throw new Error(`refresh failed: ${JSON.stringify(t)}`);
  await ref.update({
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    accessTokenExpiresAt: new Date(Date.now() + t.expires_in * 1000).toISOString(),
    refreshTokenExpiresAt: new Date(Date.now() + t.x_refresh_token_expires_in * 1000).toISOString(),
    lastRefreshedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { accessToken: t.access_token, realmId: data.realmId };
}

async function qbGet(path, accessToken) {
  const r = await fetch(`https://quickbooks.api.intuit.com${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`QB GET ${path} failed: ${r.status} ${txt}`);
  }
  return r.json();
}

async function qbPost(path, accessToken, body) {
  const r = await fetch(`https://quickbooks.api.intuit.com${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok || j.Fault) throw new Error(`QB POST ${path} failed: ${r.status} ${JSON.stringify(j)}`);
  return j;
}

async function findTestInvoice() {
  const snap = await db
    .collection('invoices')
    .where('bookingId', '==', TEST_BOOKING_ID)
    .where('source', '==', 'tech_completion')
    .get();
  if (snap.empty) throw new Error(`No tech_completion invoices for booking ${TEST_BOOKING_ID}`);
  const docs = snap.docs.slice().sort((a, b) => {
    const aMs = a.data().createdAt?.toMillis?.() || 0;
    const bMs = b.data().createdAt?.toMillis?.() || 0;
    return bMs - aMs;
  });
  return { id: docs[0].id, data: docs[0].data() };
}

async function main() {
  const failures = [];
  const summary = {};

  // ─── Phase A: baseline ──────────────────────────────────────────
  phase('A', 'baseline state of test invoice');
  const { id: invoiceId, data: inv0 } = await findTestInvoice();
  log(`  invoiceId:           ${invoiceId}`);
  log(`  invoiceNumber:       ${inv0.invoiceNumber}`);
  log(`  source:              ${inv0.source}`);
  log(`  qbInvoiceId:         ${inv0.qbInvoiceId ?? '<none>'}`);
  log(`  qbAttachableId:      ${inv0.qbAttachableId ?? '<none>'}`);
  log(`  qbAttachableError:   ${inv0.qbAttachableError ?? '<none>'}`);
  log(`  customerInvoicePdfPath: ${inv0.customerInvoicePdfPath ?? '<none>'}`);
  summary.phaseA_invoiceId = invoiceId;
  summary.phaseA_invoiceNumber = inv0.invoiceNumber;

  // Reset: if QB invoice already exists, delete it + clear qbInvoiceId so the
  // create branch of sendInvoiceWithQBPayment runs (where the new code lives).
  const { accessToken: at0, realmId } = await refreshQbToken();
  if (inv0.qbInvoiceId) {
    log(`  resetting: deleting existing QB invoice ${inv0.qbInvoiceId} so create path runs`);
    try {
      const existing = await qbGet(
        `/v3/company/${realmId}/invoice/${inv0.qbInvoiceId}?minorversion=75`,
        at0
      );
      const syncToken = existing.Invoice?.SyncToken;
      await qbPost(`/v3/company/${realmId}/invoice?operation=delete&minorversion=75`, at0, {
        Id: String(inv0.qbInvoiceId),
        SyncToken: String(syncToken),
      });
      log(`    QB invoice ${inv0.qbInvoiceId} deleted`);
    } catch (err) {
      log(`    QB delete failed (continuing — may be already-deleted): ${err.message}`);
    }
    await db.collection('invoices').doc(invoiceId).update({
      qbInvoiceId: admin.firestore.FieldValue.delete(),
      qbDocNumber: admin.firestore.FieldValue.delete(),
      qbPaymentLink: admin.firestore.FieldValue.delete(),
      qbTotalAmount: admin.firestore.FieldValue.delete(),
      qbSubtotal: admin.firestore.FieldValue.delete(),
      qbTaxAmount: admin.firestore.FieldValue.delete(),
      qbAttachableId: admin.firestore.FieldValue.delete(),
      qbAttachableError: admin.firestore.FieldValue.delete(),
      qbAttachableUploadedAt: admin.firestore.FieldValue.delete(),
    });
    log(`    Firestore qb* fields cleared`);
  }
  log('  ✅ Phase A baseline captured');

  // ─── Phase B: trigger send ──────────────────────────────────────
  phase('B', 'trigger sendInvoiceWithQBPayment (create path)');
  const idToken = await mintAdminIdToken(ADMIN_UID);
  const freshSnap = await db.collection('invoices').doc(invoiceId).get();
  const inv = freshSnap.data();
  const recipient = inv.customerEmail || 'jgoldaht+test@gmail.com';
  const body = {
    invoiceId,
    invoiceNumber: inv.invoiceNumber,
    customerName: inv.customerName,
    customerEmail: recipient,
    customerPhone: inv.customerPhone || '',
    customerAddress: '',
    customerId: '',
    lineItems: inv.lineItems || [],
    subtotal: inv.subtotal,
    tax: inv.taxAmount,
    convenienceFee: 0,
    total: inv.total,
    vehicle: '',
    dueDate: inv.dueDate || '',
  };
  log(`  POST ${QB_FN_URL}`);
  const sendStart = Date.now();
  const resp = await fetch(QB_FN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(body),
  });
  const txt = await resp.text();
  const sendMs = Date.now() - sendStart;
  log(`  HTTP ${resp.status} in ${sendMs}ms`);
  log(`  body: ${txt.slice(0, 600)}`);
  if (!resp.ok) {
    failures.push(`Phase B: send returned HTTP ${resp.status}`);
    log('  ❌ Phase B FAILED');
  } else {
    let respJson = {};
    try { respJson = JSON.parse(txt); } catch (_) {}
    if (respJson.mode !== 'fdacs') {
      failures.push(`Phase B: expected mode=fdacs, got ${respJson.mode}`);
    }
    summary.phaseB_response = respJson;
    log('  ✅ Phase B send returned mode:fdacs success');
  }

  // ─── Phase C: verify QB invoice state ───────────────────────────
  phase('C', 'verify Vehicle Custom Field, CustomerMemo, PrivateNote on QB invoice');
  const after1 = (await db.collection('invoices').doc(invoiceId).get()).data();
  const newQbInvoiceId = after1.qbInvoiceId;
  log(`  qbInvoiceId (post-send): ${newQbInvoiceId}`);
  summary.phaseC_qbInvoiceId = newQbInvoiceId;

  if (!newQbInvoiceId) {
    failures.push('Phase C: no qbInvoiceId after send');
  } else {
    const { accessToken: at1 } = await refreshQbToken();
    const qbInv = await qbGet(
      `/v3/company/${realmId}/invoice/${newQbInvoiceId}?minorversion=75`,
      at1
    );
    const inv1 = qbInv.Invoice || {};
    const cf = (inv1.CustomField || []).find(
      (f) => f.Name === 'Vehicle' || f.DefinitionId === '1'
    );
    log(`  CustomField (Vehicle): ${cf ? JSON.stringify(cf) : '<not present>'}`);
    log(`  CustomerMemo.value: ${(inv1.CustomerMemo?.value || '').slice(0, 200)}${(inv1.CustomerMemo?.value || '').length > 200 ? '...' : ''}`);
    log(`  CustomerMemo length: ${(inv1.CustomerMemo?.value || '').length}`);
    log(`  PrivateNote: ${inv1.PrivateNote || '<not present>'}`);
    summary.phaseC_customField = cf;
    summary.phaseC_customerMemoLen = (inv1.CustomerMemo?.value || '').length;
    summary.phaseC_privateNote = inv1.PrivateNote || null;

    const expectedVehicle = '2020 HONDA CIVIC';
    if (!cf || !cf.StringValue?.startsWith('2020 HONDA CIVIC')) {
      failures.push(`Phase C: CustomField StringValue does not start with "${expectedVehicle}" — got ${cf?.StringValue}`);
    }
    const memoVal = inv1.CustomerMemo?.value || '';
    if (!memoVal || !/warrant/i.test(memoVal)) {
      failures.push('Phase C: CustomerMemo missing warranty disclosure substring');
    }
    if (!inv1.PrivateNote || !inv1.PrivateNote.startsWith('Customer complaint:')) {
      failures.push('Phase C: PrivateNote missing or not formatted as "Customer complaint: ..."');
    }
    if (failures.filter((f) => f.startsWith('Phase C:')).length === 0) {
      log('  ✅ Phase C Vehicle Custom Field present, CustomerMemo contains disclosures, PrivateNote populated');
    } else {
      log('  ❌ Phase C had failures (see summary)');
    }
  }

  // ─── Phase D: verify Attachable ─────────────────────────────────
  phase('D', 'verify FDACS PDF Attachable on QB invoice');
  const after2 = (await db.collection('invoices').doc(invoiceId).get()).data();
  const attachableId = after2.qbAttachableId;
  log(`  qbAttachableId (post-send): ${attachableId}`);
  log(`  qbAttachableError:          ${after2.qbAttachableError ?? '<none>'}`);
  summary.phaseD_attachableId = attachableId;

  if (!attachableId) {
    failures.push(`Phase D: no qbAttachableId after send (qbAttachableError=${after2.qbAttachableError})`);
  } else {
    const { accessToken: at2 } = await refreshQbToken();
    const qbAttach = await qbGet(
      `/v3/company/${realmId}/attachable/${attachableId}?minorversion=75`,
      at2
    );
    const a = qbAttach.Attachable || {};
    log(`  Attachable.FileName: ${a.FileName}`);
    log(`  Attachable.Size:     ${a.Size}`);
    log(`  Attachable.AttachableRef[0].EntityRef: ${JSON.stringify(a.AttachableRef?.[0]?.EntityRef)}`);
    summary.phaseD_attachableFileName = a.FileName;
    summary.phaseD_attachableSize = a.Size;

    const expectedName = `Coastal-Invoice-${after2.invoiceNumber}.pdf`;
    if (a.FileName !== expectedName) {
      failures.push(`Phase D: FileName mismatch — expected ${expectedName}, got ${a.FileName}`);
    }
    const refVal = a.AttachableRef?.[0]?.EntityRef?.value;
    if (String(refVal) !== String(newQbInvoiceId)) {
      failures.push(`Phase D: EntityRef.value=${refVal} != qbInvoiceId=${newQbInvoiceId}`);
    }
    if (!a.Size || a.Size < 30000) {
      failures.push(`Phase D: Attachable.Size=${a.Size} below sanity threshold (30000)`);
    }
    if (failures.filter((f) => f.startsWith('Phase D:')).length === 0) {
      log(`  ✅ Phase D Attachable ${attachableId} linked to QB invoice ${newQbInvoiceId}, size ${Math.round(a.Size / 1024)}KB`);
    } else {
      log('  ❌ Phase D had failures');
    }
  }

  // ─── Phase E: manual_admin regression ───────────────────────────
  phase('E', 'manual_admin source filter still gates');
  const ms = await db
    .collection('invoices')
    .where('source', '==', 'manual_admin')
    .limit(5)
    .get();
  let withAttach = 0;
  ms.docs.forEach((d) => {
    if (d.data().qbAttachableId) withAttach++;
  });
  log(`  sampled ${ms.size} manual_admin invoices; ${withAttach} have qbAttachableId`);
  summary.phaseE_manualAdminSampled = ms.size;
  summary.phaseE_manualAdminWithAttach = withAttach;
  if (withAttach > 0) {
    failures.push('Phase E: manual_admin invoices unexpectedly have qbAttachableId — source filter not gating');
  } else {
    log('  ✅ Phase E source filter still gates manual_admin');
  }

  // ─── Summary ────────────────────────────────────────────────────
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
  if (failures.length === 0) {
    console.log('\n✅ ALL PHASES PASSED');
    process.exit(0);
  } else {
    console.log(`\n❌ ${failures.length} FAILURE(S):`);
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('VERIFY FAILED:', err);
  process.exit(1);
});
