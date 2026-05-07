// FDACS-compliant invoice PDF template.
// Pure function: takes invoice data + business settings, returns full HTML document.
// Renders to Letter-size PDF via puppeteer-core wrapper (lib/pdf.js).
//
// Field schema matches production Firestore invoice docs:
//   lineItems[].serviceName / .quantity / .unitPrice / .lineTotal / .taxable
//   invoice.subtotal / .taxAmount / .total
//   invoice.qbTaxAmount / .qbTotalAmount  (preferred when present — QB is source of truth post-sync)

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
  const signatureBase64 = options.signatureBase64 || null;
  const signedAt = options.signedAt || null;

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
    .map((li) => `
      <tr>
        <td>${esc(li.serviceName)}</td>
        <td class="num">${esc(li.quantity)}</td>
        <td class="num">${fmtCurrency(li.unitPrice)}</td>
        <td class="num">${fmtCurrency(li.lineTotal)}</td>
      </tr>
    `)
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

  const signatureHtml = signatureBase64
    ? `<img src="${signatureBase64}" alt="Customer signature" class="sig-img" />
       <div class="sig-meta">Signed: ${esc(signedAt)}</div>`
    : `<div class="sig-line">_______________________________</div>
       <div class="sig-meta">Customer signature / Date</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(docType)} ${esc(invoice.invoiceNumber || '')} - ${esc(business.businessName)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 10pt;
      color: #0B2040;
      margin: 0;
      padding: 0;
      line-height: 1.4;
    }
    h1 { font-size: 18pt; margin: 0; color: #0B2040; }
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
    .signature-section,
    .consent,
    .mv-line,
    section { page-break-inside: avoid; }
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
    }
    table.line-items th, table.line-items td {
      border: 1px solid #ddd;
      padding: 6px 8px;
      font-size: 9pt;
      text-align: left;
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
           style="height: 48px; width: auto; margin-bottom: 8px;" />
      <h1>${esc(business.businessName)}</h1>
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
          <th style="width: 60%;">Description</th>
          <th style="width: 10%;">Qty</th>
          <th style="width: 15%;">Rate</th>
          <th style="width: 15%;">Amount</th>
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

  ${consentHtml}

  ${disclosuresHtml ? `
    <section>
      <h3>Disclosures &amp; Notices</h3>
      ${disclosuresHtml}
    </section>
  ` : ''}

  <section class="signature-section">
    <h3>Customer ${docType === 'ESTIMATE' ? 'Authorization' : 'Acknowledgment of Completed Work'}</h3>
    ${signatureHtml}
  </section>

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
