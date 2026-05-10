export type UserRole = 'owner' | 'admin_only' | 'tech';

export const USER_ROLES: readonly UserRole[] = ['owner', 'admin_only', 'tech'] as const;

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}
