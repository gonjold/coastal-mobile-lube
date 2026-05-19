/* FDACS (Florida Department of Agriculture and Consumer Services) constants and
 * types extracted from apps/marketing/src/components/tech/EstimateBuilder.tsx for
 * reuse in the ops tech port. FS 559.905 governs written-estimate consent
 * thresholds for motor vehicle repair shops.
 *
 * CHARTER §11.8 lock: the threshold value, consent choice enum, and signature
 * audit-trail shapes MUST NOT change semantically. This file is the single
 * source of truth post-A3c. */

export const CONSENT_THRESHOLD = 150;

export type ConsentChoice =
  | "simple_under_150"
  | "authorize_up_to"
  | "contact_above"
  | "no_contact";

export interface EstimateConsent {
  choice: ConsentChoice;
  authorizeUpTo?: number | null;
  contactAbove?: number | null;
  authorizedOtherPerson?: {
    name: string;
    relationship: string;
    phone: string;
  } | null;
}

export interface ReAuthEvent {
  id: string;
  timestamp: { toDate: () => Date };
  method: "in_person_signature" | "phone";
  customerName: string;
  signatureUrl?: string;
  note?: string;
  lineItemIds: string[];
}
