// FDACS-compliant invoice PDF template.
// Pure function: takes invoice data + business settings, returns full HTML document.
// Renders to Letter-size PDF via puppeteer-core wrapper (lib/pdf.js).
//
// Field schema matches production Firestore invoice docs:
//   lineItems[].serviceName / .quantity / .unitPrice / .lineTotal / .taxable
//   lineItems[].partsCondition / .addedDuringWork / .reAuthEventId
//   invoice.subtotal / .taxAmount / .total
//   invoice.qbTaxAmount / .qbTotalAmount  (preferred when present — QB is source of truth post-sync)
//   invoice.customerEstimateSignatureUrl / .customerEstimateSignedAt
//   invoice.customerCompletionSignatureUrl / .customerCompletionSignedAt
//   invoice.estimateConsent.{ choice, authorizeUpTo, contactAbove, authorizedOtherPerson }
//   invoice.reAuthEvents[].{ timestamp, method, customerName, lineItemIds, signatureUrl, note }
//   invoice.photos[]  (flat URL strings)

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fmtCurrency(n) {
  if (n === null || n === undefined || isNaN(n)) return '$0.00';
  return '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtVehicleLine(v) {
  if (!v) return '';
  const parts = [v.year, v.make, v.model, v.trim].filter(Boolean);
  return parts.join(' ');
}

// Render a Firestore Timestamp (or Date / ISO string / {_seconds}) as readable Eastern time.
function fmtEastern(ts) {
  if (!ts) return '';
  let d;
  if (ts.toDate) {
    d = ts.toDate();
  } else if (typeof ts === 'object' && typeof ts._seconds === 'number') {
    d = new Date(ts._seconds * 1000);
  } else if (typeof ts === 'object' && typeof ts.seconds === 'number') {
    d = new Date(ts.seconds * 1000);
  } else {
    d = new Date(ts);
  }
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function renderEstimateConsent(invoice) {
  const consent = invoice.estimateConsent || {};
  let line;
  switch (consent.choice) {
    case 'simple_under_150':
      line = 'Customer authorized work under $150.';
      break;
    case 'authorize_up_to':
      line = `Customer authorized work up to ${fmtCurrency(consent.authorizeUpTo || 0)} without further notification.`;
      break;
    case 'contact_above':
      line = `Customer requested contact before any additional work over ${fmtCurrency(consent.contactAbove || 0)}.`;
      break;
    case 'no_contact':
      line = 'Customer requested no contact regarding additional repairs.';
      break;
    default:
      return '';
  }

  const aop = consent.authorizedOtherPerson;
  const aopHtml = aop && aop.name
    ? `<p class="consent-other">Authorized Other Person: ${esc(aop.name)}${
        aop.relationship ? ` (${esc(aop.relationship)})` : ''
      }${aop.phone ? ` &middot; ${esc(aop.phone)}` : ''}</p>`
    : '';

  return `
    <section class="estimate-consent">
      <h3>Estimate Authorization Type</h3>
      <p class="consent-line">${esc(line)}</p>
      ${aopHtml}
    </section>
  `;
}

function renderReAuthEvents(invoice) {
  const events = Array.isArray(invoice.reAuthEvents) ? invoice.reAuthEvents : [];
  if (events.length === 0) return '';

  const nameById = new Map(
    (invoice.lineItems || []).map((li) => [li.id, li.serviceName || li.description || 'Untitled'])
  );

  const cards = events
    .map((ev) => {
      const items = (ev.lineItemIds || [])
        .map((id) => nameById.get(id) || id)
        .filter(Boolean)
        .join(', ');
      const methodLabel = ev.method === 'phone' ? 'Phone Authorization' : 'In-Person Signature';
      const sigImg =
        ev.method === 'in_person_signature' && ev.signatureUrl
          ? `<img src="${esc(ev.signatureUrl)}" alt="Re-authorization signature" class="reauth-sig" />`
          : '';
      const noteHtml =
        ev.method === 'phone' && ev.note
          ? `<div class="reauth-note">Note: <em>${esc(ev.note)}</em></div>`
          : '';
      return `
        <div class="reauth-event">
          <div class="reauth-meta">
            <strong>${esc(fmtEastern(ev.timestamp))}</strong> &middot; ${esc(methodLabel)}
          </div>
          <div class="reauth-name">Authorized by: ${esc(ev.customerName || '—')}</div>
          ${items ? `<div class="reauth-items">Affected items: ${esc(items)}</div>` : ''}
          ${sigImg}
          ${noteHtml}
        </div>
      `;
    })
    .join('');

  return `
    <section class="reauth-section">
      <h3>Mid-Job Re-Authorization Events</h3>
      ${cards}
    </section>
  `;
}

function renderPhotos(invoice) {
  const photos = Array.isArray(invoice.photos) ? invoice.photos.filter(Boolean) : [];
  if (photos.length === 0) return '';

  const visible = photos.slice(0, 8);
  const overflow = Math.max(0, photos.length - 8);

  const cells = visible
    .map(
      (url) => `
        <div class="photo-cell">
          <img src="${esc(url)}" alt="Job photo" />
        </div>
      `
    )
    .join('');

  const overflowHtml = overflow > 0
    ? `<p class="photo-overflow">+${overflow} more photo${overflow === 1 ? '' : 's'} retained in audit record</p>`
    : '';

  return `
    <section class="photos-section">
      <h3>Job Photos</h3>
      <div class="photo-grid">${cells}</div>
      ${overflowHtml}
    </section>
  `;
}

function renderSignaturesSection(invoice, options, docType) {
  // ESTIMATE doctype: keep the legacy single-block render driven by options.
  if (docType === 'ESTIMATE') {
    if (options.signatureBase64) {
      return `
        <section class="signature-section">
          <h3>Customer Authorization</h3>
          <img src="${esc(options.signatureBase64)}" alt="Customer signature" class="sig-img" />
          <div class="sig-meta">Signed: ${esc(options.signedAt || '')}</div>
        </section>
      `;
    }
    return `
      <section class="signature-section">
        <h3>Customer Authorization</h3>
        <div class="sig-line">_______________________________</div>
        <div class="sig-meta">Customer signature / Date</div>
      </section>
    `;
  }

  // INVOICE doctype: dual block. Read directly off invoice fields; fall back to
  // options.signatureBase64 / signedAt for completion (legacy callers).
  const estSig = invoice.customerEstimateSignatureUrl;
  const estSignedAt = invoice.customerEstimateSignedAt;
  const compSig =
    invoice.customerCompletionSignatureUrl ||
    invoice.customerSignatureUrl ||
    options.signatureBase64 ||
    null;
  const compSignedAtRaw = invoice.customerCompletionSignedAt;
  const compSignedAt = compSignedAtRaw ? fmtEastern(compSignedAtRaw) : (options.signedAt || '');

  if (!estSig && !compSig) return '';

  const estBlock = estSig
    ? `
      <div class="signature-block">
        <div class="sig-title">Customer Authorization of Estimate</div>
        <img src="${esc(estSig)}" alt="Estimate signature" class="sig-image" />
        <div class="sig-meta">Signed: ${esc(fmtEastern(estSignedAt))}</div>
      </div>
    `
    : '';

  const compBlock = compSig
    ? `
      <div class="signature-block">
        <div class="sig-title">Customer Acknowledgment of Completed Work</div>
        <img src="${esc(compSig)}" alt="Completion signature" class="sig-image" />
        <div class="sig-meta">Signed: ${esc(compSignedAt)}</div>
      </div>
    `
    : '';

  return `
    <section class="signatures-section">
      <h3>Customer Authorization &amp; Acknowledgment</h3>
      <div class="signature-grid">
        ${estBlock}
        ${compBlock}
      </div>
    </section>
  `;
}

/**
 * Build the HTML for the FDACS-compliant invoice/estimate PDF.
 *
 * @param {object} invoice - Firestore invoice doc data (production schema)
 * @param {object} business - settings/business doc data
 * @param {object} disclosures - { warranty, shopSupplies, tireFee?, batteryFee? }
 * @param {object} options - { documentType: 'INVOICE' | 'ESTIMATE', signatureBase64?, signedAt? }
 * @returns {string} Complete HTML document
 */
function buildFdacsHtml(invoice, business, disclosures, options = {}) {
  const docType = options.documentType || 'INVOICE';

  // Prefer QB-mirrored values (post-sync source of truth — what the customer pays in QB Pay portal).
  // Fall back to Firestore-native fields when QB hasn't synced yet (draft invoices, estimates).
  const displayTax = invoice.qbTaxAmount != null ? invoice.qbTaxAmount : invoice.taxAmount;
  const displayTotal = invoice.qbTotalAmount != null ? invoice.qbTotalAmount : invoice.total;

  const vehicleLine = fmtVehicleLine(invoice.vehicleInfo);
  const hasVehicleBlock = vehicleLine || invoice.vehicleInfo?.vin || invoice.vehicleInfo?.licenseTag;

  const estimateOverThreshold =
    docType === 'ESTIMATE' &&
    Number(displayTotal) > Number(business.consentOverThreshold || 150);

  const lineItemsHtml = (invoice.lineItems || [])
    .map((li) => {
      const conditionDisplay = li.partsCondition && li.partsCondition !== 'New'
        ? String(li.partsCondition).toUpperCase()
        : '';
      const baseName = esc(li.serviceName || li.description || '');
      const descHtml = li.addedDuringWork
        ? `${baseName} <span class="added-flag">(added during work)</span>`
        : baseName;
      return `
        <tr>
          <td>${descHtml}</td>
          <td class="condition">${esc(conditionDisplay)}</td>
          <td class="num">${esc(li.quantity)}</td>
          <td class="num">${fmtCurrency(li.unitPrice)}</td>
          <td class="num">${fmtCurrency(li.lineTotal)}</td>
        </tr>
      `;
    })
    .join('');

  const disclosuresHtml = [
    disclosures.warranty ? `<div class="disclosure"><strong>Warranty:</strong> ${esc(disclosures.warranty)}</div>` : '',
    disclosures.shopSupplies ? `<div class="disclosure"><strong>Shop Supplies:</strong> ${esc(disclosures.shopSupplies)}</div>` : '',
    disclosures.tireFee ? `<div class="disclosure"><strong>Tire Fee Disclosure:</strong> ${esc(disclosures.tireFee)}</div>` : '',
    disclosures.batteryFee ? `<div class="disclosure"><strong>Battery Fee Disclosure:</strong> ${esc(disclosures.batteryFee)}</div>` : '',
  ].filter(Boolean).join('');

  const consentHtml = estimateOverThreshold ? `
    <section class="consent">
      <h3>Customer Authorization (Required for Estimates Over $${esc(business.consentOverThreshold)})</h3>
      <p>Per Florida Statute 559.905, please initial ONE of the following options:</p>
      <div class="consent-option">
        <span class="checkbox">[ ]</span>
        <span class="consent-text">${esc(business.consentOption1Text)}</span>
        <span class="initial">_______ (initial)</span>
      </div>
      <div class="consent-option">
        <span class="checkbox">[ ]</span>
        <span class="consent-text">${esc(business.consentOption2Text)}</span>
        <span class="initial">_______ (initial)</span>
      </div>
      <div class="consent-option">
        <span class="checkbox">[ ]</span>
        <span class="consent-text">${esc(business.consentOption3Text)}</span>
        <span class="initial">_______ (initial)</span>
      </div>
    </section>
  ` : '';

  const estimateConsentHtml = docType === 'INVOICE' ? renderEstimateConsent(invoice) : '';
  const reAuthHtml = docType === 'INVOICE' ? renderReAuthEvents(invoice) : '';
  const photosHtml = docType === 'INVOICE' ? renderPhotos(invoice) : '';
  const signaturesHtml = renderSignaturesSection(invoice, options, docType);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(docType)} ${esc(invoice.invoiceNumber || '')} - ${esc(business.businessName)}</title>
  <style>
    @page {
      size: Letter;
      margin: 0.5in 0.4in;
    }
    * { box-sizing: border-box; }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 10pt;
      color: #0B2040;
      margin: 0;
      padding: 0;
      line-height: 1.4;
    }
    h2 { font-size: 12pt; margin: 12px 0 6px; color: #0B2040; }
    h3 { font-size: 11pt; margin: 12px 0 6px; color: #0B2040; }
    .doc-type {
      font-size: 22pt;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #E07B2D;
      text-align: right;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0B2040;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .business-block { font-size: 9pt; line-height: 1.5; }
    .meta-block { font-size: 9pt; text-align: right; line-height: 1.6; }
    .meta-table {
      margin-left: auto;
      border-collapse: collapse;
      font-size: 9pt;
    }
    .meta-table th, .meta-table td {
      padding: 2px 0;
      border: none;
      vertical-align: baseline;
    }
    .meta-table th {
      text-align: right;
      padding-right: 10px;
      font-weight: 600;
      color: #0B2040;
    }
    .meta-table td {
      text-align: left;
      font-weight: normal;
    }
    section { margin-bottom: 16px; }
    .signatures-section,
    .signature-section,
    .signature-block,
    .estimate-consent,
    .reauth-event,
    .photos-section,
    .photo-cell,
    .consent,
    .mv-line {
      page-break-inside: avoid;
    }
    h2, h3 { page-break-after: avoid; }
    .disclosure { page-break-inside: avoid; }
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .info-block {
      border: 1px solid #ddd;
      padding: 10px;
      border-radius: 4px;
      background: #fafafa;
    }
    .info-block strong { display: block; margin-bottom: 4px; color: #0B2040; }
    table.line-items {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      table-layout: fixed;
    }
    table.line-items th, table.line-items td {
      border: 1px solid #ddd;
      padding: 6px 8px;
      font-size: 9pt;
      text-align: left;
      word-wrap: break-word;
    }
    table.line-items th {
      background: #0B2040;
      color: #fff;
      font-weight: 600;
    }
    table.line-items td.num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    table.line-items td.condition {
      text-align: center;
      font-size: 8.5pt;
      letter-spacing: 0.04em;
      color: #0B2040;
      font-weight: 600;
    }
    .added-flag {
      font-style: italic;
      font-size: 8.5pt;
      color: #888;
      margin-left: 4px;
    }
    .totals {
      width: 40%;
      margin-left: auto;
      margin-top: 8px;
    }
    .totals tr td {
      padding: 4px 8px;
      font-size: 10pt;
    }
    .totals tr.total td {
      border-top: 2px solid #0B2040;
      font-weight: 700;
      font-size: 11pt;
    }
    .totals td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .disclosure {
      font-size: 8pt;
      margin: 4px 0;
      padding-left: 6px;
      border-left: 2px solid #E07B2D;
      color: #333;
    }
    .consent {
      border: 2px solid #E07B2D;
      padding: 10px;
      margin: 12px 0;
      background: #fff8f3;
    }
    .consent h3 { margin-top: 0; color: #E07B2D; }
    .consent-option {
      margin: 8px 0;
      font-size: 9pt;
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }
    .consent-option .checkbox { font-family: monospace; font-weight: 700; flex-shrink: 0; }
    .consent-option .initial { font-size: 8pt; color: #666; flex-shrink: 0; margin-left: auto; }
    .estimate-consent {
      margin-top: 16px;
      padding: 10px 12px;
      border-left: 3px solid #E07B2D;
      background: #fafafa;
    }
    .estimate-consent h3 {
      font-size: 11pt;
      color: #0B2040;
      margin: 0 0 6px 0;
    }
    .consent-line {
      font-size: 9.5pt;
      margin: 0;
    }
    .consent-other {
      font-size: 8.5pt;
      color: #555;
      margin: 4px 0 0 0;
    }
    .reauth-section {
      margin-top: 16px;
    }
    .reauth-section h3 {
      font-size: 11pt;
      color: #0B2040;
      margin-bottom: 8px;
    }
    .reauth-event {
      border: 1px solid #ddd;
      padding: 8px 10px;
      margin-bottom: 6px;
      font-size: 9pt;
    }
    .reauth-meta { color: #0B2040; }
    .reauth-name { margin-top: 2px; }
    .reauth-items { margin-top: 2px; color: #444; }
    .reauth-sig { max-height: 50px; margin-top: 4px; display: block; }
    .reauth-note { margin-top: 4px; color: #555; }
    .photos-section { margin-top: 16px; }
    .photos-section h3 {
      font-size: 11pt;
      color: #0B2040;
      margin-bottom: 8px;
    }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }
    .photo-cell {
      border: 1px solid #ddd;
      padding: 2px;
    }
    .photo-cell img {
      width: 100%;
      height: 110px;
      object-fit: cover;
      display: block;
    }
    .photo-overflow {
      font-size: 8.5pt;
      color: #666;
      margin-top: 6px;
      font-style: italic;
    }
    .signatures-section {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #0B2040;
    }
    .signatures-section h3 {
      font-size: 12pt;
      color: #0B2040;
      margin-bottom: 10px;
    }
    .signature-grid {
      display: flex;
      gap: 16px;
    }
    .signature-block {
      flex: 1;
      border: 1px solid #ddd;
      padding: 10px;
    }
    .sig-title {
      font-weight: 600;
      font-size: 9pt;
      margin-bottom: 6px;
      color: #0B2040;
    }
    .sig-image {
      max-height: 60px;
      max-width: 100%;
      display: block;
      margin: 4px 0;
    }
    .signature-section {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #0B2040;
    }
    .sig-img { max-height: 60px; display: block; }
    .sig-line { font-family: monospace; letter-spacing: 0.05em; }
    .sig-meta { font-size: 8pt; color: #555; margin-top: 4px; }
    footer.page-footer {
      font-size: 8pt;
      color: #555;
      text-align: center;
      border-top: 1px solid #ddd;
      padding-top: 6px;
      margin-top: 24px;
    }
    .mv-line {
      font-size: 8pt;
      color: #0B2040;
      font-weight: 600;
      text-align: center;
      margin-top: 8px;
    }
    .complaint-box {
      border: 1px dashed #999;
      padding: 8px;
      background: #fafafa;
      font-size: 9pt;
      font-style: italic;
    }
  </style>
</head>
<body>
  <header>
    <div class="business-block">
      <img src="https://res.cloudinary.com/dgcdcqjrz/image/upload/f_png,h_192,q_auto/v1775916096/Coastal_logo_bh3biu.png"
           alt="Coastal Mobile Lube &amp; Tire"
           style="height: 64px; width: auto; margin-bottom: 6px;" />
      <div>${esc(business.businessAddress)}</div>
      <div>${esc(business.businessPhone)} | ${esc(business.businessEmail)}</div>
    </div>
    <div class="meta-block">
      <div class="doc-type">${esc(docType)}</div>
      <table class="meta-table">
        <tr><th>Number:</th><td>${esc(invoice.invoiceNumber || '')}</td></tr>
        <tr><th>Date:</th><td>${esc(invoice.invoiceDate || '')}</td></tr>
        ${invoice.dueDate ? `<tr><th>Due:</th><td>${esc(invoice.dueDate)}</td></tr>` : ''}
      </table>
    </div>
  </header>

  <section class="two-col">
    <div class="info-block">
      <strong>Bill To</strong>
      <div>${esc(invoice.customerName)}</div>
      ${invoice.customerAddress ? `<div>${esc(invoice.customerAddress)}</div>` : ''}
      <div>${esc(invoice.customerPhone || '')}</div>
      <div>${esc(invoice.customerEmail || '')}</div>
    </div>
    ${hasVehicleBlock ? `
    <div class="info-block">
      <strong>Vehicle</strong>
      ${vehicleLine ? `<div>${esc(vehicleLine)}</div>` : ''}
      ${invoice.vehicleInfo?.vin ? `<div>VIN: ${esc(invoice.vehicleInfo.vin)}</div>` : ''}
      ${invoice.vehicleInfo?.licenseTag ? `<div>Tag: ${esc(invoice.vehicleInfo.licenseTag)}</div>` : ''}
      <div>
        ${invoice.vehicleInfo?.odometerIn !== undefined && invoice.vehicleInfo?.odometerIn !== null ? `Odometer In: ${esc(invoice.vehicleInfo.odometerIn)} mi` : ''}
        ${invoice.vehicleInfo?.odometerOut !== undefined && invoice.vehicleInfo?.odometerOut !== null ? ` | Out: ${esc(invoice.vehicleInfo.odometerOut)} mi` : ''}
      </div>
    </div>
    ` : ''}
  </section>

  ${invoice.customerComplaint ? `
    <section>
      <h3>Customer Concern / Reason for Service</h3>
      <div class="complaint-box">${esc(invoice.customerComplaint)}</div>
    </section>
  ` : ''}

  <section>
    <h2>Services &amp; Parts</h2>
    <table class="line-items">
      <thead>
        <tr>
          <th style="width: 40%;">Description</th>
          <th style="width: 12%;">Condition</th>
          <th style="width: 8%;">Qty</th>
          <th style="width: 18%;">Rate</th>
          <th style="width: 22%;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHtml}
      </tbody>
    </table>

    <table class="totals">
      <tr><td>Subtotal:</td><td class="num">${fmtCurrency(invoice.subtotal)}</td></tr>
      ${displayTax ? `<tr><td>Sales Tax:</td><td class="num">${fmtCurrency(displayTax)}</td></tr>` : ''}
      <tr class="total"><td>${docType === 'ESTIMATE' ? 'Estimated Total' : 'Total'}:</td><td class="num">${fmtCurrency(displayTotal)}</td></tr>
    </table>
  </section>

  ${estimateConsentHtml}

  ${reAuthHtml}

  ${photosHtml}

  ${consentHtml}

  ${disclosuresHtml ? `
    <section>
      <h3>Disclosures &amp; Notices</h3>
      ${disclosuresHtml}
    </section>
  ` : ''}

  ${signaturesHtml}

  <div class="mv-line">
    Florida Motor Vehicle Repair Registration: ${esc(business.mvRegistrationNumber || 'Pending')}
  </div>

  <footer class="page-footer">
    ${esc(business.businessName)} | ${esc(business.businessPhone)} | ${esc(business.businessEmail)}
  </footer>
</body>
</html>`;
}

module.exports = { buildFdacsHtml };
