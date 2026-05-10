/**
 * @deprecated Use `VehicleAsset` from `@/types` (Asset model) instead.
 * This type is kept for backwards compatibility during Phase 1 migration.
 * Will be removed after all consumers migrate to the Asset model in Phase 4.
 *
 * Mirrors the legacy `vehicles/{id}` Firestore doc shape. New writes should
 * go through `/lib/assets/mutations.ts` `createAsset({ type: 'vehicle', ... })`.
 */
export interface Vehicle {
  id: string;
  customerId: string;
  year?: number | string;
  make?: string;
  model?: string;
  trim?: string;
  vin?: string;
  /** Some legacy docs use `plate` instead of `licensePlate`. */
  licensePlate?: string;
  plate?: string;
  color?: string;
  mileage?: number;
  nickname?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
