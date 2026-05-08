#!/usr/bin/env node
/**
 * WO-FDACS-D-EMAIL — Step 4b live send test.
 *
 * Invokes the deployed sendInvoiceWithQBPayment HTTPS function with the
 * canonical test invoice (bookingId mbUNP6kOpufjyTLqcAk3, invoice CMLT-2026-020).
 *
 * The test invoice already has a QB invoice + qbPaymentLink, so this hits the
 * FDACS resend branch — no new QB invoice is created, our nodemailer path
 * delivers the FDACS HTML body + PDF attachment to jgoldaht+test@gmail.com.
 *
 * Optional flag --legacy: invokes sendInvoiceEmail (non-QB fallback) instead,
 * useful for exercising the second source-branch.
 *
 * Run: node scripts/send-d-email-test.js [--legacy]
 */

const admin = require('firebase-admin');

const CRED_PATH = '/Users/jgsystems/.coastal-firebase-admin.json';
const PROJECT_ID = 'coastal-mobile-lube';
const REGION = 'us-east1';
const FIREBASE_API_KEY = 'AIzaSyAc0DaFdRXhiOuICQNn-rlBi5udx6ce4j4';
const ADMIN_UID = 'hhSOVRodJ8gUeCb0kBmQsFHUgNs2'; // jonrgold@gmail.com
const TEST_BOOKING_ID = 'mbUNP6kOpufjyTLqcAk3';
const QB_FN_URL = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/sendInvoiceWithQBPayment`;
const NON_QB_FN_URL = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/sendInvoiceEmail`;

const useLegacyPath = process.argv.includes('--legacy');

admin.initializeApp({
  credential: admin.credential.cert(require(CRED_PATH)),
});
const db = admin.firestore();

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
  const { id: invoiceId, data: inv } = await findTestInvoice();
  const recipient = inv.customerEmail || 'jgoldaht+test@gmail.com';

  console.log(`Test invoice: ${invoiceId} (${inv.invoiceNumber})`);
  console.log(`Recipient:    ${recipient}`);
  console.log(`Path:         ${useLegacyPath ? 'sendInvoiceEmail (non-QB)' : 'sendInvoiceWithQBPayment'}`);
  console.log('');

  const idToken = await mintAdminIdToken(ADMIN_UID);

  let endpoint, body;
  if (useLegacyPath) {
    endpoint = NON_QB_FN_URL;
    body = {
      invoiceId,
      customerEmail: recipient,
      customerName: inv.customerName,
      customerPhone: inv.customerPhone || '',
      invoiceNumber: inv.invoiceNumber,
      lineItems: inv.lineItems || [],
      subtotal: inv.subtotal,
      taxAmount: inv.taxAmount,
      total: inv.total,
      notes: inv.notes || '',
      vehicle: '',
      invoiceDate: inv.invoiceDate || '',
      dueDate: inv.dueDate || '',
    };
  } else {
    endpoint = QB_FN_URL;
    body = {
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
  }

  console.log(`POST ${endpoint}`);
  const start = Date.now();
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });
  const txt = await resp.text();
  const ms = Date.now() - start;
  console.log(`HTTP ${resp.status} in ${ms}ms`);
  console.log(txt.slice(0, 1200));
  if (!resp.ok) throw new Error(`Send failed: HTTP ${resp.status}`);

  console.log(`\n✅ Test email triggered to ${recipient}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('SEND TEST FAILED:', err);
    process.exit(1);
  });
