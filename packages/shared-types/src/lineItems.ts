export type WizardSelection = {
  kind: 'wizard';
  id: string;
  name: string;
  price: number;
  category?: string;
  division?: string;
};

export type FdacsEstimateItem = {
  kind: 'fdacs';
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  taxable: boolean;
  partsCondition?: 'New' | 'Used' | 'Rebuilt' | 'Reconditioned' | null;
  sourceServiceId?: string | null;
  addedDuringWork?: boolean;
  reAuthEventId?: string;
};

export type CustomerEstimateItem = {
  kind: 'customer_estimate';
  sku: string | null;
  description: string;
  qty: number;
  unitPrice: number;
  taxable: boolean;
  optional: boolean;
  selected: boolean | null;
};

export type InvoiceLineItem = {
  kind: 'invoice';
  serviceName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  taxable: boolean;
  partsCondition?: 'New' | 'Used' | 'Rebuilt' | 'Reconditioned' | null;
};

export type AnyLineItem =
  | WizardSelection
  | FdacsEstimateItem
  | CustomerEstimateItem
  | InvoiceLineItem;
