/**
 * Canonical Job type — the forward-looking shape that admin and tech surfaces
 * will converge on in Phase 2+. The currently-live operational entity is the
 * `Booking` shape in `@/app/admin/shared`; that drives the FDACS-critical path
 * and is NOT replaced here. Job exists as the contract for new code.
 */
export type ServiceCategory = 'auto' | 'marine' | 'rv' | 'fleet';

export const SERVICE_CATEGORIES: readonly ServiceCategory[] = [
  'auto',
  'marine',
  'rv',
  'fleet',
] as const;

export interface Job {
  id: string;
  customerId: string;
  /** Linked Asset doc id (replaces vehicleId). Optional during transition. */
  assetId?: string;
  /**
   * Tech assigned to the job. Server-defaulted to `ownerUid` at creation
   * time, but typed nullable to tolerate in-flight reads of legacy docs.
   */
  assignedTechId: string | null;
  /** Owner uid of the business that the job belongs to. */
  ownerUid: string;
  serviceCategory: ServiceCategory;
  status?: string;
  scheduledFor?: string; // ISO date
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
