'use client';

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { customAlphabet } from 'nanoid';
import { db } from '@/lib/firebase';

/* ── A3c canonicalization candidate ──────────────────────────
   Asset discriminated union below mirrors apps/marketing/src/types/asset.ts
   verbatim. Decision 3: inline in ops, canonicalize into
   @coastal/shared-types in A3c when /tech/* migration reveals the
   cross-cutting shape.
   ──────────────────────────────────────────────────────────── */

export type AssetType = 'vehicle' | 'boat' | 'trailer' | 'fleet_vehicle';

interface AssetBase {
  id: string;
  customerId: string;
  type: AssetType;
  /** User-friendly label, e.g. "Mom's Honda". */
  nickname?: string;
  notes?: string;
  /** Original `vehicles/{id}` doc id, set during the v1 → assets migration. */
  legacyVehicleId?: string;
  /** Soft-delete marker. */
  deletedAt?: string;
  /** Last-known mileage; pushed from Booking.odometerOut on job completion. */
  mileage?: number;
  /** ISO timestamp of the last completed job that touched this asset. */
  lastServicedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleAsset extends AssetBase {
  type: 'vehicle';
  year: number;
  make: string;
  model: string;
  trim?: string;
  vin?: string;
  licensePlate?: string;
  color?: string;
}

export interface BoatAsset extends AssetBase {
  type: 'boat';
  year?: number;
  make: string;
  model: string;
  hullId?: string;
  registrationNumber?: string;
  length?: number;
  engineHours?: number;
}

export interface TrailerAsset extends AssetBase {
  type: 'trailer';
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  licensePlate?: string;
  capacity?: number;
}

export interface FleetVehicleAsset extends AssetBase {
  type: 'fleet_vehicle';
  year: number;
  make: string;
  model: string;
  vin?: string;
  licensePlate?: string;
  fleetNumber?: string;
}

export type Asset =
  | VehicleAsset
  | BoatAsset
  | TrailerAsset
  | FleetVehicleAsset;

/* ── ID generation: matches marketing's nanoid pattern (12-char custom alphabet) ── */

const nanoid = customAlphabet(
  'abcdefghijklmnopqrstuvwxyz0123456789',
  12,
);

/* ── Queries ── */

export async function getAsset(id: string): Promise<Asset | null> {
  const snap = await getDoc(doc(db, 'assets', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Asset) : null;
}

export async function listAssetsForCustomer(
  customerId: string,
  type?: AssetType,
): Promise<Asset[]> {
  const constraints = [where('customerId', '==', customerId)];
  if (type) constraints.push(where('type', '==', type));
  const snap = await getDocs(query(collection(db, 'assets'), ...constraints));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Asset, 'id'>) }) as Asset)
    .filter((a) => !a.deletedAt);
}

/* ── Mutations ── */

/**
 * Atomic create: writes the asset doc + arrayUnion onto customers.assets[]
 * in a single writeBatch. Upgrades marketing's two-sequential-await pattern
 * to closed atomicity (orphan-on-step-2-failure was a latent bug).
 */
export async function createAsset(
  input: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Asset> {
  const id = `${input.type}_${nanoid()}`;
  const now = new Date().toISOString();
  const full = { ...input, id, createdAt: now, updatedAt: now } as Asset;

  const batch = writeBatch(db);
  batch.set(doc(db, 'assets', id), full);
  batch.update(doc(db, 'customers', input.customerId), {
    assets: arrayUnion(id),
    updatedAt: now,
  });
  await batch.commit();
  return full;
}

export async function updateAsset(
  id: string,
  patch: Partial<Asset>,
): Promise<void> {
  await updateDoc(doc(db, 'assets', id), {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Atomic soft-delete: sets deletedAt on the asset + arrayRemove from
 * customers.assets[] in one writeBatch. Mirrors marketing's deleteAsset
 * surface (id + customerId) but adds atomicity.
 */
export async function softDeleteAsset(
  id: string,
  customerId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const batch = writeBatch(db);
  batch.update(doc(db, 'assets', id), {
    deletedAt: now,
    updatedAt: now,
  });
  batch.update(doc(db, 'customers', customerId), {
    assets: arrayRemove(id),
    updatedAt: now,
  });
  await batch.commit();
}

/**
 * Counts bookings whose `assetId` matches this asset, split by status. Used
 * by the delete safety check (hard-block in-progress, warn on non-cancelled).
 *
 * Limitation: legacy bookings (pre-m-1c-02 migration) may lack `assetId` even
 * when they reference this vehicle. Under-reporting is acceptable here —
 * booking docs denormalize vehicleYear/Make/Model, so deleted-vehicle history
 * survives on the job record regardless.
 */
export async function countBookingsReferencingAsset(
  assetId: string,
): Promise<{ total: number; inProgress: number; activeNonCancelled: number }> {
  const snap = await getDocs(
    query(collection(db, 'bookings'), where('assetId', '==', assetId)),
  );
  let total = 0;
  let inProgress = 0;
  let activeNonCancelled = 0;
  for (const d of snap.docs) {
    total += 1;
    const s = ((d.data() as { status?: string }).status || '').toLowerCase();
    if (s === 'in-progress' || s === 'in_progress') inProgress += 1;
    if (s !== 'cancelled' && s !== 'dead') activeNonCancelled += 1;
  }
  return { total, inProgress, activeNonCancelled };
}
