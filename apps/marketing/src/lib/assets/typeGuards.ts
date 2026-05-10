import type {
  Asset,
  VehicleAsset,
  BoatAsset,
  TrailerAsset,
  FleetVehicleAsset,
} from '@/types';

export function isVehicleAsset(a: Asset): a is VehicleAsset {
  return a.type === 'vehicle';
}
export function isBoatAsset(a: Asset): a is BoatAsset {
  return a.type === 'boat';
}
export function isTrailerAsset(a: Asset): a is TrailerAsset {
  return a.type === 'trailer';
}
export function isFleetVehicleAsset(a: Asset): a is FleetVehicleAsset {
  return a.type === 'fleet_vehicle';
}

/** Display label for any asset, suitable for UI lists. */
export function assetDisplayLabel(a: Asset): string {
  if (a.nickname) return a.nickname;
  if (isVehicleAsset(a))
    return `${a.year} ${a.make} ${a.model}${a.trim ? ' ' + a.trim : ''}`;
  if (isBoatAsset(a))
    return `${a.year ? a.year + ' ' : ''}${a.make} ${a.model}`.trim();
  if (isTrailerAsset(a))
    return `${a.year ? a.year + ' ' : ''}${a.make || ''} ${
      a.model || 'Trailer'
    }`.trim();
  if (isFleetVehicleAsset(a))
    return `${a.year} ${a.make} ${a.model}${
      a.fleetNumber ? ' (' + a.fleetNumber + ')' : ''
    }`;
  return 'Asset';
}
