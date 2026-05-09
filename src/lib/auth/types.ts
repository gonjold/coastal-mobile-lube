import type { UserRole } from '@/types';

/** Server-side authenticated user, decoded from a Firebase session cookie. */
export interface AuthenticatedUser {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  emailVerified: boolean;
}
