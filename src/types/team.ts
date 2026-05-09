import type { UserRole } from './role';

/** Member of the business team. Stored within the Team document. */
export interface TeamMember {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  active: boolean;
  addedAt: string; // ISO timestamp
  addedBy: string; // uid of who added them
}

/** Singleton team document for the business. */
export interface Team {
  businessId: string; // 'coastal' for now; multi-tenant later
  members: TeamMember[];
  ownerUid: string;
  updatedAt: string; // ISO timestamp
}
