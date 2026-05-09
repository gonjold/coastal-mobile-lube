/**
 * Tax + total recalc shared by the field "add line item" and "remove line
 * item" routes. Mirrors the logic in src/components/tech/EstimateBuilder.tsx
 * and src/components/tech/WorkInProgress.tsx so estimate totals stay
 * consistent across all entry points.
 */

export const COASTAL_TAX_RATE = 0.075;

export type LineItemForTotals = {
  qty: number;
  unitPrice: number;
  taxable: boolean;
};

export type EstimateTotals = {
  subtotal: number;
  taxableSubtotal: number;
  tax: number;
  total: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeTotals(items: LineItemForTotals[]): EstimateTotals {
  const subtotal = items.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const taxableSubtotal = items
    .filter((l) => l.taxable)
    .reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const tax = taxableSubtotal * COASTAL_TAX_RATE;
  const total = subtotal + tax;
  return {
    subtotal: round2(subtotal),
    taxableSubtotal: round2(taxableSubtotal),
    tax: round2(tax),
    total: round2(total),
  };
}
