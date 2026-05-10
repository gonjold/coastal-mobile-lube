import type {
  WizardSelection,
  FdacsEstimateItem,
  CustomerEstimateItem,
  InvoiceLineItem,
} from './lineItems';

export function wizardToFdacs(_w: WizardSelection): FdacsEstimateItem {
  throw new Error('wizardToFdacs: not implemented in A1. Lands in A3.');
}

export function customerEstimateToFdacs(_c: CustomerEstimateItem): FdacsEstimateItem {
  throw new Error('customerEstimateToFdacs: not implemented in A1. Lands in A3.');
}

export function fdacsToInvoice(_f: FdacsEstimateItem): InvoiceLineItem {
  throw new Error('fdacsToInvoice: not implemented in A1. Lands in A3.');
}

export function customerEstimateToInvoice(_c: CustomerEstimateItem): InvoiceLineItem {
  throw new Error('customerEstimateToInvoice: not implemented in A1. Lands in A3.');
}
