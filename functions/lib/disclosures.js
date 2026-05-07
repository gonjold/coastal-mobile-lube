// FDACS disclosure logic.
// Pure function: takes invoice data + business settings, returns disclosures
// object keyed by type. Caller (template) renders only present keys.
//
// Schema: line items use serviceName (production schema), not description.

/**
 * Determine which disclosures apply to this invoice and return their text.
 *
 * Always-applicable:
 * - warranty (per Coastal's policy)
 * - shopSupplies (Coastal applies a shop supplies fee per industry standard)
 *
 * Conditional:
 * - tireFee: any line item serviceName contains "tire(s)" (word-boundary, case-insensitive)
 *   per FS 403.718 ($1.00 per new motor vehicle tire)
 * - batteryFee: any line item serviceName contains "battery/batteries" (word-boundary, case-insensitive)
 *   per FS 403.7185 ($1.50 per new lead-acid battery)
 *
 * @param {object} invoice - invoice doc with lineItems array
 * @param {object} business - settings/business doc with disclosure templates
 * @returns {object} { warranty, shopSupplies, tireFee?, batteryFee? }
 */
function buildDisclosures(invoice, business) {
  const disclosures = {
    warranty: business.warrantyStatement || '',
    shopSupplies: business.shopSuppliesDisclosure || '',
  };

  const lineItems = invoice.lineItems || [];

  const hasTire = lineItems.some((li) =>
    li.serviceName && /\btire(s)?\b/i.test(li.serviceName)
  );
  const hasBattery = lineItems.some((li) =>
    li.serviceName && /\bbatter(y|ies)\b/i.test(li.serviceName)
  );

  if (hasTire && business.tireFeeDisclosure) {
    disclosures.tireFee = business.tireFeeDisclosure;
  }
  if (hasBattery && business.batteryFeeDisclosure) {
    disclosures.batteryFee = business.batteryFeeDisclosure;
  }

  return disclosures;
}

module.exports = { buildDisclosures };
