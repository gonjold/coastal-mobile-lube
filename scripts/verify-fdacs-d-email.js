#!/usr/bin/env node
/**
 * WO-FDACS-D-EMAIL — Step 4a HTML smoke test.
 *
 * Loads the existing test invoice (bookingId === 'mbUNP6kOpufjyTLqcAk3') from
 * Firestore along with its booking and settings/business doc, renders the
 * FDACS email HTML via renderFdacsEmailHtml, writes the result to _reports/,
 * and runs a battery of structural sanity checks.
 *
 * Run: node scripts/verify-fdacs-d-email.js
 * Output: _reports/d-email-test-invoice-{ts}.html
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const { renderFdacsEmailHtml } = require('../functions/lib/fdacs-email-template');

const CRED_PATH = '/Users/jgsystems/.coastal-firebase-admin.json';
const PROJECT_ID = 'coastal-mobile-lube';
const TEST_BOOKING_ID = 'mbUNP6kOpufjyTLqcAk3';
const PAY_NOW_TEST_URL = 'https://example.com/pay-now-test';

const REPORTS_DIR = path.join(__dirname, '..', '_reports');
fs.mkdirSync(REPORTS_DIR, { recursive: true });

admin.initializeApp({
  credential: admin.credential.cert(require(CRED_PATH)),
  storageBucket: `${PROJECT_ID}.firebasestorage.app`,
});
const db = admin.firestore();

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function findTestInvoice() {
  // Pick the most recently-created tech_completion invoice attached to the
  // canonical test booking.
  const snap = await db
    .collection('invoices')
    .where('bookingId', '==', TEST_BOOKING_ID)
    .where('source', '==', 'tech_completion')
    .get();
  if (snap.empty) {
    throw new Error(`No tech_completion invoices found for booking ${TEST_BOOKING_ID}`);
  }
  const docs = snap.docs.slice().sort((a, b) => {
    const aMs = a.data().createdAt?.toMillis?.() || 0;
    const bMs = b.data().createdAt?.toMillis?.() || 0;
    return bMs - aMs;
  });
  return { id: docs[0].id, data: docs[0].data() };
}

async function main() {
  log(`loading test invoice for booking ${TEST_BOOKING_ID}`);
  const { id: invoiceId, data: invoice } = await findTestInvoice();
  log(`invoice ${invoiceId} (${invoice.invoiceNumber || 'no-num'})`);

  log(`loading booking ${invoice.bookingId}`);
  const bookingSnap = await db.collection('bookings').doc(invoice.bookingId).get();
  if (!bookingSnap.exists) throw new Error(`booking ${invoice.bookingId} missing`);
  const booking = bookingSnap.data();

  log(`loading settings/business`);
  const businessSnap = await db.doc('settings/business').get();
  if (!businessSnap.exists) throw new Error('settings/business missing');
  const business = businessSnap.data();

  log(`rendering FDACS email HTML`);
  const html = renderFdacsEmailHtml(invoice, booking, business, PAY_NOW_TEST_URL);

  const ts = Date.now();
  const outPath = path.join(REPORTS_DIR, `d-email-test-invoice-${ts}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  log(`wrote ${outPath} (${html.length} bytes)`);

  // Sanity checks
  const checks = [];
  function check(name, ok, hint) {
    checks.push({ name, ok, hint: ok ? '' : (hint || '') });
  }

  check('contains <table', html.includes('<table'), 'expected table-based layout');
  check('no <style block', !/<style[\s>]/.test(html), 'no embedded stylesheets allowed');
  check('no flexbox', !/display:\s*flex/i.test(html) && !/\bflex(?:-direction|-wrap|-grow|:|;)/i.test(html), 'flex layout detected');
  check('no css grid', !/display:\s*grid/i.test(html) && !/grid-template-/i.test(html), 'css grid detected');
  check('Pay Online button + total', /Pay Online/.test(html) && /\$/.test(html), 'top CTA missing dollar amount');

  const total = invoice.qbTotalAmount != null ? invoice.qbTotalAmount : (invoice.total || 0);
  const totalCurrency = '$' + Number(total).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  check(`total ${totalCurrency} present`, html.includes(totalCurrency), 'invoice total not rendered');

  // Signature URLs
  if (invoice.customerEstimateSignatureUrl) {
    check('estimate sig URL present', html.includes(invoice.customerEstimateSignatureUrl) || html.includes(invoice.customerEstimateSignatureUrl.replace(/&/g, '&amp;')), 'estimate signature missing from email body');
  } else {
    check('estimate sig URL present (skipped)', true);
  }
  const compSig = invoice.customerCompletionSignatureUrl || invoice.customerSignatureUrl;
  if (compSig) {
    check('completion sig URL present', html.includes(compSig) || html.includes(compSig.replace(/&/g, '&amp;')), 'completion signature missing from email body');
  } else {
    check('completion sig URL present (skipped)', true);
  }

  // Consent line for invoice's consent type
  const consentChoice = invoice.estimateConsent?.choice;
  if (consentChoice) {
    let needle;
    switch (consentChoice) {
      case 'simple_under_150': needle = 'Customer authorized work under $150.'; break;
      case 'authorize_up_to': needle = 'Customer authorized work up to'; break;
      case 'contact_above': needle = 'Customer requested contact before any additional work over'; break;
      case 'no_contact': needle = 'Customer requested no contact regarding additional repairs.'; break;
      default: needle = null;
    }
    if (needle) {
      check(`consent line for ${consentChoice}`, html.includes(needle), `expected consent text "${needle}"`);
    } else {
      check('consent choice known', false, `unknown consent choice ${consentChoice}`);
    }
  } else {
    check('consent line (skipped — no estimateConsent)', true);
  }

  // Pay Now button uses test URL
  check('Pay Now href = test URL', html.includes(PAY_NOW_TEST_URL), 'pay-now button missing test URL');

  // Reply-to footer mention
  check('reply-to mention in footer', /Reply to this email/i.test(html), 'footer should mention reply-to behavior');

  // Print summary
  console.log('\n— Sanity checks —');
  let pass = 0, fail = 0;
  for (const c of checks) {
    const flag = c.ok ? 'PASS' : 'FAIL';
    console.log(`  [${flag}] ${c.name}${c.ok ? '' : ` — ${c.hint}`}`);
    c.ok ? pass++ : fail++;
  }
  console.log(`\n${pass}/${pass + fail} checks passed.`);
  console.log(`HTML: ${outPath}`);

  if (fail > 0) {
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('VERIFY FAILED:', err);
    process.exit(1);
  });
