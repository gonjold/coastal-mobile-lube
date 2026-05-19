/* Local copies of Booking, AppUser, FirestoreTimestamp interfaces used by ops
 * tech components (ported from marketing in A3c).
 *
 * Per Decision 6: WO-A3C STEP 3.1 forbids touching marketing's admin/shared.ts.
 * The full canonicalization to packages/shared-types/ happens in a future sprint
 * (likely post-A3b-2 when marketing /admin code deletes).
 *
 * These interfaces mirror apps/marketing/src/app/admin/shared.ts exactly for the
 * fields the tech components consume. Stay byte-equivalent on field shapes. */

export interface FirestoreTimestamp {
  toDate: () => Date;
}

export type UserRole = 'admin' | 'tech' | 'owner' | 'admin_only';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: FirestoreTimestamp;
  createdBy: string;
  lastLoginAt?: FirestoreTimestamp | null;
}

export interface Booking {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  contactPreference?: string;
  service?: string;
  serviceCategory?: string;
  selectedServices?: Array<{ id: string; name: string; price: number | null; category: string }>;
  source?: string;
  type?: string;
  status?: string;
  address?: string;
  preferredDate?: string;
  datesFlexible?: boolean;
  timeWindow?: string;
  zip?: string;
  notes?: string;
  fleetSize?: string;
  engineType?: string;
  engineCount?: string;
  division?: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleTrim?: string;
  fuelType?: string;
  vin?: string;
  vinOrHull?: string;
  needsConfirmation?: boolean;
  vesselYear?: string;
  vesselMake?: string;
  vesselModel?: string;
  otherDescription?: string;
  rvType?: string;
  adminNotes?: string;
  commsLog?: Array<{ id: string; type: "call" | "text" | "email" | "note"; direction: "outbound" | "inbound"; summary: string; createdAt: string; createdBy: string }>;
  confirmedDate?: string;
  confirmedArrivalWindow?: string;
  estimatedDuration?: string;
  confirmedAt?: FirestoreTimestamp;
  cancelledAt?: FirestoreTimestamp;
  returningCustomer?: boolean;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
  lastViewedAt?: FirestoreTimestamp;
  isTest?: boolean;
  isTestFlaggedAt?: FirestoreTimestamp;
  isTestFlaggedBy?: string;

  // FDACS Phase B - flat additions populated by tech app (Phase C).
  licenseTag?: string | null;
  odometerIn?: number | null;
  odometerOut?: number | null;
  customerComplaint?: string | null;
  assignedTechId?: string | null;
  techCheckInAt?: FirestoreTimestamp | null;
  jobStartedAt?: FirestoreTimestamp | null;
  jobCompletedAt?: FirestoreTimestamp | null;
  photos?: Array<{
    url: string;
    capturedAt: FirestoreTimestamp;
    caption?: string;
  }>;
  reAuthEvents?: Array<{
    id: string;
    timestamp: FirestoreTimestamp;
    method: 'in_person_signature' | 'phone';
    customerName: string;
    signatureUrl?: string;
    note?: string;
    lineItemIds: string[];
  }>;
  customerSignatureUrl?: string | null;
  vehicleInfo?: {
    year?: number | null;
    make?: string | null;
    model?: string | null;
    trim?: string | null;
    vin?: string | null;
    licenseTag?: string | null;
    odometerIn?: number | null;
    odometerOut?: number | null;
  } | null;

  // FDACS Phase C - on-site estimate (WO-FDACS-C-ESTIMATE).
  estimateLineItems?: Array<{
    id: string;
    description: string;
    qty: number;
    unitPrice: number;
    taxable: boolean;
    partsCondition?: 'New' | 'Used' | 'Rebuilt' | 'Reconditioned' | null;
    sourceServiceId?: string | null;
    addedDuringWork?: boolean;
    reAuthEventId?: string;
  }>;
  estimateSubtotal?: number;
  estimateTaxableSubtotal?: number;
  estimateTax?: number;
  estimateTotal?: number;
  estimateConsent?: {
    choice: 'authorize_up_to' | 'contact_above' | 'no_contact' | 'simple_under_150';
    authorizeUpTo?: number | null;
    contactAbove?: number | null;
    authorizedOtherPerson?: { name: string; relationship: string; phone: string } | null;
  };
  customerEstimateSignatureUrl?: string | null;
  customerEstimateSignedAt?: FirestoreTimestamp | null;
  estimateLocked?: boolean;

  // FDACS Phase C - completion (WO-FDACS-C-COMPLETE).
  customerCompletionSignatureUrl?: string;
  customerCompletionSignedAt?: FirestoreTimestamp;
  invoiceId?: string;
  invoiceNumber?: string;
}
