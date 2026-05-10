/**
 * Canonical Customer type — for new Phase 1+ code. The legacy in-memory
 * Customer aggregate used by `/admin` (defined in `@/app/admin/shared`) is
 * a different shape (built from grouped bookings) and is unaffected by this
 * type. Migration M-1C-02 populates `assets[]` for the Firestore record.
 */
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  /** Digits-only phone for query lookups. */
  phoneNormalized?: string;
  address?: string;

  /**
   * Asset doc ids owned by this customer. Populated by M-1C-02 from the
   * legacy `vehicles` collection.
   */
  assets?: string[];

  /**
   * @deprecated Use `assets` instead. Kept for backwards compatibility
   * during Phase 1; cleanup migration scheduled post-Phase 4.
   */
  vehicles?: string[];

  isTest?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
