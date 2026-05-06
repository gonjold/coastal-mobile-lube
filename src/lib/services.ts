// Shared types for services and service categories. Lives outside the
// useServices hook so server-side helpers (firebase-admin) can import without
// pulling the firebase/firestore client SDK into the server bundle.

export type BookingVisibility = "inline" | "searchable" | "hidden";

export interface Service {
  id: string;
  name: string;
  displayName?: string;
  description: string;
  price: number;
  priceLabel: string;
  category: string;
  subcategory: string;
  division: "auto" | "marine" | "fleet" | "rv";
  type?: string;
  sortOrder: number;
  isActive: boolean;
  showOnBooking: boolean;
  showOnPricing: boolean;
  bundleItems: string[];
  featured?: boolean;
  notes: string;
  laborHours: number;
  bookingVisibility?: BookingVisibility;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface ServiceCategory {
  id: string;
  name: string;
  division: "auto" | "marine" | "fleet" | "rv";
  description: string;
  startingAt: number;
  sortOrder: number;
  isActive: boolean;
  tabLabel?: string;
  showOnHomepage?: boolean;
  isFeatured?: boolean;
  featuredSubtitle?: string;
  bookingVisibility?: BookingVisibility;
  createdAt: unknown;
  updatedAt: unknown;
}
