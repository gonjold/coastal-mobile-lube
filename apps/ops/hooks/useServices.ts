"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Service, ServiceCategory, BookingVisibility } from "@/lib/services";

// Re-export for backward compat — existing callers import these types from
// "@/hooks/useServices". Source of truth lives in @/lib/services.
export type { Service, ServiceCategory, BookingVisibility };

// bookingVisibility is authoritative when present; showOnBooking is a legacy
// shadow boolean kept in sync for pre-WO-40b consumers. Only fall back to the
// boolean when bookingVisibility is undefined.
export function resolveBookingVisibility(doc: {
  bookingVisibility?: BookingVisibility;
  showOnBooking?: boolean;
}): BookingVisibility {
  if (doc.bookingVisibility) return doc.bookingVisibility;
  return doc.showOnBooking === false ? "hidden" : "inline";
}

export interface UseServicesOptions {
  division?: "auto" | "marine" | "fleet" | "rv";
  category?: string;
  activeOnly?: boolean;
}

export interface UseServicesReturn {
  services: Service[];
  categories: ServiceCategory[];
  loading: boolean;
  error: string | null;
}

// ── Hook ───────────────────────────────────────────────────

export function useServices(
  options: UseServicesOptions = {}
): UseServicesReturn {
  const { division, category, activeOnly } = options;

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to services collection
  useEffect(() => {
    const constraints: QueryConstraint[] = [];

    if (division) {
      constraints.push(where("division", "==", division));
    }
    if (category) {
      constraints.push(where("category", "==", category));
    }
    if (activeOnly) {
      constraints.push(where("isActive", "==", true));
    }

    const q = query(collection(db, "services"), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Service[];
        docs.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setServices(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [division, category, activeOnly]);

  // Subscribe to serviceCategories collection
  useEffect(() => {
    const constraints: QueryConstraint[] = [];

    if (division) {
      constraints.push(where("division", "==", division));
    }
    if (activeOnly) {
      constraints.push(where("isActive", "==", true));
    }

    const q = query(collection(db, "serviceCategories"), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ServiceCategory[];
        docs.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setCategories(docs);
        setCategoriesLoaded(true);
      },
      (err) => {
        setError(err.message);
      }
    );

    return unsubscribe;
  }, [division, activeOnly]);

  // When activeOnly is set, filter out services whose category is inactive
  const filteredServices = useMemo(() => {
    if (!activeOnly || !categoriesLoaded) return services;
    const activeCategoryNames = new Set(categories.map((c) => c.name));
    return services.filter((s) => activeCategoryNames.has(s.category));
  }, [services, categories, activeOnly, categoriesLoaded]);

  return {
    services: filteredServices,
    categories,
    loading: loading || (activeOnly ? !categoriesLoaded : false),
    error,
  };
}
