#!/usr/bin/env node
/**
 * WO-COASTAL-PHONE-FIX legacy-path verification.
 *
 * Triggers the deployed sendInvoiceEmail onRequest function against the
 * existing legacy invoice CMLT-2026-016 (doc id Ed0n8TsfxdbiJ1MSkjbp,
 * source: undefined → falls through to the legacy template/PDF branch).
 *
 * Customer email is overridden to jgoldaht+phonecheck@gmail.com so the
 * actual customer is not paged. Body fields are pulled off the invoice
 * doc as-is.
 *
 * Pass criterion: response is { success: true } WITHOUT mode:'fdacs'.
 *  - mode:'fdacs' would mean the FDACS branch fired (wrong path).
 *  - mode absent + success:true → legacy branch fired (correct path).
 *
 * Does NOT deploy anything. Hits the already-deployed cloud function.
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const CRED_PATH = '/Users/jgsystems/.coastal-firebase-admin.json';
const PROJECT_ID = 'coastal-mobile-lube';
const REGION = 'us-east1';
const FIREBASE_API_KEY = 'AIzaSyAc0DaFdRXhiOuICQNn-rlBi5udx6ce4j4';
const ADMIN_UID = 'hhSOVRodJ8gUeCb0kBmQsFHUgNs2'; // jonrgold@gmail.com
const TARGET_INVOICE_DOC_ID = 'Ed0n8TsfxdbiJ1MSkjbp'; // CMLT-2026-016
const RECIPIENT_OVERRIDE = 'jgoldaht+phonecheck@gmail.com';
const SEND_URL = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/sendInvoiceEmail`;

admin.initializeApp({
  credential: admin.credential.cert(require(CRED_PATH)),
});
const db = admin.firestore();

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

(async () => {
  log(`Loading invoice doc ${TARGET_INVOICE_DOC_ID}`);
  const snap = await db.collection('invoices').doc(TARGET_INVOICE_DOC_ID).get();
  if (!snap.exists) {
    console.error(`❌ Target invoice doc ${TARGET_INVOICE_DOC_ID} not found`);
    process.exit(2);
  }
  const inv = snap.data();
  log(`Loaded ${inv.invoiceNumber} | source=${inv.source === undefined ? 'undefined' : JSON.stringify(inv.source)} | status=${inv.status}`);
  if (inv.source === 'tech_completion') {
    console.error(`❌ Invoice has source='tech_completion' — would fire FDACS path. Aborting.`);
    process.exit(2);
  }

  const idToken = await mintAdminIdToken(ADMIN_UID);
  log('Minted admin ID token');

  const body = {
    invoiceId: TARGET_INVOICE_DOC_ID,
    invoiceNumber: inv.invoiceNumber,
    customerEmail: RECIPIENT_OVERRIDE, // override
    customerName: inv.customerName || 'Test Customer',
    customerPhone: inv.customerPhone || '',
    customerAddress: inv.customerAddress || '',
    vehicle: inv.vehicle || inv.vehicleInfo || '',
    lineItems: inv.lineItems || [],
    subtotal: inv.subtotal,
    taxAmount: inv.taxAmount,
    total: inv.total,
    notes: inv.notes || '',
    invoiceDate: inv.invoiceDate || '',
    dueDate: inv.dueDate || '',
  };

  log(`POST ${SEND_URL}`);
  log(`  invoiceId:    ${body.invoiceId}`);
  log(`  invoiceNumber: ${body.invoiceNumber}`);
  log(`  recipient:    ${body.customerEmail}  (overridden from ${inv.customerEmail || '<absent>'})`);

  const t0 = Date.now();
  const resp = await fetch(SEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });
  const elapsed = Date.now() - t0;
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }

  log(`HTTP ${resp.status} in ${elapsed}ms`);
  log(`Response body: ${text}`);

  // Pass criterion
  const ok = resp.ok
    && json
    && json.success === true
    && json.mode !== 'fdacs';

  if (ok) {
    log(`✅ PASS — legacy branch fired (success:true, mode absent).`);
    log(`   Invoice ID:     ${TARGET_INVOICE_DOC_ID}`);
    log(`   Invoice Number: ${inv.invoiceNumber}`);
    log(`   Sent to:        ${RECIPIENT_OVERRIDE}`);
    log(`   Eyeball the email at ${RECIPIENT_OVERRIDE}: payment-instructions box`);
    log(`   should now show "(813) 722-5823" — NOT "(813) 277-5500".`);
    process.exit(0);
  } else {
    log(`❌ FAIL — response did not match legacy-success criteria.`);
    if (json && json.mode === 'fdacs') {
      log(`   Got mode:'fdacs' — FDACS branch fired (wrong path for this invoice).`);
    } else if (!resp.ok) {
      log(`   HTTP ${resp.status} — function rejected the request.`);
    } else {
      log(`   Unexpected body shape.`);
    }
    process.exit(1);
  }
})().catch((e) => {
  console.error(`UNHANDLED ERROR: ${e.stack || e.message}`);
  process.exit(2);
});
