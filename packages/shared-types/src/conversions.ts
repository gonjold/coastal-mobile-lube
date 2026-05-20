// Removed in Phase A (WO-COASTAL-PHASE-A-STABILIZATION).
// The four throwing stubs (wizardToFdacs, customerEstimateToFdacs,
// fdacsToInvoice, customerEstimateToInvoice) had zero call sites and
// risked surprising any future caller with a runtime throw.
// Real conversions are inline in apps/ops/lib/invoiceFromBooking.ts
// and the booking write paths. Reimplement here in Phase B if the
// estimate-invoice continuity work needs a shared shape converter.
export {};
