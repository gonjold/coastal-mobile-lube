/**
 * User role stored as Firebase custom claim.
 *
 * NOTE: distinct from the existing `UserRole` in `@/app/admin/shared`
 * (`'admin' | 'tech'`) which is sourced from the `users/{uid}` Firestore doc
 * and drives the legacy FDACS-critical access checks. New code (Phase 1+)
 * should prefer this claim-based UserRole.
 */
export type UserRole = 'owner' | 'tech' | 'admin_only';

export const USER_ROLES: readonly UserRole[] = [
  'owner',
  'tech',
  'admin_only',
] as const;
