// FDACS-compliant customer invoice EMAIL template.
//
// Email-safe variant of fdacs-template.js: table-based layout, all styling
// inline, no external CSS, no flexbox/grid, max 600px width. Renders the same
// audit-trail content the PDF renders, so the email body itself is the
// customer's primary regulatory experience (with the PDF attached as backup).
//
// Pure function — no Firestore, no I/O. Caller is responsible for fetching
// invoice + booking + settings/business and providing payNowUrl.

const {
  escapeHtml,
  fmtCurrency,
  fmtVehicleLine,
  fmtEastern,
} = require('./fdacs-helpers');
const { buildDisclosures } = require('./disclosures');

// Coastal brand
const NAVY = '#0B2040';
const ORANGE = '#E07B2D';
const TEXT = '#1a1a1a';
const MUTED = '#666666';
const FAINT = '#888888';
const RULE = '#e0e0e0';
const BG_PAGE = '#f5f5f5';
const BG_CARD = '#ffffff';
const BG_SOFT = '#fafafa';
const FONT_STACK = "'Plus Jakarta Sans', Helvetica, Arial, sans-serif";
const LOGO_URL = 'https://res.cloudinary.com/dgcdcqjrz/image/upload/f_png,h_192,q_auto/v1775916096/Coastal_logo_bh3biu.png';

const MAX_BODY_PHOTOS = 4;
const PHOTO_CELL_WIDTH = 280; // 2 columns x 280px fits inside 600px content

function safe(str) {
  return escapeHtml(str || '');
}

function renderHeader(invoice) {
  const dateStr = safe(invoice.invoiceDate || '');
  return `
  <tr>
    <td style="padding: 24px 28px; background-color: ${NAVY}; border-radius: 8px 8px 0 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="middle" style="font-family: ${FONT_STACK};">
            <img src="${LOGO_URL}" alt="Coastal Mobile Lube &amp; Tire" width="160" height="48" style="display: block; max-width: 160px; height: auto;" />
          </td>
          <td valign="middle" align="right" style="font-family: ${FONT_STACK}; color: #ffffff;">
            <div style="font-size: 11px; letter-spacing: 0.12em; color: #6BA3E0; font-weight: 700;">INVOICE</div>
            <div style="font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 2px;">${safe(invoice.invoiceNumber || '')}</div>
            ${dateStr ? `<div style="font-size: 12px; color: #ccd6e6; margin-top: 4px;">${dateStr}</div>` : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function renderPayCta(payNowUrl, totalDisplay, variant) {
  if (!payNowUrl) return '';
  const isTop = variant === 'top';
  const padTd = isTop ? '24px 28px 8px 28px' : '8px 28px 28px 28px';
  const fontSize = isTop ? '16px' : '14px';
  const padBtn = isTop ? '14px 28px' : '12px 24px';
  const label = isTop ? `Pay Online &mdash; ${totalDisplay}` : 'Pay Now';
  const note = isTop
    ? `<div style="font-family: ${FONT_STACK}; font-size: 11px; color: ${MUTED}; margin-top: 8px;">Secure payment powered by QuickBooks</div>`
    : '';

  return `
  <tr>
    <td align="center" style="padding: ${padTd};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="border-radius: 6px; background-color: ${NAVY};">
            <a href="${safe(payNowUrl)}" target="_blank" style="display: inline-block; padding: ${padBtn}; font-family: ${FONT_STACK}; font-size: ${fontSize}; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 6px;">
              ${label}
            </a>
          </td>
        </tr>
      </table>
      ${note}
    </td>
  </tr>`;
}

function renderBillToVehicle(invoice) {
  const vehicleLine = fmtVehicleLine(invoice.vehicleInfo);
  const v = invoice.vehicleInfo || {};
  const hasVehicle = vehicleLine || v.vin || v.licenseTag || v.odometerIn != null || v.odometerOut != null;

  const billCell = `
    <td valign="top" width="50%" style="padding: 12px; font-family: ${FONT_STACK}; font-size: 13px; color: ${TEXT}; background: ${BG_SOFT}; border: 1px solid ${RULE}; border-radius: 4px;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: ${NAVY}; font-weight: 700; margin-bottom: 6px;">Bill To</div>
      <div style="font-weight: 600;">${safe(invoice.customerName)}</div>
      ${invoice.customerAddress ? `<div>${safe(invoice.customerAddress)}</div>` : ''}
      ${invoice.customerPhone ? `<div>${safe(invoice.customerPhone)}</div>` : ''}
      ${invoice.customerEmail ? `<div>${safe(invoice.customerEmail)}</div>` : ''}
    </td>`;

  if (!hasVehicle) {
    return `
    <tr>
      <td style="padding: 16px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>${billCell}</tr>
        </table>
      </td>
    </tr>`;
  }

  const vehicleCell = `
    <td valign="top" width="50%" style="padding: 12px; font-family: ${FONT_STACK}; font-size: 13px; color: ${TEXT}; background: ${BG_SOFT}; border: 1px solid ${RULE}; border-radius: 4px;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: ${NAVY}; font-weight: 700; margin-bottom: 6px;">Vehicle</div>
      ${vehicleLine ? `<div style="font-weight: 600;">${safe(vehicleLine)}</div>` : ''}
      ${v.vin ? `<div>VIN: ${safe(v.vin)}</div>` : ''}
      ${v.licenseTag ? `<div>Tag: ${safe(v.licenseTag)}</div>` : ''}
      ${(v.odometerIn != null || v.odometerOut != null) ? `<div>${v.odometerIn != null ? `Odometer In: ${safe(v.odometerIn)} mi` : ''}${v.odometerOut != null ? `${v.odometerIn != null ? ' | ' : ''}Out: ${safe(v.odometerOut)} mi` : ''}</div>` : ''}
    </td>`;

  return `
  <tr>
    <td style="padding: 16px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${billCell}
          <td width="12" style="font-size: 0; line-height: 0;">&nbsp;</td>
          ${vehicleCell}
        </tr>
      </table>
    </td>
  </tr>`;
}

function renderCustomerConcern(invoice, booking) {
  const concern = invoice.customerComplaint || (booking && booking.customerComplaint) || '';
  if (!concern) return '';
  return `
  <tr>
    <td style="padding: 8px 28px 16px 28px;">
      <div style="font-family: ${FONT_STACK}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: ${NAVY}; font-weight: 700; margin-bottom: 6px;">Customer Concern</div>
      <div style="font-family: ${FONT_STACK}; font-size: 13px; color: ${TEXT}; padding: 10px 12px; background: ${BG_SOFT}; border: 1px dashed #999999; font-style: italic;">${safe(concern)}</div>
    </td>
  </tr>`;
}

function renderLineItemsTable(lineItems) {
  const items = Array.isArray(lineItems) ? lineItems : [];
  const rows = items.map((li) => {
    const condition = li.partsCondition && li.partsCondition !== 'New'
      ? String(li.partsCondition).toUpperCase()
      : '';
    const baseName = safe(li.serviceName || li.description || '');
    const addedFlag = li.addedDuringWork
      ? ` <em style="font-size: 11px; color: ${FAINT}; font-style: italic;">(added during work)</em>`
      : '';
    return `
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid ${RULE}; font-family: ${FONT_STACK}; font-size: 13px; color: ${TEXT};">${baseName}${addedFlag}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid ${RULE}; font-family: ${FONT_STACK}; font-size: 12px; color: ${NAVY}; font-weight: 600; text-align: center; letter-spacing: 0.04em;">${safe(condition)}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid ${RULE}; font-family: ${FONT_STACK}; font-size: 13px; color: ${TEXT}; text-align: center;">${safe(li.quantity)}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid ${RULE}; font-family: ${FONT_STACK}; font-size: 13px; color: ${TEXT}; text-align: right;">${fmtCurrency(li.unitPrice)}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid ${RULE}; font-family: ${FONT_STACK}; font-size: 13px; color: ${TEXT}; text-align: right; font-weight: 600;">${fmtCurrency(li.lineTotal)}</td>
        </tr>`;
  }).join('');

  return `
  <tr>
    <td style="padding: 8px 28px 0 28px;">
      <div style="font-family: ${FONT_STACK}; font-size: 13px; color: ${NAVY}; font-weight: 700; margin: 4px 0 8px 0;">Services &amp; Parts</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th align="left" style="padding: 8px 10px; background: ${NAVY}; color: #ffffff; font-family: ${FONT_STACK}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;">Description</th>
            <th align="center" style="padding: 8px 10px; background: ${NAVY}; color: #ffffff; font-family: ${FONT_STACK}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;">Condition</th>
            <th align="center" style="padding: 8px 10px; background: ${NAVY}; color: #ffffff; font-family: ${FONT_STACK}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;">Qty</th>
            <th align="right" style="padding: 8px 10px; background: ${NAVY}; color: #ffffff; font-family: ${FONT_STACK}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;">Rate</th>
            <th align="right" style="padding: 8px 10px; background: ${NAVY}; color: #ffffff; font-family: ${FONT_STACK}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </td>
  </tr>`;
}

function renderTotals(subtotal, tax, totalDisplay) {
  const taxRow = (tax && Number(tax) > 0)
    ? `
        <tr>
          <td align="right" style="padding: 4px 10px; font-family: ${FONT_STACK}; font-size: 13px; color: ${MUTED};">Sales Tax</td>
          <td align="right" width="120" style="padding: 4px 10px; font-family: ${FONT_STACK}; font-size: 13px; color: ${TEXT};">${fmtCurrency(tax)}</td>
        </tr>`
    : '';
  return `
  <tr>
    <td style="padding: 0 28px 16px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="right" style="padding: 4px 10px; font-family: ${FONT_STACK}; font-size: 13px; color: ${MUTED};">Subtotal</td>
          <td align="right" width="120" style="padding: 4px 10px; font-family: ${FONT_STACK}; font-size: 13px; color: ${TEXT};">${fmtCurrency(subtotal)}</td>
        </tr>
        ${taxRow}
        <tr>
          <td align="right" style="padding: 8px 10px 0 10px; border-top: 2px solid ${NAVY}; font-family: ${FONT_STACK}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: ${NAVY}; font-weight: 700;">Total</td>
          <td align="right" width="120" style="padding: 8px 10px 0 10px; border-top: 2px solid ${NAVY}; font-family: ${FONT_STACK}; font-size: 20px; font-weight: 800; color: ${ORANGE};">${totalDisplay}</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function renderConsent(invoice) {
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
    ? `<div style="font-family: ${FONT_STACK}; font-size: 12px; color: ${MUTED}; margin-top: 4px;">Authorized Other Person: ${safe(aop.name)}${aop.relationship ? ` (${safe(aop.relationship)})` : ''}${aop.phone ? ` &middot; ${safe(aop.phone)}` : ''}</div>`
    : '';
  return `
  <tr>
    <td style="padding: 8px 28px 16px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 10px 12px; background: ${BG_SOFT}; border-left: 3px solid ${ORANGE};">
            <div style="font-family: ${FONT_STACK}; font-size: 13px; color: ${NAVY}; font-weight: 700; margin-bottom: 4px;">Estimate Authorization Type</div>
            <div style="font-family: ${FONT_STACK}; font-size: 13px; color: ${TEXT};">${safe(line)}</div>
            ${aopHtml}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function renderReAuthEvents(invoice) {
  const events = Array.isArray(invoice.reAuthEvents) ? invoice.reAuthEvents : [];
  if (events.length === 0) return '';

  const nameById = new Map(
    (invoice.lineItems || []).map((li) => [li.id, li.serviceName || li.description || 'Untitled'])
  );

  const cards = events.map((ev) => {
    const items = (ev.lineItemIds || [])
      .map((id) => nameById.get(id) || id)
      .filter(Boolean)
      .join(', ');
    const methodLabel = ev.method === 'phone' ? 'Phone Authorization' : 'In-Person Signature';
    const sigImg = ev.method === 'in_person_signature' && ev.signatureUrl
      ? `<div style="margin-top: 6px;"><img src="${safe(ev.signatureUrl)}" alt="Re-authorization signature" width="280" height="50" style="max-width: 280px; max-height: 50px; height: auto; display: block;" /></div>`
      : '';
    const noteHtml = ev.method === 'phone' && ev.note
      ? `<div style="font-family: ${FONT_STACK}; font-size: 12px; color: ${MUTED}; margin-top: 4px; font-style: italic;">Note: ${safe(ev.note)}</div>`
      : '';
    return `
        <tr>
          <td style="padding: 10px 12px; border: 1px solid ${RULE}; background: ${BG_CARD};">
            <div style="font-family: ${FONT_STACK}; font-size: 12px; color: ${NAVY}; font-weight: 600;">${safe(fmtEastern(ev.timestamp))} &middot; ${safe(methodLabel)}</div>
            <div style="font-family: ${FONT_STACK}; font-size: 13px; color: ${TEXT}; margin-top: 2px;">Authorized by: ${safe(ev.customerName || '—')}</div>
            ${items ? `<div style="font-family: ${FONT_STACK}; font-size: 12px; color: ${MUTED}; margin-top: 2px;">Affected items: ${safe(items)}</div>` : ''}
            ${sigImg}
            ${noteHtml}
          </td>
        </tr>
        <tr><td height="6" style="font-size: 0; line-height: 0;">&nbsp;</td></tr>`;
  }).join('');

  return `
  <tr>
    <td style="padding: 8px 28px 8px 28px;">
      <div style="font-family: ${FONT_STACK}; font-size: 13px; color: ${NAVY}; font-weight: 700; margin: 4px 0 8px 0;">Mid-Job Re-Authorization Events</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${cards}
      </table>
    </td>
  </tr>`;
}

function renderPhotos(invoice) {
  const all = Array.isArray(invoice.photos) ? invoice.photos.filter(Boolean) : [];
  if (all.length === 0) return '';
  const visible = all.slice(0, MAX_BODY_PHOTOS);
  const overflow = Math.max(0, all.length - MAX_BODY_PHOTOS);

  // 2x2 grid via nested table; pair photos into rows of 2.
  let rows = '';
  for (let i = 0; i < visible.length; i += 2) {
    const left = visible[i];
    const right = visible[i + 1];
    rows += `
        <tr>
          <td valign="top" width="50%" style="padding: 4px;">
            <img src="${safe(left)}" alt="Job photo" width="${PHOTO_CELL_WIDTH}" height="200" style="max-width: ${PHOTO_CELL_WIDTH}px; height: auto; display: block; border: 1px solid ${RULE};" />
          </td>
          <td valign="top" width="50%" style="padding: 4px;">
            ${right ? `<img src="${safe(right)}" alt="Job photo" width="${PHOTO_CELL_WIDTH}" height="200" style="max-width: ${PHOTO_CELL_WIDTH}px; height: auto; display: block; border: 1px solid ${RULE};" />` : '&nbsp;'}
          </td>
        </tr>`;
  }

  const overflowLine = overflow > 0
    ? `<div style="font-family: ${FONT_STACK}; font-size: 12px; color: ${MUTED}; margin-top: 8px; font-style: italic;">View all ${all.length} photos in attached PDF.</div>`
    : '';

  return `
  <tr>
    <td style="padding: 8px 28px 8px 28px;">
      <div style="font-family: ${FONT_STACK}; font-size: 13px; color: ${NAVY}; font-weight: 700; margin: 4px 0 8px 0;">Job Photos</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${rows}
      </table>
      ${overflowLine}
    </td>
  </tr>`;
}

function renderSignatures(invoice) {
  const estSig = invoice.customerEstimateSignatureUrl;
  const estSignedAt = invoice.customerEstimateSignedAt;
  const compSig = invoice.customerCompletionSignatureUrl || invoice.customerSignatureUrl || null;
  const compSignedAt = invoice.customerCompletionSignedAt;
  if (!estSig && !compSig) return '';

  const block = (title, sig, when) => sig
    ? `
        <td valign="top" width="50%" style="padding: 12px; border: 1px solid ${RULE}; background: ${BG_CARD};">
          <div style="font-family: ${FONT_STACK}; font-size: 12px; font-weight: 600; color: ${NAVY}; margin-bottom: 6px;">${safe(title)}</div>
          <img src="${safe(sig)}" alt="${safe(title)}" width="240" height="50" style="max-width: 280px; max-height: 50px; height: auto; display: block;" />
          <div style="font-family: ${FONT_STACK}; font-size: 11px; color: ${MUTED}; margin-top: 4px;">Signed: ${safe(fmtEastern(when))}</div>
        </td>`
    : '';

  // Two side-by-side blocks; if only one sig present, render single full-width block.
  if (estSig && compSig) {
    return `
  <tr>
    <td style="padding: 12px 28px 8px 28px;">
      <div style="font-family: ${FONT_STACK}; font-size: 13px; color: ${NAVY}; font-weight: 700; margin: 4px 0 8px 0; padding-top: 8px; border-top: 1px solid ${NAVY};">Customer Authorization &amp; Acknowledgment</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${block('Customer Authorization of Estimate', estSig, estSignedAt)}
          <td width="12" style="font-size: 0; line-height: 0;">&nbsp;</td>
          ${block('Customer Acknowledgment of Completed Work', compSig, compSignedAt)}
        </tr>
      </table>
    </td>
  </tr>`;
  }

  const onlyTitle = estSig ? 'Customer Authorization of Estimate' : 'Customer Acknowledgment of Completed Work';
  const onlySig = estSig || compSig;
  const onlyWhen = estSig ? estSignedAt : compSignedAt;
  return `
  <tr>
    <td style="padding: 12px 28px 8px 28px;">
      <div style="font-family: ${FONT_STACK}; font-size: 13px; color: ${NAVY}; font-weight: 700; margin: 4px 0 8px 0; padding-top: 8px; border-top: 1px solid ${NAVY};">Customer Authorization &amp; Acknowledgment</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>${block(onlyTitle, onlySig, onlyWhen)}</tr>
      </table>
    </td>
  </tr>`;
}

function renderDisclosures(disclosures) {
  const items = [
    disclosures.warranty ? { label: 'Warranty', text: disclosures.warranty } : null,
    disclosures.shopSupplies ? { label: 'Shop Supplies', text: disclosures.shopSupplies } : null,
    disclosures.tireFee ? { label: 'Tire Fee Disclosure', text: disclosures.tireFee } : null,
    disclosures.batteryFee ? { label: 'Battery Fee Disclosure', text: disclosures.batteryFee } : null,
  ].filter(Boolean);
  if (items.length === 0) return '';
  const rows = items.map((it) => `
        <tr>
          <td style="padding: 6px 10px; border-left: 3px solid ${ORANGE}; font-family: ${FONT_STACK}; font-size: 11px; color: #333333;">
            <strong style="color: ${NAVY};">${safe(it.label)}:</strong> ${safe(it.text)}
          </td>
        </tr>
        <tr><td height="4" style="font-size: 0; line-height: 0;">&nbsp;</td></tr>`).join('');
  return `
  <tr>
    <td style="padding: 8px 28px 8px 28px;">
      <div style="font-family: ${FONT_STACK}; font-size: 13px; color: ${NAVY}; font-weight: 700; margin: 4px 0 8px 0;">Disclosures &amp; Notices</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${rows}
      </table>
    </td>
  </tr>`;
}

function renderMvLine(businessSettings) {
  const mv = businessSettings.mvRegistrationNumber || 'Pending';
  return `
  <tr>
    <td align="center" style="padding: 8px 28px 0 28px;">
      <div style="font-family: ${FONT_STACK}; font-size: 11px; color: ${NAVY}; font-weight: 600;">Florida Motor Vehicle Repair Registration: ${safe(mv)}</div>
    </td>
  </tr>`;
}

function renderFooter(businessSettings) {
  const name = businessSettings.businessName || 'Coastal Mobile Lube & Tire';
  const addr = businessSettings.businessAddress || '';
  const phone = businessSettings.businessPhone || '';
  const email = businessSettings.businessEmail || 'info@coastalmobilelube.com';
  return `
  <tr>
    <td style="padding: 24px 28px; background-color: ${NAVY}; border-radius: 0 0 8px 8px;">
      <div style="font-family: ${FONT_STACK}; font-size: 13px; color: #ffffff; text-align: center; font-weight: 600;">${safe(name)}</div>
      ${addr ? `<div style="font-family: ${FONT_STACK}; font-size: 11px; color: #ccd6e6; text-align: center; margin-top: 4px;">${safe(addr)}</div>` : ''}
      <div style="font-family: ${FONT_STACK}; font-size: 11px; color: #ccd6e6; text-align: center; margin-top: 4px;">${phone ? safe(phone) : ''}${phone && email ? ' &middot; ' : ''}${safe(email)}</div>
      <div style="font-family: ${FONT_STACK}; font-size: 10px; color: #6BA3E0; text-align: center; margin-top: 8px;">Reply to this email to reach us &mdash; ${safe(email)}</div>
    </td>
  </tr>`;
}

/**
 * Build the FDACS-compliant customer invoice email HTML.
 *
 * @param {object} invoice - Firestore invoice doc data
 * @param {object} booking - Firestore booking doc data (for customerComplaint fallback)
 * @param {object} businessSettings - settings/business doc data
 * @param {string} payNowUrl - QB Pay link (may be empty string for non-QB path)
 * @returns {string} Complete HTML document suitable for email clients
 */
function renderFdacsEmailHtml(invoice, booking, businessSettings, payNowUrl) {
  const safeBooking = booking || {};
  const safeBusiness = businessSettings || {};

  const subtotal = invoice.subtotal != null ? invoice.subtotal : 0;
  const tax = invoice.qbTaxAmount != null ? invoice.qbTaxAmount : (invoice.taxAmount || 0);
  const total = invoice.qbTotalAmount != null ? invoice.qbTotalAmount : (invoice.total || 0);
  const totalDisplay = fmtCurrency(total);

  const disclosures = buildDisclosures(invoice, safeBusiness);

  const headerHtml = renderHeader(invoice);
  const payTopHtml = renderPayCta(payNowUrl, totalDisplay, 'top');
  const billHtml = renderBillToVehicle(invoice);
  const concernHtml = renderCustomerConcern(invoice, safeBooking);
  const lineItemsHtml = renderLineItemsTable(invoice.lineItems);
  const totalsHtml = renderTotals(subtotal, tax, totalDisplay);
  const consentHtml = renderConsent(invoice);
  const reAuthHtml = renderReAuthEvents(invoice);
  const photosHtml = renderPhotos(invoice);
  const signaturesHtml = renderSignatures(invoice);
  const disclosuresHtml = renderDisclosures(disclosures);
  const mvLineHtml = renderMvLine(safeBusiness);
  const payBottomHtml = renderPayCta(payNowUrl, totalDisplay, 'bottom');
  const footerHtml = renderFooter(safeBusiness);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${safe(invoice.invoiceNumber || '')}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BG_PAGE}; font-family: ${FONT_STACK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BG_PAGE};">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: ${BG_CARD}; border-radius: 8px;">
          ${headerHtml}
          ${payTopHtml}
          ${billHtml}
          ${concernHtml}
          ${lineItemsHtml}
          ${totalsHtml}
          ${consentHtml}
          ${reAuthHtml}
          ${photosHtml}
          ${signaturesHtml}
          ${disclosuresHtml}
          ${mvLineHtml}
          ${payBottomHtml}
          ${footerHtml}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { renderFdacsEmailHtml };
