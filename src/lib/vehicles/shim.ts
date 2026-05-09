/**
 * Backwards-compatibility shim for code that still uses the vehicle-only
 * model. Reads from the new `assets` collection filtering on type='vehicle'.
 *
 * @deprecated Migrate call sites to /lib/assets/* APIs in Phase 2+.
 */
import { listAssetsForCustomer } from '@/lib/assets';
import { isVehicleAsset } from '@/lib/assets/typeGuards';
import type { VehicleAsset } from '@/types';

export async function getVehiclesForCustomer(
  customerId: string,
): Promise<VehicleAsset[]> {
  const assets = await listAssetsForCustomer(customerId, 'vehicle');
  return assets.filter(isVehicleAsset);
}
