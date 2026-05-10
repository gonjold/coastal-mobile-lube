/** Type of asset a customer owns. */
export type AssetType = 'vehicle' | 'boat' | 'trailer' | 'fleet_vehicle';

/** Common fields all assets share. */
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
  createdAt: string;
  updatedAt: string;
}

/** Standard road vehicle. */
export interface VehicleAsset extends AssetBase {
  type: 'vehicle';
  year: number;
  make: string;
  model: string;
  trim?: string;
  vin?: string;
  licensePlate?: string;
  color?: string;
  mileage?: number;
}

/** Boat / marine asset. */
export interface BoatAsset extends AssetBase {
  type: 'boat';
  year?: number;
  make: string;
  model: string;
  /** Analogous to VIN for boats. */
  hullId?: string;
  registrationNumber?: string;
  /** Length in feet. */
  length?: number;
  engineHours?: number;
}

/** Trailer asset. */
export interface TrailerAsset extends AssetBase {
  type: 'trailer';
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  licensePlate?: string;
  /** Capacity in pounds. */
  capacity?: number;
}

/** Fleet vehicle (commercial, owned by business customer). */
export interface FleetVehicleAsset extends AssetBase {
  type: 'fleet_vehicle';
  year: number;
  make: string;
  model: string;
  vin?: string;
  licensePlate?: string;
  /** Internal fleet ID. */
  fleetNumber?: string;
  mileage?: number;
}

export type Asset =
  | VehicleAsset
  | BoatAsset
  | TrailerAsset
  | FleetVehicleAsset;
